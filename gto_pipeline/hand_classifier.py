"""
hand_classifier.py — Classify poker hands into strategic categories on a given board.

Given a hand (e.g. "AcKd") and board (e.g. "As,7d,2c"), determine the
hand's strategic classification for HUD display.

Categories (priority order, highest first):
  Made hands:
    straight_flush, quads, full_house, flush, straight,
    set, trips, two_pair,
    overpair, top_pair, second_pair, low_pair, underpair
  Draws:
    flush_draw, straight_draw
  Nothing:
    overcards, ace_high, air
"""

from collections import Counter

RANKS = "23456789TJQKA"
RANK_VAL = {r: i for i, r in enumerate(RANKS)}


def parse_card(s):
    """'As' -> ('A', 's')"""
    return (s[0], s[1])


def parse_board(board_str):
    """'As,7d,2c' -> [('A','s'), ('7','d'), ('2','c')]"""
    return [parse_card(c.strip()) for c in board_str.split(",")]


def parse_hand(hand_str):
    """'AcKd' -> [('A','c'), ('K','d')]"""
    return [(hand_str[0], hand_str[1]), (hand_str[2], hand_str[3])]


def _has_straight(vals):
    """Check if sorted unique vals contain 5 consecutive. Returns True/False."""
    if len(vals) < 5:
        return False
    for i in range(len(vals) - 4):
        if vals[i + 4] - vals[i] == 4:
            # Check all 5 are present
            window = set(range(vals[i], vals[i] + 5))
            if window.issubset(set(vals)):
                return True
    # Ace-low straight: A,2,3,4,5 → vals 0,1,2,3,12
    if {0, 1, 2, 3, 12}.issubset(set(vals)):
        return True
    return False


def _count_straight_outs(vals, hand_vals):
    """
    Check if there's a straight draw (OESD or gutshot).
    Only counts if at least one hand card is involved.
    Returns: 'oesd', 'gutshot', or None
    """
    all_vals_set = set(vals)
    best_draw = None

    # Check all windows of 5 consecutive ranks
    for start in range(0, 13 - 4):
        window = set(range(start, start + 5))
        present = window & all_vals_set
        missing = window - all_vals_set
        hand_contribution = window & hand_vals

        if len(present) == 4 and len(missing) == 1 and len(hand_contribution) >= 1:
            # Is it OESD or gutshot?
            missing_val = list(missing)[0]
            if missing_val == start or missing_val == start + 4:
                best_draw = "oesd"
            else:
                if best_draw is None:
                    best_draw = "gutshot"

    # Ace-low wheel draw: A,2,3,4,5
    wheel = {0, 1, 2, 3, 12}
    present = wheel & all_vals_set
    missing = wheel - all_vals_set
    hand_contribution = wheel & hand_vals
    if len(present) == 4 and len(missing) == 1 and len(hand_contribution) >= 1:
        if best_draw != "oesd":
            best_draw = "gutshot"  # wheel draws are effectively gutshots

    return best_draw


