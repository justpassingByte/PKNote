"""
Batch normalize all raw JSON files (Flop + Turn + River).
Run: python run_normalize_all.py
"""
import os
import sys
import json
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from normalize_output import normalize_file

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FLOP_RAW  = os.path.join(SCRIPT_DIR, "outputs/raw")
FLOP_OUT  = os.path.join(SCRIPT_DIR, "outputs")
TURN_RAW  = os.path.join(SCRIPT_DIR, "outputs/turn/raw")
TURN_OUT  = os.path.join(SCRIPT_DIR, "outputs/turn")
RIVER_RAW = os.path.join(SCRIPT_DIR, "outputs/river/raw")
RIVER_OUT = os.path.join(SCRIPT_DIR, "outputs/river")
CONFIGS_DIR = os.path.join(SCRIPT_DIR, "configs")

# Known board bucket names (order matters: longer first to avoid ambiguous prefix matches)
KNOWN_BUCKETS = [
    "two_tone_A", "two_tone_K", "two_tone_low",
    "monotone_A", "monotone_low",
    "ace_wet", "broadway_wet", "mid_wet",
    "connected_high", "connected_mid", "connected_low",
    "paired_high", "paired_mid", "paired_low",
    "A_dry", "K_dry", "Q_dry", "low_dry",
]

# Known action line prefixes for turn/river files
KNOWN_ACTION_LINES = ["cbet33_call", "cbet75_call", "xx"]

# Known turn/river type suffixes
KNOWN_TURN_TYPES  = ["blank", "board_pair", "overcard", "undercard", "flush_card", "straight_card"]
KNOWN_RIVER_TYPES = ["blank", "board_pair", "overcard", "undercard", "flush_card", "straight_card"]


def parse_filename(basename):
    """
    Parse a raw filename into structured metadata.

    Examples:
      BTN_vs_BB_A_dry               → position=BTN_vs_BB, bucket=A_dry, action=None, turn=None, river=None
      BTN_vs_BB_A_dry_cbet33_call_turn_blank   → position=BTN_vs_BB, bucket=A_dry, action=cbet33_call, turn=blank
      BTN_vs_BB_A_dry_cbet33_call_turn_blank_river_blank → + river=blank
    """
    # Identify position prefix: XY_vs_ZW
    pos_match = re.match(r'^([A-Z]+_vs_[A-Z]+)_(.+)$', basename)
    if not pos_match:
        return basename, "unknown", None, None, None
    position = pos_match.group(1)
    remainder = pos_match.group(2)

    # Identify board bucket
    board_bucket = None
    after_bucket = remainder
    for bucket in KNOWN_BUCKETS:
        if remainder == bucket or remainder.startswith(bucket + "_"):
            board_bucket = bucket
            after_bucket = remainder[len(bucket):]
            if after_bucket.startswith("_"):
                after_bucket = after_bucket[1:]
            break

    if not board_bucket:
        # Fallback: everything is the bucket
        return position, remainder, None, None, None

    if not after_bucket:
        # Pure flop file
        return position, board_bucket, None, None, None

    # Parse: action_line_turn_TYPE or action_line_turn_TYPE_river_RTYPE
    action_line = None
    turn_type = None
    river_type = None

    # Try to match action line
    for al in KNOWN_ACTION_LINES:
        if after_bucket == al or after_bucket.startswith(al + "_"):
            action_line = al
            after_action = after_bucket[len(al):]
            if after_action.startswith("_"):
                after_action = after_action[1:]

            # Expect "turn_TYPE" next
            if after_action.startswith("turn_"):
                turn_part = after_action[5:]  # strip "turn_"
                # Try river suffix
                for rt in KNOWN_RIVER_TYPES:
                    for tt in KNOWN_TURN_TYPES:
                        suffix = f"{tt}_river_{rt}"
                        if turn_part == suffix:
                            turn_type = tt
                            river_type = rt
                            break
                    if turn_type:
                        break

                if not turn_type:
                    for tt in KNOWN_TURN_TYPES:
                        if turn_part == tt:
                            turn_type = tt
                            break

            break

    return position, board_bucket, action_line, turn_type, river_type


def read_board_from_config(position, board_bucket, action_line=None):
    """
    Read the flop board from the solver config file.
    Config file name: configs/{position}_{board_bucket}.txt
    Board is on the line: set_board As,7d,2c
    """
    config_name = f"{position}_{board_bucket}.txt"
    config_path = os.path.join(CONFIGS_DIR, config_name)
    if not os.path.exists(config_path):
        return "unknown"

    with open(config_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith("set_board "):
                return line.split("set_board ", 1)[1].strip()

    return "unknown"


def make_config(position, action_line, turn_type):
    """Build config dict with appropriate pot/stack based on street."""
    if action_line is None:
        # Flop
        pot = 5.5
        stack = 100
        bet_sizes = [33, 75]
    elif turn_type is not None:
        # Turn
        pot = 9.5
        stack = 97.25
        bet_sizes = [75]
    else:
        pot = 5.5
        stack = 100
        bet_sizes = [33, 75]

    return {"pot": pot, "stack": stack, "bet_sizes_pct": bet_sizes, "iterations": 3000}


def process_dir(raw_dir, out_dir, label):
    files = [f for f in os.listdir(raw_dir) if f.endswith(".json")]
    print(f"\n{'='*60}")
    print(f"  {label}: {len(files)} files")
    print(f"{'='*60}")

    success = 0
    errors = []

    for f in sorted(files):
        raw_path = os.path.join(raw_dir, f)
        out_path = os.path.join(out_dir, f)
        basename = os.path.splitext(f)[0]

        position, board_bucket, action_line, turn_type, river_type = parse_filename(basename)
        board = read_board_from_config(position, board_bucket)
        config = make_config(position, action_line, turn_type)

        # Store action_line/turn_type/river_type in config for import_to_db
        config["action_line"] = action_line
        config["turn_type"] = turn_type
        config["river_type"] = river_type

        try:
            result = normalize_file(
                raw_path, out_path,
                position=position,
                board_bucket=board_bucket,
                board=board,
                config=config,
            )

            facing = result.get("oop_facing_cbet", {})
            vs_small = facing.get("vs_bet_small", {})
            vs_big = facing.get("vs_bet_big", {})
            has_facing = any(v > 0 for v in vs_small.values()) or any(v > 0 for v in vs_big.values())
            facing_mark = "✓ facing" if has_facing else "○ no cbet"

            print(f"  ✅ {basename}")
            print(f"       pos={position} bucket={board_bucket} board={board} ({facing_mark})")
            success += 1
        except Exception as e:
            print(f"  ❌ {basename}: {e}")
            errors.append((basename, str(e)))

    return success, errors


if __name__ == "__main__":
    total_success = 0
    all_errors = []

    if os.path.isdir(FLOP_RAW):
        s, e = process_dir(FLOP_RAW, FLOP_OUT, "FLOP")
        total_success += s
        all_errors.extend(e)

    if os.path.isdir(TURN_RAW):
        s, e = process_dir(TURN_RAW, TURN_OUT, "TURN")
        total_success += s
        all_errors.extend(e)

    if os.path.isdir(RIVER_RAW):
        s, e = process_dir(RIVER_RAW, RIVER_OUT, "RIVER")
        total_success += s
        all_errors.extend(e)

    print(f"\n{'='*60}")
    print(f"  DONE: {total_success} success, {len(all_errors)} errors")
    if all_errors:
        for name, err in all_errors:
            print(f"    ❌ {name}: {err}")
    print(f"{'='*60}")
