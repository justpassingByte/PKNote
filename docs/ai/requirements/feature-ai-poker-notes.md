---
description: Detailed Requirements for AI Poker Notes & Hand Analyzer
---

# Feature: AI Poker Notes & Hand Analyzer (Detailed Requirements)

## 1. Smart Notes System
*   **Manual Notes**: 
    *   Người dùng có thể tạo note thủ công cho bất kỳ đối thủ nào. 
    *   Trường dữ liệu: `opponentName` (bắt buộc), `content` (text nội dung note).
*   **OCR Name Extraction**:
    *   Tính năng upload ảnh để tự động trích xuất tên đối thủ (giảm bớt thao tác gõ phím).
    *   **Fallback**: Nếu OCR không nhận diện được tên chính xác, hệ thống phải cho phép người dùng nhập tay vào ô Input.

## 2. AI Player Profile (Cực kỳ quan trọng)
*   **Tổng hợp dữ liệu**: AI phải đọc và phân tích **TẤT CẢ** các ghi chú (notes) của một Player cụ thể để tạo ra một hồ sơ tổng quát.
*   **Cấu trúc Output (Structured JSON)**:
    ```json
    {
      "tendencies": ["Limp quá nhiều preflop", "Cbet cực cao ở flop", ...],
      "leaks": ["Fold quá nhiều trước các cú Raise ở River", ...],
      "exploitStrategy": ["Nên Value bet mỏng hơn khi đối thủ Call rộng", "Hạn chế Bluff khi đối thủ không bao giờ fold ở River", ...]
    }
    ```
*   **Mục tiêu**: Thay vì đọc hàng chục dòng note vụn vặt, User nhận được chiến thuật khắc chế đối thủ ngay lập tức.
    *   **Token Saver**: Nếu lịch sử notes quá dài (>50-100 notes), hệ thống sẽ gộp (chunking) và tóm tắt thành các "mini-profiles" trước khi merge thành hồ sơ cuối cùng để tiết kiệm token.

## 3. Hand Upload + AI Analysis
*   **Hình thức Input**: Upload ảnh chụp màn hình ván bài (Poker Hand Image) \
*   **Pipeline xử lý**: `Image -> Backend OCR -> Parser -> Structured Hand JSON`.
*   **AI Analysis Output**: AI phân tích ván bài **độc lập** (đánh giá kỹ thuật kịch bản ván đấu) và trả về:
    *   **Hero mistakes**: Các lỗi sai của người chơi chính.
    *   **Villain mistakes**: Các lỗi sai của đối thủ trong ván đó.
    *   **Better line**: Hướng đánh tối ưu hơn (Line tốt nhất).
    *   **Exploit suggestion**: Gợi ý cách khai thác đối thủ dựa trên hành động cụ thể của ván bài này.
    *   *Note: Quá trình này không bắt buộc phải đọc lại note cũ, tập trung vào tính đúng sai của ván bài.*

## 4. Save Hand & Smart Note Linking (Auto-Note)
*   **Lưu trữ**: Sau khi phân tích, người dùng có thể lưu lại ván bài kèm theo dữ liệu JSON và kết quả phân tích AI.
*   **Logic gợi ý (Smart Link)**: Nếu AI phát hiện `Villain mistake`:
    *   Hệ thống sẽ hiển thị câu hỏi: *"Lưu lỗi này thành ghi chú cho [playerName]?"*
    *   Nếu User chọn **Yes**: Tự động tạo record trong bảng `Note` liên kết với Player đó, trích dẫn nội dung lỗi vào Note.

## 5. Search & History
*   **Danh sách**: Trang quản lý toàn bộ các Hand đã lưu và danh sách Player.
*   **Bộ lọc (Filters)**:
    *   Theo tên người chơi (Player Name).
    *   Theo nhãn (Tags: e.g., "Whale", "Aggressive", "Bluffed").
    *   Theo thời gian (Date Range).
    *   Theo kết quả (Win/Loss) - (Nếu parse được từ hand).
    *   Theo tình huống (Spot: 3bet pot, cbet flop, v.v.) - (Mở rộng sau).

## 6. AI Architecture & Cost Control
*   **Models**: Ưu tiên Claude 3.5 Sonnet / GPT-4o.
*   **Flow**: 
    1. Parse Input thành JSON.
    2. Gọi Solver nội bộ lấy baseline (EV/GTO).
    3. Truyền Structured JSON + Solver context vào LLM.
    4. Trả về insight định dạng JSON.
*   **Hạn chế chi phí (Cache)**: Nếu User gửi lại cùng một ván bài (phát hiện qua Hash trùng), hệ thống trả về kết quả đã lưu trong Database, không gọi API AI lần nữa.
*   **Model Routing**: Gói thấp dùng model rẻ (GPT-4o-mini), gói cao dùng Deep Analysis (GPT-4o/Claude Opus).

## 7. Account Security & Anti-sharing
*   **Giới hạn thiết bị**: Tối đa **2 thiết bị** đăng nhập cùng lúc cho mỗi account.
*   **Session Tracking**: Lưu trữ `deviceId` cho mỗi lần đăng nhập.
*   **Force Logout**: Nếu đăng nhập thiết bị thứ 3, cung cấp tùy chọn đăng xuất tất cả thiết bị cũ.
*   **Rate Limit**: Giới hạn số lượng request AI theo gói (Tránh script lạm dụng).
*   **Cảnh báo**: Phát hiện và thông báo nếu có dấu hiệu đăng nhập từ nhiều IP (Multi-IP spike) bất thường.

