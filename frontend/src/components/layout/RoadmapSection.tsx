'use client';

import React from 'react';
import { useReveal } from '@/hooks/useReveal';
import { useLanguage } from '@/i18n/LanguageContext';
import { Sparkles, BrainCircuit, Rocket, Smartphone } from 'lucide-react';

function RevealBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const { ref, visible } = useReveal();
    return (
        <div
            ref={ref as React.RefObject<HTMLDivElement>}
            className={`reveal ${visible ? 'is-visible' : ''}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export function RoadmapSection() {
    const headerReveal = useReveal();
    const { t } = useLanguage();

    const PHASES = [
        {
            id: 'phase1',
            icon: Sparkles,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            border: 'border-amber-400/20',
        },
        {
            id: 'phase2',
            icon: BrainCircuit,
            color: 'text-sky-400',
            bg: 'bg-sky-400/10',
            border: 'border-sky-400/20',
        },
        {
            id: 'phase3',
            icon: Rocket,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            border: 'border-emerald-400/20',
        },
        {
            id: 'phase4',
            icon: Smartphone,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            border: 'border-purple-400/20',
        }
    ];

    return (
        <section id="roadmap" className="relative py-24 bg-black/60 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div
                    ref={headerReveal.ref as React.RefObject<HTMLDivElement>}
                    className={`reveal mb-16 text-center ${headerReveal.visible ? 'is-visible' : ''}`}
                >
                    <p className="text-white/25 text-xs font-bold uppercase tracking-[0.2em] mb-3">
                        {t('landing.roadmap.overline') || 'Tầm Nhìn — Đường Dài'}
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-mono uppercase tracking-tight font-black text-white leading-tight mb-4"
                        dangerouslySetInnerHTML={{ __html: t('landing.roadmap.title') || 'Poker Hybrid <span class="text-yellow-400">System</span>.' }}
                    />
                    <p className="text-white/50 text-sm max-w-2xl mx-auto leading-relaxed">
                        {t('landing.roadmap.subtitle') || 'RobinHUD không chỉ là HUD. Nó là một hệ sinh thái nơi decision dựa vào data + context + AI + exploit thực chiến.'}
                    </p>
                </div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Absolute vertical line */}
                    <div className="hidden md:block absolute left-[50%] top-4 bottom-4 w-px bg-white/10 -translate-x-[0.5px]"></div>

                    <div className="space-y-12 md:space-y-0">
                        {PHASES.map((phase, index) => {
                            const isEven = index % 2 === 0;
                            return (
                                <RevealBlock key={phase.id} delay={index * 150}>
                                    <div className={`relative flex flex-col md:flex-row items-center md:mb-16 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                        
                                        {/* Content Box */}
                                        <div className="w-full md:w-1/2 flex justify-center md:justify-start">
                                            <div className={`w-full max-w-[420px] p-6 rounded-2xl border ${phase.border} bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition duration-300 relative ${isEven ? 'md:ml-auto md:mr-8 lg:mr-10' : 'md:mr-auto md:ml-8 lg:ml-10'}`}>
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                                                    <h3 className="text-lg font-mono uppercase tracking-tight font-black text-white/90 leading-snug">{t(`landing.roadmap.${phase.id}.title`)}</h3>
                                                    <span className={`self-start text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 sm:mt-1 ${phase.bg} ${phase.color}`}>
                                                        {t(`landing.roadmap.${phase.id}.badge`)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-white/50 leading-relaxed mb-4">
                                                    {t(`landing.roadmap.${phase.id}.desc`)}
                                                </p>
                                                <ul className="space-y-2">
                                                    {[1, 2, 3].map((i) => {
                                                        const pt = t(`landing.roadmap.${phase.id}.pt${i}`);
                                                        if (!pt) return null;
                                                        return (
                                                            <li key={i} className="flex items-start text-xs text-white/60">
                                                                <span className={`${phase.color} mr-2 mt-0.5`}>•</span>
                                                                {pt}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Center Icon */}
                                        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center w-12 h-12 rounded-full border-4 border-black bg-black z-10">
                                            <div className={`w-full h-full rounded-full flex items-center justify-center ${phase.bg} ${phase.border} border`}>
                                                <phase.icon className={`w-4 h-4 ${phase.color}`} />
                                            </div>
                                        </div>

                                        {/* Empty spacer for flex alignment */}
                                        <div className="hidden md:block w-1/2"></div>
                                    </div>
                                </RevealBlock>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
