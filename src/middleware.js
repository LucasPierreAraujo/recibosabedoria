import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Só proteger rota dashboard
  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Verifica se o token é válido
    try {
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch (err) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/dashboard'],
};
