// app/api/planilhas/pagamentos/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request) {
  try {
    const { planilhaId, membroId, quantidadeMeses, valorPago, mesesReferentes } = await request.json();
    
    // Criar pagamento
    await prisma.pagamentoMensalidade.create({
      data: {
        planilhaId,
        membroId,
        quantidadeMeses,
        valorPago,
        mesesReferentes
      }
    });
    
    // Recalcular totais da planilha
    const planilha = await prisma.planilhaFinanceira.findUnique({
      where: { id: planilhaId },
      include: {
        pagamentos: true,
        receitas: true,
        despesas: true
      }
    });
    
    // Total de receitas = mensalidades + receitas extras
    const totalMensalidades = planilha.pagamentos.reduce(
      (sum, p) => sum + Number(p.valorPago), 
      0
    );
    const totalReceitasExtras = planilha.receitas.reduce(
      (sum, r) => sum + Number(r.valor), 
      0
    );
    const totalReceitas = totalMensalidades + totalReceitasExtras;
    
    // Total de despesas
    const totalDespesas = planilha.despesas.reduce(
      (sum, d) => sum + Number(d.valor), 
      0
    );
    
    // Atualizar planilha
    await prisma.planilhaFinanceira.update({
      where: { id: planilhaId },
      data: {
        totalReceitas,
        totalDespesas,
        saldoFinal: totalReceitas - totalDespesas
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar pagamento' },
      { status: 500 }
    );
  }
}