'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Lock, Mail, Loader2, X, Shield, CheckCircle2, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: string;
}

type ModalState = 'auth' | 'verify-sent' | 'forgot-password' | 'reset-sent';

export function LoginModal({ isOpen, onClose, reason }: LoginModalProps) {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [modalState, setModalState] = useState<ModalState>('auth');
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setIsLoading(false);
            setModalState('auth');
            setUnverifiedEmail(null);
            setResendSuccess(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const endpoint = tab === 'login' ? '/api/auth/login-action' : '/api/auth/register-action';
            const res = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const json = await res.json();

            if (!json.success) {
                // Handle unverified email error
                if (json.code === 'EMAIL_NOT_VERIFIED') {
                    setUnverifiedEmail(email);
                    setError(json.error);
                    setIsLoading(false);
                    return;
                }
                setError(json.error || (tab === 'login' ? 'Login failed' : 'Registration failed'));
                setIsLoading(false);
            } else if (json.requiresVerification) {
                // Registration success — show verify email state
                setModalState('verify-sent');
                setIsLoading(false);
            } else {
                // Login success — reload page
                window.location.reload();
            }
        } catch {
            setError('Network error. Please try again.');
            setIsLoading(false);
        }
    }

    async function handleResendVerification() {
        if (!unverifiedEmail) return;
        setResendLoading(true);
        setResendSuccess(false);
        try {
            const res = await fetch('/api/auth/resend-verification-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: unverifiedEmail }),
            });
            const json = await res.json();
            if (json.success) {
                setResendSuccess(true);
            }
        } catch {
            // Silently fail
        } finally {
            setResendLoading(false);
        }
    }

    async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;

        try {
            const res = await fetch('/api/auth/forgot-password-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const json = await res.json();
            if (json.success) {
                setModalState('reset-sent');
            } else {
                setError(json.error || 'Failed to send reset email');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-sm animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Glow */}
                <div className="absolute -inset-px bg-gradient-to-br from-gold/20 via-transparent to-emerald-500/10 rounded-3xl blur-xl opacity-60" />

                <div className="relative bg-[#0a0f0c]/95 border border-white/10 rounded-3xl p-7 shadow-[0_30px_70px_rgba(0,0,0,0.7)]">
                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Header */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-gold to-yellow-600 rounded-2xl flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(212,175,55,0.35)]">
                            <Sparkles className="w-7 h-7 text-black" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-[0.15em] font-serif">VILLAINVAULT</h2>
                        <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest">Elite AI Poker Intelligence</p>
                    </div>

                    {/* ──── VERIFY SENT STATE ──── */}
                    {modalState === 'verify-sent' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Check Your Email</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                We&apos;ve sent a verification link to your email. Click it to activate your account.
                            </p>
                            <button
                                onClick={() => { setModalState('auth'); setTab('login'); }}
                                className="text-gold text-sm hover:underline"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    )}

                    {/* ──── RESET SENT STATE ──── */}
                    {modalState === 'reset-sent' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Reset Link Sent</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                If that email exists in our system, you&apos;ll receive a password reset link shortly.
                            </p>
                            <button
                                onClick={() => { setModalState('auth'); setTab('login'); }}
                                className="text-gold text-sm hover:underline"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    )}

                    {/* ──── FORGOT PASSWORD STATE ──── */}
                    {modalState === 'forgot-password' && (
                        <div>
                            <h3 className="text-base font-bold text-white mb-1 text-center">Reset Password</h3>
                            <p className="text-xs text-gray-500 text-center mb-5">
                                Enter your email and we&apos;ll send you a reset link.
                            </p>

                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] py-2.5 px-3 rounded-xl flex items-center gap-2">
                                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <div className="relative group">
                                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-gold transition-colors" />
                                        <input
                                            required type="email" name="email"
                                            placeholder="Enter your email"
                                            className="w-full bg-black/40 border border-white/8 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={isLoading} type="submit"
                                    className="w-full bg-gradient-to-r from-gold to-yellow-500 text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_8px_20px_rgba(212,175,55,0.25)] mt-2"
                                >
                                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
                                </button>
                            </form>

                            <button
                                onClick={() => { setModalState('auth'); setError(null); }}
                                className="w-full text-center text-gold text-xs mt-4 hover:underline"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    )}

                    {/* ──── AUTH STATE (Login/Register) ──── */}
                    {modalState === 'auth' && (
                        <>
                            {/* Reason banner */}
                            {reason && (
                                <div className="mb-5 flex items-center gap-2 bg-gold/5 border border-gold/20 rounded-xl px-4 py-3">
                                    <Shield className="w-4 h-4 text-gold shrink-0" />
                                    <p className="text-[11px] text-gold/90 leading-snug">{reason}</p>
                                </div>
                            )}

                            {/* Tab toggle */}
                            <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 mb-5">
                                <button type="button"
                                    onClick={() => { setTab('login'); setError(null); setUnverifiedEmail(null); }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tab === 'login' ? 'bg-gold text-black shadow' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {t('auth_modal.sign_in')}
                                </button>
                                <button type="button"
                                    onClick={() => { setTab('register'); setError(null); setUnverifiedEmail(null); }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tab === 'register' ? 'bg-gold text-black shadow' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {t('auth_modal.register')}
                                </button>
                            </div>

                            {/* Form */}
                            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] py-2.5 px-3 rounded-xl flex items-center gap-2">
                                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse shrink-0" />
                                        <span className="flex-1">{error}</span>
                                    </div>
                                )}

                                {/* Resend verification banner */}
                                {unverifiedEmail && (
                                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
                                        <RotateCcw className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                        <div className="flex-1">
                                            {resendSuccess ? (
                                                <span className="text-emerald-400 text-[11px]">Verification email sent!</span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleResendVerification}
                                                    disabled={resendLoading}
                                                    className="text-yellow-400 text-[11px] hover:underline disabled:opacity-50"
                                                >
                                                    {resendLoading ? 'Sending...' : 'Resend verification email'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="relative group">
                                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 ml-1">{t('auth_modal.email') || "Email"}</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-gold transition-colors" />
                                        <input
                                            required type="text" name="email"
                                            placeholder={t('auth_modal.email') || "Enter email"}
                                            className="w-full bg-black/40 border border-white/8 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="relative group">
                                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 ml-1">{t('auth_modal.password') || "Password"}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-gold transition-colors" />
                                        <input
                                            required type="password" name="password"
                                            placeholder="••••••••"
                                            className="w-full bg-black/40 border border-white/8 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Forgot password link */}
                                {tab === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => { setModalState('forgot-password'); setError(null); }}
                                        className="text-[11px] text-gray-500 hover:text-gold transition-colors ml-1"
                                    >
                                        Forgot password?
                                    </button>
                                )}

                                <button
                                    disabled={isLoading} type="submit"
                                    className="w-full bg-gradient-to-r from-gold to-yellow-500 text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_8px_20px_rgba(212,175,55,0.25)] mt-2"
                                >
                                    {isLoading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> {tab === 'login' ? t('auth_modal.signing_in') : t('auth_modal.registering') || "Authenticating..."}</>
                                        : <><Lock className="w-4 h-4" /> {tab === 'login' ? t('auth_modal.sign_in') : t('auth_modal.register')} </>
                                    }
                                </button>
                            </form>

                            <p className="text-center text-[10px] text-gray-600 mt-5">
                                {t('auth_modal.browse_freely') || "Browse freely · Sign in to unlock AI features"}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
