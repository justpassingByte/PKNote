import { PlayerListClient } from "@/components/dashboard/PlayerListClient";
import type { Player, PaginationMeta } from "@/components/dashboard/PlayerListClient";
import { fetchFirstPage } from "@/app/actions";
import { getAuthUser } from "@/lib/auth";

export async function PlayersContent() {
    const user = await getAuthUser();
    let initialPlayers: Player[] = [];
    let initialMeta: PaginationMeta = { 
        totalCount: 0, 
        totalNotesCount: 0, 
        playstyleCounts: {}, 
        hasMore: false, 
        nextCursor: null 
    };

    let initialPlatforms: { id: string, name: string }[] = [];
    try {
        const [playersResult, platformsResult] = await Promise.all([
            fetchFirstPage(),
            import("@/app/actions").then(a => a.getAllPlatforms())
        ]);
        initialPlayers = playersResult.data as Player[];
        initialMeta = playersResult.meta;
        initialPlatforms = platformsResult;
    } catch (err) {
        console.error("Players fetch error:", err);
    }

    return (
        <PlayerListClient
            initialPlayers={initialPlayers}
            initialMeta={initialMeta}
            initialPlatforms={initialPlatforms}
            user={user}
        />
    );
}
