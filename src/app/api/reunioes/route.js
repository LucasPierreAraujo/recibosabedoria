import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// ====================================================================
// GET - Listar todas as reuniões com suas presenças
// ====================================================================
export async function GET() {
  try {
    const reunioes = await prisma.reuniao.findMany({
      include: {
        presencas: {
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
        }
      },
      orderBy: {
        data: 'desc'
      }
    });

    // Formatar os dados para o formato esperado pelo frontend
    const reunioesFormatadas = reunioes.map(reuniao => ({
      id: reuniao.id,
      data: reuniao.data.toISOString().split('T')[0], // Formato YYYY-MM-DD
      grau: reuniao.grau,
      presencas: reuniao.presencas.reduce((acc, presenca) => {
        acc[presenca.membroId] = presenca.presente;
        return acc;
      }, {})
    }));

    return NextResponse.json(reunioesFormatadas);
  } catch (error) {
    console.error('Erro ao buscar reuniões:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar reuniões', details: error.message },
      { status: 500 }
    );
  }
}

// ====================================================================
// POST - Criar nova reunião
// ====================================================================
export async function POST(request) {
  try {
    const body = await request.json();
    const { data, grau } = body;

    if (!data || !grau) {
      return NextResponse.json(
        { error: 'Data e grau são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar grau
    const grausValidos = ['APRENDIZ', 'COMPANHEIRO', 'MESTRE'];
    if (!grausValidos.includes(grau)) {
      return NextResponse.json(
        { error: 'Grau inválido. Use APRENDIZ, COMPANHEIRO ou MESTRE' },
        { status: 400 }
      );
    }

    // Criar a reunião
    const reuniao = await prisma.reuniao.create({
      data: {
        data: new Date(data + 'T00:00:00'),
        grau
      }
    });

    return NextResponse.json({
      success: true,
      reuniao: {
        id: reuniao.id,
        data: reuniao.data.toISOString().split('T')[0],
        grau: reuniao.grau,
        presencas: {}
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar reunião:', error);
    return NextResponse.json(
      { error: 'Erro ao criar reunião', details: error.message },
      { status: 500 }
    );
  }
}

// ====================================================================
// DELETE - Excluir reunião
// ====================================================================
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da reunião é obrigatório' },
        { status: 400 }
      );
    }

    // Excluir a reunião (as presenças serão excluídas em cascata)
    await prisma.reuniao.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Reunião excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir reunião:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir reunião', details: error.message },
      { status: 500 }
    );
  }
}
