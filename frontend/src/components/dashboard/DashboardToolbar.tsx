"use client";

import { Users, Download, Upload } from "lucide-react";
import { OCRSearchInput } from "@/components/layout/OCRSearchInput";
import { exportPlayersAction } from "@/app/actions";
import { useLanguage } from '@/i18n/LanguageContext';

interface DashboardToolbarProps {
    totalCount: number;
    playstyleCounts: Record<string, number>;
    searchQuery: string;
    filterPlaystyle: string;
    filterPlatform: string;
    distinctPlatforms: string[];
    onSearchChange: (query: string) => void;
    onFilterChange: (style: string) => void;
    onPlatformFilterChange: (platform: string) => void;
    onImportClick: () => void;
}

export function DashboardToolbar({
    totalCount,
    playstyleCounts,
    searchQuery,
    filterPlaystyle,
    filterPlatform,
    distinctPlatforms,
    onSearchChange,
    onFilterChange,
    onPlatformFilterChange,
    onImportClick,
}: DashboardToolbarProps) {
    const { t } = useLanguage();
    const distinctPlaystyles = Object.keys(playstyleCounts);

    return (
        <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-[#111318] border border-gray-800 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent"></div>

            {/* Title row */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center tracking-tight uppercase">
                    <Users className="w-6 h-6 mr-3 text-gold" />
                    {t('dashboard.opponent_huds')}
                </h2>
            </div>

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full mt-3 sm:mt-4">
                <div className="w-full sm:flex-1 sm:max-w-md">
                    <OCRSearchInput onSearch={onSearchChange} />
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-1 sm:flex-none">
                        <span className="hidden sm:inline text-xs text-gray-500 uppercase tracking-widest font-black shrink-0">{t('dashboard.platform')}</span>
                        <select
                            value={filterPlatform}
                            onChange={(e) => onPlatformFilterChange(e.target.value)}
                            className="w-full sm:w-auto bg-black/40 border border-gray-800 rounded-lg px-5 py-2.5 min-h-[44px] sm:min-h-0 text-sm font-bold uppercase tracking-widest text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none cursor-pointer transition-all hover:bg-black/60 appearance-none"
                        >
                            <option value="All">{t('dashboard.all_platforms')}</option>
                            {distinctPlatforms.map(platform => (
                                <option key={platform} value={platform}>{platform}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-1 sm:flex-none">
                        <span className="hidden sm:inline text-xs text-gray-500 uppercase tracking-widest font-black shrink-0">{t('dashboard.style')}</span>
                        <select
                            value={filterPlaystyle}
                            onChange={(e) => onFilterChange(e.target.value)}
                            className="w-full sm:w-auto bg-black/40 border border-gray-800 rounded-lg px-5 py-2.5 min-h-[44px] sm:min-h-0 text-sm font-bold uppercase tracking-widest text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none cursor-pointer transition-all hover:bg-black/60 appearance-none"
                        >
                            <option value="All">{t('dashboard.all')} ({totalCount})</option>
                            {distinctPlaystyles.map(style => (
                                <option key={style} value={style}>
                                    {style} ({playstyleCounts[style] ?? 0})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
