import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { recalcularTotais } from '../../../../lib/recalcularTotaisPlanilha';

// POST: Adicionar lançamento (receita, despesa, tronco, filantropia)
export async function POST(request, { params }) {
  try {
    const { id: planilhaId } = await params; // Next.js 15 requer await
    const { tipo, ...data } = await request.json();

    let novoLancamento;

    // Criar lançamento baseado no tipo
    if (tipo === 'receita') {
      const { descricao, valor, data: dataLancamento } = data;
      
      if (!descricao || !dataLancamento) {
        return NextResponse.json({ error: 'Descrição e data são obrigatórios' }, { status: 400 });
      }

      novoLancamento = await prisma.receita.create({
        data: {
          planilhaId,
          descricao,
          valor: parseFloat(valor),
          data: new Date(dataLancamento),
        }
      });
    } 
    else if (tipo === 'despesa') {
      const { descricao, valor, tipoGasto, data: dataLancamento } = data;
      
      if (!descricao || !tipoGasto || !dataLancamento) {
        return NextResponse.json({ error: 'Descrição, tipo de gasto e data são obrigatórios' }, { status: 400 });
      }

      // Validar tipoGasto
      if (tipoGasto !== 'FIXO' && tipoGasto !== 'VARIAVEL') {
        return NextResponse.json({ error: 'Tipo de gasto deve ser FIXO ou VARIAVEL' }, { status: 400 });
      }

      novoLancamento = await prisma.despesa.create({
        data: {
          planilhaId,
          descricao,
          valor: parseFloat(valor),
          categoria: 'GERAL', // Valor padrão
          tipoGasto: tipoGasto, // Já vem como string 'FIXO' ou 'VARIAVEL'
          data: new Date(dataLancamento),
        }
      });
    } 
    else if (tipo === 'tronco') {
      const { grauSessao, valor, dataSessao, dataDeposito } = data;
      
      if (!grauSessao || !dataSessao || !dataDeposito) {
        return NextResponse.json({ error: 'Grau, data da sessão e data do depósito são obrigatórios' }, { status: 400 });
      }

      novoLancamento = await prisma.tronco.create({
        data: {
          planilhaId,
          grauSessao,
          valor: parseFloat(valor),
          data: new Date(dataSessao),
          dataDeposito: new Date(dataDeposito),
        }
      });
    } 
    else if (tipo === 'filantropia') {
      const { descricao, valor, data: dataLancamento } = data;
      
      if (!descricao || !dataLancamento) {
        return NextResponse.json({ error: 'Descrição e data são obrigatórios' }, { status: 400 });
      }

      novoLancamento = await prisma.doacaoFilantropica.create({
        data: {
          planilhaId,
          descricao,
          valor: parseFloat(valor),
          dataPagamento: new Date(dataLancamento),
        }
      });
    } 
    else {
      return NextResponse.json({ error: 'Tipo de lançamento inválido' }, { status: 400 });
    }

    // Recalcular totais
    await recalcularTotais(planilhaId);

    return NextResponse.json({ success: true, lancamento: novoLancamento });

  } catch (error) {
    console.error('Erro ao adicionar lançamento:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar lançamento', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Excluir lançamento
export async function DELETE(request, { params }) {
  try {
    const { id: planilhaId } = await params; // Next.js 15 requer await
    const { tipo, id } = await request.json();

    if (!tipo || !id) {
      return NextResponse.json({ error: 'Tipo e ID são obrigatórios' }, { status: 400 });
    }

    // Excluir baseado no tipo
    if (tipo === 'receita') {
      await prisma.receita.delete({ where: { id } });
    } else if (tipo === 'despesa') {
      await prisma.despesa.delete({ where: { id } });
    } else if (tipo === 'tronco') {
      await prisma.tronco.delete({ where: { id } });
    } else if (tipo === 'filantropia') {
      await prisma.doacaoFilantropica.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    // Recalcular totais
    await recalcularTotais(planilhaId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao excluir lançamento:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir lançamento', details: error.message },
      { status: 500 }
    );
  }
}