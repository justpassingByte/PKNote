'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles, LayoutDashboard, MonitorDown } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSelector } from '@/components/forms/LanguageSelector';

/** Smooth-scroll to a section, accounting for the fixed header height */
function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const HEADER_OFFSET = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
}

export function LandingHeader({ user }: { user?: { email: string; premium_tier: string } | null }) {
    const { t } = useLanguage();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [clicking, setClicking] = useState('');

    const NAV_LINKS = [
        { name: t('landing.nav.manifesto') || 'Manifesto', id: 'manifesto' },
        { name: t('landing.nav.features') || 'Features', id: 'features' },
        { name: t('landing.nav.roadmap') || 'Roadmap', id: 'roadmap' },
        { name: t('landing.nav.pricing') || 'Pricing', id: 'pricing' },
        { name: t('landing.nav.contact') || 'Contact', id: 'contact' },
    ];

    // Pill indicator positioning
    const navRef = useRef<HTMLDivElement>(null);
    const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

    // Update pill position whenever active section changes
    useEffect(() => {
        const btn = btnRefs.current[activeSection];
        const nav = navRef.current;
        if (!btn || !nav) { setPillStyle(s => ({ ...s, opacity: 0 })); return; }
        const bRect = btn.getBoundingClientRect();
        const nRect = nav.getBoundingClientRect();
        setPillStyle({ left: bRect.left - nRect.left, width: bRect.width, opacity: 1 });
    }, [activeSection]);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });

        const observers: IntersectionObserver[] = [];
        NAV_LINKS.forEach(link => {
            const el = document.getElementById(link.id);
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveSection(link.id); },
                { threshold: 0.25, rootMargin: '-70px 0px -35% 0px' }
            );
            obs.observe(el);
            observers.push(obs);
        });

        return () => {
            window.removeEventListener('scroll', onScroll);
            observers.forEach(o => o.disconnect());
        };
    }, []);

    const handleClick = (id: string) => {
        setClicking(id);
        scrollTo(id);
        setTimeout(() => setClicking(''), 600);
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${isScrolled
                    ? 'bg-black/85 backdrop-blur-xl border-b border-white/8 py-3'
                    : 'bg-transparent py-6'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="group flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,196,0,0.25)] group-hover:scale-110 transition-transform duration-200">
                        <Sparkles className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-widest">VILLAINVAULT</span>
                </Link>

                {/* Desktop Nav */}
                <nav ref={navRef} className="hidden md:flex items-center relative">
                    {/* Sliding pill background */}
                    <div
                        className="absolute top-0 h-full rounded-lg bg-white/6 transition-all duration-300 ease-out pointer-events-none"
                        style={{
                            left: pillStyle.left,
                            width: pillStyle.width,
                            opacity: pillStyle.opacity,
                        }}
                    />

                    <div className="flex items-center space-x-1 relative z-10">
                        {NAV_LINKS.map((link) => {
                            const isActive = activeSection === link.id;
                            const isClicked = clicking === link.id;
                            return (
                                <button
                                    key={link.id}
                                    ref={el => { btnRefs.current[link.id] = el; }}
                                    onClick={() => handleClick(link.id)}
                                    className={`
                                        relative px-4 py-2 text-sm font-medium rounded-lg
                                        transition-all duration-200 cursor-pointer select-none
                                        ${isActive ? 'text-white' : 'text-white/40 hover:text-white/70'}
                                        ${isClicked ? 'scale-95' : 'scale-100'}
                                    `}
                                    style={{ background: 'none', border: 'none' }}
                                >
                                    {link.name}
                                    {/* Gold dot under active item */}
                                    <span
                                        className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 transition-all duration-300"
                                        style={{
                                            width: isActive ? '16px' : '0px',
                                            height: '2px',
                                            opacity: isActive ? 1 : 0,
                                        }}
                                    />
                                    {/* Click ripple flash */}
                                    {isClicked && (
                                        <span className="absolute inset-0 rounded-lg bg-white/10 animate-ping pointer-events-none" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="h-4 w-px bg-white/8 mx-3 relative z-10" />

                    <div className="relative z-10 mr-2">
                        <a
                            href="/download-app"
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all text-sm font-bold tracking-tight"
                        >
                            <MonitorDown className="w-4 h-4" />
                            <span className="hidden lg:inline">{t('landing.hero.cta_desktop') || "Tải Desktop App"}</span>
                        </a>
                    </div>

                    <div className="relative z-10 mr-4">
                        <LanguageSelector />
                    </div>

                    {user ? (
                        <Link
                            href="/dashboard"
                            className="relative z-10 flex items-center gap-2 bg-white/4 border border-white/8 text-white/60 text-sm font-bold px-5 py-2 rounded-full hover:bg-white/8 hover:text-white/80 transition-all"
                        >
                            <LayoutDashboard className="w-4 h-4 text-white/40" />
                            {t('landing.nav.dashboard') || 'Dashboard'}
                        </Link>
                    ) : (
                        <Link
                            href="/dashboard"
                            className="relative z-10 flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-sm font-bold px-6 py-2 rounded-full hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            {t('landing.nav.dashboard') || 'Dashboard'}
                        </Link>
                    )}
                </nav>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white/60 hover:text-white p-2 transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-black/96 backdrop-blur-xl border-b border-white/8 p-5 flex flex-col space-y-1">
                    {NAV_LINKS.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => { handleClick(link.id); setMobileMenuOpen(false); }}
                            className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === link.id
                                    ? 'text-white bg-white/6 border-l-2 border-yellow-400/60'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/4'
                                }`}
                            style={{ background: activeSection === link.id ? undefined : 'none', border: activeSection === link.id ? undefined : 'none' }}
                        >
                            {link.name}
                        </button>
                    ))}
                    <div className="pt-2 border-t border-white/6 mt-1 flex flex-col gap-2">
                        <div className="flex justify-end pr-2 mb-2">
                            <LanguageSelector />
                        </div>
                        {user ? (
                            <Link href="/dashboard" className="flex items-center justify-center gap-2 bg-white/6 text-white/70 font-bold py-3 rounded-xl text-sm" onClick={() => setMobileMenuOpen(false)}>
                                {t('landing.nav.dashboard') || 'Dashboard'}
                            </Link>
                        ) : (
                            <Link href="/dashboard" className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-3 rounded-xl text-sm" onClick={() => setMobileMenuOpen(false)}>
                                {t('landing.nav.dashboard') || 'Dashboard'}
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
