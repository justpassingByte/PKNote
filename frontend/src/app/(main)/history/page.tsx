import { HandHistoryList } from "@/components/analyzer/HandHistoryList";

export const metadata = {
    title: "Hand History | VillainVault AI",
    description: "Browse your analyzed hands, filter by mistakes, and track your progress.",
};

export default async function HistoryPage() {
    return (
        <main className="flex-1 pt-24 sm:pt-32 px-4 sm:px-8 pb-12 overflow-y-auto w-full">
            <div className="max-w-7xl mx-auto w-full">
                <HandHistoryList />
            </div>
        </main>
    );
}
