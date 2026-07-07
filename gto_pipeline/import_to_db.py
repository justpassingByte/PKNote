"""
import_to_db.py — Import GTO JSON files into Postgres (GtoSpot + GtoHand tables).

Usage:
    # Set DATABASE_URL to your VPS Postgres
    set DATABASE_URL=postgresql://postgres:VilliantVault@YOUR_VPS_IP:5432/ponotes
    python import_to_db.py

    # Or import only flop:
    python import_to_db.py --street flop

    # Dry run (count only, no insert):
    python import_to_db.py --dry-run
"""

import os
import sys
import json
import glob
import uuid
import time
import argparse

# Add gto_pipeline to path for hand_classifier
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hand_classifier import classify_hand

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


OUTPUTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")

# Database URL - override with env var
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:VilliantVault@localhost:5432/ponotes"
)


def get_connection():
    """Connect to Postgres using DATABASE_URL."""
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    return conn


def ensure_tables(conn):
    """Create GtoSpot and GtoHand tables if they don't exist (matches Prisma schema)."""
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS "GtoSpot" (
            id           TEXT PRIMARY KEY,
            position     TEXT NOT NULL,
            board_bucket TEXT NOT NULL,
            street       TEXT NOT NULL,
            action_line  TEXT,
            turn_type    TEXT,
            river_type   TEXT,
            board        TEXT NOT NULL,
            pot          DOUBLE PRECISION NOT NULL,
            eff_stack    DOUBLE PRECISION NOT NULL,
            oop_check     DOUBLE PRECISION DEFAULT 0,
            oop_bet_small DOUBLE PRECISION DEFAULT 0,
            oop_bet_big   DOUBLE PRECISION DEFAULT 0,
            ip_check      DOUBLE PRECISION DEFAULT 0,
            ip_bet_small  DOUBLE PRECISION DEFAULT 0,
            ip_bet_big    DOUBLE PRECISION DEFAULT 0,
            oop_fold      DOUBLE PRECISION DEFAULT 0,
            oop_call      DOUBLE PRECISION DEFAULT 0,
            oop_raise     DOUBLE PRECISION DEFAULT 0,
            UNIQUE(position, board_bucket, street, action_line, turn_type, river_type)
        );

        -- Add new columns if table already exists
        DO $$ BEGIN
            ALTER TABLE "GtoSpot" ADD COLUMN IF NOT EXISTS oop_fold DOUBLE PRECISION DEFAULT 0;
            ALTER TABLE "GtoSpot" ADD COLUMN IF NOT EXISTS oop_call DOUBLE PRECISION DEFAULT 0;
            ALTER TABLE "GtoSpot" ADD COLUMN IF NOT EXISTS oop_raise DOUBLE PRECISION DEFAULT 0;
        EXCEPTION WHEN others THEN NULL;
        END $$;

        CREATE INDEX IF NOT EXISTS idx_gtospot_lookup
            ON "GtoSpot" (position, board_bucket, street);
        CREATE INDEX IF NOT EXISTS idx_gtospot_bucket
            ON "GtoSpot" (board_bucket);

        CREATE TABLE IF NOT EXISTS "GtoHand" (
            id         TEXT PRIMARY KEY,
            spot_id    TEXT NOT NULL REFERENCES "GtoSpot"(id) ON DELETE CASCADE,
            player     TEXT NOT NULL,
            hand       TEXT NOT NULL,
            hand_class TEXT NOT NULL,
            "check"    DOUBLE PRECISION DEFAULT 0,
            bet_small  DOUBLE PRECISION DEFAULT 0,
            bet_big    DOUBLE PRECISION DEFAULT 0,
            fold       DOUBLE PRECISION DEFAULT 0,
            call       DOUBLE PRECISION DEFAULT 0,
            raise      DOUBLE PRECISION DEFAULT 0
        );

        -- Add new columns if table already exists
        DO $$ BEGIN
            ALTER TABLE "GtoHand" ADD COLUMN IF NOT EXISTS fold DOUBLE PRECISION DEFAULT 0;
            ALTER TABLE "GtoHand" ADD COLUMN IF NOT EXISTS call DOUBLE PRECISION DEFAULT 0;
            ALTER TABLE "GtoHand" ADD COLUMN IF NOT EXISTS raise DOUBLE PRECISION DEFAULT 0;
        EXCEPTION WHEN others THEN NULL;
        END $$;

        CREATE INDEX IF NOT EXISTS idx_gtohand_spot
            ON "GtoHand" (spot_id, player);
        CREATE INDEX IF NOT EXISTS idx_gtohand_class
            ON "GtoHand" (hand_class);
        CREATE INDEX IF NOT EXISTS idx_gtohand_spot_class
            ON "GtoHand" (spot_id, player, hand_class);
    """)
    conn.commit()


def parse_flop_json(filepath):
    """Parse a flop normalized JSON into spot metadata."""
    with open(filepath, 'r') as f:
        data = json.load(f)

    return {
        "position": data.get("position", ""),
        "board_bucket": data.get("board_bucket", ""),
        "street": "flop",
        "action_line": None,
        "turn_type": None,
        "river_type": None,
        "board": data.get("board", ""),
        "pot": data.get("config", {}).get("pot", 5.5),
        "eff_stack": data.get("config", {}).get("stack", 100),
        "strategy": data.get("strategy", {}),
        "per_hand": data.get("per_hand", {}),
        "oop_facing_cbet": data.get("oop_facing_cbet", {}),
        "per_hand_facing_cbet": data.get("per_hand_facing_cbet", {}),
    }


def parse_turn_json(filepath):
    """Parse a turn normalized JSON."""
    with open(filepath, 'r') as f:
        data = json.load(f)

    return {
        "position": data.get("position", ""),
        "board_bucket": data.get("board_bucket", ""),
        "street": "turn",
        "action_line": data.get("action_line"),
        "turn_type": data.get("turn_type"),
        "river_type": None,
        "board": data.get("full_board", data.get("flop_board", "")),
        "pot": data.get("config", {}).get("pot", 9.5),
        "eff_stack": data.get("config", {}).get("eff_stack", 95.25),
        "strategy": data.get("strategy", {}),
        "per_hand": data.get("per_hand", {}),
        "oop_facing_cbet": data.get("oop_facing_cbet", {}),
        "per_hand_facing_cbet": data.get("per_hand_facing_cbet", {}),
    }


def parse_river_json(filepath):
    """Parse a river normalized JSON."""
    with open(filepath, 'r') as f:
        data = json.load(f)

    return {
        "position": data.get("position", ""),
        "board_bucket": data.get("board_bucket", ""),
        "street": "river",
        "action_line": data.get("action_line"),
        "turn_type": data.get("turn_type"),
        "river_type": data.get("river_type"),
        "board": data.get("full_board", ""),
        "pot": data.get("config", {}).get("pot", 23.5),
        "eff_stack": data.get("config", {}).get("eff_stack", 88.25),
        "strategy": data.get("strategy", {}),
        "per_hand": data.get("per_hand", {}),
        "oop_facing_cbet": data.get("oop_facing_cbet", {}),
        "per_hand_facing_cbet": data.get("per_hand_facing_cbet", {}),
    }


def collect_files(streets):
    """Collect all JSON files grouped by street."""
    files = []

    if "flop" in streets:
        for f in glob.glob(os.path.join(OUTPUTS_DIR, "*.json")):
            files.append(("flop", f))

    if "turn" in streets:
        turn_dir = os.path.join(OUTPUTS_DIR, "turn")
        if os.path.isdir(turn_dir):
            for f in glob.glob(os.path.join(turn_dir, "*.json")):
                files.append(("turn", f))

    if "river" in streets:
        river_dir = os.path.join(OUTPUTS_DIR, "river")
        if os.path.isdir(river_dir):
            for f in glob.glob(os.path.join(river_dir, "*.json")):
                files.append(("river", f))

    return files


def upsert_spot(cur, data, action_line_override=None,
                oop_strat=None, ip_strat=None,
                oop_facing=None):
    """Upsert a GtoSpot row. Returns the spot_id."""
    spot_id = str(uuid.uuid4())
    action_line = action_line_override if action_line_override is not None else data.get("action_line")
    oop_s = oop_strat or {}
    ip_s = ip_strat or {}
    facing = oop_facing or {}

    cur.execute("""
        INSERT INTO "GtoSpot" (
            id, position, board_bucket, street, action_line, turn_type, river_type,
            board, pot, eff_stack,
            oop_check, oop_bet_small, oop_bet_big,
            ip_check, ip_bet_small, ip_bet_big,
            oop_fold, oop_call, oop_raise
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (position, board_bucket, street, action_line, turn_type, river_type)
        DO UPDATE SET
            board = EXCLUDED.board,
            pot = EXCLUDED.pot,
            eff_stack = EXCLUDED.eff_stack,
            oop_check = EXCLUDED.oop_check,
            oop_bet_small = EXCLUDED.oop_bet_small,
            oop_bet_big = EXCLUDED.oop_bet_big,
            ip_check = EXCLUDED.ip_check,
            ip_bet_small = EXCLUDED.ip_bet_small,
            ip_bet_big = EXCLUDED.ip_bet_big,
            oop_fold = EXCLUDED.oop_fold,
            oop_call = EXCLUDED.oop_call,
            oop_raise = EXCLUDED.oop_raise
        RETURNING id
    """, (
        spot_id,
        data["position"], data["board_bucket"], data["street"],
        action_line, data["turn_type"], data["river_type"],
        data["board"], data["pot"], data["eff_stack"],
        oop_s.get("check", 0), oop_s.get("bet_small", 0), oop_s.get("bet_big", 0),
        ip_s.get("check", 0), ip_s.get("bet_small", 0), ip_s.get("bet_big", 0),
        facing.get("fold", 0), facing.get("call", 0), facing.get("raise", 0),
    ))

    row = cur.fetchone()
    return row[0] if row else spot_id


def insert_hands(cur, spot_id, per_hand, board, is_facing=False):
    """Insert GtoHand rows for a spot. Returns count inserted."""
    # Delete old hands for this spot (in case of re-import)
    cur.execute('DELETE FROM "GtoHand" WHERE spot_id = %s', (spot_id,))

    hand_rows = []
    for player in (["oop"] if is_facing else ["oop", "ip"]):
        hands = per_hand.get(player, {})
        for hand_str, freqs in hands.items():
            try:
                hand_class = classify_hand(hand_str, board)
            except Exception:
                hand_class = "unknown"

            if is_facing:
                hand_rows.append((
                    str(uuid.uuid4()), spot_id, player, hand_str, hand_class,
                    0, 0, 0,  # check/bet_small/bet_big unused
                    freqs.get("fold", 0), freqs.get("call", 0), freqs.get("raise", 0),
                ))
            else:
                hand_rows.append((
                    str(uuid.uuid4()), spot_id, player, hand_str, hand_class,
                    freqs.get("check", 0), freqs.get("bet_small", 0), freqs.get("bet_big", 0),
                    0, 0, 0,  # fold/call/raise unused
                ))

    if hand_rows:
        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO "GtoHand" (id, spot_id, player, hand, hand_class,
                                   "check", bet_small, bet_big, fold, call, raise)
            VALUES %s
            """,
            hand_rows,
            page_size=500,
        )

    return len(hand_rows)


