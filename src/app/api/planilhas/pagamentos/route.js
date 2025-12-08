// app/api/planilhas/pagamentos/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// POST - Registrar pagamento
export async function POST(request) {
  try {
    const { planilhaId, membroId, quantidadeMeses, valorPago, mesesReferentes } = await request.json();
    
    const pagamento = await prisma.pagamentoMensalidade.create({
      data: {
        planilhaId,
        membroId,
        quantidadeMeses,
        valorPago,
        mesesReferentes
      }
    });
    
    // Atualizar total de receitas da planilha
    const planilha = await prisma.planilhaFinanceira.findUnique({
      where: { id: planilhaId },
      include: { pagamentos: true, despesas: true }
    });
    
    const totalReceitas = planilha.pagamentos.reduce((sum, p) => sum + Number(p.valorPago), 0);
    const totalDespesas = planilha.despesas.reduce((sum, d) => sum + Number(d.valor), 0);
    
    await prisma.planilhaFinanceira.update({
      where: { id: planilhaId },
      data: {
        totalReceitas,
        saldoFinal: totalReceitas - totalDespesas
      }
    });
    
    return NextResponse.json({ success: true, pagamento });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 });
  }
}

// DELETE - Remover pagamento
export async function DELETE(request) {
  try {
    const { id, planilhaId } = await request.json();
    
    await prisma.pagamentoMensalidade.delete({
      where: { id }
    });
    
    // Recalcular totais
    const planilha = await prisma.planilhaFinanceira.findUnique({
      where: { id: planilhaId },
      include: { pagamentos: true, despesas: true }
    });
    
    const totalReceitas = planilha.pagamentos.reduce((sum, p) => sum + Number(p.valorPago), 0);
    const totalDespesas = planilha.despesas.reduce((sum, d) => sum + Number(d.valor), 0);
    
    await prisma.planilhaFinanceira.update({
      where: { id: planilhaId },
      data: {
        totalReceitas,
        saldoFinal: totalReceitas - totalDespesas
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover pagamento:', error);
    return NextResponse.json({ error: 'Erro ao remover pagamento' }, { status: 500 });
  }
}