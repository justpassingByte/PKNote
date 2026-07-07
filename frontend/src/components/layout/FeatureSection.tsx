'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useReveal } from '@/hooks/useReveal';
import { useLanguage } from '@/i18n/LanguageContext';
import { ThumbsUp, DatabaseZap, Zap } from 'lucide-react';

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

export function FeatureSection() {
    const oracleHead = useReveal();
    const uxHead = useReveal();
    const hudHead = useReveal();
    const featureHead = useReveal();
    const { t } = useLanguage();
    const [lightbox, setLightbox] = useState<string | null>(null);

    return (
        <>
            {/* ─── GTO Oracle ─── */}
            <section id="gto-oracle-feature" className="relative py-20 border-b border-white/5 bg-gradient-to-b from-transparent to-black/40">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-14">
                        {/* Text Content */}
                        <div className="flex-1 order-1">
                            <div 
                                ref={oracleHead.ref as React.RefObject<HTMLDivElement>}
                                className={`reveal ${oracleHead.visible ? 'is-visible' : ''}`}
                            >
                                {/* Overline */}
                                <p className="text-emerald-400 text-xs font-mono font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    {t('landing.oracle.overline')}
                                </p>
                                {/* H2 */}
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-black text-white mb-6 leading-[1.1] tracking-tight uppercase">
                                    {t('landing.oracle.h3_1')}<br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
                                        {t('landing.oracle.h3_2')}
                                    </span>
                                </h2>
                                <p className="text-white/50 text-base max-w-xl leading-relaxed mb-6">
                                    {t('landing.oracle.desc')}
                                </p>
                                
                                {/* Callouts Stack */}
                                <div className="space-y-4 mb-8 max-w-xl">
                                    {/* RLHF Feature Callout */}
                                    <div className="p-4 rounded-xl border border-white/10 bg-gradient-to-r from-emerald-500/5 to-transparent flex items-start gap-4 border-l-2 border-l-emerald-500 hover:border-l-emerald-400 transition-colors">
                                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                                            <ThumbsUp size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold text-white mb-1.5 uppercase tracking-wider flex items-center gap-2">
                                                {t('landing.oracle.rlhf_title') || "RLHF Fine-Tuning Engine"}
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black tracking-widest border border-emerald-500/30">{t('landing.oracle.rlhf_badge') || "NEW"}</span>
                                            </h4>
                                            <p className="text-sm text-white/50 leading-relaxed">
                                                {t('landing.oracle.rlhf_desc') || "AI liên tục học từ Human Feedback (Thumbs Up/Down) của Pro Players. Dữ liệu Raw JSON được lưu để tự động Fine-tune cho các Model GTO trong tương lai."}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Real-time Coach Callout */}
                                    <div className="p-4 rounded-xl border border-white/10 bg-gradient-to-r from-yellow-500/5 to-transparent flex items-start gap-4 border-l-2 border-l-yellow-500 hover:border-l-yellow-400 transition-colors">
                                        <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold text-yellow-50 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                                                {t('landing.oracle.realtime_title') || "Coach Pro Real-time"}
                                                <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[9px] font-black tracking-widest border border-yellow-500/30 capitalize">{t('landing.oracle.realtime_badge') || "< 800ms"}</span>
                                            </h4>
                                            <p className="text-sm text-white/50 leading-relaxed">
                                                {t('landing.oracle.realtime_desc') || "Hệ thống điện toán LPU engine xuất kết quả phân tích trong vỏn vẹn dưới 800ms. Chạy mượt mà, cảm giác y hệt như đang hỏi trực tiếp một Pro Poker ngồi bên cạnh."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive-looking Mockup */}
                        <div className="flex-1 order-2 w-full">
                            <RevealBlock delay={100}>
                                <div className="relative rounded-2xl border border-white/10 bg-black/80 backdrop-blur-md p-5 sm:p-7 shadow-[0_0_60px_rgba(74,222,128,0.1)] overflow-hidden font-mono">
                                    {/* Simulated glow */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
                                    
                                    <div className="relative z-10">
                                        <div className="text-white/30 text-[11px] mb-3 uppercase tracking-widest flex justify-between items-center">
                                            <span>{t('landing.oracle.sys_query')}</span>
                                            <span className="text-emerald-400/50 block">v1.2.0</span>
                                        </div>
                                        
                                        {/* Input mock */}
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/90 mb-5 flex items-start gap-3 shadow-inner">
                                            <span className="text-emerald-400 mt-0.5">?</span>
                                            <p className="leading-relaxed">Board As 7d 2c, tôi ngồi BB cầm AcKd, BTN cbet 33% pot, tôi nên làm gì?</p>
                                        </div>
                                        
                                        <div className="text-emerald-400 text-xs mb-4 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            {t('landing.oracle.mock_result_found')} (BTN vs BB / A_dry).
                                        </div>

                                        {/* Strategy Result Mock */}
                                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-5">
                                            <div className="text-white/40 text-[10px] uppercase mb-4 tracking-widest">{t('landing.oracle.mock_analysis_says')} <span className="text-yellow-400 font-bold">Mix / Pure Strategy</span></div>
                                            
                                            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
                                                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center transition-transform hover:scale-105">
                                                    <div className="text-emerald-400/70 text-[10px] sm:text-xs mb-1 font-semibold uppercase">CHECK</div>
                                                    <div className="text-lg sm:text-xl font-black text-emerald-400">35.0%</div>
                                                </div>
                                                <div className="rounded-lg border border-yellow-500/30 bg-yellow-400/15 p-3 text-center shadow-[0_0_15px_rgba(234,179,8,0.15)] transition-transform hover:scale-105 relative">
                                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap hidden sm:block">CAO NHẤT</div>
                                                    <div className="text-yellow-400/80 text-[10px] sm:text-xs mb-1 font-semibold uppercase">BET 33%</div>
                                                    <div className="text-lg sm:text-xl font-black text-yellow-400">40.0%</div>
                                                </div>
                                                <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-center border-dashed transition-transform hover:scale-105">
                                                    <div className="text-rose-400/70 text-[10px] sm:text-xs mb-1 font-semibold uppercase">BET 75%</div>
                                                    <div className="text-lg sm:text-xl font-black text-rose-400">25.0%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </RevealBlock>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Hand Analyzer + UX Demo ─── */}
            <section id="features" className="relative py-20">
                <div className="max-w-7xl mx-auto px-6">

                    {/* ─── UX Demo ─── */}
                    <div className="flex flex-col lg:flex-row items-center gap-14 py-4">
                        <div className="flex-1 order-2 lg:order-1">
                            <div
                                ref={uxHead.ref as React.RefObject<HTMLDivElement>}
                                className={`reveal ${uxHead.visible ? 'is-visible' : ''}`}
                            >
                                {/* Overline */}
                                <p className="text-white/25 text-xs font-bold uppercase tracking-[0.2em] mb-3">
                                    {t('landing.features.ux_overline') || "Hand Analyzer — Review như Pro"}
                                </p>
                                {/* H3 */}
                                <h3 className="text-2xl sm:text-3xl font-mono uppercase tracking-tight font-black text-white mb-6 leading-tight"
                                    dangerouslySetInnerHTML={{ __html: t('landing.features.ux_h3') || "Upload hand.<br/><span class=\"text-yellow-400\">AI mổ xẻ từng sai lầm.</span>" }}
                                />
                                {/* Steps */}
                                <div className="space-y-3 mb-8">
                                    {[
                                        t('landing.ux_steps.step1') || 'Paste / upload hand history hoặc ảnh bàn chơi',
                                        t('landing.ux_steps.step2') || 'AI phân tích từng street — chỉ ra leak & mistake',
                                        t('landing.ux_steps.step3') || 'Nhận chiến thuật exploit cụ thể cho lần sau'
                                    ].map((action, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <span className="text-base font-black text-white/15 w-8 shrink-0 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                                            <p className="text-white/60 text-sm">{action}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Terminal — AI analysis output preview */}
                                <div className="rounded-xl border border-white/8 bg-black/60 p-4 font-mono text-xs space-y-1.5">
                                    <div className="text-white/30 font-semibold mb-1">{t('landing.terminal.header') || 'AI ANALYSIS OUTPUT:'}</div>
                                    <div className="text-amber-400/70 font-semibold">{t('landing.terminal.mistake') || '⚠ TURN — BB check → fold to small bet'}</div>
                                    <div className="text-white/40">{t('landing.terminal.desc') || 'Quá passive, bỏ lỡ cơ hội value bet river'}</div>
                                    <div className="text-white/20 pt-1">{t('landing.terminal.exploit_label') || 'Exploit Strategy:'}</div>
                                    <div className="text-emerald-400/60">– {t('landing.terminal.exploit_1') || 'BET river 75% pot | range: TT+, AQs+ | freq: 80%'}</div>
                                    <div className="text-sky-400/50">– {t('landing.terminal.exploit_2') || 'FOLD turn vs 3x raise | range: weak pairs | freq: 100%'}</div>
                                    <div className="text-white/20 pt-1">{t('landing.terminal.leak_label') || 'Leak Detected:'}</div>
                                    <div className="text-rose-400/50">– {t('landing.terminal.leak_1') || 'Passive river play — trigger: check + fold to small bet'}</div>
                                </div>
                            </div>
                        </div>

                        <RevealBlock delay={100}>
                            <div className="flex-1 order-1 lg:order-2 flex justify-center">
                                <div className="relative w-full">
                                    <div
                                        className="absolute inset-0 rounded-2xl blur-2xl opacity-20"
                                        style={{ background: 'radial-gradient(ellipse at center, rgba(255,196,0,0.4) 0%, transparent 70%)' }}
                                    />
                                    <div className="relative z-10 group/img cursor-pointer" onClick={() => setLightbox('/real_hand_analyzer.jpeg')}>
                                        <Image
                                            src="/real_hand_analyzer.jpeg"
                                            alt="Hand Analyzer Overview"
                                            width={800}
                                            height={800}
                                            className="w-full h-auto rounded-2xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover/img:scale-[1.02]"
                                        />
                                        <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover/img:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                            <span className="text-white/0 group-hover/img:text-white/90 text-xs font-bold uppercase tracking-widest transition-all duration-300 bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 scale-90 group-hover/img:scale-100">🔍 Click to expand</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </RevealBlock>
                    </div>
                </div>
            </section>

            {/* ─── HUD Detail Section ─── */}
            <section id="profiles" className="relative py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div
                        ref={hudHead.ref as React.RefObject<HTMLDivElement>}
                        className={`reveal text-center mb-14 ${hudHead.visible ? 'is-visible' : ''}`}
                    >
                        <p className="text-white/25 text-xs font-mono font-bold uppercase tracking-[0.2em] mb-3">
                            {t('landing.hud.overline') || "HUD — Bảng vàng \"bóc bài\""}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-mono uppercase tracking-tight font-black text-white leading-tight mb-4"
                            dangerouslySetInnerHTML={{ __html: t('landing.hud.h3') || "Không nằm trên bàn.<br/><span class=\"text-yellow-400\">Panel riêng, nhìn cái hiểu luôn.</span>" }}
                        />
                        <p className="text-white/50 text-sm max-w-2xl mx-auto leading-relaxed">
                            {t('landing.hud.detail_sub') || "Mỗi đối thủ một hồ sơ riêng — AI phân tích Exploit Strategy, Positional Leaks, Range Adjustments và ghi chú tự động. Bạn chỉ cần nhìn và ra quyết định."}
                        </p>
                    </div>

                    {/* HUD Detail Screenshot — medium size */}
                    <RevealBlock delay={100}>
                        <div className="max-w-5xl mx-auto mb-12">
                            <div className="relative w-full rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden group/img cursor-pointer" onClick={() => setLightbox('/hud_detail.jpeg')}>
                                <div className="absolute inset-0 bg-yellow-400/5 group-hover/img:bg-transparent transition-colors duration-500 z-10 pointer-events-none"></div>
                                <Image
                                    src="/hud_detail.jpeg"
                                    alt="HUD Player Detail — Exploit Strategy, Leaks, AI Notes"
                                    width={1200}
                                    height={675}
                                    className="w-full h-auto opacity-90 group-hover/img:opacity-100 transition-all duration-500 group-hover/img:scale-[1.02]"
                                />
                                <div className="absolute inset-0 z-20 bg-black/0 group-hover/img:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                    <span className="text-white/0 group-hover/img:text-white/90 text-xs font-bold uppercase tracking-widest transition-all duration-300 bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 scale-90 group-hover/img:scale-100">🔍 Click to expand</span>
                                </div>
                            </div>
                        </div>
                    </RevealBlock>

                    {/* Feature highlights below the screenshot */}
                    <RevealBlock delay={200}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    title: t('landing.hud.feat1_title') || 'Exploit Strategy',
                                    desc: t('landing.hud.feat1_desc') || 'AI tự động sinh chiến thuật exploit theo từng street, position, và tình huống cụ thể. Có sizing, range, frequency.',
                                    color: 'text-amber-400',
                                    borderColor: 'border-amber-500/20 hover:border-amber-500/40',
                                },
                                {
                                    title: t('landing.hud.feat2_title') || 'Positional Leaks',
                                    desc: t('landing.hud.feat2_desc') || 'Phát hiện leak theo node — passive river, loose turn call, overbet bluff... Mỗi leak kèm trigger cụ thể.',
                                    color: 'text-red-400',
                                    borderColor: 'border-red-500/20 hover:border-red-500/40',
                                },
                                {
                                    title: t('landing.hud.feat3_title') || 'AI Notes',
                                    desc: t('landing.hud.feat3_desc') || 'Ghi chú tự động từ mỗi ván đã phân tích. Kèm board texture, pot type, action line và mức độ nghiêm trọng.',
                                    color: 'text-emerald-400',
                                    borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
                                },
                                {
                                    title: t('landing.hud.feat4_title') || 'Range Adjustments',
                                    desc: t('landing.hud.feat4_desc') || 'Gợi ý thay đổi range cụ thể theo từng đối thủ — tighten, widen, overbet, trap — không chung chung.',
                                    color: 'text-sky-400',
                                    borderColor: 'border-sky-500/20 hover:border-sky-500/40',
                                },
                            ].map((feat, i) => (
                                <div
                                    key={i}
                                    className={`rounded-xl border bg-white/[0.02] p-5 transition-all duration-300 ${feat.borderColor}`}
                                    style={{ transitionDelay: `${i * 80}ms` }}
                                >
                                    <h4 className={`text-sm font-black mb-2 ${feat.color}`}>{feat.title}</h4>
                                    <p className="text-xs text-white/40 leading-relaxed">{feat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </RevealBlock>
                </div>
            </section>

            {/* ─── Dashboard Overview Section ─── */}
            <section className="relative py-20 bg-black/40 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <RevealBlock delay={0}>
                        <p className="text-white/25 text-xs font-mono font-bold uppercase tracking-[0.2em] mb-3">
                            {t('landing.dashboard.overline') || "Hệ Thống Quản Lý Mục Tiêu"}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-mono uppercase tracking-tight font-black text-white leading-tight mb-6">
                            {t('landing.dashboard.h2') || "Dashboard Điều Khiển Sát Thủ"}
                        </h2>
                        <p className="text-white/50 text-sm max-w-2xl mx-auto leading-relaxed mb-12">
                            {t('landing.dashboard.sub') || "Không còn mù mờ về kẻ thù. Bảng điều khiển tập trung Priority Targets và Elite Regs, giúp bạn biết rõ bàn nào đáng đánh và ai đang tìm cách rút tiền của bạn."}
                        </p>
                    </RevealBlock>
                    
                    <RevealBlock delay={100}>
                        <div className="max-w-5xl mx-auto">
                            <div className="relative w-full rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden group/img cursor-pointer" onClick={() => setLightbox('/real_dashboard.png')}>
                                <div className="absolute inset-0 bg-yellow-400/5 group-hover/img:bg-transparent transition-colors duration-500 z-10 pointer-events-none"></div>
                                <Image
                                    src="/real_dashboard.png"
                                    alt="Villain Vault Dashboard Overview"
                                    width={1200}
                                    height={675}
                                    className="w-full h-auto opacity-90 group-hover/img:opacity-100 transition-all duration-500 group-hover/img:scale-[1.02]"
                                    priority
                                />
                                <div className="absolute inset-0 z-20 bg-black/0 group-hover/img:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                    <span className="text-white/0 group-hover/img:text-white/90 text-xs font-bold uppercase tracking-widest transition-all duration-300 bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 scale-90 group-hover/img:scale-100">🔍 Click to expand</span>
                                </div>
                            </div>
                        </div>
                    </RevealBlock>
                </div>
            </section>

            {/* ─── Feature Grid ─── */}
            <section className="relative py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div
                        ref={featureHead.ref as React.RefObject<HTMLDivElement>}
                        className={`reveal mb-12 ${featureHead.visible ? 'is-visible' : ''}`}
                    >
                        {/* Overline — chìm */}
                        <p className="text-white/25 text-xs font-mono font-bold uppercase tracking-[0.2em] mb-3">
                            {t('landing.what_is.overline') || "Kho Kiến Thức"}
                        </p>
                        {/* H2 — nổi */}
                        <h2 className="text-3xl sm:text-4xl font-mono uppercase tracking-tight font-black text-white leading-tight">
                            {t('landing.what_is.h2') || "Villiant Vault là gì?"}
                        </h2>
                        {/* Sub — đọc được */}
                        <p className="text-white/50 mt-3 max-w-lg text-sm leading-relaxed"
                           dangerouslySetInnerHTML={{ __html: t('landing.what_is.sub') || "Không phải tool. Không phải solver. Không phải HUD VPIP/PFR rối não. <span class=\"text-white font-semibold\">2026 rồi</span> — là két sắt + bộ não + team toàn pro không biết tilt." }}
                        />
                    </div>

                    {/* ─── Identity Pillars ─── */}
                    <RevealBlock delay={80}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
                            {/* Step 1 — Memory Retrieval */}
                            <div className="rounded-2xl border border-yellow-500/15 bg-gradient-to-b from-yellow-500/[0.04] to-transparent p-6 group hover:border-yellow-500/25 transition-all duration-400 relative">
                                <div className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest mb-3">Step 1</div>
                                <h4 className="text-sm font-black text-white mb-2">
                                    {t('landing.what_is.pillar1_title') || '① Truy Xuất Memory Theo Spot'}
                                </h4>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    {t('landing.what_is.pillar1_desc') || 'Khi bạn gặp một spot — system tự tìm lại tất cả hand tương tự bạn từng chơi, note bạn từng ghi, pattern đối thủ trong cùng vị trí. Không quên, không bỏ sót.'}
                                </p>
                                {/* Arrow connector (desktop only) */}
                                <div className="hidden sm:block absolute -right-5 top-1/2 -translate-y-1/2 text-white/15 text-xl z-10">→</div>
                            </div>

                            {/* Step 2 — GTO Cross-Reference */}
                            <div className="rounded-2xl border border-cyan-500/15 bg-gradient-to-b from-cyan-500/[0.04] to-transparent p-6 group hover:border-cyan-500/25 transition-all duration-400 relative">
                                <div className="text-[10px] font-black text-cyan-500/50 uppercase tracking-widest mb-3">Step 2</div>
                                <h4 className="text-sm font-black text-white mb-2">
                                    {t('landing.what_is.pillar2_title') || '② Đối Chiếu Lý Thuyết GTO'}
                                </h4>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    {t('landing.what_is.pillar2_desc') || 'Data truy xuất được đưa vào AI cùng với nền tảng GTO — range, frequency, sizing. Hệ thống so sánh hành vi thực tế của đối thủ với GTO baseline để tìm chỗ lệch.'}
                                </p>
                                <div className="hidden sm:block absolute -right-5 top-1/2 -translate-y-1/2 text-white/15 text-xl z-10">→</div>
                            </div>

                            {/* Step 3 — Exploit Decision */}
                            <div className="rounded-2xl border border-emerald-500/15 bg-gradient-to-b from-emerald-500/[0.04] to-transparent p-6 group hover:border-emerald-500/25 transition-all duration-400">
                                <div className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest mb-3">Step 3</div>
                                <h4 className="text-sm font-black text-white mb-2">
                                    {t('landing.what_is.pillar3_title') || '③ Ra Quyết Định Exploit'}
                                </h4>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    {t('landing.what_is.pillar3_desc') || 'AI tổng hợp: memory cá nhân + GTO framework + leak đối thủ → ra chiến thuật exploit cụ thể. Không phải chung chung, mà dựa trên data riêng của BẠN.'}
                                </p>
                            </div>
                        </div>

                        {/* Pro Tip Note */}
                        <div className="mt-8 flex gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm group hover:bg-white/[0.03] transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors"></div>
                            <div className="text-xl shrink-0">💡</div>
                            <div className="flex-1">
                                <h5 className="text-sm font-bold text-white mb-1.5">{t('landing.what_is.note_title') || 'Tối đa hóa sức mạnh hệ thống'}</h5>
                                <p className="text-xs text-white/50 leading-relaxed" dangerouslySetInnerHTML={{ 
                                    __html: t('landing.what_is.note_body') || 'Để phát huy 100% sức mạnh của tiến trình này, hãy dùng kết hợp với <span class="text-emerald-400 font-bold">Desktop App</span>. Desktop HUD sẽ tự động note từng action siêu nhỏ của đối phương. Bù lại, nếu chỉ dùng bản <b>Web</b> (upload hand thủ công + note cơ bản) — ngần đó cốt lõi cũng đã đủ để bạn bỏ xa phần lớn player ngoài kia.' 
                                }} />
                            </div>
                        </div>
                    </RevealBlock>
                </div>
            </section>



            {/* Lightbox Modal */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/60 hover:text-white text-3xl font-bold z-10 w-10 h-10 flex items-center justify-center"
                        onClick={() => setLightbox(null)}
                    >
                        ✕
                    </button>
                    <Image
                        src={lightbox}
                        alt="Full size preview"
                        width={1920}
                        height={1080}
                        className="max-w-full max-h-[90vh] w-auto h-auto rounded-xl shadow-2xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}
