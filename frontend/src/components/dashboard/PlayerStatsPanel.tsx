"use client";

import { useState, useEffect } from "react";
import { BarChart3, Save, RotateCcw } from "lucide-react";
import { API, apiFetch } from "@/lib/api";

interface PlayerStatsPanelProps {
    playerId: string;
}

interface StatsData {
    vpip: number | null;
    rfi: number | null;
    pfr: number | null;
    three_bet: number | null;
    fold_to_3bet: number | null;
    cbet: number | null;
    fold_to_cbet: number | null;
    wtsd: number | null;
    wsd: number | null;
    aggression_freq: number | null;
}

const STAT_CONFIG = [
    { key: "vpip", label: "VPIP%", description: "Voluntarily Put Money in Pot" },
    { key: "rfi", label: "RFI%", description: "Raise First In" },
    { key: "pfr", label: "PFR%", description: "Pre-Flop Raise" },
    { key: "three_bet", label: "3Bet%", description: "Three-bet percentage" },
    { key: "fold_to_3bet", label: "Fold to 3Bet%", description: "Fold to three-bet" },
    { key: "cbet", label: "C-Bet%", description: "Continuation Bet" },
    { key: "fold_to_cbet", label: "Fold to C-Bet%", description: "Fold to continuation bet" },
    { key: "wtsd", label: "WTSD%", description: "Went to Showdown" },
    { key: "wsd", label: "W$SD%", description: "Won $ at Showdown" },
    { key: "aggression_freq", label: "Agg Freq%", description: "Aggression Frequency" },
] as const;

const emptyStats: StatsData = {
    vpip: null, rfi: null, pfr: null, three_bet: null, fold_to_3bet: null,
    cbet: null, fold_to_cbet: null, wtsd: null, wsd: null, aggression_freq: null,
};

export function PlayerStatsPanel({ playerId }: PlayerStatsPanelProps) {
    const [stats, setStats] = useState<StatsData>(emptyStats);
    const [enabled, setEnabled] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchStats();
    }, [playerId]);

    const fetchStats = async () => {
        try {
            const res = await apiFetch(API.playerStats(playerId));
            if (res.ok) {
                const json = await res.json();
                const data = json.data as StatsData;
                setStats(data);
                // Auto-enable all stats for now (bypass admin check for now)
                const autoEnabled: Record<string, boolean> = {};
                for (const cfg of STAT_CONFIG) {
                    autoEnabled[cfg.key] = true;
                }
                setEnabled(autoEnabled);
            }
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            // Only send enabled stats; disabled ones become null
            const payload: Record<string, number | null> = {};
            for (const cfg of STAT_CONFIG) {
                payload[cfg.key] = enabled[cfg.key] ? stats[cfg.key as keyof StatsData] : null;
            }
            const res = await apiFetch(API.playerStats(playerId), {
                method: "PUT",
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (err) {
            console.error("Failed to save stats", err);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setStats(emptyStats);
        setEnabled({});
    };

    return (
        <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-blue-400 mr-3" />
                    <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                        Player Statistics
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center text-[10px] text-gray-500 hover:text-white px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-colors uppercase tracking-wider"
                    >
                        <RotateCcw className="w-3 h-3 mr-1" /> Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center text-[10px] text-white bg-blue-500/20 hover:bg-blue-500/30 px-3 py-1 rounded border border-blue-500/30 transition-colors uppercase tracking-wider font-semibold disabled:opacity-50"
                    >
                        <Save className="w-3 h-3 mr-1" />
                        {saving ? "Saving..." : saved ? "✓ Saved" : "Save Stats"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {STAT_CONFIG.map((cfg) => {
                    const isEnabled = enabled[cfg.key] ?? false;
                    const value = stats[cfg.key as keyof StatsData];
                    return (
                        <div
                            key={cfg.key}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isEnabled
                                ? "bg-black/40 border-blue-500/20"
                                : "bg-black/20 border-white/5 opacity-50"
                                }`}
                        >
                            {/* Toggle */}
                            <button
                                type="button"
                                onClick={() => setEnabled((prev) => ({ ...prev, [cfg.key]: !prev[cfg.key] }))}
                                className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${isEnabled ? "bg-blue-500" : "bg-gray-700"
                                    }`}
                            >
                                <span
                                    className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${isEnabled ? "translate-x-4" : "translate-x-0.5"
                                        }`}
                                />
                            </button>

                            {/* Label */}
                            <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-white block">{cfg.label}</span>
                                <span className="text-[9px] text-gray-500 block truncate">{cfg.description}</span>
                            </div>

                            {/* Input */}
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={value ?? ""}
                                disabled={!isEnabled}
                                onChange={(e) => {
                                    const v = e.target.value === "" ? null : Number(e.target.value);
                                    setStats((prev) => ({ ...prev, [cfg.key]: v }));
                                }}
                                placeholder="—"
                                className="w-16 bg-background border border-border rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
