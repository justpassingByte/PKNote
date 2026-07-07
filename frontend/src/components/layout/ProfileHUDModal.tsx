"use client";

import { useState, useEffect } from "react";
import {
    X, Crown, Zap, ShieldCheck, LogOut, ArrowUpRight, Star, Brain,
    FileText, CreditCard, Sparkles, Calendar, Monitor, Download,
    Bot, PenLine, ChevronRight, Loader2, AlertCircle, Key, Copy, Check, Plus, Trash
} from "lucide-react";
import { logout } from "@/app/auth-actions";
import { getUserProfile } from "@/app/actions";
import { useLanguage } from "@/i18n/LanguageContext";
import { apiFetch, API } from "@/lib/api";

interface ProfileHUDModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: { email: string; premium_tier: string; plan_name?: string } | null;
}

// ─── Plan Theming ────────────────────────────────────────────────────────────
const TIER_THEME: Record<string, {
    label: string; color: string; bg: string; border: string; glow: string;
    icon: React.ReactNode; badgeGrad: string;
}> = {
    FREE: {
        label: "Free", color: "text-gray-400",
        bg: "bg-gray-500/8", border: "border-gray-500/20", glow: "",
        icon: <ShieldCheck className="w-4 h-4 text-gray-400" />,
        badgeGrad: "from-gray-600/30 to-gray-700/20",
    },
    PRO: {
        label: "Pro", color: "text-blue-400",
        bg: "bg-blue-500/8", border: "border-blue-500/25", glow: "shadow-[0_0_24px_rgba(59,130,246,0.12)]",
        icon: <Star className="w-4 h-4 text-blue-400" />,
        badgeGrad: "from-blue-600/30 to-blue-700/20",
    },
    PRO_PLUS: {
        label: "Elite", color: "text-purple-400",
        bg: "bg-purple-500/8", border: "border-purple-500/25", glow: "shadow-[0_0_28px_rgba(168,85,247,0.14)]",
        icon: <Sparkles className="w-4 h-4 text-purple-400" />,
        badgeGrad: "from-purple-600/30 to-purple-700/20",
    },
    ENTERPRISE: {
        label: "Enterprise", color: "text-gold",
        bg: "bg-gold/8", border: "border-gold/30", glow: "shadow-[0_0_30px_rgba(250,204,21,0.15)]",
        icon: <Crown className="w-4 h-4 text-gold" />,
        badgeGrad: "from-gold/30 to-amber-600/20",
    },
};

