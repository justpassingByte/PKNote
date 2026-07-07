"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { PlayerHUD } from "@/components/dashboard/PlayerHUD";
import { MetricsBar } from "@/components/dashboard/MetricsBar";
import { DashboardToolbar } from "@/components/dashboard/DashboardToolbar";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { AddPlayerForm } from "@/components/forms/AddPlayerForm";
import { AddNoteForm } from "@/components/forms/AddNoteForm";
import { ImportJsonModal } from "@/components/forms/ImportJsonModal";
import { TemplateManagerModal } from "@/components/forms/TemplateManagerModal";
import { loadMorePlayers, fetchFirstPage, deletePlayerAction } from "@/app/actions";
import { useLanguage } from '@/i18n/LanguageContext';

// Mock players shown when no real data exists (demo / not logged in)
const MOCK_PLAYERS: Player[] = [
    {
        id: 'mock-1',
        name: 'xFishKiller99',
        playstyle: 'LAG',
        aggression_score: 72,
        notesCount: 34,
        platform: { id: 'p1', name: 'PokerStars' },
        ai_playstyle: 'LAG',
        ai_aggression_score: 72,
        ai_profile: {
            archetype: 'LAG',
            range_adjustments: [
                'CO vs BU 3bet: Fold AJo, KQo — Call AQo, TT-QQ — 4bet AK, KK+',
                'Cbet flop 85% → check-raise dry boards more vs this player',
            ],
        },
        recentNotes: [
            { id: 'n1', content: 'Opens 40% BTN, folds to 3bet 65% — exploit with wider 3bet range IP', created_at: '2026-03-25T10:00:00Z' },
            { id: 'n2', content: 'Overbet shoves river with missed draws — call wider on wet boards', created_at: '2026-03-24T18:00:00Z' },
        ],
    },
    {
        id: 'mock-2',
        name: 'SmoothCall_Mike',
        playstyle: 'CALLING STATION',
        aggression_score: 38,
        notesCount: 12,
        platform: { id: 'p2', name: 'GGPoker' },
        ai_playstyle: 'CALLING STATION',
        ai_aggression_score: 38,
        ai_profile: {
            archetype: 'CALLING STATION',
            range_adjustments: [
                'Value bet top pair+ for 3 streets — they call with any pair',
                'Remove bluffs from river range — station pays off everything',
            ],
        },
        recentNotes: [
            { id: 'n3', content: 'Called 3 streets with bottom pair on AKQ board — pure station', created_at: '2026-03-25T08:00:00Z' },
            { id: 'n4', content: 'Never folds to c-bet, even on dry boards — value bet relentlessly', created_at: '2026-03-23T14:00:00Z' },
        ],
    },
    {
        id: 'mock-3',
        name: 'TightIsRight',
        playstyle: 'NIT',
        aggression_score: 15,
        notesCount: 3,
        platform: { id: 'p3', name: '888poker' },
        ai_playstyle: 'NIT',
        ai_aggression_score: 15,
        ai_profile: null,
        recentNotes: [],
    },
];

// Define strict typing for Player matching the Backend return signature
export interface Player {
    id: string;
    name: string;
    playstyle: string;
    aggression_score: number;
    notesCount?: number;
    platform?: { id: string; name: string };
    ai_playstyle?: string | null;
    ai_aggression_score?: number | null;
    ai_exploit_strategy?: any;
    ai_profile?: any;
    recentNotes?: { id: string; content: string; created_at: string }[];
}

export interface PaginationMeta {
    totalCount: number;
    totalNotesCount: number;
    playstyleCounts: Record<string, number>;
    hasMore: boolean;
    nextCursor: string | null;
}

interface PlayerListClientProps {
    initialPlayers: Player[];
    initialMeta: PaginationMeta;
    initialPlatforms?: { id: string; name: string }[];
}

