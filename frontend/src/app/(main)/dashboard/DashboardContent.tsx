import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { fetchDashboard } from "@/app/actions";
import { getAuthUser } from "@/lib/auth";

export async function DashboardContent() {
    const user = await getAuthUser();
    let stats = {
        totalCount: 0,
        totalNotesCount: 0,
        playstyleCounts: {} as Record<string, number>,
        aiUsage: undefined as { remaining: number; limit: number; resetsAt: string } | undefined,
        ocrUsage: undefined as { remaining: number; limit: number; resetsAt: string } | undefined
    };
    let topWhales = [];
    let topRegs = [];

    try {
        const dashboardData = await fetchDashboard();
        if (dashboardData.stats) stats = { ...stats, ...dashboardData.stats };
        topWhales = (dashboardData.topWhales || []).slice(0, 3);
        topRegs = (dashboardData.topRegs || []).slice(0, 3);
    } catch (err) {
        console.error("Dashboard fetch error:", err);
    }

    return <DashboardHome user={user} stats={stats} topWhales={topWhales} topRegs={topRegs} />;
}
