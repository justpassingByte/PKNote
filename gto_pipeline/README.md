# GTO Pipeline — Hướng dẫn vận hành

## Tổng quan kiến trúc

Pipeline sinh data chiến thuật GTO cho App RobinHUD, chia thành 3 layer:

```
Preflop Ranges → [Flop Solver] → [Turn Subgame] → [River Subgame] → App HUD
                   54 spots        ~200 spots       ~800 spots
                   ~3 min/spot     ~10s/spot        ~2s/spot
```

### Nguyên lý
- **Flop**: Giải bài toán đầy đủ (full game tree) cho 18 board × 3 position
- **Turn**: Trích xuất Range sau Flop action → giải subgame ngắn (2 street)
- **River**: Trích xuất Range sau Turn action → giải subgame 1 street

### Action line được cover
Hiện tại chỉ cover line phổ biến nhất:
```
OOP check → IP c-bet 33% → OOP call → [Turn] → OOP check → IP bet 75% → OOP call → [River]
```

---

## Cấu trúc thư mục

```
gto_pipeline/
├── batch_solve.py           # Flop solver (layer 1)
├── batch_solve_turn.py      # Turn subgame solver (layer 2)
├── batch_solve_river.py     # River subgame solver (layer 3)
├── normalize_output.py      # Hàm normalize dùng chung
├── ranges/                  # Preflop ranges (input)
│   ├── BTN_vs_BB_ip.txt
│   ├── BTN_vs_BB_oop.txt
│   ├── SB_vs_BB_ip.txt
│   ├── SB_vs_BB_oop.txt
│   ├── CO_vs_BTN_ip.txt
│   └── CO_vs_BTN_oop.txt
├── configs/                 # Config files cho solver
│   ├── *.txt                # Flop configs
│   ├── turn/*.txt           # Turn configs
│   └── river/*.txt          # River configs
└── outputs/
    ├── raw/                 # Flop raw JSON (XÓA ĐƯỢC sau normalize)
    ├── *.json               # Flop normalized (APP DÙNG)
    ├── turn/
    │   ├── raw/             # Turn raw JSON (XÓA ĐƯỢC)
    │   └── *.json           # Turn normalized (APP DÙNG)
    └── river/
        ├── raw/             # River raw JSON (XÓA ĐƯỢC)
        └── *.json           # River normalized (APP DÙNG)
```

---

## Cách chạy (theo thứ tự)

### Bước 1: Flop

```bash
# Chạy lần đầu
python batch_solve.py

# Chạy tiếp sau khi bị gián đoạn
python batch_solve.py --skip-existing

# Test 1 spot
python batch_solve.py --dry-run
```

**Thời gian**: ~2.5 giờ cho 54 spots (2 parallel × 4 threads)
**Output**: 54 file JSON trong `outputs/`

### Bước 2: Turn

```bash
# Chạy full
python batch_solve_turn.py

# Bỏ qua spots đã giải
python batch_solve_turn.py --skip-existing

# Chỉ tạo config, không chạy solver
python batch_solve_turn.py --extract-only
```

**Thời gian**: ~30 phút cho ~200 spots
**Output**: ~200 file JSON trong `outputs/turn/`

### Bước 3: River

```bash
python batch_solve_river.py
python batch_solve_river.py --skip-existing
```

**Thời gian**: ~15 phút cho ~800 spots
**Output**: ~800 file JSON trong `outputs/river/`

---

## 18 Board Buckets

