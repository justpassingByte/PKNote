---
description: Detailed System Design for AI Poker Notes & Hand Analyzer
---

# Feature Design: AI Poker Notes & Hand Analyzer

## 0. Architecture Overview

```mermaid
graph TD
    User((User)) -->|1. Upload Image| FE[Frontend Next.js]
    FE -->|2. POST /ocr| BE[Backend Express]
    BE -->|3. Task| OCR_SVC[OCR Service (PaddleOCR)]
    OCR_SVC -->|4. JSON| BE
    BE -->|5. Parsed Result| FE
    FE -->|6. User Review/Edit| FE
    FE -->|7. Confirm Data| BE
    BE -->|8. Analysis| LLM[LLM Analyst (Gemini/GPT)]
    LLM -->|9. Result| DB[(PostgreSQL)]
    DB -->|10. Final Insight| FE
```
    
    NOW[NOWPayments] -->|Webhook| Webhook[Payment Webhook Worker]
    Webhook -->|Verify Sig| DB
    Webhook -->|Unlock Tier| DB

## 1. Data Models (Prisma Schema Updates)

### User & Subscription
*   `User`:
    *   `id`: String (UUID)
    *   `premium_tier`: Enum (FREE, PRO, PRO_PLUS, ENTERPRISE) - Default: FREE
    *   `subscription_expiry`: DateTime?
    *   `max_devices`: Int - Default: 2
*   `Session`:
    *   `id`: String
    *   `user_id`: String (FK)
    *   `device_id`: String (Unique)
    *   `last_active`: DateTime
*   `UserUsage`:
    *   `id`: String
    *   `user_id`: String (FK)
    *   `action_type`: Enum (AI_ANALYZE, OCR_NAME, OCR_HAND)
    *   `count`: Int
    *   `period_start`: DateTime

### Poker Data
*   `Player`:
    *   `id`: String
    *   `name`: String
    *   `ai_profile`: Json (tendencies, leaks, exploitStrategy) - Generated from aggregate notes.
*   `Hand`:
    *   `id`: String
    *   `user_id`: String (FK)
    *   `hand_hash`: String (Unique)
    *   `raw_input`: String
    *   `parsed_data`: Json
    *   `ai_analysis`: Json
    *   `tags`: String[]
*   `Note`:
    *   `id`: String
    *   `player_id`: String (FK)
    *   `hand_id`: String? (FK)
    *   `content`: String
    *   `note_type`: String (existing) - mapped to Enum in logic.

### Payments
*   `Invoice`:
    *   `id`: String
    *   `user_id`: String (FK)
    *   `amount`: Float
    *   `currency`: String
    *   `status`: Enum (PENDING, FINISHED, FAILED)
    *   `tier_requested`: String

## 2. API Endpoints

### Authentication & Sessions
*   `POST /api/auth/login`: Handles device detection.
*   `POST /api/auth/logout-all`: Force clear all `Session` records for user.

### Hand Analysis & OCR
*   `POST /api/analysis/hand`: 
    *   Accepts Image (FormData) or Text.
    *   Middleware: Check `UserUsage` quota.
    *   Logic: Hash input -> Check Cache -> Run OCR (if image) -> Parse -> LLM -> Cache -> Return.
*   `POST /api/analysis/ocr-name`: Specific for player name extraction fallback.

### Players & Notes
*   `GET /api/players/:id/compile-profile`: Trigger LLM to aggregate all notes into a summary profile.
*   `POST /api/notes`: Create note. If `handId` provided, link them.

### Payments
*   `POST /api/payments/create-invoice`: Call NOWPayments API.
*   `POST /api/payments/webhook`: Idempotent status update + Tier unlock.

## 3. Component Architecture (Frontend)

*   `HandAnalyzer`: Layout containing `UploadZone`, `HandPreview` (parsed JSON), and `AnalysisResultView`.
*   `AnalysisResultView`:
    *   `MistakeCard`: Highlight Hero/Villain errors.
    *   `AutoNoteSuggest`: Pop-up button if `villainMistakes` exists.
