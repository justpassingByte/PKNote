"""
normalize_output.py — Parse TexasSolver raw JSON output → simplified strategy JSON.

Traverses the game tree to extract:
  1. Root Flop Node (OOP initial strategy: check/bet_small/bet_big)
  2. IP strategy after OOP checks (check/bet_small/bet_big)
  3. OOP reaction to IP c-bets (fold/call/raise) for both bet sizes

TexasSolver output JSON structure (actual from console_solver):
{
  "actions": ["CHECK", "BET 2.000000", "BET 4.000000"],
  "childrens": {
    "CHECK": { ... child node (IP action) ... },
    "BET 2.000000": { ... child node (IP reaction) ... },
    "BET 4.000000": { ... child node (IP reaction) ... }
  },
  "node_type": "action_node",
  "player": 0,          # 0 = OOP, 1 = IP
  "strategy": {
    "actions": ["CHECK", "BET 2.000000", "BET 4.000000"],
    "strategy": {
      "AcKd": [0.8, 0.1, 0.1],  # frequencies per action
      "2h2d": [0.34, 0.25, 0.41],
      ...
    }
  }
}

Game tree path for OOP facing c-bet:
  Root (OOP, player 0) 
    → childrens["CHECK"] (IP, player 1)
      → childrens["BET X"] (OOP reaction, player 0)
        actions: ["CALL", "RAISE Y", "FOLD"]
"""

import json
import os
import sys


# ============================================================
# ACTION CLASSIFICATION
# ============================================================

def classify_action_root(action_str, pot):
    """Classify a solver action string for root/IP nodes → check/bet_small/bet_big."""
    pot = float(pot)
    if action_str == "CHECK":
        return "check"
    elif action_str.startswith("BET"):
        bet_amt = float(action_str.split()[1])
        ratio = bet_amt / pot
        if ratio < 0.55:
            return "bet_small"
        else:
            return "bet_big"
    elif action_str == "FOLD":
        return "fold"
    elif action_str.startswith("RAISE") or action_str == "ALLIN":
        return "bet_big"  # rare in SRP flop
    elif action_str == "CALL":
        return "call"
    else:
        return "unknown"


def classify_action_facing(action_str):
    """Classify a solver action string for OOP facing c-bet → fold/call/raise."""
    if action_str == "FOLD":
        return "fold"
    elif action_str == "CALL":
        return "call"
    elif action_str.startswith("RAISE") or action_str == "ALLIN":
        return "raise"
    else:
        return "unknown"


# ============================================================
# NODE EXTRACTION
# ============================================================

def normalize_node(node, pot=5.5, action_classifier=None):
    """
    Normalize a single game tree node.
    Returns dict with average strategy across all hands.
    
    action_classifier: function to map action strings to categories.
                       If None, uses classify_action_root.
    """
    if not node or node.get("node_type") != "action_node":
        return None

    if action_classifier is None:
        action_classifier = lambda a: classify_action_root(a, pot)

    strategy_block = node.get("strategy", {})
    actions = strategy_block.get("actions", [])
    hand_strategies = strategy_block.get("strategy", {})

    if not actions or not hand_strategies:
        return None

    # Build action → category mapping
    action_categories = [action_classifier(a) for a in actions]

    # Determine which categories are possible
    unique_cats = set(action_categories)
    # Filter out "unknown"
    unique_cats.discard("unknown")

    # Aggregate: simple average across all hands
    n_hands = len(hand_strategies)
    if n_hands == 0:
        return None

    category_totals = {cat: 0.0 for cat in unique_cats}

    for hand, freqs in hand_strategies.items():
        for i, freq in enumerate(freqs):
            cat = action_categories[i]
            if cat in category_totals:
                category_totals[cat] += freq / n_hands

    # Round
    result = {}
    for k, v in category_totals.items():
        result[k] = round(v, 4)

    return result


