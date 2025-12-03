// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword, createToken } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Usuário ou senha incorretos' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Usuário ou senha incorretos' }, { status: 401 });
    }

    const token = await createToken({ userId: user.id, username: user.username });

    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: { username: user.username }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ success: false, message: 'Erro no servidor' }, { status: 500 });
  }
}
