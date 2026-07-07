import { Target, Sparkles, Dices, Crosshair } from "lucide-react";
import { useMemo, useState } from "react";
import { SolveFormFilter } from "@/components/SolveFormFilter";
import { SolveRequest } from "@/lib/solverAPI";
import type { CategorizedBreakdown, HandCategory } from "@/lib/analysis/HandCategoryResolver";

interface StrategyGuideProps {
    playstyle: string;
    aiAggressionLevel?: string | null;
    aiGtoBaseline?: string | null;
    aiExploitStrategy?: string | null;
    aiAnalysisMode?: string | null;
    aiStatsUsed?: string | null;
    aiEnabled?: boolean;
    onSolve?: (request: SolveRequest) => void;
    isSolving?: boolean;
    solveError?: string | null;
}

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

const getHandStr = (r1: string, r2: string, rowIdx: number, colIdx: number) => {
    if (rowIdx === colIdx) return `${r1}${r2}`;
    return rowIdx < colIdx ? `${r1}${r2}s` : `${r2}${r1}o`;
};

// Dictionary mapping known styles to exploitative strategy bullet points
const STRATEGIES: Record<string, string[]> = {
    "LAG": [
        "Widen your value 3-betting range preflop to punish their wide opens.",
        "Smooth call with strong draws and monsters on the flop to induce bluffs on later streets.",
        "They will over-barrel; use your strong top-pairs as bluff catchers.",
        "Do not try to bluff this player off top pair."
    ],
    "NIT": [
        "Steal their blinds relentlessly preflop; they fold too often without a premium holding.",
        "If they 3-bet you, fold unless you look down at QQ+ or AKs.",
        "Float the flop and bet the turn if they check to you; they play 'fit-or-fold'.",
        "Never pay off their river raises."
    ],
    "TAG": [
        "Avoid tangling out of position without a solid range advantage.",
        "Attack their c-bets on coordinated boards; they often have air when they check the turn.",
        "Pay attention to sizing tells—they often bet larger with polarized value.",
        "Do not run multi-street elaborate bluffs; TAGs have rigid calling ranges."
    ],
    "MANIAC": [
        "Tighten up preflop and play exclusively for value.",
        "Never slowplay your strong hands preflop.",
        "Let them do the betting for you post-flop.",
        "Prepare for high variance; buy-in full and do not tilt when they hit their 2-outers."
    ],
    "CALLING STATION": [
        "Never bluff under any circumstances. Value bet thinly across all three streets.",
        "Size your value bets larger on wet boards—they don't understand pot odds.",
        "If you miss your draw, give up immediately.",
        "Do not overthink hand reading; they are playing their cards face up."
    ],
    "FISH": [
        "Isolate them preflop to play pots heads-up in position.",
        "Extract maximum value. Size up dramatically when you hit Gin.",
        "Watch for passive limping—punish it with large isolation raises.",
    ],
};

