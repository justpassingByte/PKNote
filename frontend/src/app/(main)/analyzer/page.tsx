import { HandAnalyzer } from "@/components/analyzer/HandAnalyzer";

export const metadata = {
    title: "Hand Analyzer | VillainVault AI",
    description: "Upload screenshots or paste hand histories for instant AI analysis and leak detection.",
};

export default async function AnalyzerPage() {
    return (
        <main className="flex-1 pt-24 sm:pt-32 px-4 sm:px-6 pb-12 overflow-y-auto w-full">
            <HandAnalyzer />
        </main>
    );
}
