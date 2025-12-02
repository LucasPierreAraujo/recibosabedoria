import { NextResponse } from 'next/server';

const MASTER_USER = {
  username: 'SabedoriaDeSalomao',
  password: 'Sabedoria2025@'
};

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (username === MASTER_USER.username && password === MASTER_USER.password) {
      return NextResponse.json({ 
        success: true, 
        message: 'Login realizado com sucesso' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Usuário ou senha incorretos' 
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erro no servidor' 
    }, { status: 500 });
  }
}