import { Suspense } from "react";
import { DashboardContent } from "./DashboardContent";
import DashboardSkeleton from "./DashboardSkeleton";

export const metadata = {
    title: "Dashboard | VillainVault AI",
    description: "Welcome to your AI poker headquarters. Track your sessions, identify new leaks, and monitor weak targets.",
};

export default function DashboardPage() {
    return (
        <main className="flex-1 pt-24 sm:pt-32 px-4 sm:px-8 pb-12 overflow-y-auto w-full">
            <div className="max-w-7xl mx-auto w-full">
                <Suspense fallback={<DashboardSkeleton />}>
                    <DashboardContent />
                </Suspense>
            </div>
        </main>
    );
}
