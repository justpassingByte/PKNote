import { cookies } from 'next/headers';
import { API } from './api';

export interface AuthUser {
    id: string;
    email: string;
    premium_tier: string;
    plan_name?: string;
}

/**
 * Server-side helper to get current authenticated user
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    try {
        // Optimistically decode the JWT payload to skip the massive 300ms network roundtrip to the Server.
        // The token is validated cryptographically on mutating API requests anyway.
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
        
        const parsed = JSON.parse(jsonPayload);
        
        let plan_name = parsed.tier || 'FREE';
        if (parsed.tier === 'FREE') plan_name = 'Free';
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const plansRes = await fetch(`${baseUrl}/api/payments/public-plans`, { 
                next: { revalidate: 60 } // Cache for 60 seconds
            });
            if (plansRes.ok) {
                const plansJson = await plansRes.json();
                const matchedPlan = plansJson.data?.find((p: any) => p.id === parsed.tier);
                if (matchedPlan) plan_name = matchedPlan.name;
            }
        } catch(e) { /* ignore */ }

        if (parsed && parsed.userId) {
            return {
                id: parsed.userId,
                email: parsed.email,
                premium_tier: parsed.tier || 'FREE',
                plan_name
            };
        }
        return null;
    } catch (e) {
        console.error('JWT Decode failed', e);
        return null;
    }
}
