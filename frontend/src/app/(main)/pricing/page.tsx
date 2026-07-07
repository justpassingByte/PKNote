import { PricingClient } from "@/components/pricing/PricingClient";
import { getAuthUser } from "@/lib/auth";
import { Shield, Zap, Rocket } from "lucide-react";

export const metadata = {
    title: "Pricing Plans | VillainVault AI",
    description: "Choose the elite intelligence plan for your poker grind. GPT-4o and Claude 3.5 Sonnet analysis tiers.",
};

export default async function PricingPage() {
    const user = await getAuthUser();

    return (
        <main className="flex-1 pt-24 sm:pt-32 px-4 sm:px-8 pb-12 overflow-y-auto w-full">
            <div className="max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                        Elevate Your Edge with <span className="text-gold">VillainVault AI</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Choose the plan that fits your volume. All paid plans include advanced OCR and strategic leak analysis.
                    </p>
                </div>

                {/* Pricing Grid (Client Side Interaction) */}
                <PricingClient userEmail={user?.email} currentTier={user?.premium_tier} />

                {/* Footer Info */}
                <div className="mt-16 text-center text-sm text-gray-500 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Secure Crypto Payments
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Instant Activation
                    </div>
                    <div className="flex items-center gap-2">
                        <Rocket className="w-4 h-4" /> Multi-Device Support
                    </div>
                </div>
            </div>
        </main>
    );
}
