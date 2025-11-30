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
  const taxas = ['INICIAÇÃO', 'ELEIÇÃO', 'EXALTAÇÃO', 'INSTALAÇÃO', 'REGULARIZAÇÃO', 'QUITE PLACET'];

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
        extenso += " e " + numeroParaExtenso(centavos) + " centavo" + (centavos > 1 ? "s" : "");
      }
      setValorExtenso(extenso);
    } else {
      setValorExtenso('');
    }
  }, [valor]);

  const gerarPDF = () => setPdfGerado(true);

  const exportarPDF = async () => {
    const recibo = document.getElementById('recibo-content');
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(script);
    script.onload = async () => {
      const canvas = await window.html2canvas(recibo, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `recibo_${recebemosDe.replace(/\s+/g, '_')}_${new Date().getTime()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      });
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Formulário */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4 text-black">Preencher Dados do Recibo</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
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

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold mb-1 text-black">Referente ao mês de</label>
              <select
                value={mesReferente}
                onChange={(e) => setMesReferente(e.target.value)}
                className="w-full border-2 border-black rounded px-3 py-2 text-black font-semibold"
              >
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
                {taxas.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Dia e mês completos */}
          <div className="grid grid-cols-4 gap-4 mb-6">
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
              className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Download size={20} />
              Gerar Recibo (Pré-visualizar)
            </button>
          )}
        </div>

        {/* Recibo */}
        <div id="recibo-content" className="bg-white p-8" style={{ width: '210mm', minHeight: '148mm' }}>
          {/* Header */}
          <div className="border-4 border-black rounded-lg p-4 mb-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs mb-2 text-black">Loja nº:</div>
              <div className="text-center font-bold text-sm pt-6 text-black">
                A.R.L.S. SABEDORIA DE SALOMÃO Nº 4774
              </div>
            </div>
            <div className="w-32 h-32 ml-4 flex items-center justify-center">
              <img src="/logo.jpeg" alt="ARLS Sabedoria de Salomão" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Recebemos de */}
          <div className="mb-3">
            <span className="text-sm font-bold text-black">Recebemos de(a):</span>
            <div className="border-2 border-black rounded-lg px-3 py-2 mt-1 text-black">{recebemosDe}</div>
          </div>

          {/* Valor por extenso */}
          <div className="mb-3">
            <span className="text-sm font-bold text-black">O valor de:</span>
            <div className="border-2 border-black rounded-lg px-3 py-2 mt-1 text-black">{valorExtenso}</div>
          </div>

          {/* Checkboxes de dia e mês */}
          <div className="flex gap-4 mb-4">
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
            <div className="w-64">
              <div className="text-4xl font-bold mb-2 text-center text-black">RECIBO</div>
              <div className="border-4 border-black rounded-lg p-4 flex items-center justify-between">
                <span className="text-3xl font-bold text-black">R$</span>
                <span className="text-2xl font-bold text-black">{valor}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end text-sm pt-6 text-black">
            <div className="flex gap-2 items-center">
              <span>{dataLocal} - CE,</span>
              <span className="px-4">{dia}</span>
              <span>de</span>
              <span className="px-4">{mes}</span>
              <span>de</span>
              <span className="px-8">{ano}</span>
            </div>
            <div className="w-64 text-center">
              <span>Tesoureiro</span>
            </div>
          </div>
        </div>

        {pdfGerado && (
          <div className="mt-6 text-center">
            <button
              onClick={exportarPDF}
              className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-green-700 inline-flex items-center gap-2"
            >
              <FileDown size={20} />
              Exportar e Salvar Recibo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReciboMaconico;
