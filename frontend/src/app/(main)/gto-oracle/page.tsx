import { GtoOracle } from "@/components/gto/GtoOracle";

export const metadata = {
    title: "GTO Oracle | VillainVault",
    description: "Ask any poker situation in natural language and get GTO-optimal strategy recommendations powered by 1,500,000 pre-computed solutions.",
};

export default function GtoOraclePage() {
    return (
        <main className="flex-1 pt-24 sm:pt-32 px-4 sm:px-6 pb-12 overflow-y-auto w-full">
            <GtoOracle />
        </main>
    );
}
