import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// ====================================================================
// POST - Salvar/Atualizar presenças de uma reunião
// ====================================================================
export async function POST(request) {
  try {
    const body = await request.json();
    const { reuniaoId, presencas } = body;

    if (!reuniaoId || !presencas) {
      return NextResponse.json(
        { error: 'reuniaoId e presencas são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a reunião existe
    const reuniao = await prisma.reuniao.findUnique({
      where: { id: reuniaoId }
    });

    if (!reuniao) {
      return NextResponse.json(
        { error: 'Reunião não encontrada' },
        { status: 404 }
      );
    }

    // Processar cada presença
    // presencas é um objeto onde a chave é o membroId e o valor é boolean
    const operacoes = Object.entries(presencas).map(async ([membroId, presente]) => {
      // Usar upsert para criar ou atualizar a presença
      return prisma.presenca.upsert({
        where: {
          reuniaoId_membroId: {
            reuniaoId,
            membroId
          }
        },
        update: {
          presente
        },
        create: {
          reuniaoId,
          membroId,
          presente
        }
      });
    });

    // Executar todas as operações
    await Promise.all(operacoes);

    return NextResponse.json({
      success: true,
      message: 'Presenças salvas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar presenças:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar presenças', details: error.message },
      { status: 500 }
    );
  }
}

// ====================================================================
// GET - Buscar presenças de uma reunião específica
// ====================================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reuniaoId = searchParams.get('reuniaoId');

    if (!reuniaoId) {
      return NextResponse.json(
        { error: 'reuniaoId é obrigatório' },
        { status: 400 }
      );
    }

    const presencas = await prisma.presenca.findMany({
      where: { reuniaoId },
      include: {
        membro: {
          select: {
            id: true,
            nome: true,
            grau: true,
            cim: true
          }
        }
      }
    });

    // Formatar para o formato esperado pelo frontend
    const presencasFormatadas = presencas.reduce((acc, presenca) => {
      acc[presenca.membroId] = presenca.presente;
      return acc;
    }, {});

    return NextResponse.json(presencasFormatadas);

  } catch (error) {
    console.error('Erro ao buscar presenças:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar presenças', details: error.message },
      { status: 500 }
    );
  }
}
