"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Crosshair, AlertTriangle, Brain, Plus, FileText, MessageSquare, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { HighlightKeywords } from '@/components/ui/HighlightKeywords';
import { useLanguage } from '@/i18n/LanguageContext';

export interface PlayerHUDProps {
    id: string;
    name: string;
    playstyle: string;
    aggressionScore: number;
    notesCount: number;
    platformName?: string;
    ai_playstyle?: string | null;
    ai_aggression_score?: number | null;
    ai_exploit_strategy?: any;
    ai_profile?: any;
    recentNotes?: { id: string; content: string; created_at: string }[];
    onAddNote?: () => void;
    onDelete?: () => void;
}

export function PlayerHUD({ 
    id, name, playstyle, aggressionScore, notesCount, platformName, 
    ai_playstyle, ai_aggression_score, ai_exploit_strategy, ai_profile,
    recentNotes,
    onAddNote, onDelete 
}: PlayerHUDProps) {
    const { t } = useLanguage();
    const [expanded, setExpanded] = useState(false);

    const getTagStyle = (style: string) => {
        switch (style.toUpperCase()) {
            case 'LAG': return 'bg-red-500/20 text-red-400 border-red-500/40';
            case 'TAG': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
            case 'NIT': return 'bg-green-500/20 text-green-400 border-green-500/40';
            case 'FISH': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
            case 'WHALE': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            case 'MANIAC': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
            case 'CALLING STATION': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
        }
    };

    const getAggressionIcon = (score: number) => {
        if (score > 60) return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
        if (score > 30) return <Crosshair className="w-3.5 h-3.5 text-yellow-400" />;
        return <ShieldAlert className="w-3.5 h-3.5 text-green-400" />;
    };

    const getAggressionColor = (score: number) => {
        if (score > 60) return 'text-red-400';
        if (score > 30) return 'text-yellow-400';
        return 'text-green-400';
    };

    const ai_archetype = ai_playstyle || ai_profile?.archetype;
    const displayTag = ai_archetype || playstyle;
    const aggScore = ai_aggression_score ?? aggressionScore;
    const notes = recentNotes?.slice(0, 2) || [];
    const allRangeAdj = ai_profile?.range_adjustments || [];
    const hasExtra = allRangeAdj.length > 3;
    const visibleAdj = expanded ? allRangeAdj : allRangeAdj.slice(0, 3);

    return (
        <Link href={`/players/${id}`} className="block bg-[#111318] border border-gray-800 rounded-xl p-4 relative group hover:border-gray-600 transition-colors cursor-pointer no-underline flex flex-col shadow-sm">
            
            {/* ROW 1: HEADER & STATS */}
            <div className="flex justify-between items-start mb-5">
                <div className="flex gap-3 min-w-0 flex-1">
                    {/* Hardcoded Avatar */}
                    <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center border border-gray-800 flex-shrink-0">
                        <Users className="w-6 h-6 text-gray-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-xl text-white tracking-tight leading-none mb-2 truncate">{name}</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-none block">{platformName || t('dashboard.hud.unknown') || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${getTagStyle(displayTag)} uppercase tracking-widest whitespace-nowrap flex-shrink-0 mt-1`}>
                    {displayTag}
                </span>
            </div>

            {/* ROW 2: RECENT NOTES */}
            <div className="mb-5">
                <span className="text-xs text-gray-600 font-black uppercase tracking-widest block mb-2 px-1">{t('dashboard.hud.intel_logs') || "Intel Logs"}</span>
                {notes.length > 0 ? (
                    <div className="space-y-1 px-1">
                        {notes.map((note) => (
                            <div key={note.id} className="flex items-start gap-2.5 py-2.5 border-b border-gray-800/50 last:border-0">
                                <MessageSquare className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-300 font-medium leading-relaxed line-clamp-2">
                                    <HighlightKeywords text={note.content} />
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-1 py-2 border border-dashed border-gray-800 rounded-lg text-center">
                        <span className="text-[10px] text-gray-700 italic uppercase">{t('dashboard.hud.no_logs') || "No logs."}</span>
                    </div>
                )}
            </div>

            {/* ROW 3: RANGE ADJUSTMENTS */}
            {allRangeAdj.length > 0 && (
                <div className="mb-5">
                    <span className="text-xs text-gray-600 font-black uppercase tracking-widest mb-2 block px-1">{t('dashboard.hud.tactical_adjusts') || "Tactical Adjusts"}</span>
                    <div className={`space-y-1 px-1 ${expanded ? 'max-h-[200px] overflow-y-auto scrollbar-hide' : ''}`}>
                        {visibleAdj.map((adj: string, i: number) => (
                            <div key={i} className="flex items-start gap-2.5 py-2">
                                <Brain className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-300 font-medium leading-tight">
                                    <HighlightKeywords text={adj} />
                                </span>
                            </div>
                        ))}
                    </div>
                    {hasExtra && (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(!expanded); }}
                            className="flex items-center gap-1 text-[9px] text-gray-600 hover:text-amber-500 font-black uppercase tracking-widest transition-colors mt-2 px-1"
                        >
                            {expanded ? (
                                <><ChevronUp className="w-3 h-3" /> {t('dashboard.hud.hide') || "Hide"}</>
                            ) : (
                                <><ChevronDown className="w-3 h-3" /> +{allRangeAdj.length - 3} {t('dashboard.hud.more') || "more"}</>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* DIVIDER + METRICS */}
            <div className="border-t border-gray-800 mt-auto pt-3 px-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            {getAggressionIcon(aggScore)}
                            <span className={`text-xs font-mono font-bold ${getAggressionColor(aggScore)}`}>
                                {aggScore}%
                            </span>
                            <span className="text-[8px] text-gray-700 uppercase font-black tracking-widest">{t('dashboard.hud.agg') || "AGG"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-gray-700" />
                            <span className="text-xs font-mono font-bold text-gray-500">{notesCount}</span>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddNote?.(); }}
                        className="w-7 h-7 flex items-center justify-center border border-gray-800 hover:bg-white/5 text-gray-600 hover:text-amber-500 rounded-lg transition-colors"
                        title={t('dashboard.hud.log_note') || "Log note"}
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </Link>
    );
}
