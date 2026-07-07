'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Settings, Menu, X, Sparkles, Activity, History, CreditCard, LayoutDashboard, Crosshair } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TemplateManagerModal } from '@/components/forms/TemplateManagerModal';
import { ProfileHUDModal } from '@/components/layout/ProfileHUDModal';
import { useLoginModal } from '@/context/LoginModalContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSelector } from '@/components/forms/LanguageSelector';

export function Header({
    onSettingsClick: externalSettingsClick,
    user: user,
}: {
    onSettingsClick?: () => void;
    user?: { email: string; premium_tier: string; plan_name?: string } | null;
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isAITuningOpen, setIsAITuningOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const pathname = usePathname();
    const { openLogin } = useLoginModal();
    const { t } = useLanguage();

    const navLinks = [
        { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { name: t('nav.players'), href: '/players', icon: User },
        { name: t('nav.hands'), href: '/analyzer', icon: Activity },
        { name: 'GTO Oracle', href: '/gto-oracle', icon: Crosshair },
        { name: t('nav.history'), href: '/history', icon: History },
        { name: t('nav.pricing') || 'Nâng Cấp', href: '/pricing', icon: CreditCard },
    ];

    const isActive = (href: string) => pathname === href;

    const handleSettingsClick = () => {
        if (externalSettingsClick) {
            externalSettingsClick();
        } else {
            // Settings gear opens the same AITuningModal as the Dashboard button
            setIsAITuningOpen(true);
        }
    };

    return (
        <>
            <header className="fixed top-3 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-11/12 max-w-6xl bg-card/40 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 sm:py-2 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                {/* Left: Logo */}
                <div className="flex items-center shrink-0 flex-1">
                    <Link href="/" className="flex items-center group">
                        <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-600 rounded flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Sparkles className="w-4 h-4 text-black" />
                        </div>
                    </Link>
                </div>

                {/* Center: Desktop nav links */}
                <nav className="hidden lg:flex flex-none items-center justify-center space-x-1 whitespace-nowrap overflow-hidden">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${isActive(link.href)
                                ? "bg-gold text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                                : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                        >
                            <link.icon className="w-4 h-4" />
                            <span className="hidden xl:inline">{link.name}</span>
                            <span className="xl:hidden">{link.name.split(' ')[0]}</span>
                        </Link>
                    ))}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center justify-end space-x-2 md:space-x-3 shrink-0 flex-1">
                    <LanguageSelector className="hidden lg:flex" />
                    {/* Settings gear → opens AITuningModal (same as Dashboard) */}
                    <button
                        onClick={handleSettingsClick}
                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gold hover:bg-gold/5 rounded-full transition-all"
                        aria-label="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    {/* User Profile Button */}
                    {user ? (
                        <button
                            onClick={() => setIsProfileOpen(true)}
                            className="flex items-center gap-2 pl-2 pr-2 xl:pr-4 py-1.5 bg-gold/10 border border-gold/30 rounded-full hover:bg-gold/20 hover:border-gold/50 transition-all group shadow-[0_0_10px_rgba(250,204,21,0.08)]"
                            title="Profile & Plan"
                        >
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gold/60 to-amber-700/60 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-black text-black">{user.email.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="hidden xl:block text-[10px] font-black uppercase tracking-widest text-gold truncate xl:max-w-[140px] pr-1">{user.plan_name || user.premium_tier}</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => openLogin('Sign in to access your AI poker analytics, player notes, and hand analysis.')}
                            className="flex items-center justify-center w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-gradient-to-b from-felt-light to-felt-dark text-white border border-felt-light shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform"
                            title="Sign In"
                        >
                            <User className="w-4 h-4" />
                        </button>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-300 hover:text-white rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile slide-down menu */}
            {mobileMenuOpen && (
                <div className="fixed top-[70px] sm:top-[90px] left-1/2 -translate-x-1/2 z-40 w-[95%] bg-card/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8)] lg:hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col gap-1.5">
                        {user && (
                            <button
                                onClick={() => { setIsProfileOpen(true); setMobileMenuOpen(false); }}
                                className="flex items-center justify-between px-4 py-3 mb-2 bg-gold/5 rounded-xl border border-gold/20 hover:bg-gold/10 transition-all"
                            >
                                <span className="text-xs text-gray-400">{user.email}</span>
                                <span className="text-[10px] text-gold font-bold uppercase tracking-widest">{user.plan_name || user.premium_tier}</span>
                            </button>
                        )}
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 min-h-[44px] text-sm rounded-xl transition-all ${isActive(link.href)
                                    ? "bg-gold text-black font-bold"
                                    : "text-gray-300 hover:text-white hover:bg-white/5"}`}
                            >
                                <link.icon className={`w-5 h-5 ${isActive(link.href) ? "text-black" : "text-gold"}`} />
                                {link.name}
                            </Link>
                        ))}
                        <div className="flex items-center gap-3 px-4 py-3 pt-4 border-t border-white/5 mt-2 justify-between">
                            <LanguageSelector />
                            <button
                                onClick={() => { handleSettingsClick(); setMobileMenuOpen(false); }}
                                className="flex items-center gap-2 text-sm text-gray-300 hover:text-gold hover:bg-gold/5 rounded-xl transition-all"
                            >
                                <Settings className="w-5 h-5 text-gray-400" />
                                {t('nav.settings')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Neural Tuning Modal — same component/design as Dashboard */}
            <Modal
                isOpen={isAITuningOpen}
                onClose={() => setIsAITuningOpen(false)}
                title={t('settings.title')}
                size="xl"
            >
                <TemplateManagerModal onClose={() => setIsAITuningOpen(false)} />
            </Modal>

            {/* Profile HUD Modal */}
            <ProfileHUDModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user}
            />
        </>
    );
}
