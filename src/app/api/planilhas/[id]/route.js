// app/api/planilhas/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const planilha = await prisma.planilhaFinanceira.findUnique({
      where: { id },
      include: {
        receitas: {
          orderBy: { data: 'desc' }
        },
        despesas: {
          orderBy: { data: 'desc' }
        },
        pagamentos: {
          include: {
            membro: true
          },
          orderBy: { dataPagamento: 'desc' }
        }
      }
    });
    
    if (!planilha) {
      return NextResponse.json(
        { error: 'Planilha não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(planilha);
  } catch (error) {
    console.error('Erro ao buscar planilha:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar planilha' },
      { status: 500 }
    );
  }
}