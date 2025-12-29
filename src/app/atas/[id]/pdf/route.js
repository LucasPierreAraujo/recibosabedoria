// app/atas/[id]/pdf/route.js
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Buscar a ata com todas as relações
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

    // Gerar HTML da ata
    const html = gerarHTMLAta(ata);

    // Retornar HTML para visualização (posteriormente pode ser convertido para PDF)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 });
  }
}

function gerarHTMLAta(ata) {
  const dataFormatada = new Date(ata.data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Separar presenças
  const presencasQuadro = ata.presencas.filter(p => p.tipo === 'QUADRO');
  const presencasVisitantes = ata.presencas.filter(p => p.tipo === 'VISITANTE');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ata ${ata.numeroAta}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }

    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
    }

    .header h1 {
      font-size: 16pt;
      margin: 10px 0;
      font-weight: bold;
      text-transform: uppercase;
    }

    .header h2 {
      font-size: 14pt;
      margin: 5px 0;
      font-weight: normal;
    }

    .ata-info {
      margin: 20px 0;
      text-align: justify;
    }

    .ata-info p {
      margin: 10px 0;
      text-indent: 2cm;
    }

    .section-title {
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 20px;
      margin-bottom: 10px;
      font-size: 12pt;
    }

    .cargos-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }

    .cargos-table th,
    .cargos-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }

    .cargos-table th {
      background-color: #f0f0f0;
      font-weight: bold;
    }

    .presencas-list {
      margin: 10px 0;
      padding-left: 40px;
    }

    .presencas-list li {
      margin: 5px 0;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
    }

    .assinatura {
      margin-top: 60px;
      text-align: center;
    }

    .linha-assinatura {
      border-top: 1px solid #000;
      width: 300px;
      margin: 0 auto;
      padding-top: 5px;
    }

    @media print {
      body {
        padding: 0;
      }

      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: right; margin-bottom: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 5px; font-size: 14pt;">
      🖨️ Imprimir PDF
    </button>
    <button onclick="window.close()" style="padding: 10px 20px; cursor: pointer; background: #6b7280; color: white; border: none; border-radius: 5px; font-size: 14pt; margin-left: 10px;">
      ✖ Fechar
    </button>
  </div>

  <div class="header">
    <h1>A.R.L.S. Sabedoria de Salomão Nº 4774</h1>
    <h2>Grande Oriente de Minas Gerais</h2>
    <h2>Ata de Sessão ${ata.livro}</h2>
  </div>

  <div class="ata-info">
    <p>
      <strong>Ata nº ${ata.numeroAta}</strong>, da Sessão ${ata.livro.toLowerCase()}
      realizada no dia <strong>${dataFormatada}</strong>, com início às
      <strong>${ata.horarioInicio}</strong> e encerramento às <strong>${ata.horarioEncerramento}</strong>.
    </p>

    <p>
      Estiveram presentes <strong>${ata.numeroPresentes}</strong> irmãos,
      sendo arrecadado no Tronco de Beneficência o valor de
      <strong>R$ ${Number(ata.valorTronco).toFixed(2)}</strong>.
    </p>
  </div>

  <div class="section-title">Cargos da Sessão</div>
  <table class="cargos-table">
    <thead>
      <tr>
        <th>Cargo</th>
        <th>Irmão</th>
      </tr>
    </thead>
    <tbody>
      ${ata.cargos.map(cargo => `
        <tr>
          <td>${cargo.cargo}</td>
          <td>${cargo.membro ? cargo.membro.nome : cargo.nomeManual}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${ata.leituraAta ? `
    <div class="section-title">Leitura de Ata</div>
    <div class="ata-info">
      <p>${ata.leituraAta}</p>
    </div>
  ` : ''}

  ${ata.expediente ? `
    <div class="section-title">Expediente</div>
    <div class="ata-info">
      <p>${ata.expediente}</p>
    </div>
  ` : ''}

  ${ata.ordemDia ? `
    <div class="section-title">Ordem do Dia</div>
    <div class="ata-info">
      <p>${ata.ordemDia}</p>
    </div>
  ` : ''}

  ${presencasQuadro.length > 0 ? `
    <div class="section-title">Membros do Quadro Presentes (${presencasQuadro.length})</div>
    <ul class="presencas-list">
      ${presencasQuadro.map(p => `
        <li>${p.membro ? p.membro.nome : p.nomeManual}</li>
      `).join('')}
    </ul>
  ` : ''}

  ${presencasVisitantes.length > 0 ? `
    <div class="section-title">Visitantes (${presencasVisitantes.length})</div>
    <ul class="presencas-list">
      ${presencasVisitantes.map(p => `
        <li>${p.membro ? p.membro.nome : p.nomeManual}</li>
      `).join('')}
    </ul>
  ` : ''}

  ${ata.coberturaTemplo ? `
    <div class="section-title">Cobertura do Templo</div>
    <div class="ata-info">
      <p>${ata.coberturaTemplo}</p>
    </div>
  ` : ''}

  ${ata.palavraBemLoja ? `
    <div class="section-title">Palavra a Bem da Loja ou da Maçonaria</div>
    <div class="ata-info">
      <p>${ata.palavraBemLoja}</p>
    </div>
  ` : ''}

  <div class="footer">
    <p>Nada mais havendo a tratar, foi encerrada a sessão em paz, harmonia e união.</p>
  </div>

  <div class="assinatura">
    <div class="linha-assinatura">
      Secretário
    </div>
  </div>

  <div class="assinatura">
    <div class="linha-assinatura">
      Venerável Mestre
    </div>
  </div>
</body>
</html>
  `.trim();
}
