import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        const res = await fetch(`${API.base}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
        });

        const json = await res.json();
        return NextResponse.json(json, { status: res.status });
    } catch (err) {
        return NextResponse.json({ success: false, error: 'Network error' });
    }
}
