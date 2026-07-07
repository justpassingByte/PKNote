'use client';

import React from 'react';
import { useReveal } from '@/hooks/useReveal';
import { useLanguage } from '@/i18n/LanguageContext';
import { Brain, Eye, Database, Workflow, Sparkles, Zap, ArrowRight, Layers } from 'lucide-react';

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

export function ManifestoSection() {
    const headerReveal = useReveal();
    const { t } = useLanguage();

    return (
        <section id="manifesto" className="relative py-28 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,196,0,0.04)_0%,_transparent_60%)] pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/15 to-transparent" />

            {/* Floating orbs */}
            <div className="absolute top-20 left-[10%] w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-20 right-[10%] w-80 h-80 bg-cyan-500/5 rounded-full blur-[120px]" />

            <div className="max-w-5xl mx-auto px-6 relative z-10">

                {/* Header */}
                <div
                    ref={headerReveal.ref as React.RefObject<HTMLDivElement>}
                    className={`reveal text-center mb-20 ${headerReveal.visible ? 'is-visible' : ''}`}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 mb-6">
                        <Brain className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400/80 text-xs font-bold uppercase tracking-widest">
                            {t('landing.manifesto.overline') || 'Tại Sao RobinHUD Tồn Tại'}
                        </span>
                    </div>

                    <h2 className="text-3xl sm:text-5xl font-mono uppercase tracking-tight font-black text-white leading-[1.1] mb-6"
                        dangerouslySetInnerHTML={{
                            __html: t('landing.manifesto.h2') || 'Có <span class="text-yellow-400">Bộ Não</span> rồi.<br/>Nhưng chưa có <span class="text-cyan-400">Mắt</span>.'
                        }}
                    />

                    <p className="text-white/50 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        {t('landing.manifesto.subtitle') || 'LLM là bộ não — biết suy luận, phân tích, lên chiến thuật. Nhưng không có data, nó như một thiên tài đang bịt mắt. RobinHUD cho nó đôi mắt.'}
                    </p>
                </div>

                {/* ── The Brain + Eyes Metaphor Visual ── */}
                <RevealBlock delay={0}>
                    <div className="relative max-w-4xl mx-auto mb-24">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Brain Card (LLM) */}
                            <div className="relative rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.06] to-transparent p-8 group hover:border-purple-500/35 transition-all duration-500">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[60px] group-hover:bg-purple-500/15 transition-all duration-500" />

                                <div className="relative z-10">
                                    <div className="inline-flex p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-5">
                                        <Brain className="w-7 h-7 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-mono uppercase tracking-tight font-black text-white mb-2">
                                        {t('landing.manifesto.brain_title') || '🧠 Bộ Não — LLM'}
                                    </h3>
                                    <p className="text-white/40 text-sm leading-relaxed mb-5">
                                        {t('landing.manifesto.brain_desc') || 'Biết suy luận GTO, phân tích range, đọc pattern, lên exploit plan. Nhưng nếu không có input data — nó chỉ là sức mạnh tiềm ẩn.'}
                                    </p>

                                    <div className="space-y-2.5">
                                        {[
                                            t('landing.manifesto.brain_p1') || 'Phân tích Hand History trong < 2 giây',
                                            t('landing.manifesto.brain_p2') || 'Sinh Exploit Strategy theo context',
                                            t('landing.manifesto.brain_p3') || 'Detect leak, gợi ý range adjustment',
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-2.5 text-xs text-white/50">
                                                <Sparkles className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Status badge */}
                                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/15">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                    <span className="text-purple-400/70 text-[10px] font-bold uppercase tracking-wider">Active</span>
                                </div>
                            </div>

                            {/* Eyes Card (Data) */}
                            <div className="relative rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] to-transparent p-8 group hover:border-cyan-500/35 transition-all duration-500">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px] group-hover:bg-cyan-500/15 transition-all duration-500" />

                                <div className="relative z-10">
                                    <div className="inline-flex p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 mb-5">
                                        <Eye className="w-7 h-7 text-cyan-400" />
                                    </div>
                                    <h3 className="text-xl font-mono uppercase tracking-tight font-black text-white mb-2">
                                        {t('landing.manifesto.eyes_title') || '👁 Đôi Mắt — Data của Bạn'}
                                    </h3>
                                    <p className="text-white/40 text-sm leading-relaxed mb-5">
                                        {t('landing.manifesto.eyes_desc') || 'Mỗi hand bạn phân tích, mỗi note bạn ghi, mỗi đối thủ bạn track — đó là data. Càng nhiều data, AI càng "nhìn rõ" opponent pool của bạn.'}
                                    </p>

                                    <div className="space-y-2.5">
                                        {[
                                            t('landing.manifesto.eyes_p1') || 'Hand history → pattern recognition',
                                            t('landing.manifesto.eyes_p2') || 'Player notes → behavioral modeling',
                                            t('landing.manifesto.eyes_p3') || 'OCR bàn chơi → real-time context',
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-2.5 text-xs text-white/50">
                                                <Eye className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Status badge — needs data */}
                                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/15">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    <span className="text-amber-400/70 text-[10px] font-bold uppercase tracking-wider">
                                        {t('landing.manifesto.eyes_status') || 'Cần Anh Em'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Center connector */}
                        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-black border-2 border-yellow-500/30 items-center justify-center shadow-[0_0_30px_rgba(255,196,0,0.15)]">
                            <Zap className="w-6 h-6 text-yellow-400" />
                        </div>
                    </div>
                </RevealBlock>

                {/* ── Vector DB + LLM Pipeline ── */}
                <RevealBlock delay={100}>
                    <div className="relative max-w-4xl mx-auto mb-24">
                        <div className="text-center mb-12">
                            <p className="text-white/20 text-xs font-bold uppercase tracking-[0.28em] mb-3">
                                {t('landing.manifesto.pipeline_overline') || 'Cách Chúng Tôi Scale'}
                            </p>
                            <h3 className="text-2xl sm:text-3xl font-mono uppercase tracking-tight font-black text-white mb-3"
                                dangerouslySetInnerHTML={{
                                    __html: t('landing.manifesto.pipeline_h3') || 'Vector DB + <span class="text-emerald-400">Augmented LLM</span> Workflow'
                                }}
                            />
                            <p className="text-white/40 text-sm max-w-xl mx-auto leading-relaxed">
                                {t('landing.manifesto.pipeline_sub') || 'Không phải ChatGPT wrapper. Đây là pipeline thật — data anh em feed vào được chuyển thành vector, lưu vĩnh viễn, và augment vào mỗi lần AI suy luận.'}
                            </p>
                        </div>

                        {/* Pipeline flow */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0">
                            {/* Step 1 */}
                            <div className="relative flex flex-col items-center text-center px-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-transparent border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Database className="w-7 h-7 text-cyan-400" />
                                </div>
                                <span className="text-[10px] text-cyan-400/60 font-bold uppercase tracking-widest mb-2">Step 01</span>
                                <h4 className="text-sm font-bold text-white mb-1.5">
                                    {t('landing.manifesto.step1_title') || 'Data Ingestion'}
                                </h4>
                                <p className="text-xs text-white/35 leading-relaxed">
                                    {t('landing.manifesto.step1_desc') || 'Hand history, notes, player behavior — mọi thứ anh em feed vào đều được encode thành vector embeddings và lưu vào Vector DB.'}
                                </p>

                                {/* Arrow connector */}
                                <div className="hidden sm:block absolute right-0 top-8 translate-x-1/2 z-10">
                                    <ArrowRight className="w-5 h-5 text-white/15" />
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="relative flex flex-col items-center text-center px-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/15 to-transparent border border-purple-500/20 flex items-center justify-center mb-4">
                                    <Workflow className="w-7 h-7 text-purple-400" />
                                </div>
                                <span className="text-[10px] text-purple-400/60 font-bold uppercase tracking-widest mb-2">Step 02</span>
                                <h4 className="text-sm font-bold text-white mb-1.5">
                                    {t('landing.manifesto.step2_title') || 'Retrieval + Augment'}
                                </h4>
                                <p className="text-xs text-white/35 leading-relaxed">
                                    {t('landing.manifesto.step2_desc') || 'Khi bạn query — hệ thống tìm top-K data liên quan nhất từ Vector DB, inject thẳng vào prompt context cho LLM.'}
                                </p>

                                {/* Arrow connector */}
                                <div className="hidden sm:block absolute right-0 top-8 translate-x-1/2 z-10">
                                    <ArrowRight className="w-5 h-5 text-white/15" />
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center px-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/15 to-transparent border border-yellow-500/20 flex items-center justify-center mb-4">
                                    <Zap className="w-7 h-7 text-yellow-400" />
                                </div>
                                <span className="text-[10px] text-yellow-400/60 font-bold uppercase tracking-widest mb-2">Step 03</span>
                                <h4 className="text-sm font-bold text-white mb-1.5">
                                    {t('landing.manifesto.step3_title') || 'Exploit Output'}
                                </h4>
                                <p className="text-xs text-white/35 leading-relaxed">
                                    {t('landing.manifesto.step3_desc') || 'LLM ra quyết định dựa trên data riêng của BẠN, không phải generic. Càng nhiều data, exploit càng chính xác.'}
                                </p>
                            </div>
                        </div>

                        {/* Feedback loop */}
                        <div className="mt-8 text-center">
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/8 bg-white/[0.02]">
                                <Layers className="w-4 h-4 text-emerald-400/60" />
                                <span className="text-xs text-white/30 font-semibold">
                                    {t('landing.manifesto.feedback_loop') || 'Feedback Loop — data càng dày, edge càng rõ, system tự improve'}
                                </span>
                            </div>
                        </div>
                    </div>
                </RevealBlock>

                {/* ── Mindset Shift / The Real Talk ── */}
                <RevealBlock delay={200}>
                    <div className="relative max-w-3xl mx-auto">
                        <div className="rounded-3xl border border-white/8 bg-gradient-to-b from-white/[0.03] to-transparent p-10 sm:p-14 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                            <div className="absolute bottom-0 right-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-[80px]" />

                            <div className="relative z-10">
                                {/* Overline */}
                                <p className="text-white/20 text-xs font-bold uppercase tracking-[0.28em] mb-6">
                                    {t('landing.manifesto.realtalk_overline') || 'Mindset'}
                                </p>

                                {/* Main quote */}
                                <blockquote className="text-xl sm:text-2xl font-mono uppercase tracking-tight font-black text-white/90 leading-snug mb-8"
                                    dangerouslySetInnerHTML={{
                                        __html: t('landing.manifesto.realtalk_quote') || 'Vài năm nữa, game sẽ <span class="text-amber-400">khó gấp bội</span>.<br/>Liệu bạn vẫn chơi kiểu cũ <span class="text-white/40">được bao lâu</span>?'
                                    }}
                                />

                                {/* Block 1 — Historical parallel */}
                                <div className="rounded-xl border border-white/6 bg-white/[0.02] p-6 mb-5">
                                    <h4 className="text-sm font-black text-yellow-400/80 mb-3 flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        {t('landing.manifesto.history_title') || 'Nhìn lại lịch sử'}
                                    </h4>
                                    <p className="text-sm text-white/45 leading-relaxed mb-4"
                                        dangerouslySetInnerHTML={{
                                            __html: t('landing.manifesto.history_p1') || 'Điện ra đời — người ta sợ giật chết. Bitcoin xuất hiện — bị gọi là lừa đảo. AI bây giờ — cũng bị nghi ngờ y chang. Nhưng sau này nhìn lại, toàn là thứ <span class="text-white/70 font-semibold">hiển nhiên</span>.'
                                        }}
                                    />
                                    <p className="text-sm text-white/45 leading-relaxed">
                                        {t('landing.manifesto.history_p2') || 'Ngoài kia AI viết code, AI trade, AI tự động hoá đủ thứ. Nhưng Poker vẫn đang ở thời kỳ "quạt tay": note bằng tay, tự nhớ, nhìn HUD rồi tự dịch số. Đây là mảnh đất màu mỡ mà gần như chưa ai khai thác đúng cách.'}
                                    </p>
                                </div>

                                {/* Block 2 — AI misconception debunk */}
                                <div className="rounded-xl border border-white/6 bg-white/[0.02] p-6 mb-5">
                                    <h4 className="text-sm font-black text-purple-400/80 mb-3 flex items-center gap-2">
                                        <Brain className="w-4 h-4" />
                                        {t('landing.manifesto.debunk_title') || 'AI sai? Hay bạn chưa biết cách dùng?'}
                                    </h4>
                                    <p className="text-sm text-white/45 leading-relaxed mb-4">
                                        {t('landing.manifesto.debunk_p1') || 'AI đôi lúc bịa thông tin, đôi lúc sai — đúng. Nhưng vấn đề không nằm ở AI, mà ở cách bạn dùng nó. Biết dùng AI ≠ tận dụng được AI.'}
                                    </p>
                                    <p className="text-sm text-white/45 leading-relaxed">
                                        {t('landing.manifesto.debunk_p2') || 'Người giỏi họ không dùng AI để hỏi "nên fold hay call" rồi nghe theo. Họ build workflow, xây system, tận dụng data để AI làm đòn bẩy — scale tốc độ suy luận, phân tích, và ra quyết định.'}
                                    </p>
                                </div>

                                {/* Block 3 — RTA + Builder */}
                                <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-6 mb-8">
                                    <h4 className="text-sm font-black text-cyan-400/80 mb-3 flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        {t('landing.manifesto.builder_title') || 'Tại sao mình build cái này?'}
                                    </h4>
                                    <p className="text-sm text-white/45 leading-relaxed">
                                        {t('landing.manifesto.builder_desc') || 'Mình hiểu hệ thống phát hiện (RTA) hoạt động ra sao. Nếu mình cũng sợ kiểu "dùng là bị ban" thì mình đã không build RobinHUD từ đầu. Cái mình cần bây giờ là data, feedback, và một số anh em chịu đi trước — để system học và scale.'}
                                    </p>
                                </div>

                                {/* Comparison */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                    {/* Old way */}
                                    <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-5">
                                        <p className="text-red-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                                            {t('landing.manifesto.old_way_label') || '❌ Quạt Tay'}
                                        </p>
                                        <ul className="space-y-2">
                                            {[
                                                t('landing.manifesto.old_1') || 'Note tay → quên sau 5 session',
                                                t('landing.manifesto.old_2') || 'HUD VPIP/PFR → tự ngồi dịch số',
                                                t('landing.manifesto.old_3') || 'Gamble bằng cảm giác → donate',
                                                t('landing.manifesto.old_4') || 'Vài năm nữa game khó hơn → hết lợi thế',
                                            ].map((item, i) => (
                                                <li key={i} className="text-xs text-white/35 flex items-start gap-2">
                                                    <span className="text-red-400/50 mt-0.5">–</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* New way */}
                                    <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5">
                                        <p className="text-emerald-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                                            {t('landing.manifesto.new_way_label') || '✅ Quạt Máy — RobinHUD'}
                                        </p>
                                        <ul className="space-y-2">
                                            {[
                                                t('landing.manifesto.new_1') || 'Vector DB nhớ VĨNH VIỄN mọi data',
                                                t('landing.manifesto.new_2') || 'AI ném thẳng exploit + leak → act ngay',
                                                t('landing.manifesto.new_3') || 'Data dày → edge compound interest',
                                                t('landing.manifesto.new_4') || 'Game khó hơn → system cũng mạnh hơn',
                                            ].map((item, i) => (
                                                <li key={i} className="text-xs text-white/35 flex items-start gap-2">
                                                    <span className="text-emerald-400/50 mt-0.5">+</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Closing — mindset, not product pitch */}
                                <div className="pt-8 border-t border-white/5">
                                    <p className="text-white/60 text-sm font-bold leading-relaxed mb-4"
                                        dangerouslySetInnerHTML={{
                                            __html: t('landing.manifesto.close_1') || 'Câu hỏi không phải <span class="text-white/90">"có nên dùng AI không"</span>.<br/>Câu hỏi là: <span class="text-amber-400 font-black">bạn sẽ là người dùng trước, hay chờ đến lúc ai cũng dùng?</span>'
                                        }}
                                    />
                                    <p className="text-white/35 text-xs leading-relaxed mb-4">
                                        {t('landing.manifesto.close_2') || 'Điện, internet, Bitcoin, smartphone — mọi cuộc cách mạng đều bắt đầu từ một nhóm nhỏ dám thử trước khi số đông hiểu ra. Poker cũng vậy. Không phải vấn đề công cụ nào, mà là tư duy nào.'}
                                    </p>
                                    <p className="text-white/20 text-xs italic max-w-lg mx-auto text-center">
                                        {t('landing.manifesto.close_3') || 'Người thay đổi mindset trước không cần chờ ai cho phép. Họ tự tạo lợi thế.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </RevealBlock>

            </div>
        </section>
    );
}
