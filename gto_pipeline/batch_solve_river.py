"""
batch_solve_river.py — River Subgame Solver Pipeline (V2)

Reads Turn solver output, extracts weighted ranges,
then runs 1-street subgame solves for representative river cards.

Usage:
    python batch_solve_river.py                     # Full batch
    python batch_solve_river.py --skip-existing     # Skip already solved
    python batch_solve_river.py --dry-run           # Test 1 turn spot only
    python batch_solve_river.py --extract-only      # Only generate configs
"""

import json
import os
import subprocess
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

# ============================================================
# PATHS
# ============================================================

SCRIPT_DIR = Path(__file__).parent.resolve()
SOLVER_PATH = SCRIPT_DIR / "TexasSolver" / "install" / "console_solver.exe"
RESOURCE_DIR = SCRIPT_DIR / "TexasSolver" / "install" / "resources"

if not SOLVER_PATH.exists():
    ALT = SCRIPT_DIR.parent / "TexasSolver" / "install" / "console_solver.exe"
    ALT_R = SCRIPT_DIR.parent / "TexasSolver" / "install" / "resources"
    if ALT.exists():
        SOLVER_PATH = ALT
        RESOURCE_DIR = ALT_R

TURN_RAW_DIR = SCRIPT_DIR / "outputs" / "turn" / "raw"
TURN_OUT_DIR = SCRIPT_DIR / "outputs" / "turn"
RIVER_CONFIGS_DIR = SCRIPT_DIR / "configs" / "river"
RIVER_RAW_DIR = SCRIPT_DIR / "outputs" / "river" / "raw"
RIVER_OUT_DIR = SCRIPT_DIR / "outputs" / "river"

# ============================================================
# SETTINGS
# ============================================================

RIVER_BET_SIZES = [75]
RIVER_RAISE_SIZE = 60

MAX_ITERATIONS = 1000
ACCURACY = 0.5
PRINT_INTERVAL = 100
USE_ISOMORPHISM = 1
THREADS_PER_JOB = 2
MAX_PARALLEL = 7
TIMEOUT_SECONDS = 300

CARDS_PER_TYPE = 1

# ============================================================
# CARD UTILITIES
# ============================================================

RANKS = "23456789TJQKA"
SUITS = "cdhs"
RANK_VALUE = {r: i for i, r in enumerate(RANKS)}


def parse_card(card_str):
    return card_str[0], card_str[1], RANK_VALUE[card_str[0]]


def parse_board(board_str):
    return [parse_card(c.strip()) for c in board_str.split(",")]


def get_all_cards():
    return [f"{r}{s}" for r in RANKS for s in SUITS]


def get_remaining_cards(board_cards):
    board_set = set(board_cards)
    return [c for c in get_all_cards() if c not in board_set]


# ============================================================
# RIVER CARD CLASSIFICATION
# ============================================================

def classify_river_card(river_card_str, board_4cards_str):
    """
    Classify river card into simplified categories.
    
    3-4 types only:
    1. board_pair  - Matches a board card rank
    2. flush_card  - 3rd or 4th card of same suit (completes or threatens flush)
    3. overcard    - Higher than middle board card
    4. blank       - Everything else (includes straight cards, undercards)
    """
    board = parse_board(board_4cards_str)
    river_rank, river_suit, river_val = parse_card(river_card_str)

    board_ranks = [c[0] for c in board]
    board_suits = [c[1] for c in board]
    board_vals = sorted([c[2] for c in board])
    mid_val = board_vals[2]  # 3rd of 4 sorted values

    # 1. Board pair
    if river_rank in board_ranks:
        return "board_pair"

    # 2. Flush card (3+ of same suit on final board)
    suit_count = sum(1 for s in board_suits if s == river_suit)
    if suit_count >= 2:
        return "flush_card"

    # 3. Overcard
    if river_val > mid_val:
        return "overcard"

    # 4. Blank (everything else)
    return "blank"