// ─── Sub-components ──────────────────────────────────────────────────────────
function UsageBar({ label, used, limit, color = "gold" }: { label: string; used: number; limit: number; color?: string }) {
    const { t } = useLanguage();
    const pct = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;
    const barColor = color === "gold" ? "bg-gold" : color === "blue" ? "bg-blue-400" : "bg-purple-400";
    const textColor = color === "gold" ? "text-gold" : color === "blue" ? "text-blue-400" : "text-purple-400";
    const warningColor = pct > 80 ? "bg-red-500" : barColor;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span>
                <span className={`text-[10px] font-black font-mono ${textColor}`}>
                    {limit === -1 ? `∞ ${t('profile_modal.unlimited') || "Unlimited"}` : `${limit - used} ${t('profile_modal.left') || "left /"} ${limit}`}
                </span>
            </div>
            {limit !== -1 && (
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${warningColor} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function CategoryDot({ category }: { category: string }) {
    const map: Record<string, string> = {
        EXPLOIT: "bg-red-400",
        LEAK: "bg-yellow-400",
        TELL: "bg-purple-400",
        GENERAL: "bg-gray-500",
    };
    return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${map[category?.toUpperCase()] ?? "bg-gray-500"}`} />;
}

function NoteRow({ note }: { note: any }) {
    const { t } = useLanguage();
    const isAI = note.is_ai_generated;
    const timeAgo = (() => {
        const diff = Date.now() - new Date(note.created_at).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} ${t('profile_modal.m_ago') || "m ago"}`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} ${t('profile_modal.h_ago') || "h ago"}`;
        return `${Math.floor(hrs / 24)} ${t('profile_modal.d_ago') || "d ago"}`;
    })();

    return (
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-all group">
            <div className="mt-0.5 shrink-0">
                <CategoryDot category={note.category} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-wide truncate">
                        {note.player?.name ?? t('profile_modal.unknown_player')}
                    </span>
                    {isAI && <Bot className="w-2.5 h-2.5 text-blue-400 shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{note.content}</p>
            </div>
            <span className="text-[9px] text-gray-600 font-bold shrink-0 mt-0.5">{timeAgo}</span>
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function ProfileHUDModal({ isOpen, onClose, user }: ProfileHUDModalProps) {
    const { t } = useLanguage();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [profile, setProfile] = useState<{
        user: any; plan: any; stats: any; recentNotes: any[]; usage?: any;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    // API Keys state
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [generatingKey, setGeneratingKey] = useState(false);

    useEffect(() => {
        if (!isOpen || !user) return;
        setLoading(true);
        setError(false);
        Promise.all([
            getUserProfile(),
            apiFetch(API.apiKeys).then(r => r.json()).catch(() => null),
        ])
            .then(([data, keysJson]) => {
                if (data) setProfile(data);
                else setError(true);
                if (keysJson?.success) setApiKeys(keysJson.data);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [isOpen, user]);

    useEffect(() => {
        if (!isOpen) { setProfile(null); setError(false); setNewKey(null); setApiKeys([]); }
    }, [isOpen]);

    const handleGenerateKey = async () => {
        setGeneratingKey(true);
        try {
            const res = await apiFetch(API.apiKeys, {
                method: 'POST',
                body: JSON.stringify({ name: 'Desktop App' }),
            });
            const json = await res.json();
            if (json.success) {
                setNewKey(json.data.rawKey);
                // Refresh keys list
                const keysRes = await apiFetch(API.apiKeys);
                const keysJson = await keysRes.json();
                if (keysJson?.success) setApiKeys(keysJson.data);
            }
        } catch { /* silent */ }
        setGeneratingKey(false);
    };

    const handleDeleteKey = async (id: string) => {
        try {
            const res = await apiFetch(API.apiKey(id), { method: 'DELETE' });
            if (res.ok) {
                setApiKeys(prev => prev.filter(k => k.id !== id));
            }
        } catch { /* silent */ }
    };

    const handleCopyKey = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    };

    const tier = (profile?.user?.premium_tier ?? user?.premium_tier ?? "FREE").toUpperCase();
    const theme = TIER_THEME[tier] ?? TIER_THEME.FREE;
    const plan = profile?.plan;
    const displayTierName = plan?.name ?? user?.plan_name ?? tier;
    const stats = profile?.stats;
    const recentNotes: any[] = profile?.recentNotes ?? [];
    const displayName = (profile?.user?.email ?? user?.email ?? "HERO").split("@")[0];
    const email = profile?.user?.email ?? user?.email ?? "";

    const expiryDate = profile?.user?.subscription_expiry
        ? new Date(profile.user.subscription_expiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : null;

    // Usage derived from plan limits & usage tracking
    const aiUsed = profile?.usage?.ai?.used ?? 0;
    const handOcrUsed = profile?.usage?.hand_ocr?.used ?? 0;

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-end sm:pr-6 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Panel */}
            <div className="bg-[#0a0a0a] border border-white/10 w-full sm:w-[480px] max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.9)] flex flex-col animate-in slide-in-from-right-8 duration-300 overflow-hidden">

                {/* Gold top accent */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent shrink-0" />

                {/* ── Header ── */}
                <div className="px-6 pt-6 pb-5 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.badgeGrad} border ${theme.border} flex items-center justify-center ${theme.glow}`}>
                                <span className={`text-xl font-black ${theme.color}`}>{displayName.charAt(0).toUpperCase()}</span>
                            </div>
                            {/* Online dot */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0a0a0a]" />
                        </div>
                        <div>
                            <p className="text-base font-black text-white uppercase tracking-tight">{displayName}</p>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">{email}</p>
                            <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full ${theme.bg} ${theme.border} border`}>
                                {theme.icon}
                                <span className={`text-[9px] font-black uppercase tracking-widest ${theme.color}`}>
                                    {displayTierName}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="overflow-y-auto scrollbar-hide flex-1 px-6 py-5 space-y-5">

                    {/* Loading state */}
                    {loading && (
                        <div className="flex items-center justify-center py-10 gap-3">
                            <Loader2 className="w-5 h-5 text-gold/60 animate-spin" />
                            <span className="text-[11px] text-gray-600 font-bold uppercase tracking-widest">{t('profile_modal.loading')}</span>
                        </div>
                    )}

                    {/* Error state */}
                    {error && !loading && (
                        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/5 border border-red-500/15">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-xs text-red-400">{t('profile_modal.failed_load')}</span>
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* ── Desktop App Download ── */}
                            <a
                                href="/download-app"
                                className="group relative flex items-center gap-4 w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]"
                            >
                                {/* Animated glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-400/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                    <Monitor className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="relative flex-1 min-w-0">
                                    <p className="text-xs font-black text-white uppercase tracking-wider">Desktop HUD App</p>
                                    <p className="text-[10px] text-emerald-400/60 font-medium mt-0.5">Windows • Real-time Overlay</p>
                                </div>
                                <div className="relative w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/25 group-hover:border-emerald-400/40 transition-all duration-300">
                                    <Download className="w-4 h-4 text-emerald-400 group-hover:animate-bounce" />
                                </div>
                            </a>

                            {/* ── Plan Card ── */}
                            <div className={`p-5 rounded-2xl border ${theme.bg} ${theme.border} ${theme.glow} space-y-4`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {theme.icon}
                                        <span className={`text-sm font-black uppercase tracking-widest ${theme.color}`}>
                                            {displayTierName} {t('profile_modal.plan')}
                                        </span>
                                    </div>
                                    {plan?.price !== undefined && (
                                        <span className="text-[10px] text-gray-500 font-black">
                                            {plan.price === 0 ? t('profile_modal.free') : `$${plan.price}${plan.period ?? "/mo"}`}
                                        </span>
                                    )}
                                </div>

                                {/* Features from real DB */}
                                {plan?.features?.length > 0 && (
                                    <div className="space-y-2">
                                        {plan.features.map((f: string, i: number) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className={`w-1 h-1 rounded-full ${theme.color.replace("text-", "bg-")}`} />
                                                <span className="text-[11px] text-gray-400 font-medium">{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Usage bars from plan limits */}
                                {plan && (
                                    <div className="pt-1 space-y-3 border-t border-white/5">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 flex items-center gap-1.5">
                                            <Zap className="w-3 h-3 text-gold" /> {t('profile_modal.monthly_limits')}
                                        </span>
                                        {plan.ai_limit !== 0 && (
                                            <UsageBar
                                                label={t('profile_modal.ai_analysis') || "AI Analysis"}
                                                used={aiUsed}
                                                limit={plan.ai_limit}
                                                color="gold"
                                            />
                                        )}
                                        {plan.hand_ocr_limit !== 0 && (
                                            <UsageBar
                                                label={t('profile_modal.hand_ocr') || "Hand OCR"}
                                                used={handOcrUsed}
                                                limit={plan.hand_ocr_limit}
                                                color="blue"
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Subscription expiry */}
                                {expiryDate && (
                                    <div className="flex items-center gap-2 pt-1">
                                        <Calendar className="w-3 h-3 text-gray-600" />
                                        <span className="text-[10px] text-gray-500 font-bold">
                                            {t('profile_modal.renews')} {expiryDate}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ── Upgrade CTA (not for elite/enterprise) ── */}
                            {(tier === "FREE" || tier === "PRO") && (
                                <a
                                    href="/pricing"
                                    className="group flex items-center justify-between w-full px-5 py-4 bg-gradient-to-r from-gold/12 to-amber-700/8 border border-gold/25 rounded-2xl hover:from-gold/22 hover:to-amber-600/16 transition-all shadow-[0_0_20px_rgba(250,204,21,0.04)] hover:shadow-[0_0_30px_rgba(250,204,21,0.12)]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center">
                                            <Crown className="w-4 h-4 text-gold" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-gold uppercase tracking-wider">
                                                {tier === "FREE" ? t('profile_modal.upgrade_pro') : t('profile_modal.upgrade_elite')}
                                            </p>
                                            <p className="text-[9px] text-gray-500 font-medium mt-0.5">{t('profile_modal.unlock_neural')}</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-gold/50 group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </a>
                            )}

                            {/* ── Recent Notes ── */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <PenLine className="w-3 h-3 text-gold" /> {t('profile_modal.recent_notes')}
                                    </span>
                                    <a
                                        href="/players"
                                        className="flex items-center gap-1 text-[9px] text-gray-600 hover:text-gold transition-colors font-bold uppercase tracking-wider"
                                    >
                                        {t('profile_modal.view_all')} <ChevronRight className="w-2.5 h-2.5" />
                                    </a>
                                </div>

                                {recentNotes.length > 0 ? (
                                    <div className="space-y-2">
                                        {recentNotes.map((note: any) => (
                                            <NoteRow key={note.id} note={note} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-black/30 border border-white/5">
                                        <FileText className="w-7 h-7 text-gray-700" />
                                        <p className="text-[11px] text-gray-600 font-bold">{t('profile_modal.no_notes_yet')}</p>
                                        <a href="/players" className="text-[10px] text-gold/70 hover:text-gold transition-colors font-bold uppercase tracking-wider">
                                            {t('profile_modal.add_first_player')}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* ── API Keys (inline) ── */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <Key className="w-3 h-3 text-gold" /> API Keys
                                    </span>
                                    <button
                                        onClick={handleGenerateKey}
                                        disabled={generatingKey}
                                        className="flex items-center gap-1 text-[9px] text-gold hover:text-yellow-300 transition-colors font-bold uppercase tracking-wider disabled:opacity-40"
                                    >
                                        {generatingKey ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5" />}
                                        Generate
                                    </button>
                                </div>

                                {/* Newly generated key */}
                                {newKey && (
                                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                        <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Copy now — shown only once</p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-black/40 border border-white/5 rounded-lg py-2 px-2.5 text-emerald-300 text-[10px] font-mono break-all select-all">
                                                {newKey}
                                            </code>
                                            <button
                                                onClick={() => handleCopyKey(newKey)}
                                                className="shrink-0 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                            >
                                                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Existing keys */}
                                {apiKeys.length > 0 ? (
                                    <div className="space-y-2">
                                        {apiKeys.filter(k => k.isActive).map((key: any) => (
                                            <div key={key.id} className="group/key flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black/30 border border-white/5 hover:border-white/10 transition-all">
                                                <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                                                    <Key className="w-3.5 h-3.5 text-gold" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-bold text-white truncate">{key.name}</p>
                                                    <p className="text-[9px] text-gray-500 font-mono">{key.keyPrefix}•••••••</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] text-gray-600 font-bold shrink-0">
                                                        {key.devices?.length || 0} devices
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteKey(key.id); }}
                                                        className="opacity-0 group-hover/key:opacity-100 p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                                                        title="Delete Key"
                                                    >
                                                        <Trash className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl bg-black/30 border border-white/5">
                                        <Key className="w-6 h-6 text-gray-700" />
                                        <p className="text-[10px] text-gray-600 font-bold">No API keys yet</p>
                                        <p className="text-[9px] text-gray-700">Generate one to use the Desktop App</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Quick Links ── */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: t('nav.history') || "Hand History", icon: Brain, href: "/history" },
                                    { label: t('nav.pricing') || "Pricing", icon: CreditCard, href: "/pricing" },
                                ].map(({ label, icon: Icon, href }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/15 hover:bg-white/3 transition-all group"
                                    >
                                        <Icon className="w-4 h-4 text-gray-600 group-hover:text-gold transition-colors" />
                                        <span className="text-[11px] font-bold text-gray-500 group-hover:text-white transition-colors">{label}</span>
                                    </a>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="px-6 pb-6 pt-4 border-t border-white/5 shrink-0">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 hover:bg-red-500/18 hover:border-red-500/35 hover:text-red-300 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-40"
                    >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? t('profile_modal.logging_out') : t('profile_modal.logout') || "Log Out"}
                    </button>
                </div>
            </div>
        </div>
    );
}