export const StrategyGuide = ({
    playstyle,
    aiAggressionLevel,
    aiGtoBaseline,
    aiExploitStrategy,
    aiAnalysisMode,
    aiStatsUsed,
    aiRangeMatrix,
    aiActionBreakdown,
    aiEnabled = false,
    onSolve,
    isSolving = false,
    solveError
}: StrategyGuideProps & { aiRangeMatrix?: any, aiActionBreakdown?: any }) => {
    const normalizedStyle = playstyle ? playstyle.toUpperCase() : "UNKNOWN";
    const isAIPowered = !!aiExploitStrategy;

    // RNG State for mixed frequencies
    const [rngValue, setRngValue] = useState<number | null>(null);

    const generateRNG = () => {
        setRngValue(Math.floor(Math.random() * 100) + 1);
    };

    // Parse stats used from JSON
    let statsUsedList: string[] = [];
    if (aiStatsUsed) {
        try {
            statsUsedList = JSON.parse(aiStatsUsed);
        } catch { /* ignore */ }
    }

    // Fallback to hardcoded strategies if no AI output
    const hardcodedGuidelines = STRATEGIES[normalizedStyle] || [
        "Not enough intelligence gathered to formulate a specific exploitative strategy.",
        "Play default GTO ranges and observe their VPIP/PFR deviation.",
        "Log more hands specifically regarding their 3-Bet behavior."
    ];

    return (
        <div className="bg-card/40 backdrop-blur-xl border border-gold/20 rounded-2xl p-4 sm:p-6 shadow-[0_8px_30px_rgba(255,196,0,0.1)] relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center">
                        <Target className="w-5 h-5 text-gold mr-3" />
                        <h2 className="text-lg font-bold text-white tracking-wide uppercase">
                            {aiEnabled ? (
                                "GTO-LITE"
                            ) : (
                                <>Analysis: <span className="text-felt-light">{normalizedStyle}</span></>
                            )}
                        </h2>
                    </div>
                    {aiAggressionLevel && (
                        <p className="text-xs text-gray-400 mt-1 ml-8 uppercase tracking-wider">
                            Aggression: <span className="text-white font-medium">{aiAggressionLevel}</span>
                        </p>
                    )}
                </div>
                {isAIPowered && (
                    <div className="flex flex-col items-end gap-2">
                        <span className="flex items-center gap-1 text-[9px] text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full border border-purple-500/20 font-semibold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" /> AI-Generated
                        </span>
                        {aiAnalysisMode && (
                            <span className="text-[9px] text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700 font-mono uppercase">
                                {aiAnalysisMode} Mode
                            </span>
                        )}
                    </div>
                )}
            </div>

            {aiEnabled ? (
                /* GTO Output Mockup Design */
                <div className="space-y-6">
                    {/* Solver Form */}
                    {onSolve && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Crosshair className="w-4 h-4 text-blue-400" />
                                <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                    GTO Solver Configuration
                                </h3>
                            </div>
                            <SolveFormFilter onSolve={onSolve} isLoading={isSolving} />
                            {solveError && (
                                <div className="mt-3 p-3 bg-red-900/30 border border-red-800 text-red-300 text-xs rounded-md">
                                    {solveError}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-center">
                        {/* 1. Strategy Range Grid (Left Column) */}
                        <div>
                            <h3 className="text-sm font-semibold text-felt-light mb-3 uppercase tracking-wider border-b border-white/10 pb-1">
                                Strategy Range Grid
                            </h3>
                            <div className="w-full max-w-[320px] sm:max-w-[400px] grid grid-cols-13 gap-[1px] bg-white/5 p-0.5 sm:p-1 rounded-xl border border-white/10 overflow-hidden mx-auto" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
                                {RANKS.map((r1, i) =>
                                    RANKS.map((r2, j) => {
                                        const hand = getHandStr(r1, r2, i, j);

                                        // Dynamic Color Logic based on `aiRangeMatrix`
                                        let bgColor = "bg-gray-800/80"; // Default Fold
                                        let actionText = "Fold 100%";
                                        let inlineStyle: React.CSSProperties | undefined = undefined;

                                        if (aiRangeMatrix && aiRangeMatrix[hand] && typeof aiRangeMatrix[hand] === 'object') {
                                            const handData = aiRangeMatrix[hand] as Record<string, number>;
                                            const raiseProb = Number(handData.raise ?? 0);
                                            const callProb = Number(handData.call ?? 0);
                                            const foldProb = Number(handData.fold ?? 1);

                                            const clampPct = (value: number): number => {
                                                if (!Number.isFinite(value)) return 0;
                                                if (value <= 0) return 0;
                                                if (value >= 1) return 100;
                                                return Math.round(value * 100);
                                            };

                                            const Raise = clampPct(raiseProb);
                                            const Call = clampPct(callProb);
                                            const Fold = clampPct(foldProb);

                                            if (Raise >= 70) {
                                                bgColor = "bg-gold text-black border-[0.5px] border-gold-dim";
                                                actionText = `Raise ${Raise}%`;
                                            } else if (Call >= 70) {
                                                bgColor = "bg-felt-light text-white border-[0.5px] border-felt-default";
                                                actionText = `Call ${Call}%`;
                                            } else if (Fold >= 70) {
                                                bgColor = "bg-[#111] text-gray-500 border-[0.5px] border-white/5";
                                                actionText = `Fold ${Fold}%`;
                                            } else {
                                                // Mixed strategy: 3-color gradient (raise → call → fold)
                                                bgColor = "text-white border-[0.5px] border-white/20";
                                                actionText = `R${Raise}% C${Call}% F${Fold}%`;
                                                const raiseEnd = Raise;
                                                const callEnd = Raise + Call;
                                                inlineStyle = {
                                                    background: `linear-gradient(135deg, #ffc400 0% ${raiseEnd}%, #00994d ${raiseEnd}% ${callEnd}%, #111111 ${callEnd}% 100%)`
                                                };
                                            }
                                        }

                                        return (
                                            <div
                                                key={hand}
                                                title={`${hand}: ${actionText}`}
                                                className={`aspect-square flex items-center justify-center text-[9px] sm:text-[10px] md:text-xs font-bold font-mono text-white ${bgColor ? bgColor : "opacity-90"} hover:opacity-80 hover:scale-110 cursor-crosshair transition-all`}
                                                style={inlineStyle}
                                            >
                                                {hand}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="flex justify-center items-center gap-4 mt-3">
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-gold"></span><span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Raise</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-felt-light"></span><span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Call</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#111] border border-white/20"></span><span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Fold</span></div>
                            </div>
                        </div>

                        {/* Metrics (Right Column) */}
                        <div className="flex flex-col gap-4">
                            {/* 2. Categorized Action Breakdown Panel */}
                            <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                        Action Breakdown
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-purple-400 font-mono uppercase tracking-wider">RNG</span>
                                        <button
                                            onClick={generateRNG}
                                            className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded transition-colors"
                                        >
                                            <Dices className="w-3 h-3 text-purple-300" />
                                            <span className="text-[10px] text-purple-200 font-bold min-w-[16px] text-center">
                                                {rngValue !== null ? rngValue : '--'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {/* Category List */}
                                    <div className="flex-1 space-y-1.5">
                                        {(['NUTS', 'STRONG', 'TOP_PAIR', 'DRAW', 'AIR'] as HandCategory[]).map((cat) => {
                                            const entry = (aiActionBreakdown as CategorizedBreakdown)?.[cat];
                                            const r = entry?.raise ?? 0;
                                            const c = entry?.call ?? 0;
                                            const f = entry?.fold ?? 0;
                                            const w = entry?.weight ?? 0;
                                            const cnt = entry?.count ?? 0;
                                            // Determine dominant action
                                            const dominant = r >= c && r >= f ? 'raise' : c >= f ? 'call' : 'fold';
                                            const dominantPct = dominant === 'raise' ? r : dominant === 'call' ? c : f;
                                            const dominantColor = dominant === 'raise' ? 'text-gold' : dominant === 'call' ? 'text-felt-light' : 'text-gray-400';
                                            const catLabel = cat === 'TOP_PAIR' ? 'TOP PR' : cat;
                                            return (
                                                <div key={cat} className="group">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5 min-w-[60px]">
                                                            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wider w-[44px]">{catLabel}</span>
                                                            <span className="text-[8px] text-gray-600 font-mono">{cnt}h</span>
                                                        </div>
                                                        {/* Stacked bar */}
                                                        <div className="flex-1 flex h-[10px] rounded-sm overflow-hidden bg-white/5">
                                                            {r > 0 && <div className="bg-gold transition-all" style={{ width: `${r}%` }} />}
                                                            {c > 0 && <div className="bg-felt-light transition-all" style={{ width: `${c}%` }} />}
                                                            {f > 0 && <div className="bg-[#111] transition-all" style={{ width: `${f}%` }} />}
                                                        </div>
                                                        <span className={`text-[10px] font-bold font-mono min-w-[38px] text-right ${dominantColor}`}>
                                                            {cnt > 0 ? `${dominant === 'raise' ? 'R' : dominant === 'call' ? 'C' : 'F'} ${dominantPct}%` : '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Range Composition Pie Chart */}
                                    {(() => {
                                        const bd = aiActionBreakdown as CategorizedBreakdown;
                                        const nuts = bd?.NUTS?.weight ?? 0;
                                        const strong = bd?.STRONG?.weight ?? 0;
                                        const top = bd?.TOP_PAIR?.weight ?? 0;
                                        const draw = bd?.DRAW?.weight ?? 0;
                                        // AIR fills the rest
                                        const s1 = nuts;
                                        const s2 = s1 + strong;
                                        const s3 = s2 + top;
                                        const s4 = s3 + draw;
                                        return (
                                            <div className="flex flex-col items-center gap-1 shrink-0">
                                                <div
                                                    className="w-16 h-16 rounded-full border-2 border-white/10 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                                    title={`NUTS: ${nuts}% | STRONG: ${strong}% | TOP_PAIR: ${top}% | DRAW: ${draw}% | AIR: ${100 - s4}%`}
                                                    style={{
                                                        background: `conic-gradient(
                                                            #ffc400 0% ${s1}%,
                                                            #fde047 ${s1}% ${s2}%,
                                                            #00994d ${s2}% ${s3}%,
                                                            #38bdf8 ${s3}% ${s4}%,
                                                            #374151 ${s4}% 100%
                                                        )`,
                                                    }}
                                                />
                                                <span className="text-[8px] text-gray-500 uppercase tracking-widest font-mono">Range</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                {/* Pie chart legend */}
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-gold"></span><span className="text-[8px] text-gray-500 font-mono">NUTS</span></div>
                                    <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-yellow-300"></span><span className="text-[8px] text-gray-500 font-mono">STRONG</span></div>
                                    <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-felt-light"></span><span className="text-[8px] text-gray-500 font-mono">TOP PR</span></div>
                                    <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-sky-400"></span><span className="text-[8px] text-gray-500 font-mono">DRAW</span></div>
                                    <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-gray-600"></span><span className="text-[8px] text-gray-500 font-mono">AIR</span></div>
                                </div>
                            </div>

                            {/* 3. Opponent Profile Panel */}
                            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                <h3 className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wider">
                                    Opponent Profile
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Aggression Level</span>
                                        <span className="text-xs text-red-400 font-bold uppercase">Aggressive</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Playstyle</span>
                                        <span className="flex items-center gap-1.5 text-xs text-white font-semibold bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30">
                                            🔥 LAG
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Natural Language Explanation (Strategic Insight) */}
                    <div className="bg-gradient-to-b from-purple-900/10 to-transparent p-4 rounded-xl border border-purple-500/20 pl-4 border-l-2 border-l-purple-500">
                        <h3 className="text-xs font-semibold text-purple-300 mb-2 uppercase tracking-wider">
                            Strategic Insight
                        </h3>
                        <div className="space-y-3">
                            {(() => {
                                if (!aiExploitStrategy) return <p className="text-sm text-gray-500 italic">No strategic insight available for this profile.</p>;
                                
                                const stratArray = Array.isArray(aiExploitStrategy) 
                                    ? aiExploitStrategy 
                                    : (typeof aiExploitStrategy === 'object' && aiExploitStrategy !== null ? [aiExploitStrategy] : null);
                                
                                if (stratArray) {
                                    return stratArray.map((move: any, i: number) => (
                                        <div key={i} className="bg-black/30 border border-white/5 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] text-gold font-black uppercase tracking-widest bg-gold/10 px-2 py-0.5 rounded">{move.node || 'GENERAL'}</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                                                <div>
                                                    <p className="text-[8px] text-gray-500 uppercase font-black">Action</p>
                                                    <p className="text-white text-xs font-bold leading-tight mt-1">{move.action || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-gray-500 uppercase font-black">Range</p>
                                                    <p className="text-white text-[10px] sm:text-xs font-bold leading-tight mt-1">{move.range || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-gray-500 uppercase font-black">Structure</p>
                                                    <p className="text-white text-xs font-bold leading-tight mt-1">{move.structure || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] text-gray-500 uppercase font-black">Sizing / Freq</p>
                                                    <p className="text-white text-xs font-bold leading-tight mt-1">{move.sizing || '-'} ({move.frequency || '-'})</p>
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                }

                                return (
                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {String(aiExploitStrategy)}
                                    </p>
                                );
                            })()}
                        </div>
                    </div>

                    {/* 5. Mode Indicator (using component state) */}
                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                            Stats Processing
                        </span>
                        {/* If real stats exist, show them; else mock */}
                        <div className="flex flex-wrap gap-1.5">
                            {(aiStatsUsed ? statsUsedList : ['VPIP', 'PFR', '3BET']).map((stat) => (
                                <span
                                    key={stat}
                                    className="text-[9px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-mono"
                                >
                                    {stat}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* Hardcoded Strategies Fallback */
                <ul className="space-y-4 text-sm text-gray-300">
                    {hardcodedGuidelines.map((heuristic, index) => (
                        <li key={index} className="flex items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 mr-3 shrink-0 box-shadow-glow"></span>
                            <p className="leading-relaxed">{heuristic}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
