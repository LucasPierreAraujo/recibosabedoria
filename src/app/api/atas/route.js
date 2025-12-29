// app/api/atas/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// GET: Listar todas as atas
export async function GET(request) {
  try {
    const atas = await prisma.ata.findMany({
      orderBy: {
        data: 'desc'
      },
      include: {
        cargos: {
          include: {
            membro: true
          }
        },
        presencas: {
          include: {
            membro: true
          }
        }
      }
    });

    return NextResponse.json(atas);
  } catch (error) {
    console.error('Erro ao buscar atas:', error);
    return NextResponse.json({ error: 'Erro ao buscar atas' }, { status: 500 });
  }
}

// POST: Criar nova ata
export async function POST(request) {
  try {
    const data = await request.json();
    
    const {
      numeroAta,
      livro,
      data: dataAta,
      horarioInicio,
      horarioEncerramento,
      numeroPresentes,
      valorTronco,
      leituraAta,
      expediente,
      ordemDia,
      coberturaTemplo,
      palavraBemLoja,
      cargos,
      presencas
    } = data;

    // Criar a ata
    const ata = await prisma.ata.create({
      data: {
        numeroAta,
        livro,
        data: new Date(dataAta),
        horarioInicio,
        horarioEncerramento,
        numeroPresentes: parseInt(numeroPresentes),
        valorTronco: parseFloat(valorTronco),
        leituraAta,
        expediente,
        ordemDia,
        coberturaTemplo,
        palavraBemLoja
      }
    });

    // Criar os cargos
    if (cargos && cargos.length > 0) {
      await Promise.all(
        cargos.map(cargo => 
          prisma.ataCargo.create({
            data: {
              ataId: ata.id,
              cargo: cargo.cargo,
              membroId: cargo.membroId || null,
              nomeManual: cargo.nomeManual || null // Para nomes digitados manualmente
            }
          })
        )
      );
    }

    // Criar as presenças
    if (presencas && presencas.length > 0) {
      await Promise.all(
        presencas.map(presenca => 
          prisma.ataPresenca.create({
            data: {
              ataId: ata.id,
              membroId: presenca.membroId || null,
              nomeManual: presenca.nomeManual || null,
              tipo: presenca.tipo
            }
          })
        )
      );
    }

    return NextResponse.json({ success: true, ata }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar ata:', error);
    return NextResponse.json({ error: 'Erro ao criar ata' }, { status: 500 });
  }
}

// DELETE: Excluir ata
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    await prisma.ata.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir ata:', error);
    return NextResponse.json({ error: 'Erro ao excluir ata' }, { status: 500 });
  }
}