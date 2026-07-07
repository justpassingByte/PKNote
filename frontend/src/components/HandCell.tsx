'use client';

import React, { memo } from 'react';
import { HandClass } from '@/types/poker';
import { HandStrategy } from '@/lib/solverAPI';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface HandCellProps {
    hand: HandClass;
    strategy?: HandStrategy;
}

const HandCellComponent: React.FC<HandCellProps> = ({
    hand,
    strategy,
}) => {
    const clampPct = (value: number): number => {
        if (!Number.isFinite(value)) return 0;
        if (value <= 0) return 0;
        if (value >= 1) return 100;
        return value * 100;
    };

    const raisePct = clampPct(strategy?.raise ?? 0);
    const callPct = clampPct(strategy?.call ?? 0);
    const foldPct = clampPct(strategy?.fold ?? 1);

    // Green = raise, Blue = call, Red = fold

    let backgroundStyle = '';
    if (raisePct >= 99.9) backgroundStyle = 'rgb(34, 197, 94)';
    else if (callPct >= 99.9) backgroundStyle = 'rgb(59, 130, 246)';
    else if (foldPct >= 99.9) backgroundStyle = 'rgb(153, 27, 27)';
    else {
        const rStop = raisePct;
        const cStop = raisePct + callPct;
        backgroundStyle = `linear-gradient(135deg, rgb(34, 197, 94) 0% ${rStop}%, rgb(59, 130, 246) ${rStop}% ${cStop}%, rgb(153, 27, 27) ${cStop}% 100%)`;
    }

    // To make text readable over dark colors
    const textColor = 'text-white drop-shadow-md';

    return (
        <div
            className={cn(
                "flex items-center justify-center p-0.5 sm:p-1 border border-zinc-700/50 aspect-square",
                "text-[8px] sm:text-[10px] md:text-xs font-semibold text-center select-none shadow-sm transition-transform hover:scale-105 active:scale-95 z-10 hover:z-20 relative cursor-pointer",
                textColor
            )}
            style={{ background: backgroundStyle }}
            title={`${hand}\nRaise: ${raisePct.toFixed(1)}%\nCall: ${callPct.toFixed(1)}%\nFold: ${foldPct.toFixed(1)}%`}
        >
            {hand}
        </div>
    );
};

export const HandCell = memo(HandCellComponent);