| # | Tên | Board | Đặc điểm |
|---|-----|-------|-----------|
| 1 | A_dry | As,7d,2c | Ace-high rainbow |
| 2 | K_dry | Ks,8d,3c | King-high rainbow |
| 3 | Q_dry | Qs,7d,2c | Queen-high rainbow |
| 4 | low_dry | 8s,4d,2c | Low rainbow |
| 5 | paired_high | Ks,Kd,2c | High pair board |
| 6 | paired_mid | 9s,9d,3c | Mid pair board |
| 7 | paired_low | 5s,5d,2c | Low pair board |
| 8 | two_tone_A | As,7s,2c | Ace-high 2 suited |
| 9 | two_tone_K | Ks,8s,3c | King-high 2 suited |
| 10 | two_tone_low | 8s,4s,2c | Low 2 suited |
| 11 | connected_high | Ks,Qd,Jc | High connected |
| 12 | connected_mid | Ts,9d,8c | Mid connected |
| 13 | connected_low | 7s,6d,5c | Low connected |
| 14 | ace_wet | As,9s,8c | Ace wet (suited + connected) |
| 15 | broadway_wet | Ks,Qs,Jc | Broadway wet |
| 16 | mid_wet | Js,9s,7c | Mid wet |
| 17 | monotone_A | As,7s,2s | Ace monotone |
| 18 | monotone_low | Ts,7s,2s | Low monotone |

## 3 Positions

| Position | IP | OOP |
|----------|-----|-----|
| BTN_vs_BB | BTN (IP) | BB (OOP) |
| SB_vs_BB | BB (IP) | SB (OOP) |
| CO_vs_BTN | BTN (IP) | CO (OOP) |

---

## 6 Turn Card Types

| Type | Mô tả | Ví dụ (board A-7-2) |
|------|--------|---------------------|
| blank | Không ảnh hưởng board | 4♣ |
| overcard | Cao hơn lá giữa | K♦ |
| undercard | Thấp hơn lá thấp nhất | — (không có trên A-high) |
| straight_card | Tạo khả năng sảnh | 5♦ (gần 7 và 2) |
| flush_card | Lá thứ 3 cùng chất | — (không có trên rainbow) |
| board_pair | Trùng rank với board | 7♠ |

> Không phải board nào cũng có đủ 6 loại. A-high rainbow chỉ có 3 loại.

---

## 5 River Card Types

| Type | Mô tả |
|------|--------|
| blank | Không thay đổi board |
| overcard | Cao hơn các lá giữa |
| board_pair | Trùng rank |
| flush_card | Lá thứ 3 cùng chất |
| flush_complete | Lá thứ 4 cùng chất (hoàn thành flush) |
| straight_card | Hoàn thành sảnh |

---

## Format file normalized (App HUD đọc file này)

```json
{
  "position": "BTN_vs_BB",
  "board_bucket": "A_dry",
  "board": "As,7d,2c",
  "strategy": {
    "oop": { "check": 0.62, "bet_small": 0.15, "bet_big": 0.23 },
    "ip":  { "check": 0.45, "bet_small": 0.30, "bet_big": 0.25 }
  },
  "per_hand": {
    "oop": { "AcKd": { "check": 0.8, "bet_small": 0.1, "bet_big": 0.1 } },
    "ip":  { "AcKd": { "check": 0.3, "bet_small": 0.5, "bet_big": 0.2 } }
  }
}
```

Turn/River files thêm các field: `turn_card`, `turn_type`, `river_card`, `river_type`, `full_board`.

---

## Dọn dẹp ổ cứng

Sau khi normalize xong, xóa raw files để tiết kiệm ~3GB:

```bash
# XÓA raw files (KHÔNG ảnh hưởng App)
rmdir /S /Q outputs\raw
rmdir /S /Q outputs\turn\raw
rmdir /S /Q outputs\river\raw
```

**KHÔNG XÓA** các file `.json` trực tiếp trong `outputs/`, `outputs/turn/`, `outputs/river/`.

---

## Xử lý sự cố

### Solver bị treo / máy chậm
```bash
# Kill tất cả solver process
Stop-Process -Name "console_solver" -Force
```

### Muốn chạy lại từ đầu
```bash
# Xóa tất cả output và config
rmdir /S /Q outputs
rmdir /S /Q configs
```

### Solver crash exit code 3221226505
Range format sai. Kiểm tra config file, range phải dùng notation `AKo:0.5` không dùng `AcKd:0.5`.

---

## Hạn chế & Cải tiến tương lai