def select_river_cards(board_4cards_str, max_per_type=CARDS_PER_TYPE):
    """Select representative river cards (up to max_per_type per category)."""
    board_card_strs = [c.strip() for c in board_4cards_str.split(",")]
    remaining = get_remaining_cards(board_card_strs)

    classified = {}
    for card in remaining:
        cat = classify_river_card(card, board_4cards_str)
        if cat not in classified:
            classified[cat] = []
        classified[cat].append(card)

    selected = {}
    for cat, candidates in classified.items():
        if len(candidates) <= max_per_type:
            selected[cat] = candidates
        else:
            step = len(candidates) / (max_per_type + 1)
            picks = []
            for i in range(1, max_per_type + 1):
                idx = min(int(step * i), len(candidates) - 1)
                picks.append(candidates[idx])
            selected[cat] = picks

    return selected


# ============================================================
# RANGE EXTRACTION FROM TURN JSON
# ============================================================

def extract_ranges_from_turn(turn_json_path):
    """
    Extract IP and OOP weighted ranges after:
    OOP check → IP bet → OOP call on Turn.

    Returns: (ip_range_str, oop_range_str, river_pot, river_eff_stack)
    """
    with open(turn_json_path, "r") as f:
        root = json.load(f)

    oop_root_strategy = root.get("strategy", {}).get("strategy", {})
    oop_root_actions = root.get("strategy", {}).get("actions", [])

    check_idx = None
    for i, a in enumerate(oop_root_actions):
        if a == "CHECK":
            check_idx = i
            break
    if check_idx is None:
        raise ValueError("No CHECK at OOP root")

    oop_check_weights = {}
    for hand, freqs in oop_root_strategy.items():
        oop_check_weights[hand] = freqs[check_idx]

    ip_node = root.get("childrens", {}).get("CHECK")
    if not ip_node or ip_node.get("node_type") != "action_node":
        raise ValueError("No IP node after OOP CHECK")

    ip_strategy = ip_node.get("strategy", {}).get("strategy", {})
    ip_actions = ip_node.get("strategy", {}).get("actions", [])

    bet_idx = None
    bet_amount = 0
    for i, a in enumerate(ip_actions):
        if a.startswith("BET"):
            bet_idx = i
            bet_amount = float(a.split()[1])
            break

    if bet_idx is None:
        raise ValueError("No BET at IP node")

    ip_bet_weights = {}
    for hand, freqs in ip_strategy.items():
        ip_bet_weights[hand] = freqs[bet_idx]

    bet_key = ip_actions[bet_idx]
    oop_response = ip_node.get("childrens", {}).get(bet_key)
    if not oop_response or oop_response.get("node_type") != "action_node":
        raise ValueError(f"No OOP response after IP {bet_key}")

    oop_resp_strategy = oop_response.get("strategy", {}).get("strategy", {})
    oop_resp_actions = oop_response.get("strategy", {}).get("actions", [])

    call_idx = None
    for i, a in enumerate(oop_resp_actions):
        if a == "CALL":
            call_idx = i
            break
    if call_idx is None:
        raise ValueError("No CALL at OOP response")

    ip_parts = []
    for hand, bet_freq in ip_bet_weights.items():
        w = round(bet_freq, 4)
        if w > 0.001:
            ip_parts.append(f"{hand}:{w}" if w < 0.999 else hand)

    oop_parts = []
    for hand, freqs in oop_resp_strategy.items():
        check_w = oop_check_weights.get(hand, 0)
        call_w = freqs[call_idx]
        w = round(check_w * call_w, 4)
        if w > 0.001:
            oop_parts.append(f"{hand}:{w}" if w < 0.999 else hand)

    # Read pot from turn metadata (stored in the normalized output)
    # We'll compute based on the bet amount found
    # Turn pot is passed in from the turn normalized file, here we compute river pot
    return ",".join(ip_parts), ",".join(oop_parts), bet_amount


# ============================================================
# CONFIG GENERATION
# ============================================================

