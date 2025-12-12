import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// =====================================================================
// GET: Buscar todas as planilhas OU uma planilha específica por ID
// =====================================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Se tem ID, busca planilha específica
    if (id) {
      const planilha = await prisma.planilhaFinanceira.findUnique({
        where: { id },
        include: {
          pagamentos: {
            include: {
              membro: true,
            },
          },
          receitas: true,
          despesas: true,
          troncos: true,
          doacoesFilantropicas: true,
        },
      });

      if (!planilha) {
        return NextResponse.json({ error: 'Planilha não encontrada' }, { status: 404 });
      }

      return NextResponse.json(planilha);
    }

    // Se não tem ID, lista todas as planilhas (SEM includes para evitar erros)
    const planilhas = await prisma.planilhaFinanceira.findMany({
      orderBy: [
        { ano: 'desc' },
        { mes: 'desc' },
      ],
      select: {
        id: true,
        mes: true,
        ano: true,
        valorMensalidade: true,
        valorMensalidadeExcecao: true,
        saldoInicialCaixa: true,
        saldoInicialTronco: true,
        totalReceitas: true,
        totalDespesas: true,
        saldoFinalCaixa: true,
        saldoFinalTronco: true,
        totalTroncoRecebido: true,
        totalDoacoesFilantropicas: true,
        saldoFinal: true,
        createdAt: true,
        _count: {
          select: { 
            pagamentos: true 
          }
        }
      }
    });

    return NextResponse.json(planilhas);
  } catch (error) {
    console.error('Erro ao buscar planilha(s):', error);
    return NextResponse.json(
      { error: 'Erro ao buscar planilha(s)', details: error.message },
      { status: 500 }
    );
  }
}

// =====================================================================
// POST: Criar uma nova planilha (COM REGISTRO DE INADIMPLÊNCIA INDIVIDUAL)
// =====================================================================
export async function POST(request) {
  try {
    const { 
        mes, 
        ano, 
        valorMensalidade, // Já é float puro
        saldoInicialCaixa, // Já é float puro
        saldoInicialTronco, // Já é float puro
        valorMensalidadeExcecao, // Já é float puro
        membrosExcecaoIds, // String CSV
        // ESTE É O OBJETO DE INADIMPLÊNCIA CORRIGIDO PELO FRONTEND
        inadimplenciaPorMembro 
    } = await request.json();
    
    // 1. Verificação de existência
    const existe = await prisma.planilhaFinanceira.findFirst({
      where: {
        mes: mes,
        ano: ano
      }
    });
    
    if (existe) {
      return NextResponse.json({ error: 'Planilha já existe para este mês/ano' }, { status: 400 });
    }
    
    // 2. Criação da Planilha
    
    // O Frontend já está enviando floats aqui, mas vamos garantir que o Prisma os receba como Number,
    // caso o tipo no schema seja Decimal, eles serão tratados corretamente.
    const caixaInicial = saldoInicialCaixa || 0;
    const troncoInicial = saldoInicialTronco || 0;
    
    const excecaoValor = valorMensalidadeExcecao > 0 ? valorMensalidadeExcecao : null; 
    
    const planilha = await prisma.planilhaFinanceira.create({
      data: {
        mes,
        ano,
        valorMensalidade, // Usa o float enviado
        saldoInicialCaixa: caixaInicial,
        saldoInicialTronco: troncoInicial,
        saldoFinalCaixa: caixaInicial, 
        saldoFinalTronco: troncoInicial,
        saldoFinal: caixaInicial + troncoInicial,
        
        valorMensalidadeExcecao: excecaoValor,
        membrosExcecaoIds: membrosExcecaoIds 
      }
    });
    
    const pagamentosInadimplencia = [];
    const mesesReferencia = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    
    // 3. Registro da Inadimplência
    if (inadimplenciaPorMembro && Object.keys(inadimplenciaPorMembro).length > 0) {
        
        for (const membroId in inadimplenciaPorMembro) {
            // O frontend envia [{mes: X, ano: Y}, ...]
            const mesesDevidos = inadimplenciaPorMembro[membroId]; 
            
            if (mesesDevidos.length > 0) {
                
                // Formata a string de meses referentes (ex: JAN/24, FEV/24)
                const mesesRefStr = mesesDevidos.map(m => 
                    `${mesesReferencia[m.mes - 1]}/${String(m.ano).slice(-2)}`
                ).join(', ');
                
                pagamentosInadimplencia.push({
                    planilhaId: planilha.id,
                    membroId: membroId,
                    // Marca como negativo para indicar DÍVIDA (registro de inadimplência)
                    quantidadeMeses: mesesDevidos.length * -1, 
                    valorPago: 0, // Inadimplência não tem valor pago
                    mesesReferentes: mesesRefStr,
                    dataPagamento: new Date(),
                });
            }
        }
        
        if (pagamentosInadimplencia.length > 0) {
            await prisma.pagamentoMensalidade.createMany({
                data: pagamentosInadimplencia,
            });
        }
    }
    
    return NextResponse.json({ 
      success: true, 
      planilha
    });
    
  } catch (error) {
    console.error('Erro ao criar planilha:', error);
    return NextResponse.json(
        { error: 'Erro ao criar planilha', details: error.message }, 
        { status: 500 }
    );
  }
}

// =====================================================================
// DELETE: Excluir uma planilha
// =====================================================================
export async function DELETE(request) {
  try {
    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: 'ID da planilha é obrigatório' }, { status: 400 });
    }
    
    await prisma.planilhaFinanceira.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true, message: 'Planilha excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir planilha:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir planilha.' },
      { status: 500 }
    );
  }
}