def extract_per_hand(node, pot, action_classifier=None):
    """Extract per-hand normalized strategy from a node."""
    if not node or node.get("node_type") != "action_node":
        return {}

    if action_classifier is None:
        action_classifier = lambda a: classify_action_root(a, pot)

    strategy_block = node.get("strategy", {})
    actions = strategy_block.get("actions", [])
    hand_strategies = strategy_block.get("strategy", {})

    if not actions or not hand_strategies:
        return {}

    action_categories = [action_classifier(a) for a in actions]
    unique_cats = set(action_categories)
    unique_cats.discard("unknown")

    per_hand = {}
    for hand, freqs in hand_strategies.items():
        hand_result = {cat: 0.0 for cat in unique_cats}
        for i, freq in enumerate(freqs):
            cat = action_categories[i]
            if cat in hand_result:
                hand_result[cat] += freq
        
        # Clean up garbage solver decimals (e.g., 0.9996 -> 1.0) and simplify < 5% micro-mixes
        cleaned = {}
        for k, v in hand_result.items():
            if v < 0.05:
                cleaned[k] = 0.0
            elif v > 0.95:
                cleaned[k] = 1.0
            else:
                cleaned[k] = round(v, 4)

        total = sum(cleaned.values())
        if total > 0:
            per_hand[hand] = {k: round(v / total, 4) for k, v in cleaned.items()}
        else:
            # Default: depends on context
            if "check" in unique_cats:
                per_hand[hand] = {cat: (1.0 if cat == "check" else 0.0) for cat in unique_cats}
            elif "fold" in unique_cats:
                per_hand[hand] = {cat: (1.0 if cat == "fold" else 0.0) for cat in unique_cats}
            else:
                per_hand[hand] = {cat: 0.0 for cat in unique_cats}

    return per_hand


# ============================================================
# TREE TRAVERSAL
# ============================================================

def find_ip_node(root):
    """
    Find the IP (player 1) node after OOP checks.
    
    Tree structure: root (OOP) → childrens["CHECK"] → IP node
    The root node is always OOP (player 0) even if "player" field is missing.
    """
    if not root or not isinstance(root, dict):
        return None

    childrens = root.get("childrens", {})
    if not isinstance(childrens, dict):
        return None

    # After OOP checks, the CHECK child is the IP action node
    check_child = childrens.get("CHECK")
    if check_child and check_child.get("node_type") == "action_node":
        return check_child

    return None


def find_oop_facing_cbet_nodes(root):
    """
    Find OOP reaction nodes after: OOP Check → IP Bet.
    
    Tree path:
      root (OOP, player 0)
        → childrens["CHECK"] (IP, player 1)  
          → childrens["BET X.XX"] (OOP reaction, player 0)
    
    Returns dict:
      {
        "vs_bet_small": <node or None>,
        "vs_bet_big": <node or None>,
      }
    """
    result = {"vs_bet_small": None, "vs_bet_big": None}

    ip_node = find_ip_node(root)
    if not ip_node:
        return result

    ip_childrens = ip_node.get("childrens", {})
    if not isinstance(ip_childrens, dict):
        return result

    # Get the pot size for ratio calculation
    # At flop root, pot is typically 5.5 (configured in batch_solve)
    # We look at all BET actions from IP and classify them
    bet_actions = []
    for action_key in ip_childrens:
        if action_key.startswith("BET"):
            bet_amt = float(action_key.split()[1])
            bet_actions.append((action_key, bet_amt))

    if not bet_actions:
        return result

    # Sort by bet amount
    bet_actions.sort(key=lambda x: x[1])

    # Classify: smallest bet = bet_small, largest = bet_big
    # For 2 bet sizes (typical), it's straightforward
    if len(bet_actions) >= 1:
        small_key = bet_actions[0][0]
        small_child = ip_childrens.get(small_key)
        if small_child and small_child.get("node_type") == "action_node":
            result["vs_bet_small"] = small_child

    if len(bet_actions) >= 2:
        big_key = bet_actions[-1][0]
        big_child = ip_childrens.get(big_key)
        if big_child and big_child.get("node_type") == "action_node":
            result["vs_bet_big"] = big_child

    return result


# ============================================================
# MAIN NORMALIZATION
# ============================================================

