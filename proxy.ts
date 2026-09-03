import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { accueilPourRole } from '@/lib/roles';

export function proxy(request: NextRequest) {
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

  // 3. Redirection si déjà connecté (Login/Register).
  //
  // On ne renvoie QUE vers une page que le rôle a le droit d'atteindre. La version
  // précédente envoyait vers /dashboard tout porteur de jeton non-SUPERADMIN : un
  // compte USER y était refusé par la règle 2, renvoyé ici, réexpédié vers
  // /dashboard… boucle infinie. Un rôle sans page d'accueil reste donc sur /login,
  // où la page lui explique qu'il n'a pas accès au portail.
  if (token && (pathname === '/login' || pathname === '/register')) {
    const accueil = accueilPourRole(role);
    if (accueil) {
      return NextResponse.redirect(new URL(accueil, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login', '/register'],
};
