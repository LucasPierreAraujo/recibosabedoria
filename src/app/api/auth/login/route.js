// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword, createToken } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    // Busca usuário no banco
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Usuário ou senha incorretos' 
      }, { status: 401 });
    }
    
    // Verifica a senha
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        message: 'Usuário ou senha incorretos' 
      }, { status: 401 });
    }
    
    // Cria token JWT
    const token = await createToken({ 
      userId: user.id, 
      username: user.username 
    });
    
    // Cria resposta com cookie HTTP-only
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login realizado com sucesso',
      user: { username: user.username }
    });
    
    // Define cookie seguro
    response.cookies.set('auth-token', token, {
      httpOnly: true,      // Não acessível via JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS em produção
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro no servidor' 
    }, { status: 500 });
  }
}