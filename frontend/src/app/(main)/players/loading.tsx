import { PlayerListSkeleton } from "@/components/dashboard/PlayerListSkeleton";

export default function PlayersLoading() {
    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f2e1e] via-[#020202] to-black">

            <div className="flex-1 overflow-y-auto pt-20 sm:pt-32 px-4 sm:px-8 pb-8 relative scrollbar-thin scrollbar-thumb-felt-light scrollbar-track-transparent">
                <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
                    <div className="w-[500px] h-[500px] rounded-full bg-felt-light blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <PlayerListSkeleton />
                </div>
            </div>
        </div>
    );
}