def normalize_file(raw_json_path, output_path, position, board_bucket, board, config):
    """
    Full normalization pipeline: raw solver JSON → simplified output JSON.
    
    Extracts:
      1. OOP root strategy (check/bet_small/bet_big)
      2. IP strategy after OOP check (check/bet_small/bet_big)
      3. OOP facing c-bet strategy (fold/call/raise) for both bet sizes
    """
    with open(raw_json_path, "r") as f:
        raw = json.load(f)

    pot = float(config.get("pot", 5.5))
    root_classifier = lambda a: classify_action_root(a, pot)
    facing_classifier = classify_action_facing

    # ─── Layer 1: Root OOP strategy (player 0) ───
    oop_strategy = normalize_node(raw, pot, root_classifier)
    oop_per_hand = extract_per_hand(raw, pot, root_classifier)

    # ─── Layer 2: IP strategy after OOP CHECK (player 1) ───
    ip_node = find_ip_node(raw)
    ip_strategy = normalize_node(ip_node, pot, root_classifier) if ip_node else None
    ip_per_hand = extract_per_hand(ip_node, pot, root_classifier) if ip_node else {}

    # ─── Layer 3: OOP reaction to IP c-bets (player 0, fold/call/raise) ───
    facing_nodes = find_oop_facing_cbet_nodes(raw)

    oop_vs_small = None
    oop_vs_small_per_hand = {}
    oop_vs_big = None
    oop_vs_big_per_hand = {}

    if facing_nodes["vs_bet_small"]:
        oop_vs_small = normalize_node(
            facing_nodes["vs_bet_small"], pot, facing_classifier
        )
        oop_vs_small_per_hand = extract_per_hand(
            facing_nodes["vs_bet_small"], pot, facing_classifier
        )

    if facing_nodes["vs_bet_big"]:
        oop_vs_big = normalize_node(
            facing_nodes["vs_bet_big"], pot, facing_classifier
        )
        oop_vs_big_per_hand = extract_per_hand(
            facing_nodes["vs_bet_big"], pot, facing_classifier
        )

    # ─── Build output JSON ───
    default_root = {"check": 0, "bet_small": 0, "bet_big": 0}
    default_facing = {"fold": 0, "call": 0, "raise": 0}

    output = {
        "position": position,
        "board_bucket": board_bucket,
        "board": board,
        "config": config,
        "strategy": {
            "oop": oop_strategy or default_root,
            "ip": ip_strategy or default_root,
        },
        "oop_facing_cbet": {
            "vs_bet_small": oop_vs_small or default_facing,
            "vs_bet_big": oop_vs_big or default_facing,
        },
        "per_hand": {
            "oop": oop_per_hand,
            "ip": ip_per_hand,
        },
        "per_hand_facing_cbet": {
            "vs_bet_small": oop_vs_small_per_hand,
            "vs_bet_big": oop_vs_big_per_hand,
        },
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    return output


if __name__ == "__main__":
    # Standalone usage: python normalize_output.py <raw_json> <output_json>
    if len(sys.argv) < 3:
        print("Usage: python normalize_output.py <raw_json> <output_json> [pot] [board]")
        print("Example: python normalize_output.py outputs/raw/BTN_vs_BB_A_dry.json outputs/BTN_vs_BB_A_dry.json 5.5 As,7d,2c")
        sys.exit(1)

    raw_path = sys.argv[1]
    out_path = sys.argv[2]
    pot = float(sys.argv[3]) if len(sys.argv) > 3 else 5.5
    board = sys.argv[4] if len(sys.argv) > 4 else "unknown"

    # Infer position and bucket from filename
    basename = os.path.splitext(os.path.basename(raw_path))[0]
    parts = basename.split("_", 3)  # e.g. BTN_vs_BB_dry_high
    if len(parts) >= 4:
        position = f"{parts[0]}_{parts[1]}_{parts[2]}"
        board_bucket = "_".join(parts[3:])
    else:
        position = basename
        board_bucket = "unknown"

    result = normalize_file(
        raw_path, out_path,
        position=position,
        board_bucket=board_bucket,
        board=board,
        config={"pot": pot, "stack": 100, "bet_sizes_pct": [33, 75], "iterations": 3000}
    )

    print(f"Normalized: {raw_path} → {out_path}")
    print("\n=== OOP Root Strategy ===")
    print(json.dumps(result["strategy"]["oop"], indent=2))
    print("\n=== IP Strategy (after OOP check) ===")
    print(json.dumps(result["strategy"]["ip"], indent=2))
    print("\n=== OOP Facing C-bet ===")
    print(json.dumps(result["oop_facing_cbet"], indent=2))