*   `PlayerDatabase`: List and Search view.
*   `ProfileSummary`: Displays the structured `tendencies`, `leaks`, `exploitStrategy`.
*   `SubscriptionManager`: Tier comparison table and NOWPayments redirect.

## 4. AI Processing Workflow

1.  **Canonical Normalization**: Standardize the Hand data (remove names, timestamps, stakes) before hashing to increase cache hit rate.
2.  **Vision Pipeline (Hand Extraction)**: 
    *   **Primary (Cost-Saver)**: Sử dụng **OCR Service (Self-hosted Python/PaddleOCR)** để parse screenshot sang Structured JSON. 
        - **Endpoint**: `http://ocr_service:8000/ocr`
        - **Spec chi tiết**: Tham khảo tại [docs/ai/design/hand-ocr-spec.md](file:///c:/Users/Admin/Desktop/projects/PoNotes/docs/ai/design/hand-ocr-spec.md).
    *   **Fallback**: Nếu OCR Service không detect được layout (anchors) hoặc độ tin cậy thấp (<0.8), sử dụng `gpt-4o-vision` hoặc `claude-3-5-sonnet`.
    *   **Hỗ trợ ngôn ngữ**: Normalization layer trong OCR Service sẽ map hành động tiếng Việt (`Theo`, `Tố`) thành chuẩn quốc tế.
    *   **User Review (Critical Loop)**: Trước khi gửi tới LLM phân tích chiến thuật, kết quả JSON từ OCR Service sẽ được hiển thị trên UI dưới dạng một biểu mẫu (form) có thể chỉnh sửa:
        - User kiểm tra lại `Pot`, `Board Cards`, và `Actions`.
        - User sửa các lỗi OCR (nếu có) trước khi bấm **"Analyze Now"**.
        - Điều này đảm bảo AI luôn phân tích dựa trên dữ liệu chính xác 100%, tránh "Garbage in, Garbage out".
3.  **Model Routing Logic**:
    *   `FREE/PRO`: `gpt-4o-mini` for basic insights.
    *   `PRO+/ENTERPRISE`: `gpt-4o` or `claude-3-5-sonnet` for deep exploit logic.
4.  **AI Architecture & Cost Control**
*   **Hạn chế chi phí (Cache)**: Nếu User gửi lại cùng một ván bài (phát hiện qua Hash trùng), hệ thống trả về kết quả đã lưu trong Database.
*   **RAG (Retrieval-Augmented Generation)**: Nếu một đối thủ có quá nhiều ghi chú (>50 notes), hệ thống sẽ sử dụng **Embeddings** để tìm các note liên quan nhất đến tình huống hiện tại thay vì gửi toàn bộ context tới LLM.
*   **Incremental Summarization**: Theo định kỳ, hệ thống sẽ tự động tóm tắt các note cũ thành một `Base Profile` để làm giảm số lượng Token tiêu thụ khi phân tích profile dài hạn.
4.  **Solver Integration**: Pass GTO baseline (if available) as context for Hand Analysis (Hero/Villain mistakes).
5.  **Player Profiler Pipeline**:
    *   **Aggregate Retrieval**: Khi xem Profile đối thủ, fetch toàn bộ notes liên quan.
    *   **Map-Reduce Summarization**: Nếu số lượng note lớn, chia nhỏ notes thành các nhóm (chunks) -> Tóm tắt từng nhóm -> Merge thành Final Profile JSON (`tendencies`, `leaks`, `exploitStrategy`).
6.  **RAG Layer (Token Optimization)**:
    *   **Embedding**: Convert manual notes into vector embeddings (using `text-embedding-3-small` or similar).
    *   **Incremental Summarization**: Periodically "bake" old notes into the `ai_profile` JSON to reduce the frequency of full-note retrieval.

*   **Idempotency Key**: User-side ID for invoices to prevent double-billing.
*   **Signature Verification**: HMAC SHA-512 check for NOWPayments webhook.
*   **Session Guard**: Middleware `validateSession` checks if `device_id` is in `Session` table.