def generate_river_config(board_5cards, ip_range, oop_range,
                          pot, eff_stack, output_json_path):
    """Generate solver config for river subgame (1 street only)."""
    lines = []
    lines.append(f"set_pot {pot}")
    lines.append(f"set_effective_stack {eff_stack}")
    lines.append(f"set_board {board_5cards}")
    lines.append(f"set_range_ip {ip_range}")
    lines.append(f"set_range_oop {oop_range}")

    river_bets = ",".join(str(s) for s in RIVER_BET_SIZES)
    lines.append(f"set_bet_sizes oop,river,bet,{river_bets}")
    lines.append(f"set_bet_sizes oop,river,raise,{RIVER_RAISE_SIZE}")
    lines.append(f"set_bet_sizes ip,river,bet,{river_bets}")
    lines.append(f"set_bet_sizes ip,river,raise,{RIVER_RAISE_SIZE}")

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
# SOLVER
# ============================================================

def solve_river_spot(spot_info):
    spot_name = spot_info["name"]
    config_path = spot_info["config_path"]
    raw_output_path = spot_info["raw_output_path"]

    start_time = time.time()
    log_path = RIVER_RAW_DIR / f"{spot_name}.log"

    try:
        with open(log_path, "w") as log_f:
            result = subprocess.run(
                [str(SOLVER_PATH), "-i", str(config_path), "-r", str(RESOURCE_DIR)],
                stdout=log_f,
                stderr=subprocess.STDOUT,
                timeout=TIMEOUT_SECONDS,
                cwd=str(SCRIPT_DIR),
            )

        elapsed = time.time() - start_time

        if result.returncode != 0:
            return {"name": spot_name, "success": False,
                    "error": f"Exit code {result.returncode}", "elapsed": elapsed}

        if not os.path.exists(raw_output_path):
            return {"name": spot_name, "success": False,
                    "error": "Output file not created", "elapsed": elapsed}

        return {"name": spot_name, "success": True, "elapsed": elapsed}

    except subprocess.TimeoutExpired:
        return {"name": spot_name, "success": False,
                "error": f"Timeout {TIMEOUT_SECONDS}s", "elapsed": TIMEOUT_SECONDS}
    except Exception as e:
        return {"name": spot_name, "success": False,
                "error": str(e), "elapsed": time.time() - start_time}


# ============================================================
# NORMALIZE
# ============================================================