def import_file(conn, street, filepath, dry_run=False):
    """Import a single JSON file into database (root + facing-cbet spots)."""
    if street == "flop":
        data = parse_flop_json(filepath)
    elif street == "turn":
        data = parse_turn_json(filepath)
    else:
        data = parse_river_json(filepath)

    if not data["position"] or not data["board_bucket"]:
        return 0

    board = data["board"]
    strategy = data["strategy"]
    per_hand = data["per_hand"]
    oop_facing = data.get("oop_facing_cbet", {})
    per_hand_facing = data.get("per_hand_facing_cbet", {})

    if dry_run:
        count = sum(len(per_hand.get(p, {})) for p in ["oop", "ip"])
        count += len(per_hand_facing.get("vs_bet_small", {}))
        count += len(per_hand_facing.get("vs_bet_big", {}))
        return count

    cur = conn.cursor()
    total_hands = 0

    # ─── 1. Root spot (OOP check/bet, IP check/bet) ───
    try:
        root_spot_id = upsert_spot(
            cur, data,
            action_line_override=data.get("action_line"),
            oop_strat=strategy.get("oop", {}),
            ip_strat=strategy.get("ip", {}),
        )
        total_hands += insert_hands(cur, root_spot_id, per_hand, board)
    except Exception as e:
        conn.rollback()
        print(f"  ERROR inserting root spot: {e}")
        return 0

    # ─── 2. Facing c-bet spots (OOP fold/call/raise) ───
    facing_map = {
        "vs_bet_small": "facing_cbet33",
        "vs_bet_big": "facing_cbet75",
    }

    for size_key, action_line_suffix in facing_map.items():
        agg = oop_facing.get(size_key, {})
        hands = per_hand_facing.get(size_key, {})

        # Skip if no data
        if not agg or not any(v > 0 for v in agg.values()):
            continue

        # Build action_line: for flop root it's just "facing_cbet33",
        # for turn/river it's appended to existing action_line
        base_action = data.get("action_line") or ""
        if base_action:
            full_action_line = f"{base_action}_{action_line_suffix}"
        else:
            full_action_line = action_line_suffix

        try:
            facing_spot_id = upsert_spot(
                cur, data,
                action_line_override=full_action_line,
                oop_facing=agg,
            )
            # Wrap hands in {"oop": hands} format for insert_hands
            total_hands += insert_hands(
                cur, facing_spot_id, {"oop": hands}, board, is_facing=True
            )
        except Exception as e:
            conn.rollback()
            print(f"  ERROR inserting facing spot {action_line_suffix}: {e}")
            # Continue with other facing sizes
            continue

    conn.commit()
    return total_hands


