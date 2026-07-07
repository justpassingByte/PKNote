import { Suspense } from "react";
import { PlayerListSkeleton } from "@/components/dashboard/PlayerListSkeleton";
import { PlayersContent } from "./PlayersContent";

export const metadata = {
    title: "Player Analysis Hub | VillainVault",
    description: "Access your centralized database of poker opponents. Filter by playstyle, aggression, and AI-detected leaks.",
};

export default function PlayersPage() {
    return (
        <main className="flex-1 pt-4 sm:pt-8 px-4 sm:px-8 pb-12 overflow-y-auto w-full">
            <div className="max-w-7xl mx-auto w-full">
                <Suspense fallback={<PlayerListSkeleton />}>
                    <PlayersContent />
                </Suspense>
            </div>
        </main>
    );
}
