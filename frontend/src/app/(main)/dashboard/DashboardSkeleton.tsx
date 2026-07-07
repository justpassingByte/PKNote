export default function DashboardSkeleton() {
    return (
        <div className="animate-pulse space-y-10 pb-20">


            {/* 2. Welcome Skeleton */}
            <div className="relative overflow-hidden rounded-[2rem] bg-card/40 border border-white/5 p-6 sm:p-8 h-[180px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 h-full">
                    <div className="space-y-4 flex-1">
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-white/10 rounded-full"></div>
                            <div className="h-10 w-64 bg-white/10 rounded-xl"></div>
                            <div className="h-4 w-full max-w-md bg-white/5 rounded-full"></div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 hidden md:flex">
                        <div className="h-14 w-48 bg-white/5 border border-white/5 rounded-2xl"></div>
                        <div className="h-14 w-48 bg-white/10 rounded-2xl"></div>
                    </div>
                </div>
            </div>




            {/* 4. Opposing Target Columns Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                {/* Whale Column */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="h-5 w-40 bg-white/10 rounded-full"></div>
                        <div className="h-[1px] flex-1 bg-white/5 ml-4"></div>
                    </div>
                    <div className="space-y-6">
                        {[1, 2].map((i) => (
                            <div key={i} className="p-5 bg-card/40 border border-white/5 rounded-2xl h-[220px]">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-2">
                                        <div className="h-6 w-32 bg-white/10 rounded"></div>
                                        <div className="h-4 w-20 bg-white/5 rounded"></div>
                                    </div>
                                    <div className="h-10 w-16 bg-white/10 rounded"></div>
                                </div>
                                <div className="h-24 w-full bg-black/20 rounded-xl mb-4"></div>
                                <div className="flex justify-between">
                                    <div className="h-4 w-24 bg-white/5 rounded"></div>
                                    <div className="h-4 w-4 bg-white/5 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reg Column */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="h-5 w-40 bg-white/10 rounded-full"></div>
                        <div className="h-[1px] flex-1 bg-white/5 ml-4"></div>
                    </div>
                    <div className="space-y-6">
                        {[1, 2].map((i) => (
                            <div key={i} className="p-5 bg-card/40 border border-white/5 rounded-2xl h-[220px]">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-2">
                                        <div className="h-6 w-32 bg-white/10 rounded"></div>
                                        <div className="h-4 w-20 bg-white/5 rounded"></div>
                                    </div>
                                    <div className="h-10 w-16 bg-white/10 rounded"></div>
                                </div>
                                <div className="h-24 w-full bg-black/20 rounded-xl mb-4"></div>
                                <div className="flex justify-between">
                                    <div className="h-4 w-24 bg-white/5 rounded"></div>
                                    <div className="h-4 w-4 bg-white/5 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
