import os
import sys
from pathlib import Path

# Thêm thư mục hiện tại vào PYTHONPATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from batch_solve import BOARDS, POSITIONS, POT, STACK, FLOP_BET_SIZES, MAX_ITERATIONS, OUTPUTS_DIR, OUTPUTS_RAW_DIR
from normalize_output import normalize_file

# Đảm bảo thư mục outputs tồn tại
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

print("Starting normalization of raw files...")

count = 0
for pos in POSITIONS:
    for board in BOARDS:
        spot_name = f"{pos['name']}_{board['name']}"
        raw_path = OUTPUTS_RAW_DIR / f"{spot_name}.json"
        norm_path = OUTPUTS_DIR / f"{spot_name}.json"
        
        if raw_path.exists():
            if not norm_path.exists():
                try:
                    normalize_file(
                        raw_json_path=str(raw_path),
                        output_path=str(norm_path),
                        position=pos['name'],
                        board_bucket=board['name'],
                        board=board['cards'],
                        config={
                            'pot': POT,
                            'stack': STACK,
                            'bet_sizes_pct': FLOP_BET_SIZES,
                            'iterations': MAX_ITERATIONS,
                        }
                    )
                    print(f"[SUCCESS] Normalized: {spot_name}")
                    count += 1
                except Exception as e:
                    print(f"[ERROR] Failed to normalize {spot_name}: {e}")
            else:
                print(f"[SKIP] Already normalized: {spot_name}")

print(f"\\nTotal normalized correctly: {count}")
print("Done! You can now run 'python batch_solve.py --skip-existing'")