def main():
    parser = argparse.ArgumentParser(description="Import GTO JSON to Postgres")
    parser.add_argument("--street", choices=["flop", "turn", "river", "all"], default="all")
    parser.add_argument("--dry-run", action="store_true", help="Count only, no DB writes")
    args = parser.parse_args()

    streets = ["flop", "turn", "river"] if args.street == "all" else [args.street]

    print("=" * 60)
    print("GTO Data Import Pipeline")
    print("=" * 60)
    print(f"  Database: {DATABASE_URL[:50]}...")
    print(f"  Streets: {', '.join(streets)}")
    print(f"  Dry run: {args.dry_run}")
    print()

    files = collect_files(streets)
    print(f"Found {len(files)} JSON files to import\n")

    if not files:
        print("No files found!")
        return

    if not args.dry_run:
        try:
            conn = get_connection()
            ensure_tables(conn)
            print("✓ Connected to database\n")
        except Exception as e:
            print(f"ERROR connecting to database: {e}")
            print(f"  Set DATABASE_URL env var to your VPS Postgres URL")
            return
    else:
        conn = None

    total_hands = 0
    total_spots = 0
    start = time.time()

    for street, filepath in files:
        basename = os.path.basename(filepath)
        try:
            count = import_file(conn, street, filepath, dry_run=args.dry_run)
            total_hands += count
            total_spots += 1
            symbol = "📊" if args.dry_run else "✓"
            print(f"  {symbol} [{street}] {basename} ({count} hands)")
        except Exception as e:
            print(f"  ✗ [{street}] {basename} — {e}")

    elapsed = time.time() - start

    if conn and not args.dry_run:
        conn.close()

    print(f"\n{'=' * 60}")
    print(f"IMPORT {'(DRY RUN) ' if args.dry_run else ''}COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Spots: {total_spots}")
    print(f"  Hands: {total_hands}")
    print(f"  Time: {elapsed:.1f}s")


if __name__ == "__main__":
    main()
