"use server";

import { API } from "@/lib/api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PAGE_SIZE = 10;

interface PlayerData {
    id: string;
    name: string;
    playstyle: string;
    aggression_score: number;
    notesCount?: number;
    platform?: { id: string; name: string };
    ai_playstyle?: string | null;
    ai_aggression_score?: number | null;
    ai_exploit_strategy?: string | null;
    ai_stats_used?: string | null;
    ai_range_matrix?: any;
    ai_action_breakdown?: any;
    ai_profile?: any;
}

interface PaginationMeta {
    totalCount: number;
    totalNotesCount: number;
    playstyleCounts: Record<string, number>;
    hasMore: boolean;
    nextCursor: string | null;
}

interface PaginatedResult {
    data: PlayerData[];
    meta: PaginationMeta;
}

/**
 * Server Action: fetch dashboard stats and top players
 */
export async function fetchDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    try {
        const res = await fetch(API.dashboard, { 
            cache: "no-store",
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        
        if (!res.ok) {
            return { stats: { totalCount: 0, totalNotesCount: 0, playstyleCounts: {}, aiUsage: null, ocrUsage: null }, topWhales: [], topRegs: [] };
        }
        const json = await res.json();
        if (!json.success) {
            return { stats: { totalCount: 0, totalNotesCount: 0, playstyleCounts: {}, aiUsage: null, ocrUsage: null }, topWhales: [], topRegs: [] };
        }
        console.log("Debug fetchDashboard API output first whale:", json.data.topWhales?.[0]?.name, json.data.topWhales?.[0]?.ai_profile);
        return json.data;
    } catch (err) {
        console.error("fetchDashboard Action Error:", err);
        return { stats: { totalCount: 0, totalNotesCount: 0, playstyleCounts: {}, aiUsage: null, ocrUsage: null }, topWhales: [], topRegs: [] };
    }
}

/**
 * Server Action: fetch the first page of players.
 * Used for initial SSR load and reset-after-mutation.
 */
export async function fetchFirstPage(options?: { query?: string; playstyle?: string; platform?: string }): Promise<PaginatedResult> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (options?.query) params.append("query", options.query);
    if (options?.playstyle) params.append("playstyle", options.playstyle);
    if (options?.platform) params.append("platform", options.platform);

    try {
        const res = await fetch(`${API.players}?${params.toString()}`, { 
            cache: "no-store",
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        
        if (!res.ok) {
            console.error(`Backend returned ${res.status} for players`);
            return { data: [], meta: { totalCount: 0, totalNotesCount: 0, playstyleCounts: {}, hasMore: false, nextCursor: null } };
        }

        const json = await res.json();

        if (!json.success) {
            console.error("Fetch players failed:", json.error);
            return { data: [], meta: { totalCount: 0, totalNotesCount: 0, playstyleCounts: {}, hasMore: false, nextCursor: null } };
        }

        // Serialize dates for RSC boundary safety
        const data = (json.data as any[]).map((p: any) => ({
            id: p.id,
            name: p.name,
            playstyle: p.playstyle || "UNKNOWN",
            aggression_score: p.aggression_score ?? 0,
            notesCount: p.notesCount ?? p._count?.notes ?? 0,
            platform: p.platform ? { id: p.platform.id, name: p.platform.name } : undefined,
            ai_playstyle: p.ai_playstyle || null,
            ai_aggression_score: p.ai_aggression_score ?? null,
            ai_exploit_strategy: p.ai_exploit_strategy || null,
            ai_stats_used: p.ai_stats_used || null,
            ai_range_matrix: p.ai_range_matrix || null,
            ai_action_breakdown: p.ai_action_breakdown || null,
            ai_profile: p.ai_profile || null,
        }));

        console.log("Debug fetchFirstPage raw API output data[0]:", data[0]?.name, data[0]?.ai_profile);

        return { data, meta: json.meta };
    } catch (err) {
        console.error("fetchFirstPage Action Error:", err);
        return { data: [], meta: { totalCount: 0, totalNotesCount: 0, playstyleCounts: {}, hasMore: false, nextCursor: null } };
    }
}

/**
 * Server Action: fetch the next page of players using cursor-based pagination.
 * Called from the client when the IntersectionObserver triggers.
 */
export async function loadMorePlayers(cursor: string, options?: { query?: string; playstyle?: string; platform?: string }): Promise<PaginatedResult> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const params = new URLSearchParams({ limit: String(PAGE_SIZE), cursor });
    if (options?.query) params.append("query", options.query);
    if (options?.playstyle) params.append("playstyle", options.playstyle);
    if (options?.platform) params.append("platform", options.platform);

    const res = await fetch(`${API.players}?${params.toString()}`, { 
        cache: "no-store",
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
    });
    const json = await res.json();

    if (!json.success) {
        throw new Error("Failed to fetch more players");
    }

    // Serialize to plain objects — no Date instances, no class instances
    const data = (json.data as any[]).map((p: any) => ({
        id: p.id,
        name: p.name,
        playstyle: p.playstyle || "UNKNOWN",
        aggression_score: p.aggression_score ?? 0,
        notesCount: p.notesCount ?? p._count?.notes ?? 0,
        platform: p.platform ? { id: p.platform.id, name: p.platform.name } : undefined,
        ai_playstyle: p.ai_playstyle || null,
        ai_aggression_score: p.ai_aggression_score ?? null,
        ai_exploit_strategy: p.ai_exploit_strategy || null,
        ai_stats_used: p.ai_stats_used || null,
        ai_range_matrix: p.ai_range_matrix || null,
        ai_action_breakdown: p.ai_action_breakdown || null,
        ai_profile: p.ai_profile || null,
    }));

    return { data, meta: json.meta };
}

/**
 * Server Action: fetch a single player profile with notes.
 * Used for SSR in the player profile page.
 */
export async function fetchPlayerProfile(playerId: string): Promise<{
    id: string;
    name: string;
    playstyle: string;
    aggression_score: number;
    platform: {
        id: string;
        name: string;
    };
    ai_playstyle?: string | null;
    ai_aggression_level?: string | null;
    ai_aggression_score?: number | null;
    ai_gto_baseline?: string | null;
    ai_exploit_strategy?: string | null;
    ai_analysis_mode?: string | null;
    ai_stats_used?: string | null;
    ai_range_matrix?: any;
    ai_action_breakdown?: any;
    ai_profile?: any;
    usage?: any;
    stats?: {
        vpip: number;
        pfr: number;
        three_bet: number;
        fold_to_3bet: number;
        cbet: number;
        fold_to_cbet: number;
        wtsd: number;
        wsd: number;
        aggression_freq: number;
        steal: number;
        fold_to_steal: number;
        check_raise: number;
        total_hands: number;
        rfi?: number;
        four_bet?: number;
        fold_to_4bet?: number;
        fold_to_check_raise?: number;
        stab?: number;
        float_pct?: number;
    } | null;
    notes: { 
        id: string; 
        content: string; 
        street: string; 
        note_type: string; 
        source?: string; 
        created_at: string;
        is_ai_generated?: boolean;
    }[];
} | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};

    // Fetch player data AND current AI quota in parallel
    const [res, usageRes] = await Promise.all([
        fetch(`${API.players}/${playerId}`, { cache: "no-store", headers }),
        fetch(`${API.usage}?action=AI_ANALYZE`, { cache: "no-store", headers })
    ]);
    const json = await res.json();

    if (!res.ok || !json.success || !json.data) {
        console.error(`[fetchPlayerProfile] Backend error for player ${playerId}: status=${res.status}, error=${json.error || 'unknown'}`);
        return null;
    }

    let usage = null;
    try {
        const usageJson = await usageRes.json();
        if (usageJson.success && usageJson.data) usage = usageJson.data;
    } catch { /* usage is optional */ }

    const p = json.data;
    return {
        id: p.id,
        name: p.name,
        playstyle: p.playstyle || "UNKNOWN",
        aggression_score: p.aggression_score ?? 0,
        platform: p.platform || { id: "unknown", name: "Unknown" },
        ai_playstyle: p.ai_playstyle || null,
        ai_aggression_score: p.ai_aggression_score ?? null,
        ai_exploit_strategy: p.ai_exploit_strategy || null,
        ai_stats_used: p.ai_stats_used || null,
        ai_range_matrix: p.ai_range_matrix || null,
        ai_action_breakdown: p.ai_action_breakdown || null,
        ai_profile: p.ai_profile || null,
        usage,
        stats: p.stats ? {
            vpip: p.stats.vpip ?? 0,
            pfr: p.stats.pfr ?? 0,
            three_bet: p.stats.three_bet ?? 0,
            fold_to_3bet: p.stats.fold_to_3bet ?? 0,
            cbet: p.stats.cbet ?? 0,
            fold_to_cbet: p.stats.fold_to_cbet ?? 0,
            wtsd: p.stats.wtsd ?? 0,
            wsd: p.stats.wsd ?? 0,
            aggression_freq: p.stats.aggression_freq ?? 0,
            steal: p.stats.steal ?? 0,
            fold_to_steal: p.stats.fold_to_steal ?? 0,
            check_raise: p.stats.check_raise ?? 0,
            total_hands: p.stats.total_hands ?? 0,
            rfi: p.stats.rfi ?? 0,
            four_bet: p.stats.four_bet ?? 0,
            fold_to_4bet: p.stats.fold_to_4bet ?? 0,
            fold_to_check_raise: p.stats.fold_to_check_raise ?? 0,
            stab: p.stats.stab ?? 0,
            float_pct: p.stats.float_pct ?? 0,
        } : null,
        notes: (p.notes || []).map((n: any) => ({
            id: n.id,
            content: n.content,
            street: n.street || "General",
            note_type: n.note_type || "Custom",
            source: n.source || "custom",
            is_ai_generated: n.is_ai_generated ?? false,
            created_at: typeof n.created_at === "string" ? n.created_at : new Date(n.created_at).toISOString(),
        })),
    };
}

