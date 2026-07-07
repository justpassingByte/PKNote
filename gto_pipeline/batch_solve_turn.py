"""
batch_solve_turn.py — Turn Subgame Solver Pipeline (V2)

Reads Flop solver output, extracts weighted ranges for 3 action lines,
then runs subgame solves for representative turn cards.

Action lines covered:
  1. xx         — OOP check → IP check back
  2. cbet33_call — OOP check → IP bet 33% → OOP call
  3. cbet75_call — OOP check → IP bet 75% → OOP call

Usage:
    python batch_solve_turn.py                     # Full batch (all lines)
    python batch_solve_turn.py --skip-existing     # Skip already solved
    python batch_solve_turn.py --dry-run           # Test 1 spot only
    python batch_solve_turn.py --extract-only      # Only generate configs
    python batch_solve_turn.py --spot BTN_vs_BB_A_dry  # Specific flop spot
"""

import json
import os
import re
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

FLOP_RAW_DIR = SCRIPT_DIR / "outputs" / "raw"
TURN_CONFIGS_DIR = SCRIPT_DIR / "configs" / "turn"
TURN_RAW_DIR = SCRIPT_DIR / "outputs" / "turn" / "raw"
TURN_OUT_DIR = SCRIPT_DIR / "outputs" / "turn"

# ============================================================
# ACTION LINES — pot/stack after each Flop action sequence
# ============================================================

FLOP_POT = 5.5
FLOP_EFF_STACK = 97.25  # 100 - 5.5/2

# From the JSON: BET 2.000000 = 33% pot, BET 4.000000 = 75% pot
ACTION_LINES = [
    {
        "name": "xx",
        "desc": "OOP check → IP check",
        "turn_pot": FLOP_POT,               # 5.5 (no bets)
        "turn_eff_stack": FLOP_EFF_STACK,    # 97.25
    },
    {
        "name": "cbet33_call",
        "desc": "OOP check → IP bet 33% → OOP call",
        "turn_pot": round(FLOP_POT + 2.0 * 2, 2),         # 9.5
        "turn_eff_stack": round(FLOP_EFF_STACK - 2.0, 2),  # 95.25
    },
    {
        "name": "cbet75_call",
        "desc": "OOP check → IP bet 75% → OOP call",
        "turn_pot": round(FLOP_POT + 4.0 * 2, 2),         # 13.5
        "turn_eff_stack": round(FLOP_EFF_STACK - 4.0, 2),  # 93.25
    },
]

# Turn/River bet sizes
TURN_BET_SIZES = [75]
TURN_RAISE_SIZE = 60
RIVER_BET_SIZES = [75]
RIVER_RAISE_SIZE = 60

# Solver settings
MAX_ITERATIONS = 2000
ACCURACY = 0.5
PRINT_INTERVAL = 100
USE_ISOMORPHISM = 1
THREADS_PER_JOB = 2
MAX_PARALLEL = 7
TIMEOUT_SECONDS = 600

# How many representative cards per turn type
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
# TURN CARD CLASSIFICATION
# ============================================================

def classify_turn_card(turn_card_str, flop_cards_str):
    """Classify turn card into categories relative to flop."""
    flop = parse_board(flop_cards_str)
    turn_rank, turn_suit, turn_val = parse_card(turn_card_str)

    flop_ranks = [c[0] for c in flop]
    flop_suits = [c[1] for c in flop]
    flop_vals = [c[2] for c in flop]

    sorted_vals = sorted(flop_vals)
    mid_flop = sorted_vals[1]
    min_flop = sorted_vals[0]

    if turn_rank in flop_ranks:
        return "board_pair"

    suit_count = sum(1 for s in flop_suits if s == turn_suit)
    if suit_count >= 2:
        return "flush_card"

    all_vals = sorted(flop_vals + [turn_val])
    has_straight_draw = False
    for base in range(max(0, min(all_vals) - 1), min(9, max(all_vals) + 1)):
        window = set(range(base, base + 5))
        hits = sum(1 for v in all_vals if v in window)
        if hits >= 3 and turn_val in window:
            flop_in_window = sum(1 for v in flop_vals if v in window)
            if flop_in_window >= 2:
                has_straight_draw = True
                break
    if turn_val == 12:
        low_vals = [v for v in flop_vals if v <= 3]
        if len(low_vals) >= 2:
            has_straight_draw = True
    if has_straight_draw:
        return "straight_card"

    if turn_val > mid_flop:
        return "overcard"

    if turn_val < min_flop:
        return "undercard"

    return "blank"


