"""
batch_solve.py — TexasSolver Batch GTO Pipeline

Generates solver input files, runs console_solver in parallel, normalizes output.

Usage:
    python batch_solve.py                    # Full batch (30 spots)
    python batch_solve.py --dry-run          # Solve 1 spot only (BTN_vs_BB_dry_high)
    python batch_solve.py --skip-existing    # Skip spots with existing output
    python batch_solve.py --spot BTN_vs_BB_dry_high  # Solve specific spot
"""

import json
import os
import re
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

from normalize_output import normalize_file

# ============================================================
# CONFIGURATION
# ============================================================

# Paths (relative to this script's directory)
SCRIPT_DIR = Path(__file__).parent.resolve()
SOLVER_PATH = SCRIPT_DIR / "TexasSolver" / "install" / "console_solver.exe"
RESOURCE_DIR = SCRIPT_DIR / "TexasSolver" / "install" / "resources"
RANGES_DIR = SCRIPT_DIR / "ranges"
CONFIGS_DIR = SCRIPT_DIR / "configs"
OUTPUTS_RAW_DIR = SCRIPT_DIR / "outputs" / "raw"
OUTPUTS_DIR = SCRIPT_DIR / "outputs"

# If solver is at a different location (e.g. parent dir)
if not SOLVER_PATH.exists():
    ALT_SOLVER = SCRIPT_DIR.parent / "TexasSolver" / "install" / "console_solver.exe"
    ALT_RESOURCE = SCRIPT_DIR.parent / "TexasSolver" / "install" / "resources"
    if ALT_SOLVER.exists():
        SOLVER_PATH = ALT_SOLVER
        RESOURCE_DIR = ALT_RESOURCE

# Game settings — SRP 100bb
STACK = 100         # total stack (bb)
POT = 5.5           # pot at flop (bb)
EFFECTIVE_STACK = STACK - POT / 2   # = 97.25 (what solver expects)

# Solver settings
MAX_ITERATIONS = 3000
ACCURACY = 0.5          # exploitability target (%)
PRINT_INTERVAL = 100
USE_ISOMORPHISM = 1

# Parallel settings
MAX_PARALLEL = 2
THREADS_PER_JOB = 4
FALLBACK_THREADS = 6    # if crash, retry with 1 job x 6 threads
TIMEOUT_SECONDS = 1200   # 20 minutes per spot

# Bet sizes (% of pot)
FLOP_BET_SIZES = [33, 75]      # small + big
FLOP_RAISE_SIZE = 60
TURN_BET_SIZES = [75]
TURN_RAISE_SIZE = 60
RIVER_BET_SIZES = [75]
RIVER_RAISE_SIZE = 60

# ============================================================
# BOARD BUCKETS (10 flop textures)
# ============================================================

