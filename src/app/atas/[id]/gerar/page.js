"use client"
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';

export default function GerarPDFAtaPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      carregarEGerar();
    }
  }, [params.id]);

  const carregarEGerar = async () => {
    try {
      const response = await fetch(`/api/atas/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        gerarPDF(data);
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

  const gerarPDF = async (ataData) => {
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
      let yPosition = margin;

      // Helper function to add text with auto line breaks
      const addText = (text, fontSize, isBold, align = 'left') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = pdf.splitTextToSize(text, maxWidth);

        lines.forEach((line) => {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          let xPosition = margin;
          if (align === 'center') {
            const textWidth = pdf.getTextWidth(line);
            xPosition = (pageWidth - textWidth) / 2;
          }

          pdf.text(line, xPosition, yPosition);
          yPosition += fontSize * 0.5;
        });
      };

      // Carregar e adicionar logos
      try {
        const logoGobImg = await fetch('/logo-gob.jpeg').then(r => r.blob()).then(b => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(b);
        }));

        const logoImg = await fetch('/logo.jpeg').then(r => r.blob()).then(b => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(b);
        }));

        // Logo GOB (esquerda)
        pdf.addImage(logoGobImg, 'JPEG', margin, yPosition, 25, 25);

        // Logo Loja (direita)
        pdf.addImage(logoImg, 'JPEG', pageWidth - margin - 25, yPosition, 25, 25);
      } catch (error) {
        console.error('Erro ao carregar logos:', error);
      }

      // Cabeçalho centralizado (entre as logos)
      const headerY = yPosition + 3;
      yPosition = headerY;
      addText('Augusta e Respeitável Loja Simbólica', 11, true, 'center');
      addText('Sabedoria de Salomão Nº 4.774', 11, true, 'center');
      yPosition += 2;
      addText('Rua João Aires de Aquino, Nº29, Vila Alta, 63119-450', 9, false, 'center');
      addText('Crato-Ceará', 9, true, 'center');

      yPosition = Math.max(yPosition, headerY + 25) + 8;

      // Títulos
      addText('GRANDE ORIENTE DO BRASIL', 11, true, 'center');
      yPosition += 1;
      addText('ORIENTE DE CRATO-CE', 10, true, 'center');
      yPosition += 1;
      addText(`LIVRO DO ${ataData.livro} MAÇOM`, 10, true, 'center');
      yPosition += 2;
      addText(`ATA ${ataData.numeroAta}`, 10, true, 'center');
      yPosition += 1;

      // Linha horizontal
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      addText(`ATA SESSÃO MAGNA DE ${ataData.livro}`, 10, true, 'center');
      yPosition += 8;

      // Build ata text
      const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

      const dataAta = new Date(ataData.data);
      const dia = dataAta.getDate();
      const mes = meses[dataAta.getMonth()];
      const ano = dataAta.getFullYear();

      const numerosExtenso = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
        'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte',
        'vinte e um', 'vinte e dois', 'vinte e três', 'vinte e quatro', 'vinte e cinco', 'vinte e seis',
        'vinte e sete', 'vinte e oito', 'vinte e nove', 'trinta', 'trinta e um'];

      const formatarNome = (cargo) => {
        const nome = cargo.membro ? cargo.membro.nome : cargo.nomeManual;
        return `Ir. ${nome.toUpperCase()}`;
      };

      const formatarNomePresenca = (presenca) => {
        const nome = presenca.membro ? presenca.membro.nome : presenca.nomeManual;
        return `Ir. ${nome.toUpperCase()}`;
      };

      const visitantes = ataData.presencas.filter(p => p.tipo === 'VISITANTE').length;
      const quadro = ataData.numeroPresentes - visitantes;

      let textoCorpo = `Ata ${ataData.numeroAta} da sessão ordinária no grau de ${ataData.livro} Maçom do Rito Schröder, da A∴R∴L∴S∴ Sabedoria de Salomão nº 4.774, realizada na Rua Virgílio Arrais, bairro Grangeiro, Crato–CE, aos ${dia} (${numerosExtenso[dia]}) dias do mês de ${mes} de ${ano} da Era Vulgar. Os trabalhos foram iniciados às ${ataData.horarioInicio} hs, com a presença de ${ataData.numeroPresentes} (${numerosExtenso[ataData.numeroPresentes] || ataData.numeroPresentes}) Irmãos, sendo `;

      if (visitantes > 0) {
        textoCorpo += `${quadro} (${numerosExtenso[quadro] || quadro}) do quadro da Loja e ${visitantes} (${numerosExtenso[visitantes] || visitantes}) visitantes. `;
      } else {
        textoCorpo += 'todos do quadro da Loja. ';
      }

      textoCorpo += 'Os cargos foram ocupados na seguinte ordem: ';
      textoCorpo += ataData.cargos.map(cargo => `${cargo.cargo}: ${formatarNome(cargo)}`).join(', ') + '. ';

      if (ataData.presencas.filter(p => p.tipo === 'QUADRO').length > 0) {
        textoCorpo += 'Estiveram também presentes os Irmãos membros do quadro da loja: ';
        textoCorpo += ataData.presencas.filter(p => p.tipo === 'QUADRO').map(p => formatarNomePresenca(p)).join(', ') + '. ';
      }

      if (visitantes > 0) {
        textoCorpo += 'Estiveram também presentes os seguintes visitantes: ';
        textoCorpo += ataData.presencas.filter(p => p.tipo === 'VISITANTE').map(p => formatarNomePresenca(p)).join(', ') + '. ';
      }

      const veneravel = ataData.cargos.find(c => c.cargo === 'Venerável Mestre');
      if (veneravel) {
        textoCorpo += `Após a abertura dos trabalhos, o Venerável Mestre ${formatarNome(veneravel)} saudou cordialmente a todos os presentes. `;
      }

      if (ataData.leituraAta) {
        textoCorpo += `LEITURA DE ATA: ${ataData.leituraAta} `;
      }

      if (ataData.expediente) {
        textoCorpo += `EXPEDIENTE: ${ataData.expediente} `;
      }

      if (ataData.ordemDia) {
        textoCorpo += `ORDEM DO DIA: ${ataData.ordemDia} `;
      }

      if (ataData.coberturaTemplo) {
        textoCorpo += `PEDIDOS DE COBERTURA DO TEMPLO DEFINITIVO: ${ataData.coberturaTemplo} `;
      }

      if (ataData.palavraBemLoja) {
        textoCorpo += `PALAVRA A BEM DESTA LOJA OU DA MAÇONARIA EM GERAL: ${ataData.palavraBemLoja} `;
      }

      const valorFormatado = Number(ataData.valorTronco).toFixed(2).replace('.', ',');
      const reais = Number(ataData.valorTronco).toFixed(2).split('.')[0];
      const centavos = Number(ataData.valorTronco).toFixed(2).split('.')[1];

      textoCorpo += `TRONCO DE BENEFICÊNCIA: Após o giro da esmoleira, o resultado da coleta foi de R$ ${valorFormatado} (${reais} reais${centavos !== '00' ? ` e ${centavos} centavos` : ''}). `;

      const secretario = ataData.cargos.find(c => c.cargo === 'Secretário');
      textoCorpo += `Os trabalhos foram encerrados às ${ataData.horarioEncerramento} hs e nada mais havendo a tratar eu, ${secretario ? formatarNome(secretario) : ''}, Secretário AD HOC, lavrei a presente ata que, acaba de ser lida e se aprovada será assinada por quem de direito.`;

      // Body text (justified)
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const bodyLines = pdf.splitTextToSize(textoCorpo, maxWidth);

      bodyLines.forEach((line) => {
        if (yPosition > pageHeight - margin - 50) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 5.5;
      });

      // Signatures
      yPosition += 20;
      if (yPosition > pageHeight - margin - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      const signatureY = yPosition;
      const signatureSpacing = 60;

      // Venerável Mestre
      pdf.line(margin, signatureY, margin + 50, signatureY);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      if (veneravel) {
        const nomeVM = veneravel.membro?.nome || veneravel.nomeManual;
        pdf.text(nomeVM.toUpperCase(), margin + 25, signatureY + 5, { align: 'center' });
      }
      pdf.setFont('helvetica', 'normal');
      pdf.text('Venerável Mestre', margin + 25, signatureY + 10, { align: 'center' });

      // Secretário
      const secX = margin + signatureSpacing;
      pdf.line(secX, signatureY, secX + 50, signatureY);
      pdf.setFont('helvetica', 'bold');
      if (secretario) {
        const nomeSec = secretario.membro?.nome || secretario.nomeManual;
        pdf.text(nomeSec.toUpperCase(), secX + 25, signatureY + 5, { align: 'center' });
      }
      pdf.setFont('helvetica', 'normal');
      pdf.text('Secretário', secX + 25, signatureY + 10, { align: 'center' });

      // Orador
      const oradorX = margin + (signatureSpacing * 2);
      const orador = ataData.cargos.find(c => c.cargo === 'Orador');
      pdf.line(oradorX, signatureY, oradorX + 50, signatureY);
      pdf.setFont('helvetica', 'bold');
      if (orador) {
        const nomeOrador = orador.membro?.nome || orador.nomeManual;
        pdf.text(nomeOrador.toUpperCase(), oradorX + 25, signatureY + 5, { align: 'center' });
      }
      pdf.setFont('helvetica', 'normal');
      pdf.text('Orador', oradorX + 25, signatureY + 10, { align: 'center' });

      pdf.save(`Ata_${ataData.numeroAta.replace('/', '_')}.pdf`);

      // Fecha a janela ou volta para a página anterior
      setTimeout(() => {
        window.close();
        if (!window.closed) {
          router.push('/atas');
        }
      }, 500);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF');
      router.push('/atas');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-xl font-bold text-gray-600">Gerando PDF...</div>
    </div>
  );
}