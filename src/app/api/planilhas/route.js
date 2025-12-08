// app/api/planilhas/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET - Listar todas as planilhas (agrupadas por ano)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ano = searchParams.get('ano');
    const mes = searchParams.get('mes');
    
    if (ano && mes) {
      // Buscar planilha específica
      const planilha = await prisma.planilhaFinanceira.findUnique({
        where: {
          mes_ano: {
            mes: parseInt(mes),
            ano: parseInt(ano)
          }
        },
        include: {
          receitas: true,
          despesas: true,
          pagamentos: {
            include: {
              membro: true
            }
          }
        }
      });
      return NextResponse.json(planilha);
    }
    
    // Listar todas as planilhas
    const planilhas = await prisma.planilhaFinanceira.findMany({
      orderBy: [
        { ano: 'desc' },
        { mes: 'desc' }
      ],
      include: {
        _count: {
          select: {
            receitas: true,
            despesas: true,
            pagamentos: true
          }
        }
      }
    });
    
    return NextResponse.json(planilhas);
  } catch (error) {
    console.error('Erro ao buscar planilhas:', error);
    return NextResponse.json({ error: 'Erro ao buscar planilhas' }, { status: 500 });
  }
}

// POST - Criar nova planilha
export async function POST(request) {
  try {
    const { mes, ano, valorMensalidade } = await request.json();
    
    // Verificar se já existe
    const existe = await prisma.planilhaFinanceira.findUnique({
      where: {
        mes_ano: { mes, ano }
      }
    });
    
    if (existe) {
      return NextResponse.json({ error: 'Planilha já existe para este mês/ano' }, { status: 400 });
    }
    
    // Buscar membros ativos
    const membrosAtivos = await prisma.membro.findMany({
      where: { status: 'ATIVO', grau: { not: 'CANDIDATO' } }
    });
    
    // Criar planilha
    const planilha = await prisma.planilhaFinanceira.create({
      data: {
        mes,
        ano,
        valorMensalidade
      }
    });
    
    // Verificar inadimplentes do mês anterior
    const mesAnterior = mes === 1 ? 12 : mes - 1;
    const anoAnterior = mes === 1 ? ano - 1 : ano;
    
    const planilhaAnterior = await prisma.planilhaFinanceira.findUnique({
      where: {
        mes_ano: { mes: mesAnterior, ano: anoAnterior }
      },
      include: {
        pagamentos: true
      }
    });
    
    // Identificar quem não pagou no mês anterior
    let inadimplentes = [];
    if (planilhaAnterior) {
      const pagadores = planilhaAnterior.pagamentos.map(p => p.membroId);
      inadimplentes = membrosAtivos.filter(m => !pagadores.includes(m.id));
    }
    
    return NextResponse.json({ 
      success: true, 
      planilha,
      inadimplentes: inadimplentes.map(i => ({
        id: i.id,
        nome: i.nome,
        mesesDevendo: 1
      }))
    });
    
  } catch (error) {
    console.error('Erro ao criar planilha:', error);
    return NextResponse.json({ error: 'Erro ao criar planilha' }, { status: 500 });
  }
}

// DELETE - Excluir planilha
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    
    await prisma.planilhaFinanceira.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir planilha:', error);
    return NextResponse.json({ error: 'Erro ao excluir planilha' }, { status: 500 });
  }
}