import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui-change-me'
);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Rotas públicas
  const publicPaths = ['/', '/login'];
  if (publicPaths.some(path => pathname.startsWith(path))) return NextResponse.next();

  // Pega token do cookie
  const token = request.cookies.get('auth-token')?.value;

  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  try {
    await jwtVerify(token, SECRET_KEY);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/membros/:path*', '/recibo/:path*']
};
