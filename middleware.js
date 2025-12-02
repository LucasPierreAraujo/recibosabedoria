// middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-aqui-change-me'
);

export async function middleware(request) {
  const token = request.cookies.get('auth-token');
  const { pathname } = request.nextUrl;
  
  // Rotas públicas
  const publicPaths = ['/login', '/'];
  
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Verifica autenticação para rotas protegidas
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    await jwtVerify(token.value, SECRET_KEY);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/membros/:path*',
    '/recibo/:path*'
  ]
};