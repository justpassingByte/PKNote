import { NextRequest, NextResponse } from 'next/server';
import { API } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        const res = await fetch(`${API.base}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const json = await res.json();
        return NextResponse.json(json);
    } catch (err) {
        return NextResponse.json({ success: false, error: 'Network error' });
    }
}
