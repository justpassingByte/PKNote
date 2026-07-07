"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Shield, Rocket, Loader2, Bitcoin, ExternalLink, AlertTriangle } from "lucide-react";
import { API } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Plan {
    id: string;
    name: string;
    price: number;
    period: string;
    description: string;
    features: string[];
    ai_limit: number;
    ocr_limit: number;
    is_popular: boolean;
    color_theme: string;
}

const ICON_MAP: Record<string, any> = {
    gold: Rocket,
    purple: Zap,
    blue: Zap,
    emerald: Shield
};

const COLOR_MAP: Record<string, string> = {
    gold: "text-gold",
    purple: "text-purple-400",
    blue: "text-blue-400",
    emerald: "text-emerald-400"
};

const BG_MAP: Record<string, string> = {
    gold: "bg-gold/10",
    purple: "bg-purple-500/10",
    blue: "bg-blue-500/10",
    emerald: "bg-emerald-500/10"
};

const BORDER_MAP: Record<string, string> = {
    gold: "border-gold/40",
    purple: "border-purple-500/40",
    blue: "border-blue-500/40",
    emerald: "border-emerald-500/40"
};

export function PricingClient({ userEmail, currentTier = "FREE" }: { userEmail?: string, currentTier?: string }) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
                const res = await fetch(`${baseUrl}/api/payments/public-plans`, { credentials: "include" });
                if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                const json = await res.json();
                if (json.success && json.data.length > 0) {
                    setPlans(json.data);
                } else {
                    throw new Error("No plans found");
                }
            } catch (err) {
                console.error("Failed to fetch plans, using fallback:", err);
                setPlans([
                    { id: "FREE", name: "Trial", price: 0, period: "/forever", description: "Standard access", features: ["2 AI Analysis / Day"], ai_limit: 2, ocr_limit: 5, is_popular: false, color_theme: "blue" },
                    { id: "PRO", name: "Pro", price: 14.99, period: "/month", description: "Advanced tools", features: ["100 AI Analysis / Month"], ai_limit: 100, ocr_limit: 100, is_popular: true, color_theme: "gold" },
                    { id: "PRO_PLUS", name: "Pro+", price: 29.99, period: "/month", description: "Elite tools", features: ["Unlimited AI Analysis"], ai_limit: -1, ocr_limit: -1, is_popular: false, color_theme: "purple" },
                    { id: "ENTERPRISE", name: "Enterprise", price: 79.00, period: "/month", description: "Full suite", features: ["Everything"], ai_limit: -1, ocr_limit: -1, is_popular: false, color_theme: "emerald" },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleUpgrade = async (tierId: string) => {
        if (tierId === currentTier || tierId === "FREE") return;
        setLoadingTier(tierId);
        setError(null);

        try {
            const res = await fetch(API.paymentCreateInvoice, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tierRequested: tierId }),
                credentials: "include",
            });

            const json = await res.json();

            if (!json.success) {
                throw new Error(json.error || "Failed to create invoice");
            }

            const { invoice_url, invoiceId, sandbox } = json.data;

            // If API key not configured → redirect to status page
            if (!invoice_url) {
                router.push(`/payment/status/${invoiceId}`);
                return;
            }

            // Redirect to NOWPayments hosted checkout
            window.location.href = invoice_url;
        } catch (err: any) {
            console.error("Payment error:", err);
            setError(err.message || "Payment system error. Please try again.");
        } finally {
            setLoadingTier(null);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20">
            <Loader2 className="animate-spin w-10 h-10 text-gold" />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Crypto payment notice */}
            <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-amber-300/80">
                <Bitcoin className="w-5 h-5 shrink-0 text-amber-400" />
                <span>
                    <strong>Pay with Crypto</strong> — BTC, ETH, USDT and 200+ coins accepted.
                    Network fees may apply depending on your wallet.
                    Your subscription activates within minutes of blockchain confirmation.
                </span>
            </div>

            {/* Error feedback */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-sm text-red-300">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Pricing grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => {
                    const isCurrent = plan.id === currentTier;
                    const isFree = plan.id === "FREE";
                    const Icon = ICON_MAP[plan.color_theme] || Rocket;
                    const textColor = COLOR_MAP[plan.color_theme] || "text-gold";
                    const bgColor = BG_MAP[plan.color_theme] || "bg-gold/10";
                    const borderColor = BORDER_MAP[plan.color_theme] || "border-gold/40";

                    return (
                        <div
                            key={plan.id}
                            className={`flex flex-col rounded-2xl border transition-all duration-300 relative ${
                                isCurrent
                                    ? `border-gold bg-gold/5 shadow-[0_0_30px_rgba(250,204,21,0.1)]`
                                    : plan.is_popular
                                        ? `${borderColor} shadow-2xl shadow-gold/5 bg-gradient-to-b from-card to-amber-900/5`
                                        : `border-border bg-card`
                            }`}
                        >
                            {plan.is_popular && !isCurrent && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold to-amber-600 text-black text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg">
                                    Best Value
                                </div>
                            )}

                            {isCurrent && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-black text-[10px] uppercase font-bold px-4 py-1 rounded-full shadow-lg z-10 flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Your Active Plan
                                </div>
                            )}

                            <div className="p-6 flex-1">
                                <div className={`p-3 rounded-xl ${bgColor} w-fit mb-4`}>
                                    <Icon className={`w-6 h-6 ${textColor}`} />
                                </div>
                                <h3 className="text-xl font-bold text-white leading-none">{plan.name}</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-white">
                                        {plan.price === 0 ? "Free" : `$${plan.price}`}
                                    </span>
                                    {plan.price > 0 && (
                                        <span className="text-gray-500 text-sm font-medium">{plan.period}</span>
                                    )}
                                </div>
                                <p className="mt-4 text-gray-400 text-sm leading-relaxed">
                                    {plan.description}
                                </p>

                                <ul className="mt-8 space-y-4">
                                    {plan.features.map((feature: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className={`mt-1 p-0.5 rounded-full ${bgColor}`}>
                                                <Check className={`w-3 h-3 ${textColor}`} />
                                            </div>
                                            <span className="text-sm text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-6 pt-0 mt-auto">
                                <button
                                    id={`upgrade-btn-${plan.id.toLowerCase()}`}
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={isCurrent || isFree || loadingTier !== null}
                                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                                        isCurrent || isFree
                                            ? "bg-white/5 text-gray-400 cursor-default border border-white/10"
                                            : plan.is_popular
                                                ? "bg-gradient-to-r from-gold to-amber-600 hover:from-gold hover:to-amber-500 text-black shadow-lg shadow-gold/10"
                                                : "bg-white/10 hover:bg-white/20 text-white"
                                    }`}
                                >
                                    {loadingTier === plan.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating Invoice...
                                        </>
                                    ) : isCurrent ? (
                                        "Active Plan"
                                    ) : isFree ? (
                                        "Free Forever"
                                    ) : (
                                        <>
                                            <Bitcoin className="w-4 h-4" />
                                            Pay with Crypto
                                            <ExternalLink className="w-3 h-3 opacity-60" />
                                        </>
                                    )}
                                </button>

                                {!isCurrent && !isFree && (
                                    <p className="text-[10px] text-gray-600 text-center mt-2">
                                        Powered by NOWPayments · 200+ coins
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
