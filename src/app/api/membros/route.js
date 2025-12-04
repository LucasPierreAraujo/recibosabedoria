// app/api/membros/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET - Listar todos os membros
export async function GET() {
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

// POST - Adicionar novo membro
export async function POST(request) {
  try {
    const body = await request.json();
    
    const membro = await prisma.membro.create({
      data: {
        nome: body.nome,
        grau: body.grau,
        status: body.status || 'ATIVO',
        cim: body.cim || null,
        cargo: body.cargo || null,
        assinaturaUrl: body.assinaturaUrl || null,
        dataIniciacao: body.dataIniciacao || null,
        dataFiliacao: body.dataFiliacao || null,
        dataPassagemGrau: body.dataPassagemGrau || null,
        dataElevacao: body.dataElevacao || null
      }
    });
    
    return NextResponse.json({ success: true, membro });
  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    return NextResponse.json({ error: 'Erro ao adicionar membro' }, { status: 500 });
  }
}

// PUT - Atualizar membro
export async function PUT(request) {
  try {
    const body = await request.json();
    
    const membro = await prisma.membro.update({
      where: { id: body.id },
      data: {
        nome: body.nome,
        grau: body.grau,
        status: body.status,
        cim: body.cim || null,
        cargo: body.cargo || null,
        assinaturaUrl: body.assinaturaUrl || null,
        dataIniciacao: body.dataIniciacao || null,
        dataFiliacao: body.dataFiliacao || null,
        dataPassagemGrau: body.dataPassagemGrau || null,
        dataElevacao: body.dataElevacao || null
      }
    });
    
    return NextResponse.json({ success: true, membro });
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 404 });
  }
}

// DELETE - Remover membro
export async function DELETE(request) {
  try {
    const body = await request.json();
    
    await prisma.membro.delete({
      where: { id: body.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 });
  }
}