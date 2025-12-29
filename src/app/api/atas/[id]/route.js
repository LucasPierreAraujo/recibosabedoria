// app/api/atas/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET: Buscar ata por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const ata = await prisma.ata.findUnique({
      where: { id },
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

    if (!ata) {
      return NextResponse.json({ error: 'Ata não encontrada' }, { status: 404 });
    }

    return NextResponse.json(ata);
  } catch (error) {
    console.error('Erro ao buscar ata:', error);
    return NextResponse.json({ error: 'Erro ao buscar ata' }, { status: 500 });
  }
}

// DELETE: Excluir ata
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.ata.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir ata:', error);
    return NextResponse.json({ error: 'Erro ao excluir ata' }, { status: 500 });
  }
}

// PUT: Atualizar ata
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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

    // Atualizar a ata
    const ata = await prisma.ata.update({
      where: { id },
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

    // Deletar cargos antigos e criar novos
    if (cargos) {
      await prisma.ataCargo.deleteMany({
        where: { ataId: id }
      });

      await Promise.all(
        cargos.map(cargo =>
          prisma.ataCargo.create({
            data: {
              ataId: id,
              cargo: cargo.cargo,
              membroId: cargo.membroId || null,
              nomeManual: cargo.nomeManual || null
            }
          })
        )
      );
    }

    // Deletar presenças antigas e criar novas
    if (presencas) {
      await prisma.ataPresenca.deleteMany({
        where: { ataId: id }
      });

      await Promise.all(
        presencas.map(presenca =>
          prisma.ataPresenca.create({
            data: {
              ataId: id,
              membroId: presenca.membroId || null,
              nomeManual: presenca.nomeManual || null,
              tipo: presenca.tipo
            }
          })
        )
      );
    }

    return NextResponse.json({ success: true, ata });
  } catch (error) {
    console.error('Erro ao atualizar ata:', error);
    return NextResponse.json({ error: 'Erro ao atualizar ata' }, { status: 500 });
  }
}