def classify_hand(hand_str, board_str):
    """
    Classify a poker hand on a given board.

    Args:
        hand_str: e.g. "AcKd" (2 hole cards)
        board_str: e.g. "As,7d,2c" (3-5 board cards, comma separated)

    Returns:
        str: classification label
    """
    board = parse_board(board_str)
    hand = parse_hand(hand_str)
    all_cards = hand + board

    hand_ranks = [c[0] for c in hand]
    hand_suits = [c[1] for c in hand]
    board_ranks = [c[0] for c in board]

    all_ranks = [c[0] for c in all_cards]
    all_suits = [c[1] for c in all_cards]

    rank_counts = Counter(all_ranks)
    board_rank_counts = Counter(board_ranks)

    # ─── MADE HANDS (strongest first) ────────────────────────────

    # Quads
    for r, cnt in rank_counts.items():
        if cnt >= 4:
            return "quads"

    # Full house: at least one trips + at least one other pair
    trips_ranks = [r for r, cnt in rank_counts.items() if cnt >= 3]
    pair_ranks = [r for r, cnt in rank_counts.items() if cnt >= 2]
    if len(trips_ranks) >= 1 and len(pair_ranks) >= 2:
        return "full_house"

    # Flush: 5+ same suit, hero contributes
    suit_counts = Counter(all_suits)
    for s, cnt in suit_counts.items():
        if cnt >= 5 and s in hand_suits:
            # Check if it's a straight flush
            flush_vals = sorted(
                [RANK_VAL[c[0]] for c in all_cards if c[1] == s]
            )
            if _has_straight(flush_vals):
                return "straight_flush"
            return "flush"

    # Straight: 5 consecutive ranks, hero contributes
    all_vals = sorted(set(RANK_VAL[r] for r in all_ranks))
    hand_vals = set(RANK_VAL[r] for r in hand_ranks)
    board_vals = set(RANK_VAL[r] for r in board_ranks)
    if _has_straight(all_vals):
        # Verify hero contributes (not just board straight)
        if not _has_straight(sorted(board_vals)):
            return "straight"
        # Board already has a straight - hero might contribute to a HIGHER one
        # For simplicity, if board has straight and hero doesn't improve, skip
        # Check if hero adds a card that makes a higher straight
        if hand_vals - board_vals:
            return "straight"

    # Set: pocket pair + 1 matching board card
    if hand_ranks[0] == hand_ranks[1]:
        pp_rank = hand_ranks[0]
        if board_rank_counts.get(pp_rank, 0) >= 1:
            return "set"

    # Trips: one hero card matches a board pair
    for r in hand_ranks:
        if board_rank_counts.get(r, 0) >= 2:
            return "trips"

    # Two pair: hero uses BOTH cards to form 2 different pairs with board
    hero_paired_with_board = []
    for r in hand_ranks:
        if r in board_ranks:
            hero_paired_with_board.append(r)
    if len(set(hero_paired_with_board)) >= 2 and hand_ranks[0] != hand_ranks[1]:
        return "two_pair"
    # Also: pocket pair + one card pairs board = two_pair
    if hand_ranks[0] == hand_ranks[1] and len(hero_paired_with_board) >= 1:
        # This means PP doesn't match board (would be set), but other card does
        # Wait -- if PP matches board, it's set (handled above). If PP + other card matches board:
        pass  # Can't happen with 2 cards
    # Actually: hero has AcKd, board As,Kd,2c. A pairs, K pairs → two_pair ✓
    # hero has 7c7d, board As,7s,2c. 7 pairs board (set, already handled) ✓

    # ─── SINGLE PAIR HANDS ──────────────────────────────────────

    # Sort board ranks by value descending (for top/second/bottom pair)
    unique_board_sorted = sorted(
        list(set(board_ranks)),
        key=lambda r: RANK_VAL[r],
        reverse=True,
    )

    # Overpair: pocket pair > all board cards
    if hand_ranks[0] == hand_ranks[1]:
        pp_val = RANK_VAL[hand_ranks[0]]
        max_board_val = max(RANK_VAL[r] for r in board_ranks)
        if pp_val > max_board_val:
            return "overpair"

    # Top pair / second pair / low pair
    for hr in hand_ranks:
        if hr in board_ranks:
            idx = unique_board_sorted.index(hr)
            if idx == 0:
                return "top_pair"
            elif idx == 1:
                return "second_pair"
            else:
                return "low_pair"

    # Underpair: pocket pair below top board card (didn't match any board card)
    if hand_ranks[0] == hand_ranks[1]:
        return "underpair"

    # ─── DRAWS ───────────────────────────────────────────────────

    # Flush draw: 4 cards same suit, hero contributes
    for s, cnt in suit_counts.items():
        if cnt == 4 and s in hand_suits:
            return "flush_draw"

    # Straight draw (OESD or gutshot)
    draw = _count_straight_outs(all_vals, hand_vals)
    if draw == "oesd":
        return "straight_draw"
    if draw == "gutshot":
        return "straight_draw"

    # ─── NOTHING ─────────────────────────────────────────────────

    # Overcards: both hole cards above ALL board cards
    max_board_val = max(RANK_VAL[r] for r in board_ranks)
    if all(RANK_VAL[r] > max_board_val for r in hand_ranks):
        return "overcards"

    # Ace high
    if "A" in hand_ranks:
        return "ace_high"

    return "air"


# ============================================================
# TEST
# ============================================================

