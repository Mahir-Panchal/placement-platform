import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/register'];

export function proxy(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value;
    const { pathname } = request.nextUrl;

    if (protectedRoutes.some(route => pathname.startsWith(route))) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    if (authRoutes.includes(pathname)) {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};