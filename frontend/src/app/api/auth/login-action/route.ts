import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        const res = await fetch(`${API.base}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, deviceId: 'web-client' }),
        });

        const json = await res.json();

        if (!json.success) {
            return NextResponse.json({
                success: false,
                error: json.error || 'Login failed',
                code: json.code || undefined,
            }, { status: res.status });
        }

        const secure = process.env.NEXT_PUBLIC_API_URL?.startsWith('https') || false;

        const response = NextResponse.json({ success: true });
        response.cookies.set('token', json.token, {
            httpOnly: true,
            secure,
            maxAge: 7 * 24 * 60 * 60,
            sameSite: 'lax',
            path: '/',
        });

        return response;
    } catch (err) {
        return NextResponse.json({ success: false, error: 'Network error during login' });
    }
}
