"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Download, Check, X } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DetalhePlanilhaPage() {
  const router = useRouter();
  const params = useParams();
  const planilhaId = params.id;

  const [planilha, setPlanilha] = useState(null);
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [membroSelecionado, setMembroSelecionado] = useState(null);
  const [mesesPagar, setMesesPagar] = useState(1);

  const meses = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  useEffect(() => {
    if (planilhaId) {
      carregarDados();
    }
  }, [planilhaId]);

  const carregarDados = async () => {
    try {
      // Buscar planilha
      const resPlanilha = await fetch(`/api/planilhas?ano=${new Date().getFullYear()}&mes=1`);
      const dataPlanilha = await resPlanilha.json();

      // Buscar membros ativos
      const resMembros = await fetch('/api/membros');
      const dataMembros = await resMembros.json();
      const membrosAtivos = dataMembros.filter(m => 
        m.status === 'ATIVO' && m.grau !== 'CANDIDATO'
      );

      setPlanilha(dataPlanilha);
      setMembros(membrosAtivos);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalPagamento = (membro) => {
    setMembroSelecionado(membro);
    setMesesPagar(1);
    setShowPagamentoModal(true);
  };

  const registrarPagamento = async () => {
    if (!membroSelecionado || !planilha) return;

    const valorTotal = Number(planilha.valorMensalidade) * mesesPagar;
    
    // Gerar string dos meses pagos
    let mesesRef = [];
    for (let i = 0; i < mesesPagar; i++) {
      const mesAtual = planilha.mes - i;
      const anoAtual = mesAtual > 0 ? planilha.ano : planilha.ano - 1;
      const mesAjustado = mesAtual > 0 ? mesAtual : 12 + mesAtual;
      mesesRef.push(`${meses[mesAjustado - 1]}/${anoAtual}`);
    }

    try {
      await fetch('/api/planilhas/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planilhaId,
          membroId: membroSelecionado.id,
          quantidadeMeses: mesesPagar,
          valorPago: valorTotal,
          mesesReferentes: mesesRef.join(', ')
        })
      });

      alert('Pagamento registrado com sucesso!');
      setShowPagamentoModal(false);
      carregarDados();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao registrar pagamento');
    }
  };

  const exportarPDF = async () => {
    // Implementar export similar ao recibo
    alert('Funcionalidade de exportar PDF em desenvolvimento');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!planilha) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-600">Planilha não encontrada</div>
          <button
            onClick={() => router.push('/financeiro')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const membrosPagaram = planilha.pagamentos?.map(p => p.membroId) || [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/financeiro')}
              className="hover:bg-blue-800 p-2 rounded"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {meses[planilha.mes - 1]} / {planilha.ano}
              </h1>
              <p className="text-sm text-blue-200">
                Mensalidade: R$ {Number(planilha.valorMensalidade).toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
          >
            <Download size={20} />
            Exportar PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Receitas</div>
            <div className="text-2xl font-bold text-green-600">
              R$ {Number(planilha.totalReceitas).toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Despesas</div>
            <div className="text-2xl font-bold text-red-600">
              R$ {Number(planilha.totalDespesas).toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Saldo Final</div>
            <div className={`text-2xl font-bold ${Number(planilha.saldoFinal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {Number(planilha.saldoFinal).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Tabela de Membros */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Controle de Mensalidades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-gray-700">Nome</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700">CIM</th>
                  <th className="px-6 py-3 text-center font-bold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-center font-bold text-gray-700">Ação</th>
                </tr>
              </thead>
              <tbody>
                {membros.map(membro => {
                  const pagou = membrosPagaram.includes(membro.id);
                  return (
                    <tr key={membro.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-800">{membro.nome}</td>
                      <td className="px-6 py-4 text-gray-800">{membro.cim || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        {pagou ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                            <Check size={16} /> Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                            <X size={16} /> Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {!pagou && (
                          <button
                            onClick={() => abrirModalPagamento(membro)}
                            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
                          >
                            Registrar Pagamento
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: Registrar Pagamento */}
      {showPagamentoModal && membroSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Registrar Pagamento</h2>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600">Membro:</div>
              <div className="font-bold text-lg">{membroSelecionado.nome}</div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold mb-1 text-gray-700">
                Quantidade de Meses
              </label>
              <select
                value={mesesPagar}
                onChange={(e) => setMesesPagar(parseInt(e.target.value))}
                className="w-full border-2 border-gray-300 rounded px-3 py-2"
              >
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'mês' : 'meses'}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-600">Valor Total:</div>
              <div className="text-2xl font-bold text-green-600">
                R$ {(Number(planilha.valorMensalidade) * mesesPagar).toFixed(2)}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={registrarPagamento}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Confirmar
              </button>
              <button
                onClick={() => setShowPagamentoModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}