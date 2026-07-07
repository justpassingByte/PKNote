"use client";

import { Upload, Plus, Download } from "lucide-react";
import { exportPlayersAction } from "@/app/actions";
import { useLanguage } from "@/i18n/LanguageContext";

interface MetricsBarProps {
    totalCount: number;
    totalNotesCount: number;
    playstyleCounts: Record<string, number>;
    onImportClick: () => void;
    onAddPlayerClick: () => void;
}

export function MetricsBar({
    totalCount,
    totalNotesCount,
    playstyleCounts,
    onImportClick,
    onAddPlayerClick,
}: MetricsBarProps) {
    const { t } = useLanguage();
    const playstyleEntries = Object.entries(playstyleCounts);

    return (
        <div className="mb-6 sm:mb-10 p-4 sm:p-6 bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Metrics Section */}
                <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:gap-8">
                    {/* Stat Counters — side by side on mobile */}
                    <div className="flex items-center gap-6 sm:gap-8">
                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{totalCount}</span>
                            <span className="text-sm text-gray-500 uppercase font-black tracking-widest mt-1.5">{t('dashboard.metrics.opponents') || "Opponents"}</span>
                        </div>

                        <div className="w-px h-10 bg-white/10"></div>

                        <div className="flex flex-col items-center">
                            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{totalNotesCount}</span>
                            <span className="text-sm text-gray-400 uppercase font-black tracking-widest mt-1.5">{t('dashboard.metrics.notes') || "Notes"}</span>
                        </div>
                    </div>

                    <div className="hidden md:block w-px h-10 bg-white/10"></div>

                    {/* Playstyle Breakdown — wraps naturally */}
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 uppercase font-black tracking-widest mb-2 px-1">{t('dashboard.metrics.playstyle_breakdown') || "Playstyle Breakdown"}</span>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {playstyleEntries.length > 0 ? (
                                playstyleEntries.map(([style, count]) => (
                                    <span key={style} className="text-sm border border-gray-800 px-4 py-2 rounded-lg text-gray-400 font-bold uppercase tracking-tight bg-white/5">
                                        {style} <strong className="text-white ml-2 font-mono text-base">{count}</strong>
                                    </span>
                                ))
                            ) : (
                                <span className="text-[11px] text-gray-600 italic">{t('dashboard.metrics.no_data_yet') || "No data yet"}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex w-full md:w-auto gap-2 sm:gap-3 shrink-0">
                    <button
                        onClick={async () => {
                            try {
                                const data = await exportPlayersAction();
                                if (data) {
                                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `villainvault-export-${new Date().toISOString().slice(0, 10)}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }
                            } catch (e) { 
                                console.error("Export failed", e);
                                alert(t('dashboard.metrics.export_failed') || "Export failed. Please check your session.");
                            }
                        }}
                        className="flex items-center justify-center flex-1 md:flex-none px-3 sm:px-4 py-2 min-h-[44px] bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all font-medium"
                    >
                        <Download className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t('dashboard.metrics.export') || "Export"}</span>
                    </button>
                    <button
                        onClick={onImportClick}
                        className="flex items-center justify-center flex-1 md:flex-none px-3 sm:px-4 py-2 min-h-[44px] bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all font-medium"
                    >
                        <Upload className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t('dashboard.metrics.import') || "Import"}</span>
                    </button>
                    <button
                        onClick={onAddPlayerClick}
                        className="flex items-center justify-center flex-1 md:flex-none px-6 py-2 min-h-[44px] bg-gold text-black font-black uppercase tracking-widest rounded-full text-sm hover:bg-yellow-400 transition-colors shadow-lg active:scale-95"
                    >
                        <Plus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t('dashboard.metrics.add_player') || "Add Player"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
