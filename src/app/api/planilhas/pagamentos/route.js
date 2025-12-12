// app/api/planilhas/pagamentos/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { recalcularTotais } from '../../../../lib/recalcularTotaisPlanilha';

// =====================================================================
// POST: Registrar pagamento de mensalidade
// =====================================================================
export async function POST(request) {
  try {
    const { planilhaId, membroId, quantidadeMeses, valorPago, mesesReferentes } = await request.json();
    
    // Validação
    if (!planilhaId || !membroId || !quantidadeMeses || valorPago === undefined || !mesesReferentes) {
      return NextResponse.json({ 
        error: 'Dados incompletos para registrar pagamento' 
      }, { status: 400 });
    }
    
    // Criar pagamento
    const pagamento = await prisma.pagamentoMensalidade.create({
      data: {
        planilhaId,
        membroId,
        quantidadeMeses,
        valorPago,
        mesesReferentes
      }
    });
    
    // Recalcular totais da planilha
    await recalcularTotais(planilhaId);
    
    return NextResponse.json({ 
      success: true, 
      pagamento 
    }); 
    
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar pagamento', details: error.message },
      { status: 500 }
    );
  }
}

// =====================================================================
// DELETE: Cancelar um pagamento
// =====================================================================
export async function DELETE(request) {
  try {
    const { pagamentoId, planilhaId } = await request.json();

    if (!pagamentoId || !planilhaId) {
      return NextResponse.json({ 
        error: 'IDs são obrigatórios para cancelar pagamento' 
      }, { status: 400 });
    }

    // Deletar pagamento
    await prisma.pagamentoMensalidade.delete({
      where: { id: pagamentoId }
    });

    // Recalcular totais após a exclusão
    await recalcularTotais(planilhaId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Pagamento cancelado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao cancelar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar pagamento', details: error.message },
      { status: 500 }
    );
  }
}

// =====================================================================
// PUT: Atualizar um pagamento (usado para atualizar inadimplência)
// =====================================================================
export async function PUT(request) {
  try {
    const { pagamentoId, planilhaId, quantidadeMeses, mesesReferentes } = await request.json();

    if (!pagamentoId || !planilhaId) {
      return NextResponse.json({ 
        error: 'IDs são obrigatórios para atualizar pagamento' 
      }, { status: 400 });
    }

    // Atualizar pagamento
    const pagamento = await prisma.pagamentoMensalidade.update({
      where: { id: pagamentoId },
      data: {
        quantidadeMeses,
        mesesReferentes
      }
    });

    // Recalcular totais
    await recalcularTotais(planilhaId);
    
    return NextResponse.json({ 
      success: true, 
      pagamento 
    });

  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pagamento', details: error.message },
      { status: 500 }
    );
  }
}