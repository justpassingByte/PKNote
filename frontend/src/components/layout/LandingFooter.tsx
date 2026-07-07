'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { Sparkles, Github, Mail } from 'lucide-react';

function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
}

export function LandingFooter() {
    const { t } = useLanguage();

    const SECTIONS = [
        { label: t('landing.nav.manifesto') || 'Tại Sao', id: 'manifesto' },
        { label: t('landing.nav.features') || 'Tính Năng', id: 'features' },
        { label: t('landing.nav.roadmap') || 'Lộ Trình', id: 'roadmap' },
        { label: t('landing.nav.pricing') || 'Bảng Giá', id: 'pricing' },
        { label: t('landing.nav.contact') || 'Liên Hệ', id: 'contact' },
    ];

    return (
        <footer className="relative z-10 border-t border-white/5 bg-black/80">
            <div className="max-w-7xl mx-auto px-6 py-14">
                {/* Top row — Brand + Nav + Social */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-5 h-5 text-yellow-500" />
                            <span className="font-black text-white tracking-widest text-sm">VILLAINVAULT</span>
                        </div>
                        <p className="text-xs text-white/30 leading-relaxed max-w-xs">
                            {t('landing.footer.tagline') || 'Két sắt AI đầu tiên cho poker Việt Nam. Memory + GTO + Exploit — tất cả trong một system.'}
                        </p>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
                            {t('landing.footer.nav_title') || 'Điều Hướng'}
                        </h4>
                        <ul className="space-y-2">
                            {SECTIONS.map(s => (
                                <li key={s.id}>
                                    <button
                                        onClick={() => scrollTo(s.id)}
                                        className="text-sm text-white/30 hover:text-white/70 transition-colors duration-200"
                                    >
                                        {s.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Account + Social */}
                    <div>
                        <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
                            {t('landing.footer.account_title') || 'Tài Khoản'}
                        </h4>
                        <ul className="space-y-2 mb-6">
                            <li>
                                <Link href="/login" className="text-sm text-white/30 hover:text-white/70 transition-colors duration-200">
                                    {t('landing.footer.login') || 'Đăng Nhập'}
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="text-sm text-white/30 hover:text-white/70 transition-colors duration-200">
                                    {t('landing.footer.register') || 'Đăng Ký'}
                                </Link>
                            </li>
                        </ul>

                        <div className="flex items-center gap-3">
                            <a
                                href="https://github.com/justpassingByte/RonbinHud"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg border border-white/10 bg-white/[0.03] text-white/30 hover:text-white/70 hover:border-white/20 transition-all duration-200"
                                aria-label="GitHub"
                            >
                                <Github className="w-4 h-4" />
                            </a>
                            <a
                                href="mailto:support@villianvault.com"
                                className="p-2 rounded-lg border border-white/10 bg-white/[0.03] text-white/30 hover:text-white/70 hover:border-white/20 transition-all duration-200"
                                aria-label="Email"
                            >
                                <Mail className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-xs text-white/20">
                        &copy; {new Date().getFullYear()} Villiant Vault. All rights reserved.
                    </span>
                    <div className="flex gap-5 text-xs text-white/20">
                        <a href="#" className="hover:text-white/50 transition-colors">{t('landing.footer.privacy') || 'Chính Sách Bảo Mật'}</a>
                        <a href="#" className="hover:text-white/50 transition-colors">{t('landing.footer.terms') || 'Điều Khoản'}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
