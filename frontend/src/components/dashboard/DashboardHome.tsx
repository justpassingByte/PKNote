'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
    Users, 
    FileText, 
    Zap, 
    Plus, 
    ArrowRight, 
    TrendingDown, 
    Activity, 
    History,
    Search,
    Brain,
    Target,
    ShieldAlert,
    Sparkles
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { AITuningModal } from './AITuningModal';
import { HighlightKeywords } from '@/components/ui/HighlightKeywords';
import { useLanguage } from '@/i18n/LanguageContext';

interface Player {
    id: string;
    name: string;
    playstyle: string;
    aggression_score: number;
    notesCount: number;
    platform: { name: string };
    ai_playstyle?: string;
    ai_aggression_score?: number;
    ai_exploit_strategy?: any;
    ai_profile?: any;
}

interface DashboardHomeProps {
    user?: { email: string; premium_tier: string } | null;
    stats: {
        totalCount: number;
        totalNotesCount: number;
        playstyleCounts: Record<string, number>;
        totalHands?: number;
        aiNotesCount?: number;
        manualNotesCount?: number;
        aiUsage?: { remaining: number; limit: number; resetsAt: string };
        ocrUsage?: { remaining: number; limit: number; resetsAt: string };
    };
    topWhales: Player[];
    topRegs: Player[];
}

const MOCK_WHALES: Player[] = [
    {
        id: 'mock-w1',
        name: 'SmoothCall_Mike',
        playstyle: 'CALLING STATION',
        aggression_score: 38,
        notesCount: 12,
        platform: { name: 'GGPoker' },
        ai_playstyle: 'CALLING STATION',
        ai_aggression_score: 38,
        ai_profile: {
            archetype: 'CALLING STATION',
            range_adjustments: [
                'Value bet top pair+ for 3 streets — they call with any pair',
                'Remove bluffs from river range — station pays off everything',
            ],
        },
    },
    {
        id: 'mock-w2',
        name: 'LimpKing42',
        playstyle: 'FISH',
        aggression_score: 22,
        notesCount: 5,
        platform: { name: 'PokerStars' },
        ai_playstyle: 'FISH',
        ai_aggression_score: 22,
        ai_profile: {
            archetype: 'FISH',
            range_adjustments: [
                'Isolate preflop to 4x — punish passive limps',
                'Value bet large on all streets — no fold equity needed',
            ],
        },
    },
];

const MOCK_REGS: Player[] = [
    {
        id: 'mock-r1',
        name: 'xFishKiller99',
        playstyle: 'LAG',
        aggression_score: 72,
        notesCount: 34,
        platform: { name: 'PokerStars' },
        ai_playstyle: 'LAG',
        ai_aggression_score: 72,
        ai_profile: {
            archetype: 'LAG',
            range_adjustments: [
                'CO vs BU 3bet: Fold AJo, KQo — Call AQo, TT-QQ — 4bet AK, KK+',
                'Cbet flop 85% → check-raise dry boards more vs this player',
            ],
        },
    },
    {
        id: 'mock-r2',
        name: 'GTO_Crusher',
        playstyle: 'TAG',
        aggression_score: 55,
        notesCount: 21,
        platform: { name: '888poker' },
        ai_playstyle: 'TAG',
        ai_aggression_score: 55,
        ai_profile: {
            archetype: 'TAG',
            range_adjustments: [
                'Avoid 3bet bluffing OOP — they call too wide in position',
                'Check-raise flop more on Axx boards — they overfold cbet',
            ],
        },
    },
];

