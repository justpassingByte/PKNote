"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { API } from "@/lib/api";
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Loader2,
    RefreshCw,
    ArrowRight,
    Shield,
} from "lucide-react";

type InvoiceStatus = "PENDING" | "CONFIRMING" | "FINISHED" | "FAILED" | "EXPIRED" | "MANUAL_REVIEW";

interface PaymentStatusData {
    id: string;
    status: InvoiceStatus;
    tier: string;
    amount: number;
    actually_paid: number | null;
    is_upgraded: boolean;
    last_webhook_at: string | null;
    created_at: string;
    updated_at: string;
    ui_message: string;
    is_admin?: boolean;
}

const STATUS_CONFIG: Record<InvoiceStatus, {
    icon: React.ElementType;
    color: string;
    ringColor: string;
    bgColor: string;
    label: string;
    pulse: boolean;
}> = {
    PENDING: {
        icon: Clock,
        color: "text-amber-400",
        ringColor: "ring-amber-400/30",
        bgColor: "bg-amber-400/10",
        label: "Awaiting Payment",
        pulse: true,
    },
    CONFIRMING: {
        icon: RefreshCw,
        color: "text-blue-400",
        ringColor: "ring-blue-400/30",
        bgColor: "bg-blue-400/10",
        label: "Confirming on Blockchain",
        pulse: true,
    },
    FINISHED: {
        icon: CheckCircle2,
        color: "text-emerald-400",
        ringColor: "ring-emerald-400/30",
        bgColor: "bg-emerald-400/10",
        label: "Payment Complete",
        pulse: false,
    },
    FAILED: {
        icon: XCircle,
        color: "text-red-400",
        ringColor: "ring-red-400/30",
        bgColor: "bg-red-400/10",
        label: "Payment Failed",
        pulse: false,
    },
    EXPIRED: {
        icon: AlertCircle,
        color: "text-gray-400",
        ringColor: "ring-gray-400/30",
        bgColor: "bg-gray-400/10",
        label: "Payment Expired",
        pulse: false,
    },
    MANUAL_REVIEW: {
        icon: AlertCircle,
        color: "text-yellow-400",
        ringColor: "ring-yellow-400/30",
        bgColor: "bg-yellow-400/10",
        label: "Under Review",
        pulse: false,
    },
};

const POLL_STATUSES: InvoiceStatus[] = ["PENDING", "CONFIRMING"];
const POLL_INTERVAL_MS = 10_000; // 10 seconds

export default function PaymentStatusPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params?.id as string;

    const [data, setData] = useState<PaymentStatusData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!invoiceId) return;
        try {
            const res = await fetch(API.paymentStatus(invoiceId), {
                credentials: "include",
                cache: "no-store",
            });
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                setError(null);

                // If payment just finished and user is upgraded, refresh session
                if (json.data.status === "FINISHED" && json.data.is_upgraded) {
                    fetch(API.authRefreshSession, { method: "POST", credentials: "include" })
                        .then(() => {
                            // Tell Next.js to re-fetch Server Components (like the Header)
                            router.refresh();
                        })
                        .catch(err => console.error("Session refresh failed:", err));
                }
            } else {
                setError(json.error || "Failed to load payment status");
            }
        } catch {
            setError("Network error. Please check your connection.");
        } finally {
            setLoading(false);
            setLastChecked(new Date());
        }
    }, [invoiceId]);

    const handleSimulate = async () => {
        if (!invoiceId) return;
        if (!confirm("Admin: Force this payment to success? (Only for Sandbox testing)")) return;
        
        try {
            const res = await fetch(`/api/payments/${invoiceId}/simulate-success`, {
                method: "POST",
                credentials: "include",
            });
            const json = await res.json();
            if (json.success) {
                fetchStatus();
            } else {
                alert(json.error || "Simulate failed");
            }
        } catch {
            alert("Network error simulating success");
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Auto-poll for pending/confirming
    useEffect(() => {
        if (!data) return;
        if (!POLL_STATUSES.includes(data.status)) return;

        const timer = setInterval(fetchStatus, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [data, fetchStatus]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-gold animate-spin" />
                    <p className="text-gray-400 text-sm">Loading payment status...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center max-w-md px-6">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
                    <p className="text-gray-400 mb-6">{error || "Could not load payment information."}</p>
                    <button
                        onClick={() => router.push("/pricing")}
                        className="px-6 py-3 bg-gold text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                    >
                        Back to Pricing
                    </button>
                </div>
            </div>
        );
    }

    const cfg = STATUS_CONFIG[data.status];
    const StatusIcon = cfg.icon;
    const isPolling = POLL_STATUSES.includes(data.status);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-[#111118] border border-white/10 rounded-2xl p-8 shadow-2xl">
                    {/* Status Icon */}
                    <div className="flex justify-center mb-6">
                        <div className={`relative p-5 rounded-full ring-4 ${cfg.ringColor} ${cfg.bgColor}`}>
                            <StatusIcon className={`w-10 h-10 ${cfg.color} ${cfg.pulse ? "animate-pulse" : ""}`} />
                            {isPolling && (
                                <span className="absolute inset-0 rounded-full ring-2 ring-blue-400/20 animate-ping" />
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-white text-center mb-1">
                        {cfg.label}
                    </h1>
                    <p className="text-gray-400 text-sm text-center mb-6">
                        {data.ui_message}
                    </p>

                    {/* Details */}
                    <div className="space-y-3 bg-white/5 rounded-xl p-4 mb-6">
                        <DetailRow label="Plan" value={data.tier.replace("_", " ")} />
                        <DetailRow label="Amount" value={`$${data.amount.toFixed(2)} USD`} />
                        {data.actually_paid != null && (
                            <DetailRow label="Received" value={`$${data.actually_paid.toFixed(2)} USD`} />
                        )}
                        <DetailRow
                            label="Invoice ID"
                            value={`${data.id.substring(0, 8)}...`}
                            mono
                        />
                        {data.last_webhook_at && (
                            <DetailRow
                                label="Last Update"
                                value={new Date(data.last_webhook_at).toLocaleString()}
                            />
                        )}
                    </div>

                    {/* Network fee notice */}
                    {data.status === "PENDING" && (
                        <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/20 rounded-lg p-3 mb-6">
                            <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Network fees may apply depending on your wallet. Ensure you send the exact requested amount.</span>
                        </div>
                    )}

                    {/* Polling indicator */}
                    {isPolling && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>
                                Auto-refreshing every 10s
                                {lastChecked && ` · Last checked ${lastChecked.toLocaleTimeString()}`}
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {data.status === "FINISHED" && (
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="w-full py-3 bg-gradient-to-r from-gold to-amber-600 text-black font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
                            >
                                Go to Dashboard <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                        {(data.status === "FAILED" || data.status === "EXPIRED") && (
                            <button
                                onClick={() => router.push("/pricing")}
                                className="w-full py-3 bg-gold text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                            >
                                Try Again
                            </button>
                        )}
                        <button
                            onClick={fetchStatus}
                            className="w-full py-2.5 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh Status
                        </button>

                        {/* Admin Bypass Tool */}
                        {data.is_admin && (data.status === "PENDING" || data.status === "CONFIRMING") && (
                            <button
                                onClick={handleSimulate}
                                className="w-full py-2.5 mt-4 text-[11px] uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all font-black"
                            >
                                Admin: Simulate Success
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-600 mt-4">
                    Powered by NOWPayments · Blockchain-verified
                </p>
            </div>
        </div>
    );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{label}</span>
            <span className={`text-white ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
        </div>
    );
}
