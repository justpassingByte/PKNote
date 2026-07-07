# 🚀 Hand OCR & Data Extraction Specification (Production-Grade v2)

Tài liệu này định nghĩa quy trình trích xuất dữ liệu cấu trúc (structured data) từ ảnh screenshot bàn chơi Poker, tối ưu cho việc tự động hóa ghi chú (Auto-Notes).

---

## 🧠 1. Pipeline Trích xuất (Architecture)

1.  **Layout Detection**: Nhận diện app (GG Poker, Stars, etc.) dựa trên **UI Anchors** (Template Matching).
2.  **Relative Cropping**: Cắt ảnh dựa trên tọa độ tương đối (%) kết hợp **Dynamic Anchors** (ví dụ: tìm text "Pre-Flop" để định vị Action Log).
3.  **Vision Phase**:
    *   **OCR**: Trích xuất text (Pot, Names, Actions).
    *   **Multi-Scale Template Matching**: Nhận diện Board Cards (Rank + Suit) với kỹ thuật scale-invariant và tiền xử lý ảnh vùng bài về kích thước cố định.
4.  **Normalization Layer**: Sửa lỗi OCR phổ biến (phát hiện "8B" -> "BB", "Téng" -> "Tổng").
5.  **Fuzzy Parsing**: Parse hành động dựa trên keyword matching thay vì strict regex.
6.  **Data Validation**: Kiểm tra logic (Tổng Pot ≈ Tổng Actions) với hệ số dung sai (tolerance) cho rake/side pots.
7.  **User Review (Manual Fix)**: Frontend cho phép User sửa đổi dữ liệu trước khi phân tích LLM.

---

## 📐 2. Bounding Box & Mapping Definitions

| Region | Strategy | Box / Mapping |
| :--- | :--- | :--- |
| **Pot Area** | Relative Box | (30%, 10%, 70%, 25%) |
| **Board Cards** | Anchor + Match | Pre-resize region to fixed size, use HSV thresholding |
| **Action Log** | **Anchor-Based** | Tìm text "Pre-Flop/Flop", fallback về box (5%, 60%, 45%, 95%) |
| **Player Seats**| **Radial Mapping** | Hero tại Bottom-Center (Seat 1). Mapping theo chiều kim đồng hồ mỗi 40-60° |
| **Sidebar** | Verification | (75%, 10%, 100%, 90%) |

---

## 🃏 3. Pro Card Recognition (Scale-Invariant)

Để tránh fail khi resolution thay đổi:
*   **Multi-Scale Matching**: Chạy template matching trên nhiều tỷ lệ hoặc resize vùng Board về chuẩn (ví dụ: 400x120px) trước khi so khớp.
*   **HSV Pre-processing**: Phân tách màu sắc trong không gian HSV để tách biệt Suits (Rô-Xanh, Nhép-Xanh Lá, Cơ-Đỏ, Bích-Đen) trước khi nhận diện Rank.
*   **Target**: Phải nhận diện 100% board. Nếu không -> Chuyển sang `Full Mode` (thêm preprocessing pass).

---

## ✅ 4. Validation & Confidence Scoring

### 🧬 Weighted Confidence
Kết quả cuối cùng được tính theo trọng số:
*   **Pot**: 30%
*   **Actions**: 30%
*   **Board**: 20%
*   **Winner**: 20%
-> Nếu `Weighted Confidence < 0.8`, hệ thống tự động chạy **Fallback OCR Pass** với bộ lọc (preprocessing) khác.

### 🧬 Tolerance Logic (Rake & Side Pot)
Kiểm tra `ABS(Sum(Actions) - Pot)`:
*   **Cash Games**: Chấp nhận sai số ±3 BB (cho rake/rounding).
*   **Tournaments**: Chấp nhận sai số ±5%.
*   Nếu vượt ngưỡng -> Flag `validation_failed` nhưng vẫn trả dữ liệu kèm cảnh báo.

---

## ⚡ 5. Performance & Operational Guard

### 🚀 Processing Modes
1.  **Fast Mode**: OCR + Template Matching bài (Skip validation). Target < 1s.
2.  **Full Mode**: Full pipeline + Validation + Fallback passes. Target 2-3s.

### 🚀 Operational Logic
*   **SHA256 Caching**: Skip toàn bộ OCR nếu mã băm ảnh đã tồn tại trong Redis.
*   **Circuit Breaker**: Nếu hàng đợi (queue) > 20 jobs -> Trả về `429 Too Busy` hoặc tự động ép về `Fast Mode`.
*   **Debug Output**: Trả về `raw_ocr` và `normalized_text` trong response để hỗ trợ điều chỉnh model (tuning).

---

## 🔌 6. Structured Output Example

```json
{
  "status": "success",
  "mode": "full_mode",
  "confidence": {
     "total": 0.94,
     "breakdown": { "pot": 0.98, "board": 1.0, "actions": 0.85, "winner": 0.95 }
  },
  "data": {
    "hand_id": "HL9523",
    "board": ["9d", "3c", "6h", "4c", "Kc"],
    "pot": 1.947,
    "actions": { ... },
    "winner": "kiukiukiu902"
  },
  "debug": {
    "raw_ocr": "...",
    "pre_processed_img": "url_to_tmp"
  }
}
```
