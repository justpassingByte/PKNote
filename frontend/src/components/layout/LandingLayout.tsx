import React from 'react';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { getAuthUser } from '@/lib/auth';

export async function LandingLayout({ children }: { children: React.ReactNode }) {
    const user = await getAuthUser();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-gold selection:text-black">
            {/* Background image — fixed, very subtle */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: "url('/landing_bg.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.18,
                }}
            />
            {/* Subtle vignette over the bg */}
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
                }}
            />

            <LandingHeader user={user} />
            <main className="relative z-10">
                {children}
            </main>

            <LandingFooter />
        </div>
    );
}
