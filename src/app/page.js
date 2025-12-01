"use client"
import React, { useState, useEffect } from 'react';
import { Download, FileDown } from 'lucide-react';

// Função para converter números em valor por extenso
const numeroParaExtenso = (numero) => {
  if (!numero) return "";

  const unidade = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezena = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const especiais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const centena = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  const separarMilhares = (num) => {
    const partes = [];
    let n = parseInt(num, 10);
    while (n > 0) {
      partes.unshift(n % 1000);
      n = Math.floor(n / 1000);
    }
    return partes;
  };

  const escreverCentena = (num) => {
    if (num === 100) return "cem";
    let texto = "";
    const c = Math.floor(num / 100);
    const d = Math.floor((num % 100) / 10);
    const u = num % 10;

    if (c) texto += centena[c];
    if (d === 1 && u > 0) {
      texto += (texto ? " e " : "") + especiais[u];
      return texto;
    } else if (d) {
      texto += (texto ? " e " : "") + dezena[d];
    }
    if (u) texto += (texto ? " e " : "") + unidade[u];
    return texto;
  };

  const milhares = separarMilhares(numero);
  const partesExtenso = [];
  const nomeMilhares = ["", "mil", "milhão", "bilhão", "trilhão"];
  const nomeMilharesPlural = ["", "mil", "milhões", "bilhões", "trilhões"];

  milhares.forEach((valor, idx) => {
    if (valor === 0) return;
    const idxNome = milhares.length - idx - 1;
    const texto = escreverCentena(valor);
    partesExtenso.push(
      texto + " " + (valor > 1 && idxNome > 0 ? nomeMilharesPlural[idxNome] : nomeMilhares[idxNome])
    );
  });

  return partesExtenso.join(" e ").trim();
};

