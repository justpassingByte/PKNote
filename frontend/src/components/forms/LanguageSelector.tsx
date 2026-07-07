"use client";

import { useLanguage } from "@/i18n/LanguageContext";

export function LanguageSelector({ className = "" }: { className?: string }) {
    const { language, setLanguage, isLoaded } = useLanguage();

    if (!isLoaded) return null;

    return (
        <div className={`flex items-center p-1 bg-white/5 border border-white/10 rounded-full ${className}`}>
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest transition-all duration-300 ${
                    language === 'en' 
                    ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(255,196,0,0.3)]' 
                    : 'text-white/40 hover:text-white/70'
                }`}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('vi')}
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest transition-all duration-300 ${
                    language === 'vi' 
                    ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(255,196,0,0.3)]' 
                    : 'text-white/40 hover:text-white/70'
                }`}
            >
                VI
            </button>
        </div>
    );
}