/**
 * Server Action: fetch app settings
 */
export async function getAppSettings() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    try {
        const res = await fetch(API.settings, { 
            cache: "no-store",
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) return json.data;
        return null;
    } catch (err) {
        console.error("Failed to fetch app settings", err);
        return null;
    }
}

/**
 * Server Action: update app settings
 */
export async function updateAppSettings(data: { ai_enabled?: boolean; analysis_mode?: string }) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    console.log("Updating app settings:", data);
    try {
        const res = await fetch(API.settings, {
            method: "PATCH",
            headers: { 
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data),
            cache: "no-store",
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Backend returned ${res.status}: ${errorText}`);
            throw new Error(`Failed to update settings: ${res.statusText}`);
        }

        const json = await res.json();
        if (json.success) {
            return JSON.parse(JSON.stringify(json.data));
        }

        console.error("Backend error:", json.error);
        throw new Error(json.error || "Failed to update settings");
    } catch (err) {
        console.error("Server Action Error (updateAppSettings):", err);
        throw err;
    }
}
/**
 * Server Action: create a new note for a player.
 */
export async function createNote(data: {
    player_id?: string;
    player_name?: string;
    content: string;
    street: string;
    note_type: string;
    source?: string;
    hand_id?: string;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    try {
        const res = await fetch(API.notes, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data),
            cache: "no-store",
        });

        const json = await res.json();
        if (json.success) return json.data;
        throw new Error(json.error || "Failed to create note");
    } catch (err) {
        console.error("Server Action Error (createNote):", err);
        throw err;
    }
}

/**
 * Server Action: export all players and notes for backup.
 */
export async function exportPlayersAction() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    try {
        const res = await fetch(API.playerExport, {
            cache: "no-store",
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) return json.data;
        throw new Error(json.error || "Failed to export data");
    } catch (err) {
        console.error("Server Action Error (exportPlayersAction):", err);
        throw err;
    }
}
/**
 * Server Action: fetch all platforms for filter dropdowns.
 */
export async function getAllPlatforms(): Promise<{ id: string, name: string }[]> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    try {
        const res = await fetch(API.platforms, { 
            cache: "no-store",
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        const json = await res.json();
        if (json.success) return json.data;
        return [];
    } catch (err) {
        console.error("Failed to fetch platforms", err);
        return [];
    }
}
/**
 * Server Action: delete a player and their associated data.
 */
export async function deletePlayerAction(playerId: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    try {
        const res = await fetch(`${API.players}/${playerId}`, {
            method: "DELETE",
            headers: token ? { "Authorization": `Bearer ${token}` } : {},
            cache: "no-store",
        });

        const json = await res.json();
        if (json.success) return { success: true };
        throw new Error(json.error || "Failed to delete player");
    } catch (err) {
        console.error("Server Action Error (deletePlayerAction):", err);
        throw err;
    }
}

/**
 * Server Action: fetch AI tuning settings.
 */
export async function getAISettings(): Promise<any> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    try {
        const res = await fetch(`${API.settings}/ai`, { 
            cache: "no-store",
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (err) {
        console.error("Failed to fetch AI settings", err);
        return null;
    }
}

/**
 * Server Action: update AI tuning settings.
 */
export async function updateAISettings(data: any): Promise<any> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    try {
        const res = await fetch(`${API.settings}/ai`, { 
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        return json;
    } catch (err) {
        console.error("Failed to update AI settings", err);
        return { success: false, error: String(err) };
    }
}
/**
 * Server Action: get current user's full profile (plan, stats, recent notes)
 */
export async function getUserProfile() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    try {
        const res = await fetch(`${API.base}/api/auth/me`, {
            cache: "no-store",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) return null;
        const json = await res.json();
        if (!json.success) return null;
        return {
            user: json.user,
            plan: json.plan,
            stats: json.stats,
            usage: json.usage,
            recentNotes: json.recentNotes ?? [],
        };
    } catch {
        return null;
    }
}

/**
 * Server Action: preview AI prompts based on UI config.
 */
export async function getAIPreviewAction(data: any): Promise<any> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    try {
        const res = await fetch(`${API.settings}/ai/preview`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        return json.success ? json.data : null;
    } catch (err) {
        console.error("Failed to fetch AI preview", err);
        return null;
    }
}

/**
 * Server Action: update user language.
 */
export async function updateUserLanguage(language: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, error: "Not authenticated" };

    try {
        const res = await fetch(`${API.base}/api/users/profile`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ language })
        });
        const json = await res.json();
        return json;
    } catch (err) {
        console.error("Failed to update user language", err);
        return { success: false, error: "Network error" };
    }
}
