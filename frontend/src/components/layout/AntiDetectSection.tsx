'use client';

import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useReveal } from '@/hooks/useReveal';
import { ShieldCheck, Eye, Minimize2, Clock, Github, MousePointerClick } from 'lucide-react';

export function AntiDetectSection() {
    const headerReveal = useReveal();
    const gridReveal = useReveal();
    const githubReveal = useReveal();
    const { t } = useLanguage();

    const FEATURES = [
        {
            icon: Eye,
            title: t('landing.anti_detect.f1_title') || 'Chỉ Đọc Màn Hình — Không Chạm RAM',
            desc: t('landing.anti_detect.f1_desc') || 'RobinHUD chỉ chụp ảnh các pixel hiển thị trên màn hình của bạn, sau đó dùng AI đọc tên người chơi. Hoàn toàn không inject DLL, không hook vào bộ nhớ game, không đọc lén tiến trình nào.',
            color: 'text-sky-400'
        },
        {
            icon: MousePointerClick,
            title: t('landing.anti_detect.f2_title') || 'Bạn Chủ Động — Không Auto',
            desc: t('landing.anti_detect.f2_desc') || 'Mọi lần quét bàn đều do bạn chủ động bấm nút hoặc nhấn phím tắt (F5). Không có timer chạy ngầm, không polling liên tục. Giảm thiểu tối đa signal phần mềm tự động.',
            color: 'text-amber-400'
        },
        {
            icon: Clock,
            title: t('landing.anti_detect.f3_title') || 'Timing Giống Người Thật',
            desc: t('landing.anti_detect.f3_desc') || 'Mỗi hành động (quét tên, lấy dữ liệu, hiển thị HUD) đều có độ trễ ngẫu nhiên 200–800ms, mô phỏng tốc độ đọc và phản ứng của con người thay vì xử lý tức thì kiểu máy.',
            color: 'text-emerald-400'
        },
        {
            icon: Minimize2,
            title: t('landing.anti_detect.f4_title') || 'Overlay Tiêu Chuẩn Windows',
            desc: t('landing.anti_detect.f4_desc') || 'HUD sử dụng WPF Overlay — công nghệ cửa sổ trong suốt tiêu chuẩn của Windows, giống hệt cách Discord, OBS, hay Zalo hiển thị thông báo nổi. Không dùng kỹ thuật đặc biệt nào.',
            color: 'text-purple-400'
        }
    ];

    return (
        <section className="relative py-24 bg-black/60 border-y border-white/5 overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.03)_0%,_transparent_70%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div
                    ref={headerReveal.ref as React.RefObject<HTMLDivElement>}
                    className={`reveal text-center mb-16 ${headerReveal.visible ? 'is-visible' : ''}`}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/10 mb-4">
                        <ShieldCheck className="w-4 h-4 text-red-500" />
                        <span className="text-red-400/80 text-xs font-bold uppercase tracking-widest">
                            {t('landing.anti_detect.overline') || 'Bankroll Security'}
                        </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-mono uppercase tracking-tight font-black text-white leading-tight mb-5"
                        dangerouslySetInnerHTML={{ __html: t('landing.anti_detect.h2') || 'Desktop App — Thiết Kế <span class="text-red-500">An Toàn</span> Từ Nền Tảng.' }}
                    />
                    
                    <p className="text-white/50 text-sm max-w-2xl mx-auto leading-relaxed mb-4">
                        {t('landing.anti_detect.sub') || 'RobinHUD Desktop được xây dựng với nguyên tắc zero-intrusion: không inject, không hook, không tự động. Mọi thao tác đều do bạn chủ động kích hoạt, với timing tự nhiên như khi bạn tự ghi chép bằng tay.'}
                    </p>

                    <p className="text-white/30 text-xs max-w-xl mx-auto leading-relaxed italic"
                        dangerouslySetInnerHTML={{ __html: t('landing.anti_detect.web_alt') || 'Nếu vẫn lo ngại? <span class="text-white/50 font-semibold not-italic">Dùng bản Web</span> — toàn bộ AI phân tích, hand review, player notes đều dùng được trên trình duyệt. Không cần cài gì, không risk gì.' }}
                    />
                </div>

                <div
                    ref={gridReveal.ref as React.RefObject<HTMLDivElement>}
                    className={`reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16 ${gridReveal.visible ? 'is-visible' : ''}`}
                >
                    {FEATURES.map((feat, i) => (
                        <div
                            key={i}
                            className="relative group rounded-2xl border border-white/10 bg-black/40 p-6 sm:p-8 hover:bg-white/[0.03] hover:border-white/20 transition-all duration-300"
                            style={{ transitionDelay: `${i * 100}ms` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                            <div className={`mb-6 p-4 rounded-xl inline-flex border border-white/5 bg-white/5 ${feat.color}`}>
                                <feat.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-mono uppercase tracking-tight font-black text-white mb-3">
                                {feat.title}
                            </h3>
                            <p className="text-sm text-white/40 leading-relaxed">
                                {feat.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Github Open Source Notice */}
                <div
                    ref={githubReveal.ref as React.RefObject<HTMLDivElement>}
                    className={`reveal max-w-3xl mx-auto ${githubReveal.visible ? 'is-visible' : ''}`}
                >
                    <div className="rounded-2xl border border-white/10 bg-black/80 p-8 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                        
                        <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/5 border border-white/10 mb-6">
                            <Github className="w-6 h-6 text-white/80" />
                        </div>
                        
                        <h3 className="text-xl font-mono uppercase tracking-tight font-black text-white mb-3">
                            {t('landing.anti_detect.github_title') || 'Mã Nguồn Mở & Minh Bạch'}
                        </h3>
                        
                        <p className="text-sm text-white/50 leading-relaxed mb-8 max-w-2xl mx-auto">
                            {t('landing.anti_detect.github_desc') || 'Không tin? Bạn có quyền đọc từng dòng code của RobinHUD. Chúng tôi mã nguồn mở phần Desktop App để bất kỳ ai cũng có thể tự build và tự kiểm chứng độ an toàn (Sạch 100% Virus/Trojans).'}
                        </p>
                        
                        <a
                            href="https://github.com/justpassingByte/RonbinHud"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                        >
                            <Github className="w-4 h-4" />
                            <span>{t('landing.anti_detect.github_btn') || 'Kiểm Chứng Tại GitHub'}</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
