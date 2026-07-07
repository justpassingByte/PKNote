'use client';

import React, { useState } from 'react';
import {
    SolveRequest,
    ShapingMode,
    SpotTemplateBucket,
    StackDepthBucket,
    BoardTextureBucket,
    VillainTypeBucket,
    Street,
} from '@/lib/solverAPI';

interface SolveFormFilterProps {
    onSolve: (request: SolveRequest) => void;
    isLoading: boolean;
}

export const SolveFormFilter: React.FC<SolveFormFilterProps> = ({ onSolve, isLoading }) => {
    const [shapingMode, setShapingMode] = useState<ShapingMode>('balanced');
    const villainType: VillainTypeBucket = 'NEUTRAL';
    const [street, setStreet] = useState<Street>('preflop');
    const [suitedness, setSuitedness] = useState<BoardTextureBucket['suitedness']>('RAINBOW');
    const [pairedStatus, setPairedStatus] = useState<BoardTextureBucket['pairedStatus']>('UNPAIRED');
    const [highCardTier, setHighCardTier] = useState<BoardTextureBucket['highCardTier']>('ACE_HIGH');
    const [connectivity, setConnectivity] = useState<BoardTextureBucket['connectivity']>('DRY');
    const [spot, setSpot] = useState<SpotTemplateBucket>('SRP_IP');

    const [stackDepth, setStackDepth] = useState<number>(100);

    const isPostflop = street !== 'preflop';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('SolveFormFilter: submitting solve request');

        const payload: SolveRequest = {
            spot,
            stack: String(stackDepth) as StackDepthBucket,
            street,
            shapingMode,
            villainType,
        };

        // Only include board context for postflop streets
        if (isPostflop) {
            payload.board = {
                suitedness,
                pairedStatus,
                highCardTier,
                connectivity,
            };
        }

        onSolve(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4 bg-zinc-900 p-3 sm:p-4 border border-zinc-800 rounded-lg shadow-sm">
            {/* Primary Filters Row */}
            <div className="flex flex-wrap gap-4 items-end w-full">
                <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 min-w-0 sm:min-w-[200px]">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Street</label>
                    <select
                        value={street}
                        onChange={(e) => setStreet(e.target.value as Street)}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="preflop">Preflop</option>
                        <option value="flop">Flop</option>
                        <option value="turn">Turn</option>
                        <option value="river">River</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 min-w-0 sm:min-w-[200px]">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Shaping Mode</label>
                    <select
                        value={shapingMode}
                        onChange={(e) => setShapingMode(e.target.value as ShapingMode)}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="balanced">Balanced</option>
                        <option value="polar">Polar</option>
                        <option value="merged">Merged</option>
                    </select>
                </div>

                {/* Villain Profile commented out as requested
                <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Villain Profile</label>
                    <select
                        value={villainType}
                        onChange={(e) => setVillainType(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="NEUTRAL">Neutral</option>
                        <option value="OVERFOLD">Overfold</option>
                        <option value="OVERCALL">Overcall</option>
                        <option value="OVERAGGRO">Over-Aggro</option>
                        <option value="PASSIVE">Passive</option>
                    </select>
                </div>
                */}

                <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 min-w-0 sm:min-w-[200px]">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Spot</label>
                    <select
                        value={spot}
                        onChange={(e) => setSpot(e.target.value as SpotTemplateBucket)}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="SRP_IP">SRP In Position</option>
                        <option value="SRP_OOP">SRP Out of Position</option>
                        <option value="3BET_IP">3-Bet IP</option>
                        <option value="3BET_OOP">3-Bet OOP</option>
                        <option value="4BET_IP">4-Bet IP</option>
                        <option value="4BET_OOP">4-Bet OOP</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 min-w-0 sm:min-w-[150px]">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex justify-between">
                        <span>Effective Stack</span>
                        <span className="text-blue-400 font-mono">{stackDepth} BB</span>
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="1000"
                        value={stackDepth}
                        onChange={(e) => setStackDepth(parseInt(e.target.value) || 100)}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                    />
                </div>
            </div>

            {/* Secondary Filters and Action Row */}
            <div className="flex flex-wrap gap-4 items-end w-full">
                {isPostflop && (
                    <>
                        <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 min-w-0 sm:min-w-[160px]">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Suitedness</label>
                            <select
                                value={suitedness}
                                onChange={(e) => setSuitedness(e.target.value as BoardTextureBucket['suitedness'])}
                                className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="RAINBOW">Rainbow</option>
                                <option value="TWO_TONE">Two-Tone</option>
                                <option value="MONOTONE">Monotone</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 min-w-0 sm:min-w-[160px]">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Paired Status</label>
                            <select
                                value={pairedStatus}
                                onChange={(e) => setPairedStatus(e.target.value as BoardTextureBucket['pairedStatus'])}
                                className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="UNPAIRED">Unpaired</option>
                                <option value="PAIRED">Paired</option>
                                <option value="TRIPS">Trips</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 min-w-0 sm:min-w-[160px]">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">High Card Tier</label>
                            <select
                                value={highCardTier}
                                onChange={(e) => setHighCardTier(e.target.value as BoardTextureBucket['highCardTier'])}
                                className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="LOW_BOARD">Low</option>
                                <option value="JACK_HIGH">Mid (Jack High)</option>
                                <option value="KING_HIGH">King High</option>
                                <option value="ACE_HIGH">Ace High</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 min-w-0 sm:min-w-[160px]">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Connectivity</label>
                            <select
                                value={connectivity}
                                onChange={(e) => setConnectivity(e.target.value as BoardTextureBucket['connectivity'])}
                                className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="DRY">Dry</option>
                                <option value="CONNECTED">Connected</option>
                                <option value="VERY_CONNECTED">Very Connected</option>
                            </select>
                        </div>
                    </>
                )}

                <div className="flex-1 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-500 font-medium text-white rounded-md shadow disabled:opacity-50 transition-colors w-full sm:w-auto self-end mb-0.5"
                    >
                        {isLoading ? 'Solving...' : 'Run Solve'}
                    </button>
                </div>
            </div>
        </form>
    );
};