export function PlayerListClient({
    initialPlayers,
    initialMeta,
    initialPlatforms = [],
    user
}: PlayerListClientProps & { user?: { email: string; premium_tier: string } | null }) {
    const [players, setPlayers] = useState<Player[]>(initialPlayers);
    const [meta, setMeta] = useState<PaginationMeta>(initialMeta);
    const [cursor, setCursor] = useState<string | null>(initialMeta.nextCursor);
    const [hasMore, setHasMore] = useState(initialMeta.hasMore);
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useLanguage();

    // UI state
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isNoteModalOpen, setNoteModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPlaystyle, setFilterPlaystyle] = useState('All');
    const [filterPlatform, setFilterPlatform] = useState('All');
    const [activePlayerForNote, setActivePlayerForNote] = useState<Player | null>(null);

    const sentinelRef = useRef<HTMLDivElement>(null);

    // Load more via Server Action
    const handleLoadMore = useCallback(async () => {
        if (isLoading || !hasMore || !cursor) return;
        setIsLoading(true);

        try {
            const result = await loadMorePlayers(cursor, { 
                query: searchQuery, 
                playstyle: filterPlaystyle, 
                platform: filterPlatform 
            });
            setPlayers(prev => [...prev, ...result.data]);
            setMeta(result.meta);
            setHasMore(result.meta.hasMore);
            setCursor(result.meta.nextCursor);
        } catch (e) {
            console.error("Failed to load more players", e);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, cursor, searchQuery, filterPlaystyle, filterPlatform]);

    // Reset and reload from page 1 via Server Action
    const resetAndReload = useCallback(async (overrides?: { query?: string; playstyle?: string; platform?: string }) => {
        setIsLoading(true);
        try {
            const result = await fetchFirstPage({ 
                query: overrides?.query !== undefined ? overrides.query : searchQuery, 
                playstyle: overrides?.playstyle !== undefined ? overrides.playstyle : filterPlaystyle, 
                platform: overrides?.platform !== undefined ? overrides.platform : filterPlatform 
            });
            setPlayers(result.data);
            setMeta(result.meta);
            setHasMore(result.meta.hasMore);
            setCursor(result.meta.nextCursor);
        } catch (e) {
            console.error("Failed to reload players", e);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, filterPlaystyle, filterPlatform]);
    
    const handleDeletePlayer = async (id: string) => {
        try {
            await deletePlayerAction(id);
            setPlayers(prev => prev.filter(p => p.id !== id));
            resetAndReload();
        } catch (err: any) {
            alert(err.message || "Failed to delete player");
        }
    };

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        if (!sentinelRef.current || !hasMore || isLoading) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isLoading && hasMore && cursor) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, isLoading, cursor, handleLoadMore]);

    // Trigger server-side reload when filters change (debounced for search)
    useEffect(() => {
        const timer = setTimeout(() => {
            resetAndReload();
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [searchQuery, filterPlaystyle, filterPlatform]);

    // Format platforms for the dropdown
    const platformNames = initialPlatforms.map(p => p.name);

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent">
            <Header user={user} onSettingsClick={() => setSettingsOpen(true)} />

            <div className="flex-1 overflow-y-auto pt-20 sm:pt-24 px-4 sm:px-6 pb-6 relative scrollbar-hide">
                {/* Decorative background */}
                <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
                    <div className="w-[500px] h-[500px] rounded-full bg-felt-light blur-3xl"></div>
                </div>


                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Metrics Bar */}
                    <MetricsBar
                        totalCount={meta.totalCount}
                        totalNotesCount={meta.totalNotesCount}
                        playstyleCounts={meta.playstyleCounts}
                        onImportClick={() => setImportModalOpen(true)}
                        onAddPlayerClick={() => setAddModalOpen(true)}
                    />

                    {/* Toolbar */}
                    <DashboardToolbar
                        totalCount={meta.totalCount}
                        playstyleCounts={meta.playstyleCounts}
                        searchQuery={searchQuery}
                        filterPlaystyle={filterPlaystyle}
                        filterPlatform={filterPlatform}
                        distinctPlatforms={platformNames}
                        onSearchChange={setSearchQuery}
                        onFilterChange={setFilterPlaystyle}
                        onPlatformFilterChange={setFilterPlatform}
                        onImportClick={() => setImportModalOpen(true)}
                    />

                    {/* Player Grid */}
                    <div className="bg-[#111318]/20 border-x border-b border-gray-800/50 rounded-b-2xl p-4 sm:p-6 shadow-inner overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                            {players.length === 0 && !isLoading && (searchQuery || filterPlaystyle !== 'All' || filterPlatform !== 'All') ? (
                                <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-500 border border-dashed border-border rounded-lg bg-card/20">
                                    <p>{t('player_list.no_players')}</p>
                                    <p className="text-xs mt-1">{t('player_list.try_filters')}</p>
                                </div>
                            ) : (
                                (players.length > 0 ? players : MOCK_PLAYERS).map((player) => (
                                    <PlayerHUD
                                        key={player.id}
                                        id={player.id}
                                        name={player.name}
                                        playstyle={player.playstyle || "UNKNOWN"}
                                        aggressionScore={player.aggression_score}
                                        notesCount={player.notesCount || 0}
                                        platformName={player.platform?.name}
                                        ai_playstyle={player.ai_playstyle}
                                        ai_aggression_score={player.ai_aggression_score}
                                        ai_exploit_strategy={player.ai_exploit_strategy}
                                        ai_profile={player.ai_profile}
                                        recentNotes={player.recentNotes}
                                        onAddNote={() => {
                                            setActivePlayerForNote(player);
                                            setNoteModalOpen(true);
                                        }}
                                        onDelete={() => handleDeletePlayer(player.id)}
                                    />
                                ))
                            )}
                        </div>

                        {/* Loading Spinner */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-gold animate-spin" />
                                <span className="ml-3 text-sm text-gray-400 font-medium">{t('player_list.loading')}</span>
                            </div>
                        )}

                        {/* End of List Indicator */}
                        {!hasMore && players.length > 0 && (
                            <div className="flex items-center justify-center py-6">
                                <div className="h-px w-16 bg-white/10"></div>
                                <span className="mx-4 text-xs text-gray-500 uppercase tracking-widest">{t('player_list.all_loaded')}</span>
                                <div className="h-px w-16 bg-white/10"></div>
                            </div>
                        )}

                        {/* Sentinel for IntersectionObserver */}
                        {hasMore && <div ref={sentinelRef} className="h-4" />}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title={t('player_list.add_target')}>
                <AddPlayerForm
                    onCancel={() => setAddModalOpen(false)}
                    onSuccess={() => { setAddModalOpen(false); resetAndReload(); }}
                />
            </Modal>

            <Modal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} title={t('player_list.bulk_import')}>
                <ImportJsonModal
                    onCancel={() => setImportModalOpen(false)}
                    onSuccess={() => { setImportModalOpen(false); resetAndReload(); }}
                />
            </Modal>

            <Modal isOpen={isNoteModalOpen && activePlayerForNote !== null} onClose={() => setNoteModalOpen(false)} title={`${t('player_list.add_note')}: ${activePlayerForNote?.name}`}>
                {activePlayerForNote && (
                    <AddNoteForm
                        playerId={activePlayerForNote.id}
                        onCancel={() => setNoteModalOpen(false)}
                        onSuccess={() => { setNoteModalOpen(false); resetAndReload(); }}
                    />
                )}
            </Modal>

            <Modal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} title={t('player_list.settings_tags')} size="xl">
                <TemplateManagerModal onClose={() => setSettingsOpen(false)} />
            </Modal>
        </div>
    );
}