export function DashboardHome({ user, stats, topWhales, topRegs }: DashboardHomeProps) {
    const [isAITuningOpen, setIsAITuningOpen] = useState(false);
    const { t } = useLanguage();
    const displayName = user?.email ? user.email.split('@')[0].toUpperCase() : 'HERO';

    return (
        <div className="space-y-8 pb-20">
            {/* Modal for AI Tuning */}
            <Modal 
                isOpen={isAITuningOpen} 
                onClose={() => setIsAITuningOpen(false)}
                title={t('dashboard.ai_tuning_modal_title')}
                size="xl"
            >
                <AITuningModal onClose={() => setIsAITuningOpen(false)} />
            </Modal>

            {/* 1. Welcome & Primary Action */}
            <div className="relative overflow-hidden rounded-2xl bg-[#111318] shadow-xl border border-gray-800 p-8 sm:p-10 mb-8">
                {/* Minimal Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-4 flex-1">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-black uppercase tracking-widest border border-emerald-500/20">
                                <Sparkles className="w-3.5 h-3.5" />
                                {t('dashboard.neural_link_established')}
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-tight uppercase">
                                {t('dashboard.welcome')} <span className="text-white underline decoration-gold/30">{displayName}</span>
                            </h1>
                            <p className="text-gray-400 max-w-lg leading-relaxed text-sm sm:text-lg font-medium">
                                {t('dashboard.tracking_prefix')} <span className="text-white font-bold">{stats.totalCount}</span> {t('dashboard.tracking_suffix')}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <button 
                            onClick={() => setIsAITuningOpen(true)}
                            className="group flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-xl hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98]"
                        >
                            <Brain className="w-5 h-5 text-gray-400 group-hover:text-gold transition-colors" />
                            <span className="text-sm uppercase tracking-widest">{t('dashboard.neural_tuning_btn')}</span>
                        </button>

                        <Link 
                            href="/analyzer"
                            className="group flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 text-black font-black rounded-xl hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-[0.98]"
                        >
                            <Zap className="w-5 h-5 fill-current" />
                            <span className="text-sm uppercase tracking-widest">{t('dashboard.new_hand_btn')}</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard 
                    title={t('dashboard.total_analyzed') || "Total Hands Analyzed"}
                    value={stats.totalHands ?? 0}
                    icon={<Activity className="w-5 h-5" />}
                    color="gold"
                    href="/history"
                />
                <StatCard 
                    title={t('dashboard.total_opponents') || "Total Opponents Tracked"}
                    value={stats.totalCount ?? 0}
                    icon={<Users className="w-5 h-5" />}
                    color="green"
                    href="/players"
                />
                <StatCard 
                    title={t('dashboard.ai_notes') || "Total AI Notes"}
                    value={stats.aiNotesCount ?? 0}
                    icon={<Brain className="w-5 h-5" />}
                    color="blue"
                    href="/players"
                />
                <StatCard 
                    title={t('dashboard.manual_notes') || "Total Manual Notes"}
                    value={stats.manualNotesCount ?? 0}
                    icon={<FileText className="w-5 h-5" />}
                    color="red"
                    href="/players"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
                {/* Col 1: Top WHALE Targets */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 px-1">
                        <ShieldAlert className="w-4 h-4 text-gray-500" />
                        <h2 className="text-xs font-black text-white uppercase tracking-widest">{t('dashboard.priority_targets')}</h2>
                        <div className="h-[1px] flex-1 bg-gray-800/60 ml-2"></div>
                    </div>
                    <div className="space-y-3">
                        {(topWhales.length > 0 ? topWhales : MOCK_WHALES).map(player => (
                            <PlayerCard key={player.id} player={player} />
                        ))}
                    </div>
                </div>

                {/* Col 2: Top REG Targets */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2.5 px-1">
                        <Target className="w-4 h-4 text-gray-500" />
                        <h2 className="text-xs font-black text-white uppercase tracking-widest">{t('dashboard.elite_regs')}</h2>
                        <div className="h-[1px] flex-1 bg-gray-800/60 ml-2"></div>
                    </div>
                    <div className="space-y-3">
                        {(topRegs.length > 0 ? topRegs : MOCK_REGS).map(player => (
                            <PlayerCard key={player.id} player={player} isStrong />
                        ))}
                    </div>
                </div>

                {/* Col 3: Quick Actions */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <h2 className="text-[10px] font-bold text-white uppercase tracking-wider">{t('dashboard.quick_actions')}</h2>
                        <div className="h-[1px] flex-1 bg-gray-800"></div>
                    </div>
                    <div className="space-y-2">
                        <Link href="/players" className="flex items-center gap-3 p-3 bg-[#111318] border border-gray-700 rounded-xl hover:border-gray-500 transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-[#1a1d24] flex items-center justify-center border border-gray-700">
                                <Users className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white">{t('dashboard.all_players')}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{stats.totalCount} {t('dashboard.tracked_count')}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>

                        <Link href="/analyzer" className="flex items-center gap-3 p-3 bg-[#111318] border border-gray-700 rounded-xl hover:border-gray-500 transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <Zap className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white">{t('dashboard.hand_scanner')}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t('dashboard.upload_analyze')}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    </div>

                    {/* Playstyle Breakdown */}
                    <div className="pt-1">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-2 block px-1">{t('dashboard.player_breakdown')}</span>
                        <div className="space-y-1.5">
                            {(() => {
                                const counts = Object.keys(stats.playstyleCounts).length > 0
                                    ? stats.playstyleCounts
                                    : { LAG: 4, TAG: 3, FISH: 6, WHALE: 2, NIT: 1, MANIAC: 1 };
                                const maxCount = Math.max(...Object.values(counts));
                                const barColorMap: Record<string, string> = {
                                    LAG: '#ef4444', TAG: '#3b82f6', NIT: '#22c55e',
                                    FISH: '#eab308', WHALE: '#fbbf24', MANIAC: '#a855f7',
                                    'CALLING STATION': '#f97316', UNKNOWN: '#6b7280',
                                };
                                return Object.entries(counts)
                                    .sort(([,a], [,b]) => b - a)
                                    .map(([style, count]) => (
                                        <div key={style} className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide w-[70px] text-right shrink-0">{style}</span>
                                            <div className="flex-1 h-5 bg-gray-800/50 rounded overflow-hidden">
                                                <div 
                                                    className="h-full rounded"
                                                    style={{ 
                                                        width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`,
                                                        backgroundColor: barColorMap[style.toUpperCase()] || '#6b7280'
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-mono font-bold text-gray-300 w-5 text-right">{count}</span>
                                        </div>
                                    ));
                            })()}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

function PlayerCard({ player, isStrong = false }: { player: Player, isStrong?: boolean }) {
    const { t } = useLanguage();
    const getTagStyle = (style: string) => {
        const s = style?.toUpperCase();
        if (s === 'MANIAC' || s === 'LAG') return 'bg-red-500/5 text-red-500/80 border-red-500/20';
        return 'bg-white/5 text-gray-400 border-gray-800';
    };
    const displayTag = player.ai_playstyle || player.playstyle;
    const aggScore = player.ai_aggression_score ?? player.aggression_score;
    const getAggressionColor = (score: number) => {
        if (score > 65) return 'text-red-400';
        if (score < 25) return 'text-gray-500';
        return 'text-white';
    };

    return (
        <Link 
            href={`/players/${player.id}`} 
            className="block bg-[#111318] border border-gray-800 rounded-xl p-3 hover:border-gray-600 transition-all group"
        >
            {/* ROW 1: Name + Tag */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 min-w-0 flex-1">
                    {/* Hardcoded Avatar */}
                    <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-gray-800 flex-shrink-0">
                        <Users className="w-5 h-5 text-gray-500 group-hover:text-gold transition-colors" />
                    </div>
                    
                    <div className="min-w-0">
                        <h4 className="font-bold text-base text-white tracking-tight truncate leading-tight mb-1">{player.name}</h4>
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none block">{player.platform?.name || t('dashboard.hud.unknown') || 'Unknown'}</span>
                    </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${getTagStyle(displayTag)} uppercase tracking-widest whitespace-nowrap flex-shrink-0 ml-2 mt-1`}>
                    {displayTag}
                </span>
            </div>

            {/* ROW 2: Range Adjustments (max 2) - Higher Density */}
            {player.ai_profile?.range_adjustments && player.ai_profile.range_adjustments.length > 0 && (
                <div className="mb-3">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2 block px-1">{t('dashboard.range_adjustments')}</span>
                    <div className="space-y-1">
                        {player.ai_profile.range_adjustments.slice(0, 2).map((adj: string, i: number) => (
                            <div key={i} className="flex items-start gap-2.5 border-l-2 border-gray-700 py-1.5 pl-4">
                                <span className="text-sm text-gray-300 font-medium leading-tight">
                                    <HighlightKeywords text={adj} />
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FOOTER: Metrics */}
            <div className="border-t border-gray-700/60 pt-2 mt-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className={`text-base font-mono font-bold ${getAggressionColor(aggScore)}`}>
                                {aggScore}%
                            </span>
                            <span className="text-xs text-gray-600 font-black uppercase tracking-wider">{t('dashboard.hud.agg') || 'AGG'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <span className="text-base font-mono font-bold text-gray-400">{player.notesCount}</span>
                        </div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </Link>
    );
}

function StatCard({ title, value, icon, color, href }: { title: string, value: number, icon: React.ReactNode, color: string, href: string }) {
    const colors: Record<string, string> = {
        gold: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        green: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        red: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    };

    return (
        <Link 
            href={href}
            className="p-5 bg-[#111318] border border-gray-800 rounded-xl group hover:border-gray-600 transition-all"
        >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 border ${colors[color]}`}>
                {icon}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{title}</div>
        </Link>
    );
}

function ActionButton({ icon, title, desc, href, onClick, disabled = false }: { icon: React.ReactNode, title: string, desc: string, href?: string, onClick?: () => void, disabled?: boolean }) {
    const content = (
        <>
            <div className="w-9 h-9 rounded-lg bg-[#1a1d24] flex items-center justify-center text-gray-400 border border-gray-800">
                {icon}
            </div>
            <div className="text-left">
                <div className="text-sm font-bold text-white">{title}</div>
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">{desc}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </>
    );

    if (onClick) {
        return (
            <button 
                onClick={onClick}
                disabled={disabled}
                className={`flex items-center gap-3 p-4 rounded-xl border border-gray-800 bg-[#111318] hover:border-gray-600 transition-all group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {content}
            </button>
        );
    }

    return (
        <Link 
            href={disabled ? '#' : (href || '#')}
            className={`flex items-center gap-3 p-4 rounded-xl border border-gray-800 bg-[#111318] hover:border-gray-600 transition-all group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {content}
        </Link>
    );
}
