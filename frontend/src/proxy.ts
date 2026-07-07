import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Open-access proxy — no forced login redirects.
 * All routes are publicly browseable.
 * Only: redirect authenticated users away from /login & /register.
 */
const PUBLIC_ONLY_ROUTES = ['/login', '/register'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('token')?.value;

    // If already logged in and visiting login/register, bounce to dashboard
    const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.some(route => pathname.startsWith(route));
    if (isPublicOnlyRoute && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

/**
 * Only run on login/register routes (to redirect already-authed users away)
 */
export const config = {
    matcher: ['/login', '/login/:path*', '/register', '/register/:path*'],
};