def select_turn_cards(flop_cards_str, max_per_type=CARDS_PER_TYPE):
    """
    Select representative turn cards (up to max_per_type per category).
    Returns: dict {category: [card1, card2, ...]}
    """
    flop_card_strs = [c.strip() for c in flop_cards_str.split(",")]
    remaining = get_remaining_cards(flop_card_strs)

    classified = {}
    for card in remaining:
        cat = classify_turn_card(card, flop_cards_str)
        if cat not in classified:
            classified[cat] = []
        classified[cat].append(card)

    selected = {}
    for cat, candidates in classified.items():
        if len(candidates) <= max_per_type:
            selected[cat] = candidates
        else:
            # Spread picks evenly across the candidates
            step = len(candidates) / (max_per_type + 1)
            picks = []
            for i in range(1, max_per_type + 1):
                idx = int(step * i)
                idx = min(idx, len(candidates) - 1)
                picks.append(candidates[idx])
            selected[cat] = picks

    return selected


# ============================================================
# RANGE EXTRACTION FROM FLOP JSON
# ============================================================

def extract_ranges_after_action(flop_json_path, action_line_name):
    """
    Extract IP and OOP weighted ranges after a specific action sequence.

    Supports:
    - "xx":            OOP check → IP check back
    - "cbet33_call":   OOP check → IP bet small → OOP call
    - "cbet75_call":   OOP check → IP bet large → OOP call

    Returns: (ip_range_str, oop_range_str) with combo weights
    """
    with open(flop_json_path, "r") as f:
        root = json.load(f)

    # Step 1: OOP root node — get check weights
    oop_root_strategy = root.get("strategy", {}).get("strategy", {})
    oop_root_actions = root.get("strategy", {}).get("actions", [])

    check_idx = None
    for i, a in enumerate(oop_root_actions):
        if a == "CHECK":
            check_idx = i
            break
    if check_idx is None:
        raise ValueError("No CHECK action at OOP root")

    oop_check_weights = {}
    for hand, freqs in oop_root_strategy.items():
        oop_check_weights[hand] = freqs[check_idx]

    # Step 2: IP node after OOP check
    ip_node = root.get("childrens", {}).get("CHECK")
    if not ip_node or ip_node.get("node_type") != "action_node":
        raise ValueError("No IP action node after OOP CHECK")

    ip_strategy = ip_node.get("strategy", {}).get("strategy", {})
    ip_actions = ip_node.get("strategy", {}).get("actions", [])

    # ---- Line: check-check ----
    if action_line_name == "xx":
        # Find IP check action
        ip_check_idx = None
        for i, a in enumerate(ip_actions):
            if a == "CHECK":
                ip_check_idx = i
                break
        if ip_check_idx is None:
            raise ValueError("No CHECK action at IP node")

        # IP range = IP check weight
        ip_parts = []
        for hand, freqs in ip_strategy.items():
            w = round(freqs[ip_check_idx], 4)
            if w > 0.001:
                ip_parts.append(f"{hand}:{w}" if w < 0.999 else hand)

        # OOP range = OOP check weight (IP checked back, so ALL OOP check hands reach turn)
        oop_parts = []
        for hand, check_w in oop_check_weights.items():
            w = round(check_w, 4)
            if w > 0.001:
                oop_parts.append(f"{hand}:{w}" if w < 0.999 else hand)

        return ",".join(ip_parts), ",".join(oop_parts)

    # ---- Line: cbet (small or big) + call ----
    elif action_line_name in ("cbet33_call", "cbet75_call"):
        # Find the right bet action
        bet_threshold = 3.0 if action_line_name == "cbet33_call" else 3.0
        target_big = action_line_name == "cbet75_call"

        bet_idx = None
        for i, a in enumerate(ip_actions):
            if a.startswith("BET"):
                amt = float(a.split()[1])
                if target_big and amt >= 3.0:
                    bet_idx = i
                    break
                elif not target_big and amt < 3.0:
                    bet_idx = i
                    break

        if bet_idx is None:
            raise ValueError(f"No matching BET for {action_line_name}")

        # IP bet weights
        ip_bet_weights = {}
        for hand, freqs in ip_strategy.items():
            ip_bet_weights[hand] = freqs[bet_idx]

        # Navigate to OOP response
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

        # IP range = bet weight
        ip_parts = []
        for hand, bet_freq in ip_bet_weights.items():
            w = round(bet_freq, 4)
            if w > 0.001:
                ip_parts.append(f"{hand}:{w}" if w < 0.999 else hand)

        # OOP range = check_weight × call_weight
        oop_parts = []
        for hand, freqs in oop_resp_strategy.items():
            check_w = oop_check_weights.get(hand, 0)
            call_w = freqs[call_idx]
            w = round(check_w * call_w, 4)
            if w > 0.001:
                oop_parts.append(f"{hand}:{w}" if w < 0.999 else hand)

        return ",".join(ip_parts), ",".join(oop_parts)

    else:
        raise ValueError(f"Unknown action_line: {action_line_name}")


