"use client";

import { useState } from "react";
import {
    Sparkles, Send, ChevronDown, ChevronUp,
    Target, BarChart3, Layers, AlertCircle, Loader2, DatabaseZap,
    ThumbsUp, ThumbsDown
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

// ─── CONFIG ─────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const USE_MOCK = false; // Toggled to false per requirement

// ─── MOCK DATA ──────────────────────────────────────────────────
const MOCK_RESPONSE = {
    parsed: {
        position: "BTN_vs_BB",
        board_bucket: "A_dry",
        street: "flop",
        action_line: null,
        turn_type: null,
        river_type: null,
        hero_hand: "AcKd",
        hero_position: "oop",
        board_cards: "As,7d,2c",
        situation_summary: "BB facing BTN cbet 33% on A-dry flop with top pair"
    },
    spot: {
        id: "mock-spot-1",
        position: "BTN_vs_BB",
        board_bucket: "A_dry",
        street: "flop",
        action_line: null,
        turn_type: null,
        river_type: null,
        board: "As,7d,2c",
        pot: 5.5,
        eff_stack: 100,
    },
    strategy: {
        oop: { check: 0.62, bet_small: 0.21, bet_big: 0.17 },
        ip: { check: 0.45, bet_small: 0.32, bet_big: 0.23 },
    },
    hero: {
        hand: "AcKd",
        hand_class: "top_pair",
        check: 0.35,
        bet_small: 0.40,
        bet_big: 0.25,
    },
    by_hand_class: {
        oop: {
            set: { count: 8, avg_check: 0.15, avg_bet_small: 0.25, avg_bet_big: 0.60 },
            two_pair: { count: 14, avg_check: 0.20, avg_bet_small: 0.35, avg_bet_big: 0.45 },
            overpair: { count: 12, avg_check: 0.30, avg_bet_small: 0.40, avg_bet_big: 0.30 },
            top_pair: { count: 48, avg_check: 0.35, avg_bet_small: 0.40, avg_bet_big: 0.25 },
            second_pair: { count: 32, avg_check: 0.70, avg_bet_small: 0.20, avg_bet_big: 0.10 },
            low_pair: { count: 20, avg_check: 0.85, avg_bet_small: 0.10, avg_bet_big: 0.05 },
            underpair: { count: 30, avg_check: 0.75, avg_bet_small: 0.15, avg_bet_big: 0.10 },
            flush_draw: { count: 24, avg_check: 0.45, avg_bet_small: 0.30, avg_bet_big: 0.25 },
            straight_draw: { count: 18, avg_check: 0.55, avg_bet_small: 0.25, avg_bet_big: 0.20 },
            overcards: { count: 40, avg_check: 0.80, avg_bet_small: 0.12, avg_bet_big: 0.08 },
            ace_high: { count: 22, avg_check: 0.90, avg_bet_small: 0.07, avg_bet_big: 0.03 },
            air: { count: 60, avg_check: 0.70, avg_bet_small: 0.15, avg_bet_big: 0.15 },
        },
        ip: {},
    },
    hands: { oop: {}, ip: {} },
    future_runouts: [
        { action_line: "cbet33_call", runout_type: "blank", board: "As 7d 2c 3h", check: 0.65, bet_small: 0.25, bet_big: 0.10 },
        { action_line: "cbet33_call", runout_type: "overcard", board: "As 7d 2c Kh", check: 0.85, bet_small: 0.10, bet_big: 0.05 },
        { action_line: "cbet33_call", runout_type: "board_pair", board: "As 7d 2c 7h", check: 0.40, bet_small: 0.45, bet_big: 0.15 },
        { action_line: "cbet33_call", runout_type: "flush_card", board: "As 7d 2c 8c", check: 0.95, bet_small: 0.05, bet_big: 0.00 },
        { action_line: "cbet33_call", runout_type: "straight_card", board: "As 7d 2c 5h", check: 0.50, bet_small: 0.35, bet_big: 0.15 },
    ]
};

// Examples translated inline using the translation hook in rendering

const CLASS_ORDER = [
    "straight_flush", "quads", "full_house", "flush", "straight",
    "set", "trips", "two_pair", "overpair",
    "top_pair", "second_pair", "low_pair", "underpair",
    "flush_draw", "straight_draw",
    "overcards", "ace_high", "air"
];

const CLASS_COLORS: Record<string, string> = {
    straight_flush: "text-yellow-300", quads: "text-yellow-400",
    full_house: "text-amber-400", flush: "text-blue-400",
    straight: "text-purple-400", set: "text-emerald-400",
    trips: "text-emerald-300", two_pair: "text-teal-400",
    overpair: "text-green-400", top_pair: "text-green-300",
    second_pair: "text-lime-400", low_pair: "text-lime-300",
    underpair: "text-orange-300",
    flush_draw: "text-sky-400", straight_draw: "text-indigo-400",
    overcards: "text-slate-300", ace_high: "text-slate-400",
    air: "text-slate-500"
};

// ─── TYPES ──────────────────────────────────────────────────────
interface ParsedQuery {
    position: string;
    board_bucket: string;
    street: string;
    action_line: string | null;
    turn_type: string | null;
    river_type: string | null;
    hero_hand: string | null;
    hero_position: string;
    board_cards: string;
    situation_summary: string;
}

interface GtoStrategy {
    // Root spot: OOP first action
    check?: number;
    bet_small?: number;
    bet_big?: number;
    // Facing-cbet spot: OOP reaction
    fold?: number;
    call?: number;
    raise?: number;
}

interface HandData {
    hand: string;
    hand_class: string;
    // Root
    check?: number;
    bet_small?: number;
    bet_big?: number;
    // Facing
    fold?: number;
    call?: number;
    raise?: number;
}

interface ClassSummary {
    count: number;
    // Root
    avg_check?: number;
    avg_bet_small?: number;
    avg_bet_big?: number;
    // Facing
    avg_fold?: number;
    avg_call?: number;
    avg_raise?: number;
}

interface GtoResponse {
    log_id?: string;
    parsed: ParsedQuery;
    spot: {
        id: string;
        position: string;
        board_bucket: string;
        street: string;
        action_line: string | null;
        turn_type: string | null;
        river_type: string | null;
        board: string;
        pot: number;
        eff_stack: number;
    };
    strategy: {
        oop: GtoStrategy;
        ip: GtoStrategy;
    };
    hero: HandData | null;
    by_hand_class: Record<string, Record<string, ClassSummary>>;
    hands: Record<string, Record<string, HandData[]>>;
    future_runouts?: {
        action_line?: string;
        runout_type: string;
        board: string;
        check: number;
        bet_small: number;
        bet_big: number;
    }[];
}

// ─── HELPERS ────────────────────────────────────────────────────
function PlayingCard({ card, size = "md" }: { card: string, size?: "md" | "lg" }) {
    if (!card || card.length < 2) return <span className="font-mono text-slate-300">{card}</span>;
    const suit = card[card.length - 1].toLowerCase();
    let rank = card.slice(0, -1).toUpperCase();
    if (rank === "T") rank = "10";

    // Standard 2-color deck matching user screenshot (Spades/Clubs=Black, Hearts/Diamonds=Red)
    const isRed = suit === "h" || suit === "d";
    const suitData: Record<string, string> = {
        s: "♠", h: "♥", d: "♦", c: "♣"
    };
    const sIcon = suitData[suit] || suit;
    const textColor = isRed ? "text-[#e61919]" : "text-[#1a1c23]";

    // Match the exact dimensions and text sizes from the reference image
    const dims = size === 'lg' ? "w-12 h-[72px]" : "w-10 h-[56px]";
    const textSz = size === 'lg' ? "text-2xl" : "text-lg";
    const iconSz = size === 'lg' ? "text-[28px]" : "text-[22px]";

    return (
        <div className={`relative ${dims} shrink-0 bg-white rounded-md border-[1.5px] border-slate-200 shadow-sm select-none`}>
            {/* Rank at Top-Left */}
            <span className={`absolute top-1 left-1.5 font-bold font-sans tracking-tighter ${textSz} ${textColor} leading-none`}>{rank}</span>
            {/* Suit at Center (slightly shifted down to balance with rank) */}
            <div className="absolute inset-0 flex items-center justify-center pt-4">
                <span className={`${iconSz} ${textColor} leading-none`}>{sIcon}</span>
            </div>
        </div>
    );
}

function pct(v: number | undefined) {
    return `${((v ?? 0) * 100).toFixed(1)}%`;
}

// ─── API ────────────────────────────────────────────────────────
async function askGTO(question: string, language: string): Promise<GtoResponse> {
    if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 1200)); // Simulate latency
        return MOCK_RESPONSE as GtoResponse;
    }

    const resp = await fetch(`${API_URL}/api/gto/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, language }),
    });

    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `API error: ${resp.status}`);
    }
    return resp.json();
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────

function ActionBar({ label, value, colorBase }: { label: string; value: number; colorBase: string }) {
    const w = Math.max(value * 100, 0);
    // We expect colorBase like "emerald", "amber", "red"
    return (
        <div className="mb-3 last:mb-0 group">
            <div className="flex justify-between items-end mb-1.5 px-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-300 transition-colors">
                    {label}
                </span>
                <span className={`text-xs font-mono font-bold text-${colorBase}-400 group-hover:text-${colorBase}-300 transition-colors`}>
                    {pct(value)}
                </span>
            </div>
            <div className="h-2.5 w-full bg-[#0a0e17] rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-${colorBase}-700 to-${colorBase}-400 relative`}
                    style={{ width: `${w}%` }}
                >
                    {w > 0 && <div className="absolute inset-0 bg-white/20 w-full animate-pulse" />}
                </div>
            </div>
        </div>
    );
}

