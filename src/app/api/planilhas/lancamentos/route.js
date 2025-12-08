// app/api/planilhas/lancamentos/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// POST - Adicionar receita ou despesa
export async function POST(request) {
  try {
    const { tipo, planilhaId, descricao, valor, categoria } = await request.json();
    
    if (tipo === 'receita') {
      await prisma.receita.create({
        data: { planilhaId, descricao, valor }
      });
    } else {
      await prisma.despesa.create({
        data: { planilhaId, categoria, descricao, valor }
      });
    }
    
    // Recalcular totais
    const planilha = await prisma.planilhaFinanceira.findUnique({
      where: { id: planilhaId },
      include: { pagamentos: true, receitas: true, despesas: true }
    });
    
    const totalReceitas = 
      planilha.pagamentos.reduce((sum, p) => sum + Number(p.valorPago), 0) +
      planilha.receitas.reduce((sum, r) => sum + Number(r.valor), 0);
    
    const totalDespesas = planilha.despesas.reduce((sum, d) => sum + Number(d.valor), 0);
    
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
    console.error('Erro ao adicionar lançamento:', error);
    return NextResponse.json({ error: 'Erro ao adicionar lançamento' }, { status: 500 });
  }
}

// DELETE - Remover lançamento
export async function DELETE(request) {
  try {
    const { tipo, id, planilhaId } = await request.json();
    
    if (tipo === 'receita') {
      await prisma.receita.delete({ where: { id } });
    } else {
      await prisma.despesa.delete({ where: { id } });
    }
    
    // Recalcular totais
    const planilha = await prisma.planilhaFinanceira.findUnique({
      where: { id: planilhaId },
      include: { pagamentos: true, receitas: true, despesas: true }
    });
    
    const totalReceitas = 
      planilha.pagamentos.reduce((sum, p) => sum + Number(p.valorPago), 0) +
      planilha.receitas.reduce((sum, r) => sum + Number(r.valor), 0);
    
    const totalDespesas = planilha.despesas.reduce((sum, d) => sum + Number(d.valor), 0);
    
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
    console.error('Erro ao remover lançamento:', error);
    return NextResponse.json({ error: 'Erro ao remover lançamento' }, { status: 500 });
  }
}