import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('claridoc_token')?.value;
  const role = request.cookies.get('claridoc_role')?.value;
  const { pathname } = request.nextUrl;

  // 1. Protection de l'espace Admin (SUPERADMIN uniquement)
  if (pathname.startsWith('/admin')) {
    if (!token || role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. Protection de l'espace Dashboard (BOSS et ADMIN uniquement)
  if (pathname.startsWith('/dashboard')) {
    if (!token || (role !== 'BOSS' && role !== 'ADMIN')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. Redirection si déjà connecté (Login/Register)
  if (token && (pathname === '/login' || pathname === '/register')) {
    if (role === 'SUPERADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login', '/register'],
};