def test_classifier():
    """Run known test cases to verify classification accuracy."""
    test_cases = [
        # ── Board: As,7d,2c (A_dry, rainbow) ──
        ("AdAc", "As,7d,2c", "set"),           # Pocket AA hits board A
        ("7h7c", "As,7d,2c", "set"),           # Pocket 77 hits board 7
        ("AcKd", "As,7d,2c", "top_pair"),      # A pairs top card
        ("Ac7c", "As,7d,2c", "two_pair"),      # Both cards pair board
        ("Ad2h", "As,7d,2c", "two_pair"),      # Both pair
        ("AcQd", "As,7d,2c", "top_pair"),      # A pairs top card
        ("7h5h", "As,7d,2c", "second_pair"),   # 7 pairs second card
        ("2h3h", "As,7d,2c", "low_pair"),      # 2 pairs lowest card
        ("KcKd", "As,7d,2c", "underpair"),     # KK < A on board
        ("8c8d", "As,7d,2c", "underpair"),     # 88 < A
        ("3c3d", "As,7d,2c", "underpair"),     # 33 < A
        ("9s8s", "As,7d,2c", "air"),           # nothing connects
        ("KdQd", "As,7d,2c", "air"),           # K,Q < A, not overcards
        ("4c3c", "As,7d,2c", "straight_draw"), # 4,3 + 2 on board → gutshot to 5/wheel

        # ── Board: 8s,4d,2c (low_dry) ──
        ("KcKd", "8s,4d,2c", "overpair"),      # KK > 8
        ("QcQd", "8s,4d,2c", "overpair"),      # QQ > 8
        ("8c9c", "8s,4d,2c", "top_pair"),      # 8 pairs top
        ("KcQd", "8s,4d,2c", "overcards"),     # Both > 8

        # ── Board: Ts,9d,8c (connected_mid) ──
        ("JcQc", "Ts,9d,8c", "straight"),      # Q,J,T,9,8 straight
        ("Jc7c", "Ts,9d,8c", "straight"),      # J,T,9,8,7 straight
        ("JcKc", "Ts,9d,8c", "straight_draw"), # OESD to Q-high straight
        ("7c6c", "Ts,9d,8c", "straight"),      # 6,7,8,9,T = straight!

        # ── Board: As,7s,2c (two_tone_A, 2 spades) ──
        ("Ks8s", "As,7s,2c", "flush_draw"),    # 3 spades + Ks = 4 spades
        ("Ts3s", "As,7s,2c", "flush_draw"),    # 3 spades + Ts = 4 spades
        ("Kc8c", "As,7s,2c", "air"),           # Clubs don't connect

        # ── Board: As,7s,2s (monotone_A, 3 spades) ──
        ("Ks8s", "As,7s,2s", "flush"),         # 4 spades + 1 more = flush
        ("Ts3s", "As,7s,2s", "flush"),         # flush
        ("Kc8c", "As,7s,2s", "air"),           # no spades

        # ── Board: Ks,Kd,2c (paired_high) ──
        ("Kc3c", "Ks,Kd,2c", "trips"),        # Board pair + hero K = trips
        ("2h2s", "Ks,Kd,2c", "full_house"),   # 222 + KK = full house
        ("AcAd", "Ks,Kd,2c", "overpair"),     # AA > K (doesn't pair board)
        ("Ac2d", "Ks,Kd,2c", "second_pair"),  # 2 is 2nd unique rank (K,2)

        # ── Board: 7s,6d,5c (connected_low) ──
        ("8c9c", "7s,6d,5c", "straight"),     # 9,8,7,6,5
        ("9c4c", "7s,6d,5c", "straight_draw"), # 9,7,6,5,4 no 5-consecutive, draw
        ("4c3c", "7s,6d,5c", "straight"),     # 3,4,5,6,7 = straight
        ("8c4c", "7s,6d,5c", "straight"),     # 4,5,6,7,8 = straight
        ("9c8c", "7s,6d,5c", "straight"),     # 5,6,7,8,9 = straight

        # ── River: As,7d,2c,5c,Kh ──
        ("AcKd", "As,7d,2c,5c,Kh", "two_pair"),  # A,K pair board
        ("7c7h", "As,7d,2c,5c,Kh", "set"),        # 77 + 7d = set
    ]

    print(f"{'Hand':<8} {'Board':<20} {'Expected':<16} {'Got':<16} {'OK?'}")
    print("─" * 72)

    passed = 0
    failed = 0
    for hand, board, expected in test_cases:
        got = classify_hand(hand, board)
        ok = "✓" if got == expected else "✗"
        if got == expected:
            passed += 1
        else:
            failed += 1
        print(f"{hand:<8} {board:<20} {expected:<16} {got:<16} {ok}")

    print(f"\n{passed}/{passed + failed} passed, {failed} failed")
    return failed == 0


if __name__ == "__main__":
    test_classifier()
