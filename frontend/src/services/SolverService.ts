import { API } from '@/lib/api';
import { HandClass } from '@/types/poker';

export type ShapingMode = 'polar' | 'merged' | 'balanced';
export type VillainTypeBucket = 'NEUTRAL' | 'OVERFOLD' | 'OVERCALL' | 'OVERAGGRO' | 'PASSIVE';

export type SpotTemplateBucket =
    | 'LIMPED_IP'
    | 'LIMPED_OOP'
    | 'SRP_IP'
    | 'SRP_OOP'
    | '3BET_IP'
    | '3BET_OOP'
    | '4BET_IP'
    | '4BET_OOP'
    | '3BP_IP'
    | '3BP_OOP'
    | '4BP_IP'
    | '4BP_OOP';

export type StackDepthBucket = 'SHORT' | 'MEDIUM' | 'DEEP' | 'VERY_DEEP' | `${number}`;
export type Street = 'preflop' | 'flop' | 'turn' | 'river';

export interface BoardTextureBucket {
    suitedness: 'MONOTONE' | 'TWO_TONE' | 'RAINBOW';
    pairedStatus: 'UNPAIRED' | 'PAIRED' | 'TWO_PAIR' | 'TRIPS' | 'QUADS';
    highCardTier: 'ACE_HIGH' | 'KING_HIGH' | 'QUEEN_HIGH' | 'JACK_HIGH' | 'LOW_BOARD';
    connectivity: 'DRY' | 'CONNECTED' | 'VERY_CONNECTED' | 'SEMI_CONNECTED' | 'DISCONNECTED';
}

export interface HandStrategy {
    raise: number; // 0..1
    call: number;  // 0..1
    fold: number;  // 0..1
}

export interface SolveRequest {
    spot: SpotTemplateBucket;
    stack: StackDepthBucket;
    street?: Street;
    board?: BoardTextureBucket;
    villainType?: VillainTypeBucket;
    shapingMode?: ShapingMode;
}

export type SolveResponse = Record<HandClass, HandStrategy>;

const SPOT_ALIAS_MAP: Partial<Record<SpotTemplateBucket, SpotTemplateBucket>> = {
    '3BET_IP': '3BP_IP',
    '3BET_OOP': '3BP_OOP',
    '4BET_IP': '4BP_IP',
    '4BET_OOP': '4BP_OOP',
};

function normalizeRequest(request: SolveRequest): SolveRequest {
    const mappedSpot = SPOT_ALIAS_MAP[request.spot] ?? request.spot;
    const street = request.street ?? 'preflop';

    let board = request.board;
    if (board && street !== 'preflop') {
        const connectivity =
            board.connectivity === 'DISCONNECTED'
                ? 'DRY'
                : board.connectivity === 'SEMI_CONNECTED'
                    ? 'CONNECTED'
                    : board.connectivity;
        board = { ...board, connectivity };
    }

    return {
        ...request,
        spot: mappedSpot,
        street,
        board: street === 'preflop' ? undefined : board,
    };
}

function parseHandStrategy(hand: string, raw: unknown): HandStrategy {
    if (!raw || typeof raw !== 'object') {
        throw new Error(`Invalid solver strategy for hand ${hand}`);
    }

    const record = raw as Record<string, unknown>;
    const raise = Number(record.raise);
    const call = Number(record.call);
    const fold = Number(record.fold);

    if (!Number.isFinite(raise) || !Number.isFinite(call) || !Number.isFinite(fold)) {
        throw new Error(`Non-numeric strategy values for hand ${hand}`);
    }

    if (raise < 0 || raise > 1 || call < 0 || call > 1 || fold < 0 || fold > 1) {
        throw new Error(`Out-of-range strategy values for hand ${hand}`);
    }

    const sum = raise + call + fold;
    if (Math.abs(sum - 1) > 1e-6) {
        throw new Error(`Invalid strategy sum for hand ${hand}: ${sum}`);
    }

    return { raise, call, fold };
}

function parseResponse(data: unknown): SolveResponse {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid solver response payload');
    }

    const source = data as Record<string, unknown>;
    const normalized: Record<string, HandStrategy> = {};
    for (const [hand, raw] of Object.entries(source)) {
        normalized[hand] = parseHandStrategy(hand, raw);
    }

    return normalized as SolveResponse;
}

export async function fetchStrategy(request: SolveRequest): Promise<SolveResponse> {
    const url = `${API.base}/api/solve`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizeRequest(request)),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch solver strategy');
    }

    const json = await response.json();
    if (!json.success) {
        throw new Error(json.error || 'Failed to fetch solver strategy');
    }

    return parseResponse(json.data);
}