## 8. Crypto Payment Integration (NOWPayments)
*   **Flow**: Upgrade -> Tạo Invoice API -> Redirect trang thanh toán -> Webhook callback.
*   **Webhook Requirements**:
    *   Verify signature (HMAC SHA-512) bảo mật.
    *   Kiểm tra trạng thái `finished`.
    *   **Idempotency**: Đảm bảo không xử lý trùng lặp một giao dịch nhiều lần.
    *   Unlock premium: Update `premium = true` và set ngày hết hạn.

## 9. Pricing & Tier Limits

### 🆓 Free (Kéo User)
*   Manual Note: Không giới hạn.
*   OCR Name: 5 lần/ngày.
*   AI Analyze: 2 lần/ngày.
*   Basic Summary (Tóm tắt cơ bản).

### 💎 Pro ($14.99/tháng | $129/năm)
*   AI Analyze: **100 ván/tháng**.
*   OCR: **100 lượt/tháng**.
*   Save hands + Notes.
*   Player profile (Basic AI).

### 🧠 Pro+ / Advanced ($29.99/tháng | $249/năm)
*   AI Analyze: **500 ván/tháng**.
*   OCR: **300 lượt/tháng**.
*   Full Player profile (Deep AI analysis).
*   Exploit suggestions.
*   Auto-note suggestions.
*   Priority Speed (Phản hồi nhanh hơn).

### 🏆 Enterprise / High Roller ($79 - $99/tháng)
*   AI Analyze: **Unlimited*** (Soft cap 2000 requests/tháng, sau đó throttle nhẹ).
*   OCR: Unlimited.
*   Advanced exploit insights.
*   Batch analyze (Phân tích nhiều hand cùng lúc).
*   Player Database lớn nhất.
*   Priority Queue (Hàng đợi ưu tiên tuyệt đối).

## 11. Core Use Cases (Luồng sử dụng chính)

### Use Case 1: Phân tích & Ghi chú thông minh (The "Grind" Cycle)
1. **Trigger**: Người chơi gặp một tình huống khó hoặc thấy đối thủ đánh láo ở River.
2. **Action**: Chụp ảnh màn hình (screenshot) -> Tải lên App analyzer.
3. **Logic**: OCR nhận diện Action -> AI báo "Bạn Call là sai (Hero mistake)" + "Đối thủ Bluff quá đà (Villain mistake)".
4. **Follow-up**: App hiện Pop-up "Lưu đối thủ X hay Bluff river?". User ấn "Save".
5. **Outcome**: Hồ sơ đối thủ được cập nhật ngay lập tức cho các lần gặp sau.

### Use Case 2: Soi hồ sơ đối thủ trước trận đấu (The "Scout" Cycle)
1. **Trigger**: Người chơi vừa vào bàn, thấy một đối thủ lạ nhưng tên quen.
2. **Action**: Search tên đối thủ (hoặc OCR tên từ ảnh bàn chơi).
3. **Logic**: Hệ thống gom tất cả 50 ghi chú cũ -> AI thực hiện "Map-Reduce Summarization" -> Trả về JSON tóm tắt (Tendencies, Leaks).
4. **Outcome**: Người chơi biết ngay đối thủ này "Fold to 3-bet" cao, quyết định 3-bet bluff ngay ván đầu.

### Use Case 3: Nâng cấp gói dịch vụ (The "Payment" Cycle)
1. **Trigger**: User gói Free dùng hết 2 lượt AI Analyze trong ngày.
2. **Action**: Click nút "Unlock Unlimited" -> Chọn gói Pro+ -> Redirect NOWPayments.
3. **Logic**: User trả USDT -> NOWPayments gọi Webhook -> Backend verify HMAC signature -> Unlock premium status.
4. **Outcome**: User được tiếp tục phân tích 500 ván mới ngay lập tức.

## 12. Tech Requirements
*   **Strict Typing**: Dùng TypeScript toàn bộ project (Frontend & Backend).
*   **Deterministic Outputs**: Đảm bảo output AI ổn định qua system prompts.
*   **Hiệu năng**: Không re-render không cần thiết ở React, tối ưu State management.
*   **Source of Truth**: Backend là nơi lưu trữ và quyết định cuối cùng về dữ liệu/logic.

## ✅ Success Criteria
*   **OCR Accuracy**: Nhận diện đúng >90% các thông số cơ bản (bet size, positions) từ ảnh chụp màn hình các platform phổ biến.
*   **Cache Efficiency**: Tỉ lệ "hit" Cache cho các Hand giống hệt nhau đạt 100%, giảm thiểu tối đa chi phí Token.
*   **Payment Reliability**: 100% các giao dịch thanh toán thành công qua NOWPayments phải được kích hoạt gói tự động trong < 1 phút qua Webhook.
*   **Account Security**: Hệ thống chặn thành công thiết bị thứ 3 đăng nhập đồng thời.

## 🚫 DO NOT BUILD (Phạm vi không làm)
*   Giao diện Solver phức tạp.
*   Biểu đồ EV rắc rối.
*   Tree visualizer đa tầng.
*   Train model AI mới từ đầu.