### Hạn chế V1

**1. Chỉ cover 1 kiểu chơi (action line)**

Hiện tại chỉ có data cho tình huống:
> OOP check → IP bet nhỏ (33% pot) → OOP gọi theo (call)

Những tình huống CHƯA CÓ data:
- IP check back (IP không bet, check lại) → Turn chơi khác hoàn toàn
- IP bet lớn (75% pot) → OOP gọi → Range hẹp hơn nhiều
- OOP donk bet (OOP bet trước thay vì check) → Tình huống hiếm nhưng vẫn xảy ra

→ Khi App gặp tình huống không có data, nó sẽ không hiển thị gợi ý.

**2. Mỗi loại Turn/River chỉ chọn 1 lá đại diện**

Ví dụ cụ thể: Board A♠-7♦-2♣
- Loại "overcard" chọn lá K♦ làm đại diện
- Nhưng thực tế K turn và Q turn chiến thuật khác nhau (K gần A hơn, đe dọa top pair nhiều hơn)
- App sẽ dùng chung data K cho cả Q, J, T... → sai lệch nhẹ

**3. Gộp bài cùng rank khi truyền vào solver**

Ví dụ: Sau Flop, solver nói:
- A♣K♦ bet 85% (có cửa thùng clubs)
- A♥K♠ bet 72% (không có cửa thùng)

Nhưng khi truyền vào Turn solver, ta gộp thành `AKo:78.5%` (trung bình).
→ Trên board có cửa thùng, mất đi thông tin bài nào có backdoor flush.

---

### Cải tiến V2

**CẢI TIẾN 1: Thêm action line — ❌ PHẢI SOLVE LẠI TỪ ĐẦU? KHÔNG!**

Data Flop KHÔNG cần solve lại. File Flop JSON đã chứa tất cả action line bên trong.
Chỉ cần sửa code `batch_solve_turn.py` để trích Range cho line khác:
```
# Hiện tại chỉ trích: check → bet_small → call
# Thêm: check → check (IP check back)
# Thêm: check → bet_big → call (IP bet lớn)
```
Rồi chạy Turn + River solver cho các line mới. Flop KHÔNG chạy lại.

Ước tính thêm: ~400 Turn spots + ~1600 River spots (gấp 3 hiện tại).
Thời gian thêm: ~1.5 giờ. Ổ cứng thêm: ~100MB normalized.

**CẢI TIẾN 2: Thêm lá đại diện — ❌ KHÔNG cần solve lại Flop**

Thay vì chọn 1 lá K đại diện cho "overcard", chọn thêm Q và J.
Chỉ sửa hàm `select_turn_cards()` rồi chạy lại Turn + River.
Flop KHÔNG chạy lại.

Ước tính thêm: gấp 2-3 số spots Turn/River.

**CẢI TIẾN 3: Giữ thông tin suit — ⚠️ CẦN THỬ NGHIỆM**

Cần kiểm tra xem TexasSolver có nhận format `AcKd:0.85` trực tiếp không.
Nếu có → sửa code bỏ bước convert abstract, giữ nguyên combo.
Nếu không → phải tìm solver khác hoặc chấp nhận hạn chế này.
Flop KHÔNG cần solve lại trong cả 2 trường hợp.

---

### Tóm lại

| Cải tiến | Solve lại Flop? | Solve lại Turn? | Solve lại River? | Khó? |
|----------|-----------------|-----------------|------------------|------|
| Thêm action line | ❌ Không | ✅ Thêm mới | ✅ Thêm mới | Dễ |
| Thêm lá đại diện | ❌ Không | ✅ Thêm mới | ✅ Thêm mới | Dễ |
| Giữ suit info | ❌ Không | ⚠️ Cần test | ⚠️ Cần test | Trung bình |

**Kết luận: Flop data (54 spots, ~2.5 giờ) KHÔNG BAO GIỜ cần chạy lại.
Mọi cải tiến chỉ ảnh hưởng Turn và River (chạy nhanh, ~30-60 phút).**
