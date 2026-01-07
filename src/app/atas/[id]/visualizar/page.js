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
      yPosition += 12;

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

      // Agrupar cargos por membro (evitar repetir o nome)
      const cargosPorMembro = {};
      ata.cargos.forEach(cargo => {
        const nome = cargo.membro ? cargo.membro.nome : cargo.nomeManual;
        if (!cargosPorMembro[nome]) {
          cargosPorMembro[nome] = [];
        }
        cargosPorMembro[nome].push(cargo.cargo);
      });

      const cargosTexto = Object.entries(cargosPorMembro).map(([nome, cargos]) => {
        // Ordenar: "Membro do Ministério Público" sempre por último
        const cargosOrdenados = cargos.sort((a, b) => {
          if (a === 'Membro do Ministério Público') return 1;
          if (b === 'Membro do Ministério Público') return -1;
          return 0;
        });
        const cargosUnidos = cargosOrdenados.join(' / ');
        return `<B>${cargosUnidos}:</B> Ir. ${nome.toUpperCase()}`;
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

      // Função para obter todos os cargos de um membro
      const obterCargosDoMembro = (membroNome) => {
        const cargos = ata.cargos
          .filter(c => {
            const nome = c.membro?.nome || c.nomeManual;
            return nome === membroNome;
          })
          .map(c => c.cargo);

        // Ordenar: "Membro do Ministério Público" sempre por último
        const cargosOrdenados = cargos.sort((a, b) => {
          if (a === 'Membro do Ministério Público') return 1;
          if (b === 'Membro do Ministério Público') return -1;
          return 0;
        });

        return cargosOrdenados.join(' / ');
      };

      const cargosVM = obterCargosDoMembro(nomeVM);
      const cargosSec = obterCargosDoMembro(nomeSec);
      const cargosOrador = obterCargosDoMembro(nomeOrador);

      let textoCorpo = `<B>Ata</B> <B>${ata.numeroAta}</B> da sessão ordinária no grau de ${ata.livro} Maçom do Rito Schröder, da <B>A.R.L.S.</B> <B>Sabedoria</B> <B>de</B> <B>Salomão</B> <B>nº</B> <B>4.774,</B> realizada na Rua Virgílio Arrais, bairro Grangeiro, Crato–CE, aos ${dia} (${numerosExtenso[dia]}) dias do mês de ${mes} de ${ano} da Era Vulgar. Os trabalhos foram iniciados às ${ata.horarioInicio} hs, com a presença de ${ata.numeroPresentes} (${numerosExtenso[ata.numeroPresentes] || ata.numeroPresentes}) Irmãos, sendo ${presencaTexto}. Os cargos foram ocupados na seguinte ordem: ${cargosTexto}. `;

      if (membrosQuadroTexto) {
        textoCorpo += `Estiveram também presentes os Irmãos membros do quadro da loja: ${membrosQuadroTexto}. `;
      }

      if (visitantesTexto) {
        textoCorpo += `Estiveram também presentes os seguintes visitantes: ${visitantesTexto}. `;
      }

      textoCorpo += `Após a abertura dos trabalhos, o Venerável Mestre Ir. ${nomeVM.toUpperCase()} saudou cordialmente a todos os presentes.`;

      if (ata.leituraAta) {
        textoCorpo += ` <B>LEITURA</B> <B>DE</B> <B>ATA:</B> ${ata.leituraAta}`;
      }

      if (ata.expediente) {
        textoCorpo += ` <B>EXPEDIENTE:</B> ${ata.expediente}`;
      }

      if (ata.ordemDia) {
        textoCorpo += ` <B>ORDEM</B> <B>DO</B> <B>DIA:</B> ${ata.ordemDia}`;
      }

      if (ata.coberturaTemplo) {
        textoCorpo += ` <B>PEDIDOS</B> <B>DE</B> <B>COBERTURA</B> <B>DO</B> <B>TEMPLO</B> <B>DEFINITIVO:</B> ${ata.coberturaTemplo}`;
      }

      if (ata.palavraBemLoja) {
        textoCorpo += ` <B>PALAVRA</B> <B>A</B> <B>BEM</B> <B>DESTA</B> <B>LOJA</B> <B>OU</B> <B>DA</B> <B>MAÇONARIA</B> <B>EM</B> <B>GERAL:</B> ${ata.palavraBemLoja}`;
      }

      // Função para converter número em extenso
      const numeroParaExtenso = (numero) => {
        const unidades = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        const dez_vinte = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

        const num = parseInt(numero);

        if (num === 0) return 'zero';
        if (num < 10) return unidades[num];
        if (num >= 10 && num < 20) return dez_vinte[num - 10];
        if (num >= 20 && num < 100) {
          const dez = Math.floor(num / 10);
          const uni = num % 10;
          return uni === 0 ? dezenas[dez] : `${dezenas[dez]} e ${unidades[uni]}`;
        }
        if (num === 100) return 'cem';
        if (num > 100 && num < 1000) {
          const cen = Math.floor(num / 100);
          const resto = num % 100;
          if (resto === 0) return centenas[cen];
          if (resto < 10) return `${centenas[cen]} e ${unidades[resto]}`;
          if (resto < 20) return `${centenas[cen]} e ${dez_vinte[resto - 10]}`;
          const dez = Math.floor(resto / 10);
          const uni = resto % 10;
          return uni === 0 ? `${centenas[cen]} e ${dezenas[dez]}` : `${centenas[cen]} e ${dezenas[dez]} e ${unidades[uni]}`;
        }
        return numero.toString();
      };

      const valorFormatado = Number(ata.valorTronco).toFixed(2).replace('.', ',');
      const reais = parseInt(Number(ata.valorTronco).toFixed(2).split('.')[0]);
      const centavos = parseInt(Number(ata.valorTronco).toFixed(2).split('.')[1]);

      const reaisExtenso = numeroParaExtenso(reais);
      const centavosExtenso = numeroParaExtenso(centavos);

      const valorExtenso = centavos !== 0
        ? `${reaisExtenso} ${reais === 1 ? 'real' : 'reais'} e ${centavosExtenso} ${centavos === 1 ? 'centavo' : 'centavos'}`
        : `${reaisExtenso} ${reais === 1 ? 'real' : 'reais'}`;

      textoCorpo += ` <B>TRONCO</B> <B>DE</B> <B>BENEFICÊNCIA:</B> Após o giro da esmoleira, o resultado da coleta foi de R$ ${valorFormatado} (${valorExtenso}). Os trabalhos foram encerrados às ${ata.horarioEncerramento} hs e nada mais havendo a tratar eu, Ir. ${nomeSec.toUpperCase()}, Secretário ADHOC, lavrei a presente ata que, acaba de ser lida e se aprovada será assinada por quem de direito.`;

      // Renderizar texto COM negrito - processar palavra por palavra
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      // Dividir em palavras mantendo os marcadores
      const words = textoCorpo.split(/\s+/);
      let currentLine = [];
      let currentLineWidth = 0;
      let isBold = false;

      const renderLine = (words, justify = true) => {
        if (yPosition > pageHeight - margin - 2) {
          pdf.addPage();
          yPosition = addHeader();
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
        }

        if (words.length === 0) return;

        // Calcular largura total
        const totalTextWidth = words.reduce((sum, word) => {
          pdf.setFont('helvetica', word.isBold ? 'bold' : 'normal');
          return sum + pdf.getTextWidth(word.text);
        }, 0);

        let xPos = margin;
        const spaceWidth = justify && words.length > 1 ? (maxWidth - totalTextWidth) / (words.length - 1) : pdf.getTextWidth(' ');

        words.forEach((word, i) => {
          pdf.setFont('helvetica', word.isBold ? 'bold' : 'normal');
          pdf.text(word.text, xPos, yPosition);
          xPos += pdf.getTextWidth(word.text);
          if (i < words.length - 1) {
            xPos += spaceWidth;
          }
        });

        pdf.setFont('helvetica', 'normal');
        yPosition += 5.5;
      };

      words.forEach((word, index) => {
        if (!word) return;

        let cleanWord = word;
        let wordIsBold = isBold;

        // Processar marcadores
        if (word.includes('<B>')) {
          cleanWord = cleanWord.replace(/<B>/g, '');
          isBold = true;
          wordIsBold = true;
        }

        if (word.includes('</B>')) {
          cleanWord = cleanWord.replace(/<\/B>/g, '');
          isBold = false;
        }

        if (!cleanWord) return;

        // Calcular largura da palavra
        pdf.setFont('helvetica', wordIsBold ? 'bold' : 'normal');
        const wordWidth = pdf.getTextWidth(cleanWord);
        const spaceWidth = pdf.getTextWidth(' ');

        // Verificar se a palavra cabe na linha atual
        const projectedWidth = currentLineWidth + (currentLine.length > 0 ? spaceWidth : 0) + wordWidth;

        if (projectedWidth > maxWidth && currentLine.length > 0) {
          // Renderizar linha atual (justificada)
          renderLine(currentLine, true);
          currentLine = [];
          currentLineWidth = 0;
        }

        // Adicionar palavra à linha atual
        currentLine.push({ text: cleanWord, isBold: wordIsBold });
        currentLineWidth += wordWidth + (currentLine.length > 1 ? spaceWidth : 0);

        // Se for a última palavra, renderizar sem justificar
        if (index === words.length - 1) {
          renderLine(currentLine, false);
        }
      });

      // Assinaturas
      yPosition += 25;
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = addHeader();
      }

      const signatureY = yPosition;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');

      // Calcular posições para 3 assinaturas distribuídas
      const signatureWidth = 40;
      const gapBetweenSignatures = 20;
      const totalSignaturesWidth = (signatureWidth * 3) + (gapBetweenSignatures * 2);
      const startX = (pageWidth - totalSignaturesWidth) / 2;

      const pos1 = startX;
      const pos2 = pos1 + signatureWidth + gapBetweenSignatures;
      const pos3 = pos2 + signatureWidth + gapBetweenSignatures;

      // Linha para assinatura VM
      pdf.line(pos1, signatureY, pos1 + signatureWidth, signatureY);
      pdf.text(nomeVM.toUpperCase(), pos1 + signatureWidth/2, signatureY + 5, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text(cargosVM, pos1 + signatureWidth/2, signatureY + 10, { align: 'center' });

      // Linha para assinatura Secretário
      pdf.setFont('helvetica', 'bold');
      pdf.line(pos2, signatureY, pos2 + signatureWidth, signatureY);
      pdf.text(nomeSec.toUpperCase(), pos2 + signatureWidth/2, signatureY + 5, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text(cargosSec, pos2 + signatureWidth/2, signatureY + 10, { align: 'center' });

      // Linha para assinatura Orador
      pdf.setFont('helvetica', 'bold');
      pdf.line(pos3, signatureY, pos3 + signatureWidth, signatureY);
      pdf.text(nomeOrador.toUpperCase(), pos3 + signatureWidth/2, signatureY + 5, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text(cargosOrador, pos3 + signatureWidth/2, signatureY + 10, { align: 'center' });

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
      <header className="bg-blue-900 text-white p-3 md:p-4 shadow-lg sticky top-0 z-50">
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
            <button
              onClick={() => router.push('/atas')}
              className="hover:bg-blue-800 p-2 rounded flex items-center gap-1 md:gap-2"
            >
              <ArrowLeft size={20} className="md:w-6 md:h-6" />
              <span className="text-sm md:text-base">Voltar</span>
            </button>
            <div className="flex-1">
              <h1 className="text-lg md:text-2xl font-bold">Visualizar Ata</h1>
              <p className="text-xs md:text-sm text-blue-200">Ata {ata.numeroAta}</p>
            </div>
          </div>
          <button
            onClick={gerarPDF}
            disabled={gerando}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-3 md:px-4 py-2 rounded-lg disabled:opacity-50 w-full md:w-auto text-sm md:text-base"
          >
            <Download size={18} className="md:w-5 md:h-5" />
            {gerando ? 'Gerando PDF...' : 'Baixar PDF'}
          </button>
        </div>
      </header>

      {/* Conteúdo da Ata */}
      <main className="w-full p-2 md:p-8">
        <div className="bg-white shadow-2xl rounded-lg">
          <div id="ata-completa" className="bg-white p-4 md:p-8 max-w-full md:max-w-[210mm]" style={{ margin: '0 auto' }}>

            {/* Cabeçalho com logos - será repetido em todas as páginas */}
            <div id="ata-cabecalho" className="mb-4 md:mb-6">
              <div className="flex justify-between items-start mb-4">
                <img src="/logo-gob.jpeg" alt="GOB" className="h-12 w-12 md:h-20 md:w-20" />
                <div className="text-center flex-1 mx-2 md:mx-4">
                  <h1 className="text-xs md:text-lg font-bold text-gray-900 mb-1 md:mb-2">
                    Augusta e Respeitável Loja Simbólica<br />
                    Sabedoria de Salomão Nº 4.774
                  </h1>
                  <p className="text-[10px] md:text-sm text-gray-700">
                    Rua João Aires de Aquino, Nº29, Vila Alta, 63119-450
                  </p>
                  <p className="text-[10px] md:text-sm text-gray-700 font-semibold">Crato-Ceará</p>
                </div>
                <img src="/logo.jpeg" alt="Loja" className="h-12 w-12 md:h-20 md:w-20" />
              </div>
            </div>

            {/* Corpo da ata */}
            <div id="ata-corpo">

            {/* Título */}
            <div className="text-center mb-4 md:mb-6">
              <h2 className="text-sm md:text-lg font-bold text-gray-900">GRANDE ORIENTE DO BRASIL</h2>
              <h3 className="text-xs md:text-base font-bold text-gray-900">ORIENTE DE CRATO-CE</h3>
              <h3 className="text-xs md:text-base font-bold text-gray-900">
                LIVRO DO {ata.livro} MAÇOM
              </h3>
              <h3 className="text-xs md:text-base font-bold text-gray-900 mt-1 md:mt-2">ATA {ata.numeroAta}</h3>
            </div>

            <hr className="border-t-2 border-gray-900 mb-3 md:mb-4" />

            {/* Subtítulo */}
            <h4 className="text-center text-xs md:text-base font-bold text-gray-900 mb-3 md:mb-4">
              ATA SESSÃO MAGNA DE {ata.livro}
            </h4>

            {/* Corpo da ata - texto contínuo sem quebras */}
            <div className="text-justify text-xs md:text-sm leading-relaxed text-gray-900" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
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
                {(() => {
                  // Agrupar cargos por membro
                  const cargosPorMembro = {};
                  ata.cargos.forEach(cargo => {
                    const nome = cargo.membro ? cargo.membro.nome : cargo.nomeManual;
                    if (!cargosPorMembro[nome]) {
                      cargosPorMembro[nome] = {
                        cargos: [],
                        cargoObj: cargo
                      };
                    }
                    cargosPorMembro[nome].cargos.push(cargo.cargo);
                  });

                  return Object.entries(cargosPorMembro).map(([nome, info], index, arr) => {
                    // Ordenar: "Membro do Ministério Público" sempre por último
                    const cargosOrdenados = info.cargos.sort((a, b) => {
                      if (a === 'Membro do Ministério Público') return 1;
                      if (b === 'Membro do Ministério Público') return -1;
                      return 0;
                    });

                    return (
                      <span key={index}>
                        <strong>{cargosOrdenados.join(' / ')}:</strong> {formatarNomeCargo(info.cargoObj)}
                        {index < arr.length - 1 ? ', ' : '. '}
                      </span>
                    );
                  });
                })()}
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
                  (() => {
                    const numeroParaExtenso = (numero) => {
                      const unidades = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
                      const dez_vinte = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
                      const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
                      const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

                      const num = parseInt(numero);

                      if (num === 0) return 'zero';
                      if (num < 10) return unidades[num];
                      if (num >= 10 && num < 20) return dez_vinte[num - 10];
                      if (num >= 20 && num < 100) {
                        const dez = Math.floor(num / 10);
                        const uni = num % 10;
                        return uni === 0 ? dezenas[dez] : `${dezenas[dez]} e ${unidades[uni]}`;
                      }
                      if (num === 100) return 'cem';
                      if (num > 100 && num < 1000) {
                        const cen = Math.floor(num / 100);
                        const resto = num % 100;
                        if (resto === 0) return centenas[cen];
                        if (resto < 10) return `${centenas[cen]} e ${unidades[resto]}`;
                        if (resto < 20) return `${centenas[cen]} e ${dez_vinte[resto - 10]}`;
                        const dez = Math.floor(resto / 10);
                        const uni = resto % 10;
                        return uni === 0 ? `${centenas[cen]} e ${dezenas[dez]}` : `${centenas[cen]} e ${dezenas[dez]} e ${unidades[uni]}`;
                      }
                      return numero.toString();
                    };

                    const reais = parseInt(Number(ata.valorTronco).toFixed(2).split('.')[0]);
                    const centavos = parseInt(Number(ata.valorTronco).toFixed(2).split('.')[1]);
                    const reaisExtenso = numeroParaExtenso(reais);
                    const centavosExtenso = numeroParaExtenso(centavos);

                    return centavos !== 0
                      ? `${reaisExtenso} ${reais === 1 ? 'real' : 'reais'} e ${centavosExtenso} ${centavos === 1 ? 'centavo' : 'centavos'}`
                      : `${reaisExtenso} ${reais === 1 ? 'real' : 'reais'}`;
                  })()
                }). Os trabalhos foram encerrados às {ata.horarioEncerramento} hs e nada mais havendo a tratar eu,{' '}
                {ata.cargos.find(c => c.cargo === 'Secretário')
                  ? formatarNomeCargo(ata.cargos.find(c => c.cargo === 'Secretário'))
                  : ''
                }, Secretário ADHOC, lavrei a presente ata que, acaba de ser lida e se aprovada será assinada por quem de direito.
              </p>
            </div>
            </div>

            {/* Assinaturas - só aparece na última página */}
            <div id="ata-assinaturas" className="mt-8 md:mt-16">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 md:gap-0 px-2 md:px-8">
              <div className="text-center w-full md:w-auto">
                <div className="border-b-2 border-gray-900 w-32 md:w-48 mb-2 mx-auto"></div>
                <p className="text-[10px] md:text-sm font-bold text-gray-900">
                  {ata.cargos.find(c => c.cargo === 'Venerável Mestre')
                    ? (ata.cargos.find(c => c.cargo === 'Venerável Mestre').membro?.nome ||
                       ata.cargos.find(c => c.cargo === 'Venerável Mestre').nomeManual)?.toUpperCase()
                    : ''}
                </p>
                <p className="text-[9px] md:text-xs text-gray-900">
                  {(() => {
                    const vm = ata.cargos.find(c => c.cargo === 'Venerável Mestre');
                    if (!vm) return 'Venerável Mestre';
                    const nomeVM = vm.membro?.nome || vm.nomeManual;
                    const cargos = ata.cargos
                      .filter(c => {
                        const nome = c.membro?.nome || c.nomeManual;
                        return nome === nomeVM;
                      })
                      .map(c => c.cargo)
                      .sort((a, b) => {
                        if (a === 'Membro do Ministério Público') return 1;
                        if (b === 'Membro do Ministério Público') return -1;
                        return 0;
                      });
                    return cargos.join(' / ');
                  })()}
                </p>
              </div>

              <div className="text-center w-full md:w-auto">
                <div className="border-b-2 border-gray-900 w-32 md:w-48 mb-2 mx-auto"></div>
                <p className="text-[10px] md:text-sm font-bold text-gray-900">
                  {ata.cargos.find(c => c.cargo === 'Secretário')
                    ? (ata.cargos.find(c => c.cargo === 'Secretário').membro?.nome ||
                       ata.cargos.find(c => c.cargo === 'Secretário').nomeManual)?.toUpperCase()
                    : ''}
                </p>
                <p className="text-[9px] md:text-xs text-gray-900">
                  {(() => {
                    const sec = ata.cargos.find(c => c.cargo === 'Secretário');
                    if (!sec) return 'Secretário';
                    const nomeSec = sec.membro?.nome || sec.nomeManual;
                    const cargos = ata.cargos
                      .filter(c => {
                        const nome = c.membro?.nome || c.nomeManual;
                        return nome === nomeSec;
                      })
                      .map(c => c.cargo)
                      .sort((a, b) => {
                        if (a === 'Membro do Ministério Público') return 1;
                        if (b === 'Membro do Ministério Público') return -1;
                        return 0;
                      });
                    return cargos.join(' / ');
                  })()}
                </p>
              </div>

              <div className="text-center w-full md:w-auto">
                <div className="border-b-2 border-gray-900 w-32 md:w-48 mb-2 mx-auto"></div>
                <p className="text-[10px] md:text-sm font-bold text-gray-900">
                  {ata.cargos.find(c => c.cargo === 'Orador')
                    ? (ata.cargos.find(c => c.cargo === 'Orador').membro?.nome ||
                       ata.cargos.find(c => c.cargo === 'Orador').nomeManual)?.toUpperCase()
                    : ''}
                </p>
                <p className="text-[9px] md:text-xs text-gray-900">
                  {(() => {
                    const orad = ata.cargos.find(c => c.cargo === 'Orador');
                    if (!orad) return 'Orador';
                    const nomeOrad = orad.membro?.nome || orad.nomeManual;
                    const cargos = ata.cargos
                      .filter(c => {
                        const nome = c.membro?.nome || c.nomeManual;
                        return nome === nomeOrad;
                      })
                      .map(c => c.cargo)
                      .sort((a, b) => {
                        if (a === 'Membro do Ministério Público') return 1;
                        if (b === 'Membro do Ministério Público') return -1;
                        return 0;
                      });
                    return cargos.join(' / ');
                  })()}
                </p>
              </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