def normalize_river_file(raw_path, output_path, metadata):
    with open(raw_path, "r") as f:
        raw = json.load(f)

    from normalize_output import normalize_node, extract_per_hand

    pot = metadata.get("river_pot", 23.75)

    oop_strategy = normalize_node(raw, pot)

    ip_node = None
    check_child = raw.get("childrens", {}).get("CHECK")
    if check_child and check_child.get("node_type") == "action_node":
        ip_node = check_child

    ip_strategy = normalize_node(ip_node, pot) if ip_node else None
    oop_per_hand = extract_per_hand(raw, pot)
    ip_per_hand = extract_per_hand(ip_node, pot) if ip_node else {}

    output = {
        "position": metadata["position"],
        "board_bucket": metadata["board_bucket"],
        "flop_board": metadata["flop_board"],
        "turn_card": metadata["turn_card"],
        "turn_type": metadata["turn_type"],
        "action_line": metadata["action_line"],
        "river_card": metadata["river_card"],
        "river_type": metadata["river_type"],
        "full_board": metadata["full_board"],
        "config": {
            "pot": pot,
            "eff_stack": metadata.get("river_eff", 88.0),
            "bet_sizes_pct": RIVER_BET_SIZES,
            "iterations": MAX_ITERATIONS,
        },
        "strategy": {
            "oop": oop_strategy or {"check": 0, "bet_small": 0, "bet_big": 0},
            "ip": ip_strategy or {"check": 0, "bet_small": 0, "bet_big": 0},
        },
        "per_hand": {
            "oop": oop_per_hand,
            "ip": ip_per_hand,
        }
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    return output


# ============================================================
# HELPERS
# ============================================================

def filter_range_for_card(range_str, card):
    parts = range_str.split(",")
    filtered = []
    for part in parts:
        hand_part = part.split(":")[0]
        c1 = hand_part[0:2]
        c2 = hand_part[2:4]
        if c1 != card and c2 != card:
            filtered.append(part)
    return ",".join(filtered)


def combos_to_abstract(range_str):
    if not range_str:
        return ""

    RANK_ORDER = "23456789TJQKA"
    groups = {}

    for part in range_str.split(","):
        part = part.strip()
        if not part:
            continue

        if ":" in part:
            combo, weight = part.split(":", 1)
            weight = float(weight)
        else:
            combo = part
            weight = 1.0

        if len(combo) != 4:
            continue

        r1, s1 = combo[0], combo[1]
        r2, s2 = combo[2], combo[3]

        ri1 = RANK_ORDER.index(r1)
        ri2 = RANK_ORDER.index(r2)

        if ri1 < ri2:
            r1, r2 = r2, r1

        if r1 == r2:
            abstract = f"{r1}{r2}"
        elif s1 == s2:
            abstract = f"{r1}{r2}s"
        else:
            abstract = f"{r1}{r2}o"

        if abstract not in groups:
            groups[abstract] = []
        groups[abstract].append(weight)

    result_parts = []
    for hand, weights in groups.items():
        avg_w = sum(weights) / len(weights)
        if avg_w > 0.999:
            result_parts.append(hand)
        elif avg_w > 0.001:
            result_parts.append(f"{hand}:{round(avg_w, 3)}")

    return ",".join(result_parts)


# ============================================================
# MAIN
# ============================================================

def main():
    import argparse

    parser = argparse.ArgumentParser(description="River Subgame Solver Pipeline (V2)")
    parser.add_argument("--skip-existing", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--parallel", type=int, default=MAX_PARALLEL)
    parser.add_argument("--extract-only", action="store_true")
    args = parser.parse_args()

    print("=" * 60)
    print("River Subgame Solver Pipeline (V2)")
    print("=" * 60)

    if not SOLVER_PATH.exists():
        print(f"\n❌ Solver not found: {SOLVER_PATH}")
        sys.exit(1)
    print(f"✓ Solver: {SOLVER_PATH}")

    RIVER_CONFIGS_DIR.mkdir(parents=True, exist_ok=True)
    RIVER_RAW_DIR.mkdir(parents=True, exist_ok=True)
    RIVER_OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"  Cards per river type: {CARDS_PER_TYPE}")

    # ---- Phase 1: Scan normalized turn outputs ----
    print(f"\n--- Phase 1: Extracting ranges from turn outputs ---")

    turn_files = sorted(TURN_OUT_DIR.glob("*.json"))
    if not turn_files:
        print("  ⚠ No turn outputs found. Run batch_solve_turn.py first.")
        return

    spots = []
    skipped = 0
    tested_one = False

    for turn_norm_path in turn_files:
        turn_spot_name = turn_norm_path.stem

        if args.dry_run and tested_one:
            break

        with open(turn_norm_path, "r") as f:
            turn_meta = json.load(f)

        position = turn_meta.get("position", "")
        board_bucket = turn_meta.get("board_bucket", "")
        flop_board = turn_meta.get("flop_board", "")
        turn_card = turn_meta.get("turn_card", "")
        turn_type = turn_meta.get("turn_type", "")
        action_line = turn_meta.get("action_line", "cbet33_call")
        turn_full_board = turn_meta.get("full_board", "")
        turn_pot = turn_meta.get("config", {}).get("pot", 9.5)
        turn_eff = turn_meta.get("config", {}).get("eff_stack", 95.25)

        if not turn_full_board:
            continue

        turn_raw_path = TURN_RAW_DIR / f"{turn_spot_name}.json"
        if not turn_raw_path.exists():
            print(f"  ⚠ Missing raw: {turn_spot_name}")
            continue

        try:
            ip_range, oop_range, bet_amount = extract_ranges_from_turn(
                str(turn_raw_path)
            )
        except Exception as e:
            print(f"  ✗ {turn_spot_name}: {e}")
            continue

        ip_count = len(ip_range.split(",")) if ip_range else 0
        oop_count = len(oop_range.split(",")) if oop_range else 0

        if ip_count < 3 or oop_count < 3:
            print(f"  ⚠ {turn_spot_name}: too few (IP={ip_count}, OOP={oop_count})")
            continue

        river_pot = round(turn_pot + bet_amount * 2, 2)
        river_eff = round(turn_eff - bet_amount, 2)

        river_cards = select_river_cards(turn_full_board)
        total_river = sum(len(v) for v in river_cards.values())

        print(f"  ✓ {turn_spot_name}: IP={ip_count}, OOP={oop_count}, "
              f"{len(river_cards)} types × {CARDS_PER_TYPE}, pot={river_pot}")

        for river_type, card_list in river_cards.items():
            for ci, river_card in enumerate(card_list):
                suffix = f"_{ci+1}" if len(card_list) > 1 else ""
                spot_name = f"{turn_spot_name}_river_{river_type}{suffix}"
                full_board = turn_full_board + "," + river_card

                norm_path = RIVER_OUT_DIR / f"{spot_name}.json"
                if args.skip_existing and norm_path.exists():
                    skipped += 1
                    continue

                config_path = RIVER_CONFIGS_DIR / f"{spot_name}.txt"
                raw_path = RIVER_RAW_DIR / f"{spot_name}.json"

                ip_filtered = filter_range_for_card(ip_range, river_card)
                oop_filtered = filter_range_for_card(oop_range, river_card)

                if not ip_filtered or not oop_filtered:
                    continue

                ip_abstract = combos_to_abstract(ip_filtered)
                oop_abstract = combos_to_abstract(oop_filtered)

                if not ip_abstract or not oop_abstract:
                    continue

                config_content = generate_river_config(
                    full_board, ip_abstract, oop_abstract,
                    river_pot, river_eff, str(raw_path)
                )

                with open(config_path, "w", newline="\n") as f:
                    f.write(config_content)

                spots.append({
                    "name": spot_name,
                    "config_path": config_path,
                    "raw_output_path": raw_path,
                    "norm_path": norm_path,
                    "metadata": {
                        "position": position,
                        "board_bucket": board_bucket,
                        "flop_board": flop_board,
                        "turn_card": turn_card,
                        "turn_type": turn_type,
                        "action_line": action_line,
                        "river_card": river_card,
                        "river_type": river_type,
                        "full_board": full_board,
                        "river_pot": river_pot,
                        "river_eff": river_eff,
                    }
                })

        tested_one = True

    if skipped:
        print(f"  ⏭ Skipped {skipped} already solved")

    if args.extract_only:
        print(f"\n  --extract-only: Generated {len(spots)} configs. Done.")
        return

    if not spots:
        print("\nNo river spots to solve!")
        return

    total = len(spots)
    print(f"\n  Total: {total} river subgame spots")

    # ---- Phase 2: Solve ----
    print(f"\n--- Phase 2: Solving {total} spots "
          f"({args.parallel} parallel, {THREADS_PER_JOB} threads each) ---\n")

    completed = 0
    failed = []
    total_start = time.time()

    with ProcessPoolExecutor(max_workers=args.parallel) as executor:
        future_to_spot = {executor.submit(solve_river_spot, s): s for s in spots}

        for future in as_completed(future_to_spot):
            result = future.result()
            completed += 1

            if result["success"]:
                print(f"  ✓ [{completed}/{total}] {result['name']} "
                      f"({result['elapsed']:.1f}s)")
            else:
                print(f"  ✗ [{completed}/{total}] {result['name']} — "
                      f"{result['error']}")
                failed.append(result)

    total_elapsed = time.time() - total_start

    # ---- Phase 3: Normalize ----
    print(f"\n--- Phase 3: Normalizing outputs ---")
    norm_count = 0

    for spot in spots:
        raw_path = spot["raw_output_path"]
        norm_path = spot["norm_path"]

        if not os.path.exists(raw_path):
            continue

        try:
            normalize_river_file(str(raw_path), str(norm_path), spot["metadata"])
            norm_count += 1
            print(f"  ✓ {spot['name']}")
        except Exception as e:
            print(f"  ✗ {spot['name']} — {e}")

    # ---- Summary ----
    print(f"\n{'=' * 60}")
    print(f"RIVER PIPELINE COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Total time: {total_elapsed:.1f}s ({total_elapsed/60:.1f} min)")
    print(f"  Solved: {total - len(failed)}/{total}")
    print(f"  Normalized: {norm_count}")
    if failed:
        print(f"  Failed: {len(failed)}")
        for f in failed:
            print(f"    - {f['name']}: {f['error']}")
    print(f"\n  Outputs: {RIVER_OUT_DIR}")


if __name__ == "__main__":
    main()