function StrategyPanel({ title, strategy, accentBorder, accentText }: {
    title: string; strategy: GtoStrategy; accentBorder: string; accentText: string;
}) {
    const isFacing = strategy.fold !== undefined;
    return (
        <div className="bg-gradient-to-b from-[#111827] to-[#0a0e17] border border-[#2a3654] rounded-xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-600/50 transition-colors">
            <div className={`absolute top-0 inset-x-0 h-1 ${accentBorder} border-t border-t-white/20`} />
            <h4 className={`font-mono text-xs font-bold uppercase tracking-[2px] mb-5 flex items-center gap-2 ${accentText}`}>
                <BarChart3 size={14} />
                {title}
            </h4>
            <div className="flex flex-col">
                {isFacing ? (
                    <>
                        <ActionBar label="Fold" value={strategy.fold ?? 0} colorBase="red" />
                        <ActionBar label="Call" value={strategy.call ?? 0} colorBase="emerald" />
                        <ActionBar label="Raise" value={strategy.raise ?? 0} colorBase="amber" />
                    </>
                ) : (
                    <>
                        <ActionBar label="Check" value={strategy.check ?? 0} colorBase="emerald" />
                        <ActionBar label="Bet 33%" value={strategy.bet_small ?? 0} colorBase="amber" />
                        <ActionBar label="Bet 75%" value={strategy.bet_big ?? 0} colorBase="red" />
                    </>
                )}
            </div>
        </div>
    );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────
export function GtoOracle() {
    const { t, language } = useLanguage();
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState("");
    const [error, setError] = useState("");
    const [data, setData] = useState<GtoResponse | null>(null);
    const [isMockData, setIsMockData] = useState(false);
    const [showClassBreakdown, setShowClassBreakdown] = useState(true);

    const [feedbackStatus, setFeedbackStatus] = useState<'none' | 'liked' | 'disliked' | 'submitted'>('none');
    const [feedbackReason, setFeedbackReason] = useState("");
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    async function handleAsk() {
        if (!question.trim() || loading) return;
        setLoading(true);
        setError("");
        setData(null);
        setFeedbackStatus('none');
        setFeedbackReason("");

        try {
            setIsMockData(false);
            setLoadingStep(t('oracle_tool.llm_parsing') || "🧠 LLM đang parse câu hỏi...");
            const result = await askGTO(question, language);
            setData(result);
        } catch (err: unknown) {
            console.error("Fetch API failed, falling back to mock data", err);
            setError(t('oracle_tool.mock_fallback_error') || "Không kết nối được tới Server. Tự động hiển thị Dữ Liệu Mẫu (Mock Fallback).");
            setData(MOCK_RESPONSE as unknown as GtoResponse);
            setIsMockData(true);
        } finally {
            setLoading(false);
            setLoadingStep("");
        }
    }

    async function handleFeedbackSubmit(isHelpful: boolean, reason: string = "") {
        if (!data?.log_id) return;
        setSubmittingFeedback(true);
        try {
            await fetch(`${API_URL}/api/gto/feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ log_id: data.log_id, is_helpful: isHelpful, feedback_reason: reason })
            });
            if (isHelpful) setFeedbackStatus('submitted');
        } catch (e) {
            console.error(e);
        } finally {
            setSubmittingFeedback(false);
        }
    }

    const parsed = data?.parsed;
    const hero = data?.hero;
    const isFacingSpot = data?.spot?.action_line?.includes('facing_') || (data?.strategy?.oop?.fold !== undefined);
    const classData = data
        ? Object.entries(data.by_hand_class[parsed?.hero_position || "oop"] || {}).sort(
            (a, b) => {
                const ia = CLASS_ORDER.indexOf(a[0]);
                const ib = CLASS_ORDER.indexOf(b[0]);
                return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
            }
        )
        : [];

    return (
        <div className="max-w-6xl mx-auto w-full px-4">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 mb-3">
                    <Sparkles className="text-gold" size={28} />
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                        {t('oracle_tool.title')?.split(' ')[0] || "GTO"} <span className="text-gold">{t('oracle_tool.title')?.split(' ')[1] || 'Oracle'}</span>
                    </h1>
                </div>
                <p className="text-slate-400 text-sm">
                    {t('oracle_tool.subtitle') || "Hỏi bất kỳ tình huống poker nào bằng ngôn ngữ tự nhiên"}
                </p>
                <div className="flex flex-col items-center gap-2 mt-4">
                    <div className="flex items-center gap-2">
                        <span className="inline-block px-3 py-1 text-[10px] font-mono text-gold/80 border border-gold/20 rounded-full bg-gold/5 tracking-wider">
                            {t('oracle_tool.solutions_badge') || "1,500,000 GTO SOLUTIONS"}
                        </span>
                        <span className="inline-block px-3 py-1 text-[10px] font-mono text-emerald-400/80 border border-emerald-400/20 rounded-full bg-emerald-400/5 tracking-wider">
                            {t('oracle_tool.srp_badge') || "SRP ONLY (100BB)"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-mono text-slate-400 border border-slate-700/50 rounded bg-slate-800/30 tracking-wider">BTN vs BB</span>
                        <span className="inline-block px-2 py-0.5 text-[9px] font-mono text-slate-400 border border-slate-700/50 rounded bg-slate-800/30 tracking-wider">SB vs BB</span>
                        <span className="inline-block px-2 py-0.5 text-[9px] font-mono text-slate-400 border border-slate-700/50 rounded bg-slate-800/30 tracking-wider">CO vs BTN</span>
                    </div>
                </div>
            </div>

            {/* Input */}
            <div className="bg-[#111827] border border-[#2a3654] rounded-xl p-5 mb-5 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />

                <label className="block text-[10px] font-semibold uppercase tracking-[2px] text-slate-500 mb-3">
                    {t('oracle_tool.input_label') || "Hỏi GTO Oracle"}
                </label>

                <div className="flex gap-3">
                    <textarea
                        className="flex-1 bg-[#0d1117] border border-[#2a3654] rounded-lg px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/30 transition-all h-20"
                        placeholder={t('oracle_tool.input_placeholder') || "Ví dụ: Board As 7d 2c, tôi ngồi BB cầm 7h 5h, BTN cbet 33% pot, tôi nên làm gì?"}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAsk();
                            }
                        }}
                    />
                    <button
                        onClick={handleAsk}
                        disabled={loading || !question.trim()}
                        className="self-end bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 h-12 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 shrink-0"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {loading ? "..." : (t('oracle_tool.ask_btn') || "Hỏi")}
                    </button>
                </div>

                {/* Examples */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {[0, 1, 2, 3, 4].map((i) => {
                        // Cast to any since we know this is an array mapping
                        const exArray = t('oracle_tool.examples') as any;
                        const defaultExamples = [
                            "Board As 7d 2c, tôi ngồi BB cầm 7h 5h, BTN cbet 33% pot, tôi nên làm gì?",
                            "Flop Ks 8s 3c, tôi BB cầm Ts9s, BTN bet 75%. Flush draw nên call hay raise?",
                            "Board 8s 4d 2c, tôi BB cầm QQ, BTN c-bet 33%, overpair nên xử lý sao?",
                            "Board Ts 9d 8c, BTN vs BB, tôi cầm Jc7c straight rồi, bet big hay slowplay?",
                            "Board monotone As 7s 2s, BB cầm Ks8s flush, BTN check tôi nên bet size nào?"
                        ];
                        const ex = Array.isArray(exArray) ? exArray[i] : defaultExamples[i];
                        if (!ex) return null;
                        return (
                            <button
                                key={i}
                                onClick={() => setQuestion(ex)}
                                className="px-2.5 py-1 text-[11px] bg-[#1a2236] border border-[#2a3654] rounded text-slate-400 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition-all"
                            >
                                {ex.slice(0, 40)}...
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-10">
                    <Loader2 size={32} className="animate-spin text-gold mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{loadingStep}</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-900/40 border border-red-700/50 rounded-xl p-4 mb-5 flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {/* ─── RESULTS ─── */}
            {parsed && data && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

                    {/* LEFT COLUMN: Situation & Details */}
                    <div className="space-y-5">
                        {/* Unified Situation Card */}
                        <div className="bg-[#111827] border border-[#2a3654] rounded-xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-gold via-emerald-500 to-gold" />

                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-[10px] font-semibold uppercase tracking-[2px] text-gold/70 flex items-center gap-2 mb-2">
                                        <Sparkles size={14} className="text-gold" />
                                        {t('oracle_tool.your_situation') || "Your Situation"}
                                        {isMockData && <span className="ml-2 bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded text-[8px] tracking-wider border border-red-700/50">MOCK FALLBACK</span>}
                                    </h3>
                                    {parsed.situation_summary && (
                                        <p className="text-sm text-slate-300">
                                            {parsed.situation_summary}
                                        </p>
                                    )}
                                </div>

                                {/* Metadata Badges */}
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] bg-[#1a2236] border border-[#2a3654] px-2 py-0.5 rounded text-slate-400 capitalize">
                                        {parsed.position.replace(/_/g, ' ')}
                                    </span>
                                    {(data.spot.action_line || Object.keys(data.strategy[parsed.hero_position as 'oop' | 'ip'] || {}).length > 0) && (
                                        <span className="text-[10px] bg-[#1a2236] border border-[#2a3654] px-2 py-0.5 rounded text-slate-400 capitalize">
                                            Pot: {data.spot.pot}bb
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Hand & Board Viz */}
                            <div className="bg-[#0a0e17] border border-[#1a2236] rounded-lg p-4 mb-5 flex flex-wrap items-center gap-x-6 gap-y-4">
                                {hero ? (
                                    <div>
                                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t('oracle_tool.hero_hand') || "Hero Hand"}</span>
                                        <div className="flex items-center gap-1.5">
                                            <PlayingCard card={hero.hand.slice(0, 2)} size="md" />
                                            <PlayingCard card={hero.hand.slice(2, 4)} size="md" />
                                        </div>
                                        <span className={`block mt-1 text-[10px] font-semibold uppercase tracking-wider ${CLASS_COLORS[hero.hand_class] || "text-slate-400"}`}>
                                            {hero.hand_class.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t('oracle_tool.hero_hand') || "Hero Hand"}</span>
                                        <span className="text-sm text-slate-500 italic">{t('oracle_tool.no_hand_specified') || "No exact hand specified"}</span>
                                    </div>
                                )}

                                {/* Separator */}
                                <div className="w-px h-10 bg-[#2a3654] hidden sm:block"></div>

                                {parsed.board_cards && (
                                    <div>
                                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                                            {t('oracle_tool.board') || "Board"} ({parsed.street})
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {parsed.board_cards.split(",").map((c: string, i: number) => (
                                                <PlayingCard key={i} card={c.trim()} size="md" />
                                            ))}
                                        </div>
                                        <span className="block mt-1 text-[10px] text-slate-500 uppercase tracking-wider">
                                            {parsed.board_bucket}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* GTO Recommendation & Actions */}
                            {hero ? (() => {
                                const isFacing = hero.fold !== undefined;
                                const actions = isFacing ? [
                                    { label: "Fold",  value: hero.fold  ?? 0, color: "text-red-400" },
                                    { label: "Call",  value: hero.call  ?? 0, color: "text-emerald-400" },
                                    { label: "Raise", value: hero.raise ?? 0, color: "text-amber-400" },
                                ] : [
                                    { label: "Check",   value: hero.check     ?? 0, color: "text-emerald-400" },
                                    { label: "Bet 33%", value: hero.bet_small ?? 0, color: "text-amber-400" },
                                    { label: "Bet 75%", value: hero.bet_big   ?? 0, color: "text-red-400" },
                                ];
                                const best = actions.reduce((a, b) => a.value > b.value ? a : b);
                                const isMixed = actions.filter(a => a.value >= 0.25).length >= 2;

                                return (
                                    <div>
                                        {/* Action recommendation text */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <Target size={16} className={best.color} />
                                            <span className="text-sm text-slate-200">
                                                {isMixed
                                                    ? <span>{t('oracle_tool.gto_recommends_mix') || "Phân tích GTO khuyên "}<strong className={best.color}>{t('oracle_tool.mix_strategy') || "Mix Strategy"}</strong>: {actions.filter(a => a.value >= 0.1).map(a => `${a.label} (${pct(a.value)})`).join(" / ")}</span>
                                                    : <span>{t('oracle_tool.optimal_action') || "Hành động tối ưu nhất là "}<strong className={best.color}>{best.label}</strong> ({pct(best.value)}).</span>
                                                }
                                            </span>
                                        </div>

                                        {/* Action frequency bars */}
                                        <div className="grid grid-cols-3 gap-3">
                                            {actions.map(a => (
                                                <div key={a.label} className="bg-[#1a2236]/50 border border-[#2a3654] rounded-lg p-3 text-center">
                                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{a.label}</div>
                                                    <div className={`text-xl font-bold font-mono ${a.value === best.value ? a.color : a.color + '/50'}`}>{pct(a.value)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })() : (

                                <div className="text-center py-4 bg-[#1a2236]/30 rounded-lg border border-[#2a3654]/50">
                                    <p className="text-sm text-slate-400">{t('oracle_tool.specify_hand_tip') || "Dùng ngôn ngữ tự nhiên thêm hand cụ thể vào câu hỏi (VD: \"cầm AcKd\") để xem lời khuyên hành động."}</p>
                                </div>
                            )}

                            {/* Future Runouts Database Query */}
                            {data.future_runouts && data.future_runouts.length > 0 && (
                                <div className="mt-5 p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-lg overflow-x-auto">
                                    <h4 className="text-[10px] font-semibold uppercase tracking-[2px] text-emerald-500 mb-3 flex items-center gap-2">
                                        <DatabaseZap size={12} />
                                        {t('oracle_tool.future_runouts') || "Expected Future Streets Database"}
                                    </h4>
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                        <thead>
                                            <tr className="border-b border-[#2a3654]/50 text-slate-500">
                                                <th className="pb-2 font-medium">{t('oracle_tool.runout_type') || "Runout Type"}</th>
                                                <th className="pb-2 font-medium">CHK</th>
                                                <th className="pb-2 font-medium">B 33</th>
                                                <th className="pb-2 font-medium">B 75</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2a3654]/30 text-slate-300 font-mono">
                                            {data.future_runouts.map((runout, i) => (
                                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-2.5">
                                                        <span className="text-emerald-400/80 mr-2">{runout.runout_type.replace('_', ' ')}</span>
                                                    </td>
                                                    <td className={`py-2.5 ${runout.check >= 0.5 ? "text-emerald-400" : ""}`}>{pct(runout.check)}</td>
                                                    <td className={`py-2.5 ${runout.bet_small >= 0.3 ? "text-amber-400" : ""}`}>{pct(runout.bet_small)}</td>
                                                    <td className={`py-2.5 ${runout.bet_big >= 0.3 ? "text-red-400" : ""}`}>{pct(runout.bet_big)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Parse tags (collapsed) */}
                        <details className="bg-[#0f1523] border border-[#2a3654] rounded-xl shadow-md group">
                            <summary className="cursor-pointer px-5 py-4 text-xs font-bold uppercase tracking-[2px] text-slate-400 flex items-center gap-2 select-none hover:text-blue-400 transition-colors">
                                <span className="w-2 h-2 rounded-full bg-blue-500/50 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.8)] transition-all" />
                                {t('oracle_tool.llm_parse_details') || "LLM Data Map"}
                                <ChevronDown size={14} className="ml-auto text-slate-500 group-hover:text-blue-400 transition-colors" />
                            </summary>
                            <div className="px-5 pb-5">
                                <div className="flex flex-wrap gap-2.5">
                                    {Object.entries(parsed)
                                        .filter(([k, v]) => v !== null && v !== undefined && k !== 'situation_summary')
                                        .map(([k, v]) => (
                                            <div key={k} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-950/20 border border-blue-900/40 rounded-md font-mono text-xs shadow-sm hover:border-blue-500/50 transition-colors">
                                                <span className="text-blue-400/80 font-medium">{k}:</span>
                                                <span className="text-emerald-300 font-bold">{String(v)}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </details>

                        {/* Spot metadata */}
                        <div className="text-center py-2 lg:text-left">
                            <p className="text-[10px] font-mono text-slate-600">
                                Spot ID: {data.spot.position} / {data.spot.board_bucket} / {data.spot.street}
                                {data.spot.action_line && ` / ${data.spot.action_line}`}
                                {data.spot.turn_type && ` / ${data.spot.turn_type}`}
                                {USE_MOCK && " | ⚠️ MOCK DATA"}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Strategy & Breakdown */}
                    <div className="space-y-4">

                        {/* Strategy and Breakdown section begins */}


                        {/* Hand class breakdown */}
                        <div className="bg-[#0f1523] border border-[#2a3654] rounded-xl p-5 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/10 rounded-full blur-[60px] pointer-events-none" />
                            <button
                                onClick={() => setShowClassBreakdown(!showClassBreakdown)}
                                className="w-full flex items-center justify-between mb-4 group relative z-10"
                            >
                                <h3 className="text-xs font-bold uppercase tracking-[2px] text-slate-400 flex items-center gap-2 group-hover:text-slate-200 transition-colors">
                                    <Layers size={16} />
                                    {t('oracle_tool.range') || "Range Analysis"} ({parsed.hero_position?.toUpperCase() || "OOP"})
                                </h3>
                                {showClassBreakdown
                                    ? <ChevronUp size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                                    : <ChevronDown size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                                }
                            </button>

                            {showClassBreakdown && (
                                <div className="overflow-x-auto -mx-2 px-2 relative z-10">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-[#1a2236] pb-2">
                                                <th className="text-left text-[11px] font-bold uppercase text-slate-500 py-3 px-2 tracking-widest">{t('oracle_tool.class') || "Class"}</th>
                                                <th className="text-right text-[11px] font-bold uppercase text-slate-500 py-3 px-2 tracking-widest" title="Combos">Cb</th>
                                                {isFacingSpot ? (
                                                    <>
                                                        <th className="text-right text-[11px] font-bold uppercase text-red-500 py-3 px-2 tracking-widest">Fold</th>
                                                        <th className="text-right text-[11px] font-bold uppercase text-emerald-500 py-3 px-2 tracking-widest">Call</th>
                                                        <th className="text-right text-[11px] font-bold uppercase text-amber-500 py-3 px-2 tracking-widest">Raise</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="text-right text-[11px] font-bold uppercase text-emerald-500 py-3 px-2 tracking-widest">Chk</th>
                                                        <th className="text-right text-[11px] font-bold uppercase text-amber-500 py-3 px-2 tracking-widest">B 33</th>
                                                        <th className="text-right text-[11px] font-bold uppercase text-red-500 py-3 px-2 tracking-widest">B 75</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1a2236]">
                                            {classData.map(([cls, stats]) => {
                                                const isHeroClass = hero?.hand_class === cls;
                                                return (
                                                    <tr
                                                        key={cls}
                                                        className={`transition-all duration-200 ${isHeroClass ? "bg-emerald-900/30 shadow-[inset_4px_0_0_rgba(52,211,153,1)]" : "hover:bg-slate-800/30"}`}
                                                    >
                                                        <td className={`py-3 px-2 font-mono font-medium text-xs tracking-wide flex items-center gap-2 ${isHeroClass ? 'text-emerald-300 font-bold' : (CLASS_COLORS[cls] || 'text-slate-400')}`}>
                                                            {isHeroClass && <span className="bg-emerald-500 text-black text-[9px] px-1.5 py-0.5 rounded-sm font-bold tracking-widest mr-1 animate-pulse">HERO</span>}
                                                            {cls.replace(/_/g, ' ')}
                                                        </td>
                                                        <td className={`text-right py-3 px-2 font-mono text-xs ${isHeroClass ? 'text-emerald-200' : 'text-slate-400/80'}`}>{stats.count}</td>
                                                        {isFacingSpot ? (
                                                            <>
                                                                <td className={`text-right py-3 px-2 font-mono text-xs font-semibold ${isHeroClass ? 'text-red-400' : 'text-red-400/70'}`}>{pct(stats.avg_fold)}</td>
                                                                <td className={`text-right py-3 px-2 font-mono text-xs font-semibold ${isHeroClass ? 'text-emerald-400' : 'text-emerald-400/70'}`}>{pct(stats.avg_call)}</td>
                                                                <td className={`text-right py-3 px-2 font-mono text-xs font-semibold ${isHeroClass ? 'text-amber-400' : 'text-amber-400/70'}`}>{pct(stats.avg_raise)}</td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className={`text-right py-3 px-2 font-mono text-xs font-semibold ${isHeroClass ? 'text-emerald-400' : 'text-emerald-400/70'}`}>{pct(stats.avg_check)}</td>
                                                                <td className={`text-right py-3 px-2 font-mono text-xs font-semibold ${isHeroClass ? 'text-amber-400' : 'text-amber-400/70'}`}>{pct(stats.avg_bet_small)}</td>
                                                                <td className={`text-right py-3 px-2 font-mono text-xs font-semibold ${isHeroClass ? 'text-red-400' : 'text-red-400/70'}`}>{pct(stats.avg_bet_big)}</td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Overall strategy */}
                        <div className={`grid grid-cols-1 ${isFacingSpot ? '' : 'md:grid-cols-2'} gap-4`}>
                            <StrategyPanel
                                title={isFacingSpot ? (t('oracle_tool.facing_strategy') || "OOP Facing C-bet") : (t('oracle_tool.oop_strategy') || "OOP Strategy")}
                                strategy={data.strategy.oop}
                                accentBorder="bg-blue-500"
                                accentText="text-blue-400"
                            />
                            {!isFacingSpot && (
                                <StrategyPanel
                                    title={t('oracle_tool.ip_strategy') || "IP Strategy"}
                                    strategy={data.strategy.ip}
                                    accentBorder="bg-red-500"
                                    accentText="text-red-400"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating RLHF Feedback Widget */}
            {data && data.log_id && (
                <div className="fixed top-[120px] right-6 xl:right-12 z-50 w-80 lg:w-96 animate-in slide-in-from-right-8 fade-in duration-500 shadow-2xl">
                    {feedbackStatus !== 'submitted' ? (
                        <div className="bg-gradient-to-br from-[#121c27] to-[#0a0f18] border-2 border-blue-500/40 rounded-xl p-4 shadow-xl backdrop-blur-xl">
                            {feedbackStatus === 'none' && (
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2 pt-0.5">
                                        <Sparkles size={16} className="text-blue-400 shrink-0 mt-0.5" />
                                        <span className="text-sm font-semibold text-blue-100 flex-1 leading-snug">
                                            {t('oracle_tool.feedback_ask') || "Đánh giá chất lượng của Oracle?"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-black/60 px-1 py-1 rounded-full border border-white/10 shrink-0">
                                        <button
                                            onClick={() => handleFeedbackSubmit(true)}
                                            className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                                            title={t('common.helpful') || "Giúp ích"}
                                        >
                                            <ThumbsUp size={16} />
                                        </button>
                                        <button
                                            onClick={() => setFeedbackStatus('disliked')}
                                            className="p-1.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                            title={t('common.not_helpful') || "Không hữu ích"}
                                        >
                                            <ThumbsDown size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {feedbackStatus === 'disliked' && (
                                <div className="flex flex-col gap-3">
                                    <label className="text-[13px] font-bold text-red-400">
                                        {t('oracle_tool.feedback_improve') || "Làm sao để chúng tôi cải thiện kết quả này?"}
                                    </label>
                                    <textarea
                                        value={feedbackReason}
                                        onChange={(e) => setFeedbackReason(e.target.value)}
                                        placeholder={t('oracle_tool.feedback_placeholder') || "Góp ý để cải thiện Oracle..."}
                                        className="bg-[#0b0e14] border border-red-500/30 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 resize-none focus:outline-none focus:border-red-500/70 h-24 transition-colors"
                                    />
                                    <div className="flex gap-2 justify-end mt-1">
                                        <button
                                            onClick={() => setFeedbackStatus('none')}
                                            className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
                                        >
                                            {t('common.hide') || "Đóng"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleFeedbackSubmit(false, feedbackReason);
                                                setFeedbackStatus('submitted');
                                            }}
                                            disabled={submittingFeedback || !feedbackReason.trim()}
                                            className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-2 shadow-lg"
                                        >
                                            {submittingFeedback ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            {t('common.send') || "Gửi"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-[#0a2e1d] border-2 border-emerald-500/40 text-emerald-400 text-[13px] font-bold px-4 py-3.5 rounded-xl flex items-start gap-3 shadow-xl backdrop-blur-md">
                            <Sparkles size={18} className="mt-0.5 shrink-0" />
                            <span className="leading-snug">{t('oracle_tool.feedback_thanks') || "Đã nhận được đánh giá. Cảm ơn bạn đã đóng góp cho VillainVault!"}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
