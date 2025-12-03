// app/api/membros/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/auth';

async function checkAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return false;

  const payload = await verifyToken(token);
  return payload ? true : false;
}

// GET - Listar membros
export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const membros = await prisma.membro.findMany({
      orderBy: { dataCadastro: 'desc' }
    });
    return NextResponse.json(membros);
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 });
  }
}

// POST - Adicionar
export async function POST(request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const membro = await prisma.membro.create({
      data: {
        nome: body.nome,
        grau: body.grau,
        status: body.status || 'ATIVO'
      }
    });
    return NextResponse.json({ success: true, membro });
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    return NextResponse.json({ error: 'Erro ao adicionar membro' }, { status: 500 });
  }
}

// PUT - Atualizar
export async function PUT(request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const membro = await prisma.membro.update({
      where: { id: body.id },
      data: {
        nome: body.nome,
        grau: body.grau,
        status: body.status
      }
    });
    return NextResponse.json({ success: true, membro });
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 404 });
  }
}

// DELETE - Remover
export async function DELETE(request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    await prisma.membro.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 });
  }
}
