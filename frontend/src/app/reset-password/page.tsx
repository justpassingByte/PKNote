'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Lock, Loader2, Sparkles, CheckCircle2, XCircle } from 'lucide-react';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const json = await res.json();
            if (json.success) {
                setStatus('success');
            } else {
                setError(json.error || 'Reset failed');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-[#0a0f0c] flex items-center justify-center p-6">
                <div className="w-full max-w-sm text-center">
                    <div className="relative bg-[#111]/90 border border-white/8 rounded-3xl p-8 shadow-[0_30px_70px_rgba(0,0,0,0.5)]">
                        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-white font-bold text-lg mb-2">Invalid Link</h2>
                        <p className="text-gray-400 text-sm mb-4">This password reset link is invalid or has expired.</p>
                        <Link href="/" className="text-gold text-sm hover:underline">Back to Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f0c] flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <div className="absolute -inset-px bg-gradient-to-br from-gold/10 via-transparent to-emerald-500/5 rounded-3xl blur-2xl opacity-40" />

                <div className="relative bg-[#111]/90 border border-white/8 rounded-3xl p-8 shadow-[0_30px_70px_rgba(0,0,0,0.5)]">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-gold to-yellow-600 rounded-2xl flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(212,175,55,0.35)]">
                            <Sparkles className="w-7 h-7 text-black" />
                        </div>
                        <h1 className="text-lg font-bold text-white tracking-[0.15em] font-serif">VILLAINVAULT</h1>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-white font-bold text-lg mb-2">Password Reset!</h2>
                            <p className="text-gray-400 text-sm mb-4">Your password has been updated. You can now sign in.</p>
                            <Link
                                href="/"
                                className="inline-block bg-gradient-to-r from-gold to-yellow-500 text-black font-bold py-3 px-8 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(212,175,55,0.25)]"
                            >
                                Go to Sign In
                            </Link>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-white font-bold text-base text-center mb-1">Set New Password</h2>
                            <p className="text-gray-500 text-xs text-center mb-6">Enter your new password below.</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] py-2.5 px-3 rounded-xl flex items-center gap-2">
                                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <div className="relative group">
                                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-gold transition-colors" />
                                        <input
                                            required type="password" name="password" minLength={6}
                                            placeholder="••••••••"
                                            className="w-full bg-black/40 border border-white/8 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="relative group">
                                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-gold transition-colors" />
                                        <input
                                            required type="password" name="confirmPassword" minLength={6}
                                            placeholder="••••••••"
                                            className="w-full bg-black/40 border border-white/8 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={isLoading} type="submit"
                                    className="w-full bg-gradient-to-r from-gold to-yellow-500 text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_8px_20px_rgba(212,175,55,0.25)] mt-2"
                                >
                                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : 'Reset Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0f0c] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
