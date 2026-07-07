import React from 'react';

// Keyword Highlighting Helper
export function HighlightKeywords({ text }: { text: string }) {
    if (!text) return null;
    
    const keywords: Record<string, string> = {
        fold: 'text-gray-500 font-bold',
        bet: 'text-red-400 font-bold',
        raise: 'text-red-400 font-black',
        '3-bet': 'text-red-500 font-black',
        '3bet': 'text-red-500 font-black',
        '4-bet': 'text-red-500 font-black',
        '4bet': 'text-red-500 font-black',
        '5-bet': 'text-red-500 font-black',
        shove: 'text-red-500 font-black underline',
        'all-in': 'text-red-500 font-black underline',
        call: 'text-gray-300 font-bold',
        check: 'text-gray-500 font-bold',
        exploit: 'text-gold font-black uppercase tracking-tighter',
        punish: 'text-gold font-black uppercase tracking-tighter',
        leak: 'text-rose-400 font-black uppercase tracking-tighter',
        isolate: 'text-amber-500/90 font-black bg-amber-500/5 px-1 rounded',
        'value bet': 'text-white font-black',
        monster: 'text-white font-black',
        bluff: 'text-rose-400 font-bold',
        bluffs: 'text-rose-400 font-bold',
        bluffing: 'text-rose-400 font-bold',
        'c-bet': 'text-red-400 font-bold',
        'cbet': 'text-red-400 font-bold',
        overbet: 'text-red-500 font-black uppercase',
        barrels: 'text-rose-400 font-bold',
        barrel: 'text-rose-400 font-bold',
        called: 'text-gray-300 font-bold',
        calling: 'text-gray-300 font-bold',
        'check-raise': 'text-red-400 font-black underline',
    };

    // Case-insensitive regex for all keywords
    const regex = new RegExp(`(\\b(?:${Object.keys(keywords).join('|')})\\b)`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) => {
                const lowerPart = part.toLowerCase();
                if (keywords[lowerPart]) {
                    return <span key={i} className={keywords[lowerPart]}>{part}</span>;
                }
                return part;
            })}
        </>
    );
}
