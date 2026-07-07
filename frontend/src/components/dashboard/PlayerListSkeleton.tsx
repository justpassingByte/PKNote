export function PlayerListSkeleton() {
    return (
        <div className="animate-pulse">
            {/* Metrics skeleton */}
            <div className="mb-10 p-6 bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl">
                <div className="flex flex-wrap items-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-16 bg-white/10 rounded" />
                        <div className="h-3 w-20 bg-white/5 rounded" />
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-white/10" />
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-16 bg-white/10 rounded" />
                        <div className="h-3 w-12 bg-white/5 rounded" />
                    </div>
                    <div className="hidden sm:block w-px h-10 bg-white/10" />
                    <div className="flex flex-col gap-2">
                        <div className="h-3 w-32 bg-white/5 rounded" />
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-6 w-16 bg-white/5 rounded-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar skeleton */}
            <div className="bg-card/40 border border-white/5 rounded-t-2xl p-5 mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="h-6 w-48 bg-white/10 rounded" />
                    <div className="flex gap-4 w-full sm:w-auto">
                        <div className="h-10 flex-1 sm:w-64 bg-white/5 rounded-full" />
                        <div className="h-10 w-24 bg-white/5 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Grid skeleton - FIXED 3 COLUMNS on large screens */}
            <div className="bg-[#111318]/20 border-x border-b border-gray-800/50 rounded-b-2xl p-4 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-[#111318] border border-gray-800 rounded-2xl p-6 h-[320px] flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-2">
                                    <div className="h-6 w-32 bg-white/10 rounded" />
                                    <div className="h-4 w-20 bg-white/5 rounded" />
                                </div>
                                <div className="h-8 w-14 bg-white/10 rounded-lg" />
                            </div>
                            
                            {/* AI Section Skeleton */}
                            <div className="bg-black/20 border border-gray-800/50 rounded-2xl p-4 mb-6 grow">
                                <div className="flex justify-between mb-4">
                                    <div className="h-4 w-24 bg-gray-800/50 rounded" />
                                    <div className="h-4 w-12 bg-gray-800/30 rounded" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-8 w-full bg-gray-800/20 rounded-xl" />
                                    <div className="h-8 w-full bg-gray-800/20 rounded-xl" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 space-y-3">
                                <div className="flex justify-between">
                                    <div className="h-4 w-20 bg-white/5 rounded" />
                                    <div className="h-4 w-12 bg-white/10 rounded" />
                                </div>
                                <div className="flex justify-between">
                                    <div className="h-4 w-24 bg-white/5 rounded" />
                                    <div className="h-4 w-16 bg-white/10 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
