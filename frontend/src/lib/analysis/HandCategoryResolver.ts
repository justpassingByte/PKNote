/**
 * HandCategoryResolver — Deterministic Hand Classification
 *
 * Classifies each of the 169 hand classes into a strength category
 * relative to the current board texture. This is a pure post-processing
 * utility that does NOT touch the solver engine.
 *
 * Rules:
 * - Classification is 100% deterministic (no randomness).
 * - Each hand maps to exactly ONE category.
 * - Priority order: NUTS > STRONG > TOP_PAIR > DRAW > AIR.
 */

import type { BoardTextureBucket } from '@/lib/solverAPI';

// ─── Types ──────────────────────────────────────────────────────────
export type HandCategory = 'NUTS' | 'STRONG' | 'TOP_PAIR' | 'DRAW' | 'AIR';

export interface CategoryBreakdownEntry {
    raise: number;   // Normalized % (0-100)
    call: number;    // Normalized % (0-100)
    fold: number;    // Normalized % (0-100)
    weight: number;  // Range frequency % (0-100)
    count: number;   // Number of hand combos in this bucket
}

export type CategorizedBreakdown = Record<HandCategory, CategoryBreakdownEntry>;

// ─── Constants ──────────────────────────────────────────────────────
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
type Rank = typeof RANKS[number];

const RANK_VALUE: Record<Rank, number> = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

const BROADWAY_RANKS = new Set<Rank>(['A', 'K', 'Q', 'J', 'T']);

/** Map highCardTier to the anchor rank of the board. */
const TIER_ANCHOR: Record<string, Rank> = {
    'ACE_HIGH': 'A',
    'KING_HIGH': 'K',
    'JACK_HIGH': 'J',
    'LOW_BOARD': '9',   // Anything below T
};

// ─── Helpers ────────────────────────────────────────────────────────

/** Parse a hand class string like "AKs", "72o", "TT" into rank1, rank2, type. */
function parseHand(hand: string): { r1: Rank; r2: Rank; isPair: boolean; isSuited: boolean } {
    const r1 = hand[0] as Rank;
    const r2 = hand[1] as Rank;
    const suffix = hand[2] as string | undefined;
    return {
        r1,
        r2,
        isPair: r1 === r2,
        isSuited: suffix === 's',
    };
}

/** Check if a rank matches a board high card tier. */
function rankMatchesTier(rank: Rank, tier: string | undefined): boolean {
    if (!tier) return false;
    const anchor = TIER_ANCHOR[tier];
    return anchor ? rank === anchor : false;
}

/** Check if both ranks are broadway. */
function isBroadwayHand(r1: Rank, r2: Rank): boolean {
    return BROADWAY_RANKS.has(r1) && BROADWAY_RANKS.has(r2);
}

/** Check if hand has connected ranks (gap ≤ 2). */
function isConnected(r1: Rank, r2: Rank): boolean {
    return Math.abs(RANK_VALUE[r1] - RANK_VALUE[r2]) <= 2;
}

// ─── Classifier ─────────────────────────────────────────────────────

/**
 * Deterministically classify a hand relative to the board texture.
 *
 * @param hand - e.g. "AKs", "72o", "TT"
 * @param board - The board texture bucket from the solve request.
 *                For preflop, pass undefined to get a positional default.
 * @returns Exactly one HandCategory.
 */
export function classify(hand: string, board?: BoardTextureBucket): HandCategory {
    const { r1, r2, isPair, isSuited } = parseHand(hand);
    const highCardTier = board?.highCardTier;
    const pairedStatus = board?.pairedStatus;
    const suitedness = board?.suitedness;

    // ── NUTS ─────────────────────────────────────────────────────
    // Pocket pairs on paired boards → set potential
    if (isPair && pairedStatus === 'PAIRED') return 'NUTS';
    if (isPair && pairedStatus === 'TRIPS') return 'NUTS';

    // Strong broadway suited on monotone → flush potential is nutted
    if (isSuited && suitedness === 'MONOTONE' && isBroadwayHand(r1, r2)) return 'NUTS';

    // Pocket aces / kings are always nuts
    if (isPair && (r1 === 'A' || r1 === 'K')) return 'NUTS';

    // ── STRONG ───────────────────────────────────────────────────
    // High pocket pairs (QQ, JJ, TT)
    if (isPair && RANK_VALUE[r1] >= 10) return 'STRONG';

    // Broadway suited hands are strong
    if (isSuited && isBroadwayHand(r1, r2)) return 'STRONG';

    // Top pair + top kicker: e.g., AK on ACE_HIGH board (non-suited, non-pair)
    if (r1 === 'A' && RANK_VALUE[r2] >= 10 && !isSuited) return 'STRONG';

    // ── TOP_PAIR ─────────────────────────────────────────────────
    // Hand matches the board's high card tier
    if (rankMatchesTier(r1, highCardTier)) return 'TOP_PAIR';
    if (rankMatchesTier(r2, highCardTier)) return 'TOP_PAIR';

    // Medium pocket pairs (99-66)
    if (isPair && RANK_VALUE[r1] >= 6) return 'TOP_PAIR';

    // ── DRAW ─────────────────────────────────────────────────────
    // Suited hands on two-tone boards
    if (isSuited && suitedness === 'TWO_TONE') return 'DRAW';

    // Suited connectors (any board)
    if (isSuited && isConnected(r1, r2)) return 'DRAW';

    // Non-suited connectors with broadway potential
    if (!isSuited && isConnected(r1, r2) && (BROADWAY_RANKS.has(r1) || BROADWAY_RANKS.has(r2))) return 'DRAW';

    // ── AIR ──────────────────────────────────────────────────────
    return 'AIR';
}

