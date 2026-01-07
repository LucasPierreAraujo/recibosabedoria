import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Buscar pagamentos de um ano
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ano = parseInt(searchParams.get('ano')) || new Date().getFullYear();

    const pagamentos = await prisma.controleMensalidade.findMany({
      where: { ano }
    });

    // Transformar em objeto { membroId: { mes: status } }
    const pagamentosObj = {};
    pagamentos.forEach(p => {
      if (!pagamentosObj[p.membroId]) {
        pagamentosObj[p.membroId] = {};
      }
      pagamentosObj[p.membroId][p.mes] = p.status;
    });

    return NextResponse.json({ pagamentos: pagamentosObj });
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 });
  }
}

// POST - Salvar/Atualizar pagamento
export async function POST(request) {
  try {
    const { ano, membroId, mes, status } = await request.json();

    console.log('=== Salvando pagamento ===');
    console.log('Dados recebidos:', { ano, membroId, mes, status });

    if (!ano || !membroId || !mes) {
      console.error('Dados incompletos:', { ano, membroId, mes });
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Se status for null, deletar o registro
    if (status === null) {
      console.log('Deletando registro...');
      const resultado = await prisma.controleMensalidade.deleteMany({
        where: {
          ano,
          membroId,
          mes
        }
      });
      console.log('Registros deletados:', resultado.count);
    } else {
      // Upsert (create or update)
      console.log('Executando upsert...');
      const resultado = await prisma.controleMensalidade.upsert({
        where: {
          ano_membroId_mes: {
            ano,
            membroId,
            mes
          }
        },
        update: { status },
        create: {
          ano,
          membroId,
          mes,
          status
        }
      });
      console.log('Upsert concluído:', resultado);
    }

    console.log('Pagamento salvo com sucesso!');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar pagamento:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json({ error: 'Erro ao salvar pagamento', details: error.message }, { status: 500 });
  }
}
