'use client';

import React from 'react';
import { HandCell } from './HandCell';
import { getHandMatrix } from '@/types/poker';
import { SolveResponse } from '@/lib/solverAPI';

interface HandMatrixProps {
    data: SolveResponse | null;
    isLoading: boolean;
}

export const HandMatrix: React.FC<HandMatrixProps> = ({ data, isLoading }) => {
    const matrix = getHandMatrix();

    return (
        <div className="relative w-full max-w-sm sm:max-w-xl md:max-w-3xl mx-auto aspect-square bg-zinc-900 border border-zinc-800 rounded-lg p-1 sm:p-2 shadow-xl">
            {isLoading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-zinc-600 border-t-white rounded-full animate-spin"></div>
                        <p className="text-white font-medium shadow-md">Calculating Equilibrium...</p>
                    </div>
                </div>
            )}

            <div className="w-full h-full grid grid-cols-13 grid-rows-13 gap-[1px] bg-zinc-800 border border-zinc-700">
                {matrix.map((row, i) => (
                    <React.Fragment key={`row-${i}`}>
                        {row.map((hand) => {
                            const strategy = data?.[hand];

                            return (
                                <HandCell
                                    key={hand}
                                    hand={hand}
                                    strategy={strategy}
                                />
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
