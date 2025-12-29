"use client"
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import jsPDF from 'jspdf';

export default function VisualizarAtaPage() {
  const params = useParams();
  const router = useRouter();
  const [ata, setAta] = useState(null);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (params.id) {
      carregarAta();
    }
  }, [params.id]);

  const carregarAta = async () => {
    try {
      const response = await fetch(`/api/atas/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setAta(data);
      } else {
        alert('Ata não encontrada');
        router.push('/atas');
      }
    } catch (error) {
      console.error('Erro ao carregar ata:', error);
      alert('Erro ao carregar ata');
      router.push('/atas');
    }
  };

  const gerarPDF = async () => {
    setGerando(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const maxWidth = pageWidth - (2 * margin);
      const headerHeight = 35; // Altura do cabeçalho
      let yPosition = margin;
      let logoGobImg, logoImg;

      // Carregar logos uma vez
      try {
        logoGobImg = await fetch('/logo-gob.jpeg').then(r => r.blob()).then(b => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(b);
        }));

        logoImg = await fetch('/logo.jpeg').then(r => r.blob()).then(b => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(b);
        }));
      } catch (error) {
        console.error('Erro ao carregar logos:', error);
      }

      // Função para adicionar cabeçalho em cada página
      const addHeader = () => {
        const startY = margin;

        // Logos
        if (logoGobImg && logoImg) {
          pdf.addImage(logoGobImg, 'JPEG', margin, startY, 25, 25);
          pdf.addImage(logoImg, 'JPEG', pageWidth - margin - 25, startY, 25, 25);
        }

        // Texto do cabeçalho
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        let headerTextY = startY + 3;

        pdf.text('Augusta e Respeitável Loja Simbólica', pageWidth / 2, headerTextY, { align: 'center' });
        headerTextY += 5;
        pdf.text('Sabedoria de Salomão Nº 4.774', pageWidth / 2, headerTextY, { align: 'center' });
        headerTextY += 5;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Rua João Aires de Aquino, Nº29, Vila Alta, 63119-450', pageWidth / 2, headerTextY, { align: 'center' });
        headerTextY += 4;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Crato-Ceará', pageWidth / 2, headerTextY, { align: 'center' });

        return margin + headerHeight;
      };

      // Adicionar cabeçalho na primeira página
      yPosition = addHeader();

      // Títulos
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GRANDE ORIENTE DO BRASIL', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;

      pdf.setFontSize(10);
      pdf.text('ORIENTE DE CRATO-CE', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;

      pdf.text(`LIVRO DO ${ata.livro} MAÇOM`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 7;

      pdf.text(`ATA ${ata.numeroAta}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;

      // Linha horizontal
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      pdf.text(`ATA SESSÃO MAGNA DE ${ata.livro}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      // Construir o texto completo da ata
      const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

      const dataAta = new Date(ata.data);
      const dia = dataAta.getDate();
      const mes = meses[dataAta.getMonth()];
      const ano = dataAta.getFullYear();

      const numerosExtenso = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
        'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte',
        'vinte e um', 'vinte e dois', 'vinte e três', 'vinte e quatro', 'vinte e cinco'];

      const visitantes = ata.presencas.filter(p => p.tipo === 'VISITANTE').length;
      const quadro = ata.numeroPresentes - visitantes;

      const presencaTexto = visitantes > 0
        ? `${quadro} (${numerosExtenso[quadro] || quadro}) do quadro da Loja e ${visitantes} (${numerosExtenso[visitantes] || visitantes}) visitantes`
        : 'todos do quadro da Loja';

      const cargosTexto = ata.cargos.map(cargo => {
        const nome = cargo.membro ? cargo.membro.nome : cargo.nomeManual;
        return `${cargo.cargo}: Ir. ${nome.toUpperCase()}`;
      }).join(', ');

      const membrosQuadroTexto = ata.presencas
        .filter(p => p.tipo === 'QUADRO')
        .map(p => {
          const nome = p.membro ? p.membro.nome : p.nomeManual;
          return `Ir. ${nome.toUpperCase()}`;
        })
        .join(', ');

      const visitantesTexto = ata.presencas
        .filter(p => p.tipo === 'VISITANTE')
        .map(p => {
          const nome = p.membro ? p.membro.nome : p.nomeManual;
          return `Ir. ${nome.toUpperCase()}`;
        })
        .join(', ');

      const venaveMestre = ata.cargos.find(c => c.cargo === 'Venerável Mestre');
      const secretario = ata.cargos.find(c => c.cargo === 'Secretário');
      const orador = ata.cargos.find(c => c.cargo === 'Orador');

      const nomeVM = venaveMestre ? (venaveMestre.membro?.nome || venaveMestre.nomeManual) : '';
      const nomeSec = secretario ? (secretario.membro?.nome || secretario.nomeManual) : '';
      const nomeOrador = orador ? (orador.membro?.nome || orador.nomeManual) : '';

      let textoCorpo = `Ata ${ata.numeroAta} da sessão ordinária no grau de ${ata.livro} Maçom do Rito Schröder, da A.R.L.S. Sabedoria de Salomão nº 4.774, realizada na Rua Virgílio Arrais, bairro Grangeiro, Crato–CE, aos ${dia} (${numerosExtenso[dia]}) dias do mês de ${mes} de ${ano} da Era Vulgar. Os trabalhos foram iniciados às ${ata.horarioInicio} hs, com a presença de ${ata.numeroPresentes} (${numerosExtenso[ata.numeroPresentes] || ata.numeroPresentes}) Irmãos, sendo ${presencaTexto}. Os cargos foram ocupados na seguinte ordem: ${cargosTexto}. `;

      if (membrosQuadroTexto) {
        textoCorpo += `Estiveram também presentes os Irmãos membros do quadro da loja: ${membrosQuadroTexto}. `;
      }

      if (visitantesTexto) {
        textoCorpo += `Estiveram também presentes os seguintes visitantes: ${visitantesTexto}. `;
      }

      textoCorpo += `Após a abertura dos trabalhos, o Venerável Mestre Ir. ${nomeVM.toUpperCase()} saudou cordialmente a todos os presentes.`;

      if (ata.leituraAta) {
        textoCorpo += ` LEITURA DE ATA: ${ata.leituraAta}`;
      }

      if (ata.expediente) {
        textoCorpo += ` EXPEDIENTE: ${ata.expediente}`;
      }

      if (ata.ordemDia) {
        textoCorpo += ` ORDEM DO DIA: ${ata.ordemDia}`;
      }

      if (ata.coberturaTemplo) {
        textoCorpo += ` PEDIDOS DE COBERTURA DO TEMPLO DEFINITIVO: ${ata.coberturaTemplo}`;
      }

      if (ata.palavraBemLoja) {
        textoCorpo += ` PALAVRA A BEM DESTA LOJA OU DA MAÇONARIA EM GERAL: ${ata.palavraBemLoja}`;
      }

      const valorFormatado = Number(ata.valorTronco).toFixed(2).replace('.', ',');
      const reais = Number(ata.valorTronco).toFixed(2).split('.')[0];
      const centavos = Number(ata.valorTronco).toFixed(2).split('.')[1];
      const valorExtenso = centavos !== '00' ? `${reais} reais e ${centavos} centavos` : `${reais} reais`;

      textoCorpo += ` TRONCO DE BENEFICÊNCIA: Após o giro da esmoleira, o resultado da coleta foi de R$ ${valorFormatado} (${valorExtenso}). Os trabalhos foram encerrados às ${ata.horarioEncerramento} hs e nada mais havendo a tratar eu, Ir. ${nomeSec.toUpperCase()}, Secretário AD HOC, lavrei a presente ata que, acaba de ser lida e se aprovada será assinada por quem de direito.`;

      // Corpo justificado
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const bodyLines = pdf.splitTextToSize(textoCorpo, maxWidth);

      bodyLines.forEach((line, index) => {
        if (yPosition > pageHeight - margin - 2) {
          pdf.addPage();
          yPosition = addHeader();
        }

        // Justificar texto (exceto última linha e linhas curtas)
        const isLastLine = index === bodyLines.length - 1;
        const trimmedLine = line.trim();

        if (!isLastLine && trimmedLine.length > 0) {
          const words = trimmedLine.split(/\s+/); // Split por qualquer espaço
          if (words.length > 1 && words.filter(w => w.length > 0).length > 1) {
            const totalTextWidth = words.reduce((sum, word) => sum + pdf.getTextWidth(word), 0);
            const totalSpaceNeeded = maxWidth - totalTextWidth;
            const spacePerGap = totalSpaceNeeded / (words.length - 1);

            let xPos = margin;
            words.forEach((word, i) => {
              if (word.length > 0) {
                pdf.text(word, xPos, yPosition);
                if (i < words.length - 1) {
                  xPos += pdf.getTextWidth(word) + spacePerGap;
                }
              }
            });
          } else {
            pdf.text(trimmedLine, margin, yPosition);
          }
        } else {
          pdf.text(trimmedLine, margin, yPosition);
        }

        yPosition += 5.5;
      });

      // Assinaturas
      yPosition += 20;
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = addHeader();
      }

      const signatureY = yPosition;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');

      // Calcular posições para 3 assinaturas distribuídas
      const signatureWidth = 50;
      const totalSignaturesWidth = signatureWidth * 3;
      const spacing = (maxWidth - totalSignaturesWidth) / 4;

      const pos1 = margin + spacing;
      const pos2 = pos1 + signatureWidth + spacing;
      const pos3 = pos2 + signatureWidth + spacing;

      // Linha para assinatura VM
      pdf.line(pos1, signatureY, pos1 + signatureWidth, signatureY);
      pdf.text(nomeVM.toUpperCase(), pos1 + signatureWidth/2, signatureY + 5, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text('Venerável Mestre', pos1 + signatureWidth/2, signatureY + 10, { align: 'center' });

      // Linha para assinatura Secretário
      pdf.setFont('helvetica', 'bold');
      pdf.line(pos2, signatureY, pos2 + signatureWidth, signatureY);
      pdf.text(nomeSec.toUpperCase(), pos2 + signatureWidth/2, signatureY + 5, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text('Secretário', pos2 + signatureWidth/2, signatureY + 10, { align: 'center' });

      // Linha para assinatura Orador
      pdf.setFont('helvetica', 'bold');
      pdf.line(pos3, signatureY, pos3 + signatureWidth, signatureY);
      pdf.text(nomeOrador.toUpperCase(), pos3 + signatureWidth/2, signatureY + 5, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text('Orador', pos3 + signatureWidth/2, signatureY + 10, { align: 'center' });

      pdf.save(`Ata_${ata.numeroAta.replace('/', '_')}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF');
    } finally {
      setGerando(false);
    }
  };

  if (!ata) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-600">Carregando...</div>
      </div>
    );
  }

  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  const dataAta = new Date(ata.data);
  const dia = dataAta.getDate();
  const mes = meses[dataAta.getMonth()];
  const ano = dataAta.getFullYear();

  // Formatação de texto dos cargos (com Ir. prefixo)
  const formatarNomeCargo = (cargo) => {
    const nome = cargo.membro ? cargo.membro.nome : cargo.nomeManual;
    return `Ir. ${nome.toUpperCase()}`;
  };

  const formatarNomePresenca = (presenca) => {
    const nome = presenca.membro ? presenca.membro.nome : presenca.nomeManual;
    return `Ir. ${nome.toUpperCase()}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header com botões */}
      <header className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/atas')}
              className="hover:bg-blue-800 p-2 rounded flex items-center gap-2"
            >
              <ArrowLeft size={24} />
              <span>Voltar</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Visualizar Ata</h1>
              <p className="text-sm text-blue-200">Ata {ata.numeroAta}</p>
            </div>
          </div>
          <button
            onClick={gerarPDF}
            disabled={gerando}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Download size={20} />
            {gerando ? 'Gerando PDF...' : 'Baixar PDF'}
          </button>
        </div>
      </header>

      {/* Conteúdo da Ata */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
          <div id="ata-completa" className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto' }}>

            {/* Cabeçalho com logos - será repetido em todas as páginas */}
            <div id="ata-cabecalho" className="mb-6">
              <div className="flex justify-between items-start mb-4">
                <img src="/logo-gob.jpeg" alt="GOB" className="h-24 w-24" />
                <div className="text-center flex-1 mx-4">
                  <h1 className="text-xl font-bold text-gray-900 mb-2">
                    Augusta e Respeitável Loja Simbólica<br />
                    Sabedoria de Salomão Nº 4.774
                  </h1>
                  <p className="text-sm text-gray-700">
                    Rua João Aires de Aquino, Nº29, Vila Alta, 63119-450
                  </p>
                  <p className="text-sm text-gray-700 font-semibold">Crato-Ceará</p>
                </div>
                <img src="/logo.jpeg" alt="Loja" className="h-24 w-24" />
              </div>
            </div>

            {/* Corpo da ata */}
            <div id="ata-corpo">

            {/* Título */}
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">GRANDE ORIENTE DO BRASIL</h2>
              <h3 className="text-base font-bold text-gray-900">ORIENTE DE CRATO-CE</h3>
              <h3 className="text-base font-bold text-gray-900">
                LIVRO DO {ata.livro} MAÇOM
              </h3>
              <h3 className="text-base font-bold text-gray-900 mt-2">ATA {ata.numeroAta}</h3>
            </div>

            <hr className="border-t-2 border-gray-900 mb-4" />

            {/* Subtítulo */}
            <h4 className="text-center text-base font-bold text-gray-900 mb-4">
              ATA SESSÃO MAGNA DE {ata.livro}
            </h4>

            {/* Corpo da ata - texto contínuo sem quebras */}
            <div className="text-justify text-sm leading-relaxed text-gray-900" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              <p style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                <strong>Ata {ata.numeroAta}</strong> da sessão ordinária no grau de {ata.livro} Maçom do Rito Schröder, da <strong>A.R.L.S. Sabedoria de Salomão nº 4.774</strong>, realizada na Rua Virgílio Arrais, bairro Grangeiro, Crato–CE, aos {dia} ({
                  ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
                   'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte',
                   'vinte e um', 'vinte e dois', 'vinte e três', 'vinte e quatro', 'vinte e cinco', 'vinte e seis',
                   'vinte e sete', 'vinte e oito', 'vinte e nove', 'trinta', 'trinta e um'][dia]
                }) dias do mês de {mes} de {ano} da Era Vulgar. Os trabalhos foram iniciados às {ata.horarioInicio} hs, com a presença de {ata.numeroPresentes} ({
                  ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
                   'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte',
                   'vinte e um', 'vinte e dois', 'vinte e três', 'vinte e quatro', 'vinte e cinco'][ata.numeroPresentes] || ata.numeroPresentes
                }) Irmãos, sendo {
                  (() => {
                    const visitantes = ata.presencas.filter(p => p.tipo === 'VISITANTE').length;
                    const quadro = ata.numeroPresentes - visitantes;
                    const numerosExtenso = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
                      'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte',
                      'vinte e um', 'vinte e dois', 'vinte e três', 'vinte e quatro', 'vinte e cinco'];

                    if (visitantes > 0) {
                      return `${quadro} (${numerosExtenso[quadro] || quadro}) do quadro da Loja e ${visitantes} (${numerosExtenso[visitantes] || visitantes}) visitantes`;
                    } else {
                      return 'todos do quadro da Loja';
                    }
                  })()
                }. Os cargos foram ocupados na seguinte ordem:{' '}
                {ata.cargos.map((cargo, index) => (
                  <span key={index}>
                    <strong>{cargo.cargo}:</strong> {formatarNomeCargo(cargo)}
                    {index < ata.cargos.length - 1 ? ', ' : '. '}
                  </span>
                ))}
                {ata.presencas.filter(p => p.tipo === 'QUADRO').length > 0 && (
                  <>
                    Estiveram também presentes os Irmãos membros do quadro da loja:{' '}
                    {ata.presencas.filter(p => p.tipo === 'QUADRO').map((presenca, index, arr) => (
                      <span key={index}>
                        {formatarNomePresenca(presenca)}
                        {index < arr.length - 1 ? ', ' : '. '}
                      </span>
                    ))}
                  </>
                )}
                {ata.presencas.filter(p => p.tipo === 'VISITANTE').length > 0 && (
                  <>
                    Estiveram também presentes os seguintes visitantes:{' '}
                    {ata.presencas.filter(p => p.tipo === 'VISITANTE').map((presenca, index, arr) => (
                      <span key={index}>
                        {formatarNomePresenca(presenca)}
                        {index < arr.length - 1 ? ', ' : '. '}
                      </span>
                    ))}
                  </>
                )}
                Após a abertura dos trabalhos, o Venerável Mestre {
                  ata.cargos.find(c => c.cargo === 'Venerável Mestre')
                    ? formatarNomeCargo(ata.cargos.find(c => c.cargo === 'Venerável Mestre'))
                    : ''
                } saudou cordialmente a todos os presentes.
                {ata.leituraAta && (
                  <> <strong>LEITURA DE ATA:</strong> {ata.leituraAta}</>
                )}
                {ata.expediente && (
                  <> <strong>EXPEDIENTE:</strong> {ata.expediente}</>
                )}
                {ata.ordemDia && (
                  <> <strong>ORDEM DO DIA:</strong> {ata.ordemDia}</>
                )}
                {ata.coberturaTemplo && (
                  <> <strong>PEDIDOS DE COBERTURA DO TEMPLO DEFINITIVO:</strong> {ata.coberturaTemplo}</>
                )}
                {ata.palavraBemLoja && (
                  <> <strong>PALAVRA A BEM DESTA LOJA OU DA MAÇONARIA EM GERAL:</strong> {ata.palavraBemLoja}</>
                )}
                {' '}<strong>TRONCO DE BENEFICÊNCIA:</strong> Após o giro da esmoleira, o resultado da coleta foi de R$ {Number(ata.valorTronco).toFixed(2).replace('.', ',')} ({
                  Number(ata.valorTronco).toFixed(2).split('.')[0]
                } reais{
                  Number(ata.valorTronco).toFixed(2).split('.')[1] !== '00'
                    ? ` e ${Number(ata.valorTronco).toFixed(2).split('.')[1]} centavos`
                    : ''
                }). Os trabalhos foram encerrados às {ata.horarioEncerramento} hs e nada mais havendo a tratar eu,{' '}
                {ata.cargos.find(c => c.cargo === 'Secretário')
                  ? formatarNomeCargo(ata.cargos.find(c => c.cargo === 'Secretário'))
                  : ''
                }, Secretário AD HOC, lavrei a presente ata que, acaba de ser lida e se aprovada será assinada por quem de direito.
              </p>
            </div>
            </div>

            {/* Assinaturas - só aparece na última página */}
            <div id="ata-assinaturas" className="mt-16">
              <div className="flex justify-between items-end px-8">
              <div className="text-center">
                <div className="border-b-2 border-gray-900 w-48 mb-2"></div>
                <p className="text-sm font-bold text-gray-900">
                  {ata.cargos.find(c => c.cargo === 'Venerável Mestre')
                    ? (ata.cargos.find(c => c.cargo === 'Venerável Mestre').membro?.nome ||
                       ata.cargos.find(c => c.cargo === 'Venerável Mestre').nomeManual)?.toUpperCase()
                    : ''}
                </p>
                <p className="text-xs text-gray-900">Venerável Mestre</p>
              </div>

              <div className="text-center">
                <div className="border-b-2 border-gray-900 w-48 mb-2"></div>
                <p className="text-sm font-bold text-gray-900">
                  {ata.cargos.find(c => c.cargo === 'Secretário')
                    ? (ata.cargos.find(c => c.cargo === 'Secretário').membro?.nome ||
                       ata.cargos.find(c => c.cargo === 'Secretário').nomeManual)?.toUpperCase()
                    : ''}
                </p>
                <p className="text-xs text-gray-900">Secretário</p>
              </div>

              <div className="text-center">
                <div className="border-b-2 border-gray-900 w-48 mb-2"></div>
                <p className="text-sm font-bold text-gray-900">
                  {ata.cargos.find(c => c.cargo === 'Orador')
                    ? (ata.cargos.find(c => c.cargo === 'Orador').membro?.nome ||
                       ata.cargos.find(c => c.cargo === 'Orador').nomeManual)?.toUpperCase()
                    : ''}
                </p>
                <p className="text-xs text-gray-900">Orador</p>
              </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
