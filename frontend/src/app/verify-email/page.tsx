'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { API } from '@/lib/api';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch(`${API.base}/api/auth/verify-email?token=${token}`);
                const json = await res.json();
                if (json.success) {
                    setStatus('success');
                    setMessage('Your email has been verified! You can now sign in.');
                } else {
                    setStatus('error');
                    setMessage(json.error || 'Verification failed.');
                }
            } catch {
                setStatus('error');
                setMessage('Network error. Please try again.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-[#0a0f0c] flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Glow */}
                <div className="absolute -inset-px bg-gradient-to-br from-gold/10 via-transparent to-emerald-500/5 rounded-3xl blur-2xl opacity-40" />

                <div className="relative bg-[#111]/90 border border-white/8 rounded-3xl p-8 shadow-[0_30px_70px_rgba(0,0,0,0.5)] text-center">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-gold to-yellow-600 rounded-2xl flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(212,175,55,0.35)]">
                            <Sparkles className="w-7 h-7 text-black" />
                        </div>
                        <h1 className="text-lg font-bold text-white tracking-[0.15em] font-serif">VILLAINVAULT</h1>
                    </div>

                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-gold animate-spin" />
                            <p className="text-gray-400 text-sm">Verifying your email...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-white font-bold text-lg">Email Verified!</h2>
                            <p className="text-gray-400 text-sm">{message}</p>
                            <Link
                                href="/"
                                className="mt-4 bg-gradient-to-r from-gold to-yellow-500 text-black font-bold py-3 px-8 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(212,175,55,0.25)]"
                            >
                                Go to Sign In
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
                                <XCircle className="w-8 h-8 text-red-400" />
                            </div>
                            <h2 className="text-white font-bold text-lg">Verification Failed</h2>
                            <p className="text-gray-400 text-sm">{message}</p>
                            <Link
                                href="/"
                                className="mt-4 text-gold text-sm hover:underline"
                            >
                                Back to Home
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0a0f0c] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
