"use client";

import { Shield, Zap, TrendingUp } from "lucide-react";

// ─── Response Types ─────────────────────────────────────────────

interface PlayerTendency {
    tag: string;
    weight: number;
}

export interface PlayerProfileData {
    player_profile_id: string;
    archetype: "nit" | "tag" | "lag" | "fish" | "maniac" | "calling_station" | "loose_passive" | "unknown";
    tendencies: PlayerTendency[];
    aggression_score: number;
    looseness_score: number;
    confidence: number;
    reliability_score: number;
    data_sources: {
        stats_weight: number;
        template_weight: number;
        custom_note_weight: number;
    };
}

interface PlayerProfileCardProps {
    profile: PlayerProfileData;
}

// ─── Styling Helpers ────────────────────────────────────────────

const ARCHETYPE_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    tag: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", glow: "shadow-[0_0_12px_rgba(59,130,246,0.15)]" },
    lag: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", glow: "shadow-[0_0_12px_rgba(168,85,247,0.15)]" },
    loose_passive: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", glow: "shadow-[0_0_12px_rgba(234,179,8,0.15)]" },
    calling_station: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", glow: "shadow-[0_0_12px_rgba(245,158,11,0.15)]" },
    maniac: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", glow: "shadow-[0_0_12px_rgba(239,68,68,0.15)]" },
    nit: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", glow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]" },
    fish: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", glow: "shadow-[0_0_12px_rgba(6,182,212,0.15)]" },
    unknown: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400", glow: "" },
};

function formatArchetypeLabel(label: string): string {
    return label.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function formatTag(tag: string): string {
    return tag.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function getTierStyle(score: number) {
    if (score >= 0.7) return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "HIGH CONFIDENCE", color: "bg-emerald-400" };
    if (score >= 0.4) return { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", label: "MEDIUM CONFIDENCE", color: "bg-yellow-400" };
    return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", label: "LOW CONFIDENCE", color: "bg-red-400" };
}

// ─── Component ──────────────────────────────────────────────────

export function PlayerProfileCard({ profile }: PlayerProfileCardProps) {
    const archetypeStyle = ARCHETYPE_STYLES[profile.archetype] || ARCHETYPE_STYLES.unknown;
    const tierStyle = getTierStyle(profile.reliability_score);

    return (
        <div className="bg-[#111318] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Top accent */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

            <div className="p-6 space-y-5">

                {/* ── Header: Archetype + Quality ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                            Decision Engine Profile
                        </h3>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${tierStyle.bg} ${tierStyle.border} ${tierStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tierStyle.color} animate-pulse`}></span>
                        {tierStyle.label}
                    </div>
                </div>

                {/* ── Archetype Badge ── */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${archetypeStyle.border} bg-[#1a1d24]`}>
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mb-1">
                            Archetype
                        </span>
                        <span className={`text-xl font-black tracking-tight ${archetypeStyle.text}`}>
                            {formatArchetypeLabel(profile.archetype)}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mb-1">
                            Profile Confidence
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${profile.confidence > 0.7 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : profile.confidence > 0.4 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`}
                                    style={{ width: `${Math.round(profile.confidence * 100)}%` }}
                                />
                            </div>
                            <span className="text-sm font-mono text-white font-bold">
                                {Math.round(profile.confidence * 100)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Core Aggression vs Looseness Grid ── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1a1d24] rounded-lg p-4 border border-gray-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full pointer-events-none"></div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mb-2">Aggression</span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-mono text-white font-bold">{profile.aggression_score}</span>
                            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: `${profile.aggression_score}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#1a1d24] rounded-lg p-4 border border-gray-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full pointer-events-none"></div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mb-2">Looseness</span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-mono text-white font-bold">{profile.looseness_score}</span>
                            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${profile.looseness_score}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Canonical Tendencies ── */}
                {profile.tendencies && profile.tendencies.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-4 h-4 text-gold" />
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                                Isolated Tendencies
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.tendencies.map((tendency, i) => (
                                <div
                                    key={i}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1a1d24] rounded border border-gray-700 text-xs font-semibold text-gray-300"
                                >
                                    <span className="uppercase tracking-wider">{formatTag(tendency.tag)}</span>
                                    <span className="text-[9px] opacity-60 font-mono px-1.5 py-0.5 bg-black/40 rounded">
                                        W: {tendency.weight}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Source Weights ── */}
                <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                            Data Source Weights
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: "HUD Stats", weight: profile.data_sources.stats_weight },
                            { label: "Templates", weight: profile.data_sources.template_weight },
                            { label: "Custom AI", weight: profile.data_sources.custom_note_weight },
                        ].map((src, i) => (
                            <div key={i} className="text-center p-2 rounded bg-[#1a1d24] border border-gray-800">
                                <span className="block text-[9px] text-gray-500 uppercase tracking-wider mb-1">{src.label}</span>
                                <span className="block text-xs font-mono text-gray-300">{(src.weight * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
