import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        const res = await fetch(`${API.base}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const json = await res.json();

        if (!json.success) {
            return NextResponse.json({ success: false, error: json.error || 'Registration failed' });
        }

        // No longer auto-login — user must verify email first
        return NextResponse.json({
            success: true,
            message: json.message,
            requiresVerification: true,
        });
    } catch (err) {
        return NextResponse.json({ success: false, error: 'Network error during registration' });
    }
}