# ============================================================
# CONFIG GENERATION
# ============================================================

def generate_turn_config(board_4cards, ip_range, oop_range,
                         turn_pot, turn_eff_stack, output_json_path):
    """Generate solver config for a turn subgame."""
    lines = []
    lines.append(f"set_pot {turn_pot}")
    lines.append(f"set_effective_stack {turn_eff_stack}")
    lines.append(f"set_board {board_4cards}")
    lines.append(f"set_range_ip {ip_range}")
    lines.append(f"set_range_oop {oop_range}")

    turn_bets = ",".join(str(s) for s in TURN_BET_SIZES)
    lines.append(f"set_bet_sizes oop,flop,bet,{turn_bets}")
    lines.append(f"set_bet_sizes oop,flop,raise,{TURN_RAISE_SIZE}")
    lines.append(f"set_bet_sizes ip,flop,bet,{turn_bets}")
    lines.append(f"set_bet_sizes ip,flop,raise,{TURN_RAISE_SIZE}")

    river_bets = ",".join(str(s) for s in RIVER_BET_SIZES)
    lines.append(f"set_bet_sizes oop,turn,bet,{river_bets}")
    lines.append(f"set_bet_sizes oop,turn,raise,{RIVER_RAISE_SIZE}")
    lines.append(f"set_bet_sizes ip,turn,bet,{river_bets}")
    lines.append(f"set_bet_sizes ip,turn,raise,{RIVER_RAISE_SIZE}")

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
# BOARDS + POSITIONS
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

POSITIONS = [
    {"name": "BTN_vs_BB"},
    {"name": "SB_vs_BB"},
    {"name": "CO_vs_BTN"},
]

# ============================================================
# SOLVER EXECUTION
# ============================================================

def solve_turn_spot(spot_info):
    """Run solver for a single turn subgame spot."""
    spot_name = spot_info["name"]
    config_path = spot_info["config_path"]
    raw_output_path = spot_info["raw_output_path"]

    start_time = time.time()
    log_path = TURN_RAW_DIR / f"{spot_name}.log"

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