const ReciboMaconico = () => {
  const [valor, setValor] = useState('');
  const [recebemosDe, setRecebemosDe] = useState('');
  const [valorExtenso, setValorExtenso] = useState('');
  const [mesReferente, setMesReferente] = useState('');
  const [taxaDe, setTaxaDe] = useState('');
  const [dataLocal, setDataLocal] = useState('CRATO-CE');
  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [ano, setAno] = useState('');

  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const mesesCompletos = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];
  const taxas = ['INICIAÇÃO', 'ELEIÇÃO', 'PASSAGEM DE GRAU', 'ELEVAÇÃO' , 'INSTALAÇÃO', 'REGULARIZAÇÃO', 'QUITE PLACET'];

  const [pdfGerado, setPdfGerado] = useState(false);

  // Atualiza valor por extenso automaticamente
  useEffect(() => {
    if (!valor) {
      setValorExtenso('');
      return;
    }

    const numero = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(numero)) {
      const inteiro = Math.floor(numero);
      const centavos = Math.round((numero - inteiro) * 100);
      let extenso = (numeroParaExtenso(inteiro) + (inteiro === 1 ? " real" : " reais")).toUpperCase();

      if (centavos > 0) {
        extenso += " E " + numeroParaExtenso(centavos).toUpperCase() + " CENTAVO" + (centavos > 1 ? "S" : "");
      }
      setValorExtenso(extenso);
    } else {
      setValorExtenso('');
    }
  }, [valor]);

  const gerarPDF = () => setPdfGerado(true);

  const exportarPDF = async () => {
    const recibo = document.getElementById('recibo-content');
    
    try {
      // Carrega html2canvas se não estiver carregado
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      // Carrega jsPDF se não estiver carregado
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      // Gera o canvas
      const canvas = await window.html2canvas(recibo, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: recibo.scrollWidth,
        windowHeight: recibo.scrollHeight
      });
      
      // Cria o PDF
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      
      // Calcula dimensões
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      
      // Define o PDF em modo paisagem A4
      const pdfWidth = 297; // A4 landscape em mm
      const pdfHeight = 210; // A4 landscape em mm
      
      let finalWidth = pdfWidth;
      let finalHeight = pdfWidth / ratio;
      
      // Se a altura calculada for maior que a página, ajusta pela altura
      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight;
        finalWidth = pdfHeight * ratio;
      }
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Centraliza a imagem no PDF
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      pdf.save(`recibo_${recebemosDe.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Formulário */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-black">Preencher Dados do Recibo</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold mb-1 text-black">Valor (R$)</label>
              <input
                type="text"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full border-2 border-black rounded px-3 py-2 text-black font-semibold"
                placeholder="1.000,00"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-black">Recebemos de</label>
              <input
                type="text"
                value={recebemosDe}
                onChange={(e) => setRecebemosDe(e.target.value)}
                className="w-full border-2 border-black rounded px-3 py-2 text-black font-semibold"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-1 text-black">O valor de (por extenso)</label>
            <input
              type="text"
              value={valorExtenso}
              readOnly
              className="w-full border-2 border-black rounded px-3 py-2 text-black font-semibold bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold mb-1 text-black">Referente ao mês de</label>
              <select
                value={mesReferente}
                onChange={(e) => setMesReferente(e.target.value)}
                className="w-full border-2 border-black rounded px-3 py-2 text-black font-semibold"
              >
                <option value="">Selecione</option>
                {meses.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-black">Ano (referente)</label>
              <input
                type="text"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="w-full border-2 border-black rounded px-3 py-2 text-black font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-black">Taxa de</label>
              <select
                value={taxaDe}
                onChange={(e) => setTaxaDe(e.target.value)}
                className="w-full border-2 border-black rounded px-3 py-2 text-black font-semibold"
              >
                <option value="">Selecione</option>
                {taxas.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Dia e mês completos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold mb-1 text-black">Local</label>
              <input
                type="text"
                value={dataLocal}
                onChange={(e) => setDataLocal(e.target.value)}
                className="w-full border-2 border-black rounded px-3 py-2 text-black font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-black">Dia</label>
              <select
                value={dia}
                onChange={(e) => setDia(e.target.value)}
                className="w-full border-2 border-black rounded px-3 py-2 text-black font-semibold"
              >
                <option value="">Selecione</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-black">Mês</label>
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="w-full border-2 border-black rounded px-3 py-2 text-black font-semibold"
              >
                <option value="">Selecione</option>
                {mesesCompletos.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-black">Ano</label>
              <input
                type="text"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="w-full border-2 border-black rounded px-3 py-2 text-black font-semibold"
              />
            </div>
          </div>

          {!pdfGerado && (
            <button
              onClick={gerarPDF}
              className="w-full md:w-auto bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 inline-flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Gerar Recibo (Pré-visualizar)
            </button>
          )}
        </div>

        {/* Recibo */}
        <div id="recibo-content" className="bg-white p-4 md:p-8 overflow-x-auto" style={{ maxWidth: '100%' }}>
          {/* Header */}
          <div className="border-4 border-black rounded-lg p-3 md:p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <div className="text-xs mb-2 text-black">Loja nº:</div>
              <div className="text-center font-bold text-sm pt-6 text-black">
                A.R.L.S. SABEDORIA DE SALOMÃO Nº 4774
              </div>
            </div>
            <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
              <img src="/logo.jpeg" alt="ARLS Sabedoria de Salomão" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Recebemos de */}
          <div className="mb-3">
            <span className="text-sm font-bold text-black">Recebemos de(a):</span>
            <div className="border-2 border-black rounded-lg px-3 py-2 mt-1 text-black break-words">{recebemosDe}</div>
          </div>

          {/* Valor por extenso */}
          <div className="mb-3">
            <span className="text-sm font-bold text-black">O valor de:</span>
            <div className="border-2 border-black rounded-lg px-3 py-2 mt-1 text-black break-words">{valorExtenso}</div>
          </div>

          {/* Checkboxes de dia e mês */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 border-2 border-black rounded-lg p-3">
              <div className="mb-2 text-black">
                <div className="text-xs mb-1 font-bold">Dia:</div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <div key={d} className="flex flex-col items-center">
                      <input type="checkbox" checked={parseInt(dia) === d} readOnly className="mb-1" />
                      <span className="text-xs">{d}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-2 text-black">
                <div className="text-xs mb-1 font-bold">Mês:</div>
                <div className="flex gap-1 flex-wrap">
                  {meses.map(m => (
                    <div key={m} className="flex flex-col items-center">
                      <input type="checkbox" checked={mesReferente === m} readOnly className="mb-1" />
                      <span className="text-xs">{m}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs mt-2">
                  <span className="font-bold">ANO:</span> {ano}
                </div>
              </div>

              <div className="text-black">
                <div className="text-xs font-bold mb-1">Taxa de:</div>
                <div className="space-y-1 text-xs">
                  {taxas.map(taxa => (
                    <div key={taxa} className="flex items-center gap-2">
                      <input type="checkbox" checked={taxaDe === taxa} readOnly />
                      <span>{taxa}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recibo R$ */}
            <div className="w-full md:w-64">
              <div className="text-4xl font-bold mb-2 text-center text-black">RECIBO</div>
              <div className="border-4 border-black rounded-lg p-4 flex items-center justify-between">
                <span className="text-3xl font-bold text-black">R$</span>
                <span className="text-2xl font-bold text-black">{valor}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end text-sm pt-6 text-black gap-4 md:gap-0">
            <div className="flex gap-2 items-center flex-wrap">
              <span>{dataLocal},</span>
              <span className="px-4">{dia}</span>
              <span>de</span>
              <span className="px-4">{mes}</span>
              <span>de</span>
              <span className="px-8">{ano}</span>
            </div>
            <div className="w-full md:w-64 text-center">
              <span>Tesoureiro</span>
            </div>
          </div>
        </div>

        {pdfGerado && (
          <div className="mt-6 text-center">
            <button
              onClick={exportarPDF}
              className="w-full md:w-auto bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 inline-flex items-center justify-center gap-2"
            >
              <FileDown size={20} />
              Exportar e Salvar Recibo em PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReciboMaconico;