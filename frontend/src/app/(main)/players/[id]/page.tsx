import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PlayerProfileClient } from "@/components/dashboard/PlayerProfileClient";
import { PlayerProfileSkeleton } from "@/components/dashboard/PlayerProfileSkeleton";
import { fetchPlayerProfile } from "@/app/actions";
import { getAuthUser } from "@/lib/auth";

interface PlayerProfilePageProps {
    params: Promise<{ id: string }>;
}

// Mock player shown when real data is unavailable (demo / not logged in)
const MOCK_PLAYER = {
    id: 'mock-demo',
    name: 'xFishKiller99',
    playstyle: 'LAG',
    aggression_score: 72,
    notes: [
        {
            id: 'mn1',
            content: 'Opens 40% BTN, folds to 3bet 65% — exploit with wider 3bet range IP',
            street: 'Preflop',
            note_type: 'Custom',
            created_at: '2026-03-25T10:00:00Z',
            is_ai_generated: false,
        },
        {
            id: 'mn2',
            content: 'Overbet shoves river with missed draws — call wider on wet boards',
            street: 'River',
            note_type: 'Custom',
            created_at: '2026-03-24T18:00:00Z',
            is_ai_generated: false,
        },
        {
            id: 'mn3',
            content: 'C-bets 85% on dry flops but checks back 60% on wet textures',
            street: 'Flop',
            note_type: 'Custom',
            created_at: '2026-03-23T14:00:00Z',
            is_ai_generated: true,
        },
    ],
    platform: { id: 'p1', name: 'PokerStars' },
    ai_profile: {
        archetype: 'LAG',
        confidence: 0.82,
        aggression_score: 72,
        looseness_score: 65,
        leaks: [
            'Over-cbets dry flops — exploitable with check-raise strategy',
            'Folds to 3bet OOP too often — widen 3bet bluffing range',
            'Barrel frequency drops on turn — float flop and bet turn',
        ],
        strategy: [
            {
                node: 'BTN vs CO 3BET',
                action: '4bet bluff',
                range: 'A5s, A4s, KQo',
                structure: 'Polarized',
                sizing: '2.5x',
                frequency: '35%',
            },
        ],
        range_adjustments: [
            'CO vs BU 3bet: Fold AJo, KQo — Call AQo, TT-QQ — 4bet AK, KK+',
            'Cbet flop 85% → check-raise dry boards more vs this player',
        ],
        gto_deviation_reason: 'Player over-folds to aggression in 3bet pots',
    },
    ai_exploit_strategy: [
        {
            node: 'IP vs CBET',
            action: 'Float + probe turn',
            range: 'Gutshots, BDFD, overcards',
            structure: 'Linear',
            sizing: '66% pot',
            frequency: '45%',
        },
    ],
    stats: {
        vpip: 28.5,
        pfr: 21.3,
        three_bet: 8.7,
        fold_to_3bet: 62.4,
        cbet: 72.1,
        fold_to_cbet: 45.8,
        wtsd: 27.6,
        wsd: 52.3,
        aggression_freq: 38.9,
        steal: 34.2,
        fold_to_steal: 71.5,
        check_raise: 9.4,
        total_hands: 1847,
        rfi: 19.8,
        four_bet: 3.2,
        fold_to_4bet: 58.0,
        fold_to_check_raise: 55.3,
        stab: 42.1,
        float_pct: 18.7,
    },
};

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
    const { id } = await params;

    // If accessing a mock ID, show mock data directly
    if (id.startsWith('mock-')) {
        const user = await getAuthUser();
        return (
            <Suspense fallback={<PlayerProfileSkeleton />}>
                <PlayerProfileClient initialPlayer={MOCK_PLAYER as any} user={user} />
            </Suspense>
        );
    }

    const [player, user] = await Promise.all([
        fetchPlayerProfile(id),
        getAuthUser()
    ]);

    if (!player) {
        notFound();
    }

    return (
        <Suspense fallback={<PlayerProfileSkeleton />}>
            <PlayerProfileClient initialPlayer={player} user={user} />
        </Suspense>
    );
}
