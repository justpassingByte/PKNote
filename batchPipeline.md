# 🚀 TexasSolver Batch Pipeline (Full Setup Guide for AI Agent)

## 🎯 Mục tiêu

Xây dựng hệ thống:

* Solve GTO offline hàng loạt (batch)
* Export strategy → JSON
* Dùng làm **baseline cho RobinHUD**

---

# 🧰 1. Yêu cầu hệ thống

* GPU: RTX 3070 (OK, đủ mạnh)
* RAM: ≥16GB (khuyến nghị 32GB)
* OS: Windows (hoặc Linux)

---

# 📦 2. Cài đặt TexasSolver

```bash
git clone https://github.com/bupticybee/TexasSolver
cd TexasSolver
```

### Build (Windows - Visual Studio)

* Open `.sln`
* Build Release x64

👉 Output:

```
TexasSolver.exe
```

---

# ⚙️ 3. Thiết kế cấu hình solver

## 📄 config template

```json
{
  "game": "nlhe",
  "players": 2,
  "stack": 100,
  "pot": 5,
  "board": "Ks7d2c",

  "ranges": {
    "ip": "ranges/ip.txt",
    "oop": "ranges/oop.txt"
  },

  "bet_sizes": {
    "flop": [0.25, 0.5, 1.0],
    "turn": [0.5, 1.0],
    "river": [0.75, 1.5]
  },

  "iterations": 3000
}
```

---

# 🧠 4. Bucket system (QUAN TRỌNG)

## Flop buckets (18 buckets chuẩn)

```
A_dry         (A72r)      mặt A khô, IP c-bet nhiều
K_dry         (K83r)      mặt K khô
Q_dry         (Q72r)      mặt Q/J khô
low_dry       (842r)      mặt rác khô
paired_high   (KK2r)      đôi lớn 
paired_mid    (993r)      đôi trung
paired_low    (552r)      đôi nhỏ, IP check nhiều
two_tone_A    (A72ss)     A high có mua thùng
two_tone_K    (K83ss)     K high mua thùng
two_tone_low  (842ss)     bài nhỏ mua thùng
connected_high(KQJr)      sảnh to
connected_mid (T98r)      sảnh trung
connected_low (765r)      sảnh nhỏ
ace_wet       (A98ss)     A có sảnh thùng
broadway_wet  (KQJss)     broadway sảnh thùng
mid_wet       (J97ss)     dynamic trung
monotone_A    (A72sss)    3 lá đồng chất có A
monotone_low  (T72sss)    3 lá đồng chất
```

---

# 🔥 5. Batch Solve Script

## 📄 batch_solve.py

```python
import json
import subprocess
import os

TEXAS_SOLVER_PATH = "TexasSolver.exe"

positions = ["BTN_vs_BB", "SB_vs_BB", "CO_vs_BTN"]

boards = [
    {"name": "A_dry",          "cards": "As,7d,2c"},
    {"name": "K_dry",          "cards": "Ks,8d,3c"},
    {"name": "Q_dry",          "cards": "Qs,7d,2c"},
    {"name": "low_dry",        "cards": "8s,4d,2c"},
    {"name": "paired_high",    "cards": "Ks,Kd,2c"},
    {"name": "paired_mid",     "cards": "9s,9d,3c"},
    {"name": "paired_low",     "cards": "5s,5d,2c"},
    {"name": "two_tone_A",     "cards": "As,7s,2c"},
    {"name": "two_tone_K",     "cards": "Ks,8s,3c"},
    {"name": "two_tone_low",   "cards": "8s,4s,2c"},
    {"name": "connected_high", "cards": "Ks,Qd,Jc"},
    {"name": "connected_mid",  "cards": "Ts,9d,8c"},
    {"name": "connected_low",  "cards": "7s,6d,5c"},
    {"name": "ace_wet",        "cards": "As,9s,8c"},
    {"name": "broadway_wet",   "cards": "Ks,Qs,Jc"},
    {"name": "mid_wet",        "cards": "Js,9s,7c"},
    {"name": "monotone_A",     "cards": "As,7s,2s"},
    {"name": "monotone_low",   "cards": "Ts,7s,2s"},
]

def create_config(board):
    return {
        "game": "nlhe",
        "players": 2,
        "stack": 100,
        "pot": 5,
        "board": board,
        "ranges": {
            "ip": "ranges/ip.txt",
            "oop": "ranges/oop.txt"
        },
        "bet_sizes": {
            "flop": [0.25, 0.5, 1.0],
            "turn": [0.5, 1.0],
            "river": [0.75, 1.5]
        },
        "iterations": 3000
    }

os.makedirs("configs", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

for pos in positions:
    for b in boards:
        config = create_config(b["cards"])

        config_path = f"configs/{pos}_{b['name']}.json"
        output_path = f"outputs/{pos}_{b['name']}.json"

        with open(config_path, "w") as f:
            json.dump(config, f)

        print(f"Solving {pos} - {b['name']}")

        subprocess.run([
            TEXAS_SOLVER_PATH,
            "--config", config_path,
            "--output", output_path
        ])
```

---

# ⚡ 6. Output format (raw)

```json
{
  "node": "flop",
  "strategy": {
    "bet_25": 0.52,
    "bet_50": 0.18,
    "bet_100": 0.05,
    "check": 0.25
  }
}
```

---

# 🔄 7. Normalize output

```python
def normalize(data):
    strat = data.get("strategy", {})
    return {
        "bet_small": strat.get("bet_25", 0),
        "bet_mid": strat.get("bet_50", 0),
        "bet_big": strat.get("bet_100", 0),
        "check": strat.get("check", 0)
    }
```

---

# 💾 8. Final DB format

```json
{
  "BTN_vs_BB|dry_high": {
    "bet_small": 0.52,
    "bet_mid": 0.18,
    "bet_big": 0.05,
    "check": 0.25
  }
}
```

---

# 🚀 9. Runtime (RobinHUD)

```text
Hand → classify board → lookup DB → output strategy
```

---

# ⚠️ 10. Best Practices

## DO:

* Giữ 2–3 bet size
* Dùng bucket
* Solve 50–100 spot

## DON'T:

* Solve từng board cụ thể
* Solve realtime
* Dùng quá nhiều bet size

---

# 🧠 11. Performance tuning (RTX 3070)

* iterations: 2000–5000
* batch chạy 3–6 spot song song
* mỗi spot ~1–5 phút

---

# 🎯 FINAL INSIGHT

Bạn đang build:

> **GTO Dataset Engine → không phải solver**

---

# 🧩 1 câu chốt

> Solve một lần → dùng cả đời

---

👉 Gửi file này cho AI agent là nó build full pipeline cho bạn được luôn.