// ─── Aggregation ────────────────────────────────────────────────────

/** Empty breakdown entry for initialization. */
function emptyEntry(): CategoryBreakdownEntry {
    return { raise: 0, call: 0, fold: 0, weight: 0, count: 0 };
}

/** Create a fresh CategorizedBreakdown with all categories at zero. */
export function emptyCategorizedBreakdown(): CategorizedBreakdown {
    return {
        NUTS: emptyEntry(),
        STRONG: emptyEntry(),
        TOP_PAIR: emptyEntry(),
        DRAW: emptyEntry(),
        AIR: emptyEntry(),
    };
}

/**
 * Given the SolveResponse data (raise/call/fold records) and the board context,
 * produce a fully normalized CategorizedBreakdown.
 *
 * Steps:
 * 1. Classify each hand into a category.
 * 2. Sum raw raise/call/fold weights per category.
 * 3. Normalize raise/call/fold within each category to sum to 100%.
 * 4. Compute weight (category's share of the total range).
 */
export function buildCategorizedBreakdown(
    raiseRecord: Record<string, number>,
    callRecord: Record<string, number>,
    foldRecord: Record<string, number>,
    board?: BoardTextureBucket,
): CategorizedBreakdown {
    const result = emptyCategorizedBreakdown();

    // Accumulators for raw sums (not yet normalized)
    const rawSums: Record<HandCategory, { raise: number; call: number; fold: number; count: number }> = {
        NUTS: { raise: 0, call: 0, fold: 0, count: 0 },
        STRONG: { raise: 0, call: 0, fold: 0, count: 0 },
        TOP_PAIR: { raise: 0, call: 0, fold: 0, count: 0 },
        DRAW: { raise: 0, call: 0, fold: 0, count: 0 },
        AIR: { raise: 0, call: 0, fold: 0, count: 0 },
    };

    // Collect all hand keys (union of all three records)
    const allHands = new Set<string>([
        ...Object.keys(raiseRecord),
        ...Object.keys(callRecord),
        ...Object.keys(foldRecord),
    ]);

    let totalWeight = 0;

    for (const hand of allHands) {
        const r = raiseRecord[hand] ?? 0;
        const c = callRecord[hand] ?? 0;
        const f = foldRecord[hand] ?? 0;
        const handTotal = r + c + f;

        const category = classify(hand, board);
        rawSums[category].raise += r;
        rawSums[category].call += c;
        rawSums[category].fold += f;
        rawSums[category].count += 1;
        totalWeight += handTotal;
    }

    // Normalize within each category + compute weight
    const CATEGORIES: HandCategory[] = ['NUTS', 'STRONG', 'TOP_PAIR', 'DRAW', 'AIR'];

    for (const cat of CATEGORIES) {
        const raw = rawSums[cat];
        const catTotal = raw.raise + raw.call + raw.fold;

        result[cat].count = raw.count;

        if (catTotal > 0) {
            result[cat].raise = Math.round((raw.raise / catTotal) * 100);
            result[cat].call = Math.round((raw.call / catTotal) * 100);
            result[cat].fold = Math.round((raw.fold / catTotal) * 100);

            // Correct rounding errors to ensure sum = 100
            const sum = result[cat].raise + result[cat].call + result[cat].fold;
            if (sum !== 100) {
                // Adjust the largest value
                const max = Math.max(result[cat].raise, result[cat].call, result[cat].fold);
                if (result[cat].raise === max) result[cat].raise += (100 - sum);
                else if (result[cat].call === max) result[cat].call += (100 - sum);
                else result[cat].fold += (100 - sum);
            }
        }

        // Weight = this category's share of total range frequency
        if (totalWeight > 0) {
            result[cat].weight = Math.round((catTotal / totalWeight) * 100);
        }
    }

    // Correct weight rounding to sum to 100
    const weightSum = CATEGORIES.reduce((s, c) => s + result[c].weight, 0);
    if (weightSum !== 100 && weightSum > 0) {
        // Find the category with the largest weight and adjust
        let maxCat: HandCategory = 'AIR';
        let maxW = 0;
        for (const cat of CATEGORIES) {
            if (result[cat].weight > maxW) {
                maxW = result[cat].weight;
                maxCat = cat;
            }
        }
        result[maxCat].weight += (100 - weightSum);
    }

    return result;
}