BOARDS = [
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

# ============================================================
# POSITION MATCHUPS (3)
# ============================================================

POSITIONS = [
    {
        "name": "BTN_vs_BB",
        "ip_range_file": "BTN_vs_BB_ip.txt",
        "oop_range_file": "BTN_vs_BB_oop.txt",
    },
    {
        "name": "SB_vs_BB",
        "ip_range_file": "SB_vs_BB_ip.txt",
        "oop_range_file": "SB_vs_BB_oop.txt",
    },
    {
        "name": "CO_vs_BTN",
        "ip_range_file": "CO_vs_BTN_ip.txt",
        "oop_range_file": "CO_vs_BTN_oop.txt",
    },
]

# ============================================================
# RANGE VALIDATION
# ============================================================

VALID_RANGE_PATTERN = re.compile(
    r'^([2-9TJQKA]{2}[so]?(:\d+\.?\d*)?)(,[2-9TJQKA]{2}[so]?(:\d+\.?\d*)?)*$'
)

def load_range(filepath):
    """Load and validate a range file."""
    with open(filepath, "r") as f:
        range_str = f.read().strip()
    
    # Basic validation
    if not range_str:
        raise ValueError(f"Empty range file: {filepath}")
    
    # Check for common format issues
    if "  " in range_str:
        raise ValueError(f"Double space found in range: {filepath}")
    if range_str.startswith(",") or range_str.endswith(","):
        raise ValueError(f"Range starts/ends with comma: {filepath}")
    if ",," in range_str:
        raise ValueError(f"Double comma found in range: {filepath}")
    
    # Validate each hand combo
    hands = range_str.split(",")
    for hand in hands:
        hand = hand.strip()
        if ":" in hand:
            combo, weight = hand.rsplit(":", 1)
            try:
                w = float(weight)
                if not (0 < w <= 1):
                    raise ValueError(f"Invalid weight {w} for hand {combo} in {filepath}")
            except ValueError:
                raise ValueError(f"Invalid weight format '{weight}' for hand '{combo}' in {filepath}")
        else:
            combo = hand
        
        # Validate hand format: 2 rank chars + optional suit indicator
        if not re.match(r'^[2-9TJQKA]{2}[so]?$', combo):
            raise ValueError(f"Invalid hand format '{combo}' in {filepath}")
    
    print(f"  ✓ Range validated: {filepath} ({len(hands)} combos)")
    return range_str

# ============================================================
# CONFIG GENERATION
# ============================================================

def generate_solver_input(position, board, ip_range, oop_range, output_json_path):
    """Generate a TexasSolver input command file."""
    
    lines = []
    lines.append(f"set_pot {POT}")
    lines.append(f"set_effective_stack {EFFECTIVE_STACK}")
    lines.append(f"set_board {board}")
    lines.append(f"set_range_ip {ip_range}")
    lines.append(f"set_range_oop {oop_range}")
    
    # Flop bet sizes
    flop_bets = ",".join(str(s) for s in FLOP_BET_SIZES)
    lines.append(f"set_bet_sizes oop,flop,bet,{flop_bets}")
    lines.append(f"set_bet_sizes oop,flop,raise,{FLOP_RAISE_SIZE}")
    lines.append(f"set_bet_sizes ip,flop,bet,{flop_bets}")
    lines.append(f"set_bet_sizes ip,flop,raise,{FLOP_RAISE_SIZE}")
    
    # Turn bet sizes (needed for tree building even though we only dump flop)
    turn_bets = ",".join(str(s) for s in TURN_BET_SIZES)
    lines.append(f"set_bet_sizes oop,turn,bet,{turn_bets}")
    lines.append(f"set_bet_sizes oop,turn,raise,{TURN_RAISE_SIZE}")
    lines.append(f"set_bet_sizes ip,turn,bet,{turn_bets}")
    lines.append(f"set_bet_sizes ip,turn,raise,{TURN_RAISE_SIZE}")
    
    # River bet sizes
    river_bets = ",".join(str(s) for s in RIVER_BET_SIZES)
    lines.append(f"set_bet_sizes oop,river,bet,{river_bets}")
    lines.append(f"set_bet_sizes oop,river,raise,{RIVER_RAISE_SIZE}")
    lines.append(f"set_bet_sizes ip,river,bet,{river_bets}")
    lines.append(f"set_bet_sizes ip,river,raise,{RIVER_RAISE_SIZE}")
    
    # Tree + solver
    lines.append("set_allin_threshold 0.67")
    lines.append("build_tree")
    lines.append(f"set_thread_num {THREADS_PER_JOB}")
    lines.append(f"set_accuracy {ACCURACY}")
    lines.append(f"set_max_iteration {MAX_ITERATIONS}")
    lines.append(f"set_print_interval {PRINT_INTERVAL}")
    lines.append(f"set_use_isomorphism {USE_ISOMORPHISM}")
    lines.append("start_solve")
    lines.append("set_dump_rounds 1")
    lines.append(f"dump_result {output_json_path}")
    
    return "\n".join(lines) + "\n"

# ============================================================
# SOLVER EXECUTION
# ============================================================

def solve_spot(spot_info):
    """Run solver for a single spot. Called by ProcessPoolExecutor."""
    spot_name = spot_info["name"]
    config_path = spot_info["config_path"]
    raw_output_path = spot_info["raw_output_path"]
    
    start_time = time.time()
    
    log_file_path = OUTPUTS_RAW_DIR / f"{spot_name}.log"
    
    try:
        with open(log_file_path, "w") as log_f:
            result = subprocess.run(
                [str(SOLVER_PATH), "-i", str(config_path), "-r", str(RESOURCE_DIR)],
                stdout=log_f,
                stderr=subprocess.STDOUT,
                timeout=TIMEOUT_SECONDS,
                cwd=str(SCRIPT_DIR),
            )
        
        elapsed = time.time() - start_time
        
        if result.returncode != 0:
            return {
                "name": spot_name,
                "success": False,
                "error": f"Exit code {result.returncode} (Check logs: {log_file_path})",
                "elapsed": elapsed,
            }
        
        # Check output file exists
        if not os.path.exists(raw_output_path):
            return {
                "name": spot_name,
                "success": False,
                "error": f"Output file not created: {raw_output_path}",
                "elapsed": elapsed,
                "stdout": f"Check {log_file_path}",
            }
        
        return {
            "name": spot_name,
            "success": True,
            "elapsed": elapsed,
        }
        
    except subprocess.TimeoutExpired:
        return {
            "name": spot_name,
            "success": False,
            "error": f"Timeout after {TIMEOUT_SECONDS}s",
            "elapsed": TIMEOUT_SECONDS,
        }
    except Exception as e:
        return {
            "name": spot_name,
            "success": False,
            "error": str(e),
            "elapsed": time.time() - start_time,
        }

# ============================================================
# MAIN PIPELINE
# ============================================================

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="TexasSolver Batch GTO Pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Solve only 1 spot (BTN_vs_BB_dry_high)")
    parser.add_argument("--skip-existing", action="store_true", help="Skip spots with existing normalized output")
    parser.add_argument("--spot", type=str, help="Solve specific spot (e.g. BTN_vs_BB_dry_high)")
    parser.add_argument("--parallel", type=int, default=MAX_PARALLEL, help=f"Max parallel jobs (default: {MAX_PARALLEL})")
    args = parser.parse_args()
    
    # --- Pre-checks ---
    print("=" * 60)
    print("TexasSolver Batch GTO Pipeline")
    print("=" * 60)
    
    if not SOLVER_PATH.exists():
        print(f"\n❌ Solver not found: {SOLVER_PATH}")
        print("   Run build_solver.ps1 first!")
        sys.exit(1)
    print(f"✓ Solver: {SOLVER_PATH}")
    
    if not RESOURCE_DIR.exists():
        print(f"\n❌ Resources not found: {RESOURCE_DIR}")
        sys.exit(1)
    print(f"✓ Resources: {RESOURCE_DIR}")
    
    # --- Create directories ---
    CONFIGS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUTS_RAW_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    
    # --- Load and validate ranges ---
    print(f"\n--- Loading ranges ---")
    ranges = {}
    for pos in POSITIONS:
        ip_path = RANGES_DIR / pos["ip_range_file"]
        oop_path = RANGES_DIR / pos["oop_range_file"]
        
        if not ip_path.exists() or not oop_path.exists():
            print(f"❌ Range file missing for {pos['name']}")
            sys.exit(1)
        
        ranges[pos["name"]] = {
            "ip": load_range(ip_path),
            "oop": load_range(oop_path),
        }
    
    # --- Generate configs ---
    print(f"\n--- Generating solver configs ---")
    spots = []
    
    for pos in POSITIONS:
        for board in BOARDS:
            spot_name = f"{pos['name']}_{board['name']}"
            
            # Filter if specific spot requested
            if args.spot and spot_name != args.spot:
                continue
            if args.dry_run and spot_name != "BTN_vs_BB_dry_high":
                continue
            
            config_path = CONFIGS_DIR / f"{spot_name}.txt"
            raw_output_path = OUTPUTS_RAW_DIR / f"{spot_name}.json"
            normalized_output_path = OUTPUTS_DIR / f"{spot_name}.json"
            
            # Skip existing
            if args.skip_existing and normalized_output_path.exists():
                print(f"  ⏭ {spot_name} (already exists)")
                continue
            
            # Generate config
            config_content = generate_solver_input(
                position=pos["name"],
                board=board["cards"],
                ip_range=ranges[pos["name"]]["ip"],
                oop_range=ranges[pos["name"]]["oop"],
                output_json_path=str(raw_output_path),
            )
            
            with open(config_path, "w", newline="\n") as f:
                f.write(config_content)
            
            spots.append({
                "name": spot_name,
                "position": pos["name"],
                "board": board,
                "config_path": config_path,
                "raw_output_path": raw_output_path,
                "normalized_output_path": normalized_output_path,
            })
    
    if not spots:
        print("\nNo spots to solve!")
        sys.exit(0)
    
    print(f"\n  Generated {len(spots)} configs")
    print(f"  Settings: pot={POT}, stack={STACK}, eff_stack={EFFECTIVE_STACK}")
    print(f"  Bet sizes: {FLOP_BET_SIZES}% pot")
    print(f"  Iterations: {MAX_ITERATIONS}, accuracy: {ACCURACY}%")
    
    # --- Solve ---
    total = len(spots)
    parallel = args.parallel
    print(f"\n--- Solving {total} spots ({parallel} parallel, {THREADS_PER_JOB} threads each) ---\n")
    
    completed = 0
    failed = []
    total_start = time.time()
    
    with ProcessPoolExecutor(max_workers=parallel) as executor:
        future_to_spot = {executor.submit(solve_spot, spot): spot for spot in spots}
        
        for future in as_completed(future_to_spot):
            spot = future_to_spot[future]
            result = future.result()
            completed += 1
            
            if result["success"]:
                elapsed_str = f"{result['elapsed']:.1f}s"
                print(f"  ✓ [{completed}/{total}] {result['name']} ({elapsed_str})")
            else:
                elapsed_str = f"{result['elapsed']:.1f}s"
                print(f"  ✗ [{completed}/{total}] {result['name']} — {result['error']} ({elapsed_str})")
                failed.append(result)
    
    total_elapsed = time.time() - total_start
    
    # --- Retry failed spots with fallback settings ---
    if failed and parallel > 1:
        print(f"\n--- Retrying {len(failed)} failed spots (1 job × {FALLBACK_THREADS} threads) ---\n")
        
        retry_spots = []
        for f in failed:
            for spot in spots:
                if spot["name"] == f["name"]:
                    # Update config with more threads
                    config_path = spot["config_path"]
                    with open(config_path, "r") as fh:
                        content = fh.read()
                    content = content.replace(
                        f"set_thread_num {THREADS_PER_JOB}",
                        f"set_thread_num {FALLBACK_THREADS}"
                    )
                    with open(config_path, "w", newline="\n") as fh:
                        fh.write(content)
                    retry_spots.append(spot)
        
        for spot in retry_spots:
            result = solve_spot(spot)
            if result["success"]:
                print(f"  ✓ (retry) {result['name']} ({result['elapsed']:.1f}s)")
                failed = [f for f in failed if f["name"] != result["name"]]
            else:
                print(f"  ✗ (retry) {result['name']} — {result['error']}")
    
    # --- Normalize successful outputs ---
    print(f"\n--- Normalizing outputs ---")
    normalized_count = 0
    
    for spot in spots:
        raw_path = spot["raw_output_path"]
        norm_path = spot["normalized_output_path"]
        
        if not os.path.exists(raw_path):
            continue
        
        try:
            normalize_file(
                raw_json_path=str(raw_path),
                output_path=str(norm_path),
                position=spot["position"],
                board_bucket=spot["board"]["name"],
                board=spot["board"]["cards"],
                config={
                    "pot": POT,
                    "stack": STACK,
                    "bet_sizes_pct": FLOP_BET_SIZES,
                    "iterations": MAX_ITERATIONS,
                },
            )
            normalized_count += 1
            print(f"  ✓ {spot['name']}")
        except Exception as e:
            print(f"  ✗ {spot['name']} — Normalize error: {e}")
    
    # --- Summary ---
    print(f"\n{'=' * 60}")
    print(f"PIPELINE COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Total time: {total_elapsed:.1f}s ({total_elapsed/60:.1f} min)")
    print(f"  Solved: {total - len(failed)}/{total}")
    print(f"  Normalized: {normalized_count}")
    if failed:
        print(f"  Failed: {len(failed)}")
        for f in failed:
            print(f"    - {f['name']}: {f['error']}")
    print(f"\n  Outputs: {OUTPUTS_DIR}")


if __name__ == "__main__":
    main()
