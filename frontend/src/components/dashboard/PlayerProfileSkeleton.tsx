export function PlayerProfileSkeleton() {
    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f2e1e] via-[#020202] to-black">
            <div className="flex-1 overflow-y-auto pt-32 p-8 animate-pulse">
                <div className="max-w-7xl mx-auto">
                    {/* Back button skeleton */}
                    <div className="h-4 w-36 bg-white/10 rounded mb-8" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN skeleton */}
                        <div className="lg:col-span-1 space-y-8">
                            {/* Player card skeleton */}
                            <div className="bg-[#111318] border border-gray-800 rounded-2xl p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gray-800/20" />
                                    <div className="flex-1">
                                        <div className="h-6 w-32 bg-gray-800/40 rounded mb-2" />
                                        <div className="h-3 w-24 bg-gray-800/20 rounded" />
                                    </div>
                                </div>
                                <div className="h-10 bg-gray-800/10 rounded-xl" />
                                <div className="h-16 bg-gray-800/10 rounded-xl" />
                                <div className="h-10 bg-gray-800/10 rounded-xl" />
                            </div>
                            {/* Strategy skeleton */}
                            <div className="bg-[#111318] border border-gray-800 rounded-2xl p-8 h-48" />
                        </div>

                        {/* RIGHT COLUMN skeleton */}
                        <div className="lg:col-span-2">
                            <div className="bg-[#111318] border border-gray-800 rounded-2xl p-8 space-y-4">
                                <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
                                    <div className="h-6 w-40 bg-gray-800/40 rounded" />
                                    <div className="flex gap-3">
                                        <div className="h-6 w-20 bg-gray-800/20 rounded-full" />
                                        <div className="h-6 w-24 bg-gray-800/20 rounded-full" />
                                    </div>
                                </div>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="bg-black/20 border border-gray-800/50 rounded-xl p-5 h-24" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