def normalize_turn_file(raw_path, output_path, metadata):
    """Normalize turn subgame output → simplified strategy JSON."""
    with open(raw_path, "r") as f:
        raw = json.load(f)

    from normalize_output import normalize_node, extract_per_hand

    pot = metadata.get("turn_pot", 9.5)

    oop_strategy = normalize_node(raw, pot)

    ip_node = None
    childrens = raw.get("childrens", {})
    check_child = childrens.get("CHECK")
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
        "full_board": metadata["full_board"],
        "config": {
            "pot": pot,
            "eff_stack": metadata.get("turn_eff_stack", 95.25),
            "bet_sizes_pct": TURN_BET_SIZES,
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
# MAIN PIPELINE
# ============================================================

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Turn Subgame Solver Pipeline (V2)")
    parser.add_argument("--skip-existing", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Test 1 flop spot only")
    parser.add_argument("--spot", type=str, help="Specific flop spot")
    parser.add_argument("--parallel", type=int, default=MAX_PARALLEL)
    parser.add_argument("--extract-only", action="store_true")
    parser.add_argument("--line", type=str,
                        help="Specific action line (xx, cbet33_call, cbet75_call)")
    args = parser.parse_args()

    print("=" * 60)
    print("Turn Subgame Solver Pipeline (V2)")
    print("=" * 60)

    if not SOLVER_PATH.exists():
        print(f"\n❌ Solver not found: {SOLVER_PATH}")
        sys.exit(1)
    print(f"✓ Solver: {SOLVER_PATH}")

    TURN_CONFIGS_DIR.mkdir(parents=True, exist_ok=True)
    TURN_RAW_DIR.mkdir(parents=True, exist_ok=True)
    TURN_OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Filter action lines
    lines_to_run = ACTION_LINES
    if args.line:
        lines_to_run = [al for al in ACTION_LINES if al["name"] == args.line]
        if not lines_to_run:
            print(f"❌ Unknown action line: {args.line}")
            sys.exit(1)

    print(f"  Action lines: {[al['name'] for al in lines_to_run]}")
    print(f"  Cards per turn type: {CARDS_PER_TYPE}")

    # ---- Phase 1: Extract ranges ----
    print(f"\n--- Phase 1: Extracting ranges from flop outputs ---")

    spots = []
    skipped = 0

    for pos in POSITIONS:
        for board in BOARDS:
            flop_spot = f"{pos['name']}_{board['name']}"
            flop_raw = FLOP_RAW_DIR / f"{flop_spot}.json"

            if args.spot and flop_spot != args.spot:
                continue
            if args.dry_run and flop_spot != "BTN_vs_BB_A_dry":
                continue

            if not flop_raw.exists():
                print(f"  ⚠ Missing: {flop_spot}")
                continue

            # Select turn cards for this board
            turn_cards = select_turn_cards(board["cards"])
            total_cards = sum(len(v) for v in turn_cards.values())

            # For each action line
            for aline in lines_to_run:
                try:
                    ip_range, oop_range = extract_ranges_after_action(
                        str(flop_raw), aline["name"]
                    )
                except Exception as e:
                    print(f"  ✗ {flop_spot}/{aline['name']}: {e}")
                    continue

                ip_count = len(ip_range.split(",")) if ip_range else 0
                oop_count = len(oop_range.split(",")) if oop_range else 0

                if ip_count < 5 or oop_count < 5:
                    print(f"  ⚠ {flop_spot}/{aline['name']}: too few "
                          f"(IP={ip_count}, OOP={oop_count})")
                    continue

                print(f"  ✓ {flop_spot}/{aline['name']}: "
                      f"IP={ip_count}, OOP={oop_count}, "
                      f"{len(turn_cards)} types × {CARDS_PER_TYPE} cards")

                # Generate configs for each turn card
                for turn_type, card_list in turn_cards.items():
                    for ci, turn_card in enumerate(card_list):
                        suffix = f"_{ci+1}" if len(card_list) > 1 else ""
                        spot_name = (f"{flop_spot}_{aline['name']}"
                                     f"_turn_{turn_type}{suffix}")
                        full_board = board["cards"] + "," + turn_card

                        norm_path = TURN_OUT_DIR / f"{spot_name}.json"
                        if args.skip_existing and norm_path.exists():
                            skipped += 1
                            continue

                        config_path = TURN_CONFIGS_DIR / f"{spot_name}.txt"
                        raw_path = TURN_RAW_DIR / f"{spot_name}.json"

                        ip_filtered = filter_range_for_card(ip_range, turn_card)
                        oop_filtered = filter_range_for_card(oop_range, turn_card)

                        if not ip_filtered or not oop_filtered:
                            continue

                        ip_abstract = combos_to_abstract(ip_filtered)
                        oop_abstract = combos_to_abstract(oop_filtered)

                        if not ip_abstract or not oop_abstract:
                            continue

                        config_content = generate_turn_config(
                            full_board, ip_abstract, oop_abstract,
                            aline["turn_pot"], aline["turn_eff_stack"],
                            str(raw_path)
                        )

                        with open(config_path, "w", newline="\n") as f:
                            f.write(config_content)

                        spots.append({
                            "name": spot_name,
                            "config_path": config_path,
                            "raw_output_path": raw_path,
                            "norm_path": norm_path,
                            "metadata": {
                                "position": pos["name"],
                                "board_bucket": board["name"],
                                "flop_board": board["cards"],
                                "turn_card": turn_card,
                                "turn_type": turn_type,
                                "action_line": aline["name"],
                                "full_board": full_board,
                                "turn_pot": aline["turn_pot"],
                                "turn_eff_stack": aline["turn_eff_stack"],
                            }
                        })

    if skipped:
        print(f"  ⏭ Skipped {skipped} already solved")

    if args.extract_only:
        print(f"\n  --extract-only: Generated {len(spots)} configs. Done.")
        return

    if not spots:
        print("\nNo turn spots to solve!")
        return

    total = len(spots)
    print(f"\n  Total: {total} turn subgame spots")

    # ---- Phase 2: Solve ----
    print(f"\n--- Phase 2: Solving {total} spots "
          f"({args.parallel} parallel, {THREADS_PER_JOB} threads each) ---\n")

    completed = 0
    failed = []
    total_start = time.time()

    with ProcessPoolExecutor(max_workers=args.parallel) as executor:
        future_to_spot = {executor.submit(solve_turn_spot, s): s for s in spots}

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
            normalize_turn_file(str(raw_path), str(norm_path), spot["metadata"])
            norm_count += 1
            print(f"  ✓ {spot['name']}")
        except Exception as e:
            print(f"  ✗ {spot['name']} — {e}")

    # ---- Summary ----
    print(f"\n{'=' * 60}")
    print(f"TURN PIPELINE COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Total time: {total_elapsed:.1f}s ({total_elapsed/60:.1f} min)")
    print(f"  Solved: {total - len(failed)}/{total}")
    print(f"  Normalized: {norm_count}")
    if failed:
        print(f"  Failed: {len(failed)}")
        for f in failed:
            print(f"    - {f['name']}: {f['error']}")
    print(f"\n  Outputs: {TURN_OUT_DIR}")


# ============================================================
# HELPERS
# ============================================================

def filter_range_for_card(range_str, card):
    """Remove hands containing the given card."""
    parts = range_str.split(",")
    filtered = []
    for part in parts:
        hand_part = part.split(":")[0]
        card1 = hand_part[0:2]
        card2 = hand_part[2:4]
        if card1 != card and card2 != card:
            filtered.append(part)
    return ",".join(filtered)


def combos_to_abstract(range_str):
    """
    Convert specific combo range (AcKd:0.85,AhKs:0.72,...)
    to abstract notation (AKo:0.785,...) for TexasSolver.

    Groups by: suited (AKs) vs offsuit (AKo) vs pair (AA).
    Averages weights within each group.
    """
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


if __name__ == "__main__":
    main()
