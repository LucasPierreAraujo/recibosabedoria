import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword, createToken } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Busca usuário no banco
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Usuário ou senha incorretos' }, { status: 401 });
    }

    // Verifica a senha
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Usuário ou senha incorretos' }, { status: 401 });
    }

    // Cria token JWT
    const token = await createToken({ userId: user.id, username: user.username });

    // Cria resposta
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login realizado com sucesso',
      user: { username: user.username }
    });

    // Define cookie (substitua pelo que te passei)
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false,           // false no localhost
      sameSite: 'lax',         // ou 'strict'
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ success: false, message: 'Erro no servidor' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword, createToken } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ success: false, message: 'Usuário ou senha incorretos' }, { status: 401 });

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) return NextResponse.json({ success: false, message: 'Usuário ou senha incorretos' }, { status: 401 });

    const token = await createToken({ userId: user.id, username: user.username });

    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: { username: user.username }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false, // false em localhost
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/' // ⚠️ importante
    });

    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Erro no servidor' }, { status: 500 });
  }
}
