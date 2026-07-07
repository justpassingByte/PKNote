export default function DashboardLoading() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 pt-24 sm:pt-32 px-4 sm:px-8 pb-12 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-10 pb-20 mt-10">
                    <div className="animate-pulse space-y-10">
                        {/* 1. Welcome Skeleton */}
                        <div className="rounded-[2.5rem] bg-card/40 border border-white/5 p-8 sm:p-12 h-64 shadow-2xl">
                            <div className="h-6 w-32 bg-white/10 rounded-full mb-6"></div>
                            <div className="h-10 w-3/4 max-w-lg bg-white/10 rounded-xl mb-4"></div>
                            <div className="h-4 w-1/2 max-w-md bg-white/5 rounded-full"></div>
                        </div>

                        {/* 2. Key Stats Grid Skeleton */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-6 bg-card/40 border border-white/5 rounded-3xl h-36">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 mb-4"></div>
                                    <div className="h-8 w-16 bg-white/10 rounded-lg mb-2"></div>
                                    <div className="h-3 w-24 bg-white/5 rounded-full"></div>
                                </div>
                            ))}
                        </div>

                        {/* 3. Bottom Grid Skeleton */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="h-6 w-48 bg-white/10 rounded-lg mb-4"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="p-5 bg-card/40 border border-white/5 rounded-2xl h-32">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <div className="h-5 w-32 bg-white/10 rounded"></div>
                                                    <div className="h-4 w-16 bg-white/5 rounded"></div>
                                                </div>
                                                <div className="h-8 w-12 bg-white/10 rounded"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="h-6 w-32 bg-white/10 rounded-lg mb-4"></div>
                                <div className="flex flex-col gap-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-card/40 h-20">
                                            <div className="w-10 h-10 rounded-xl bg-white/10"></div>
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 w-24 bg-white/10 rounded"></div>
                                                <div className="h-3 w-32 bg-white/5 rounded"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
