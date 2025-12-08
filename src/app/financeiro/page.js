"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, FileText, FolderOpen, Download } from 'lucide-react';

export default function FinanceiroPage() {
  const router = useRouter();
  const [planilhas, setPlanilhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [novoMes, setNovoMes] = useState(new Date().getMonth() + 1);
  const [novoAno, setNovoAno] = useState(new Date().getFullYear());
  const [valorMensalidade, setValorMensalidade] = useState('345.00');

  const meses = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  useEffect(() => {
    carregarPlanilhas();
  }, []);

  const carregarPlanilhas = async () => {
    try {
      const response = await fetch('/api/planilhas');
      const data = await response.json();
      setPlanilhas(data);
    } catch (error) {
      console.error('Erro ao carregar planilhas:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarPlanilha = async () => {
    try {
      const response = await fetch('/api/planilhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mes: novoMes,
          ano: novoAno,
          valorMensalidade: parseFloat(valorMensalidade)
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Planilha criada com sucesso!');
        if (data.inadimplentes.length > 0) {
          alert(`Atenção: ${data.inadimplentes.length} membro(s) com mensalidade pendente do mês anterior.`);
        }
        setShowCreateModal(false);
        carregarPlanilhas();
      } else {
        alert(data.error || 'Erro ao criar planilha');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar planilha');
    }
  };

  const excluirPlanilha = async (id, mes, ano) => {
    if (!confirm(`Deseja realmente excluir a planilha de ${meses[mes - 1]}/${ano}?`)) {
      return;
    }

    try {
      await fetch('/api/planilhas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      alert('Planilha excluída com sucesso!');
      carregarPlanilhas();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir planilha');
    }
  };

  // Agrupar planilhas por ano
  const planilhasPorAno = planilhas.reduce((acc, planilha) => {
    if (!acc[planilha.ano]) {
      acc[planilha.ano] = [];
    }
    acc[planilha.ano].push(planilha);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="hover:bg-blue-800 p-2 rounded"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Gestão Financeira</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Nova Planilha
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Carregando...</div>
        ) : Object.keys(planilhasPorAno).length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-600">
            <FolderOpen size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-xl mb-2">Nenhuma planilha criada</p>
            <p className="text-sm">Clique em "Nova Planilha" para começar</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(planilhasPorAno).sort((a, b) => b - a).map(ano => (
              <div key={ano} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <FolderOpen className="text-blue-600" />
                  Ano {ano}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {planilhasPorAno[ano].map(planilha => (
                    <div
                      key={planilha.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition cursor-pointer"
                      onClick={() => router.push(`/financeiro/${planilha.id}`)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="text-blue-600" size={24} />
                          <h3 className="font-bold text-lg text-gray-800">
                            {meses[planilha.mes - 1]}
                          </h3>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            excluirPlanilha(planilha.id, planilha.mes, planilha.ano);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mensalidade:</span>
                          <span className="font-semibold">R$ {Number(planilha.valorMensalidade).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Receitas:</span>
                          <span className="font-semibold text-green-600">
                            R$ {Number(planilha.totalReceitas).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Despesas:</span>
                          <span className="font-semibold text-red-600">
                            R$ {Number(planilha.totalDespesas).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-gray-700 font-bold">Saldo:</span>
                          <span className={`font-bold ${Number(planilha.saldoFinal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {Number(planilha.saldoFinal).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Pagamentos:</span>
                          <span>{planilha._count.pagamentos}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal: Criar Planilha */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Nova Planilha Financeira</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Mês</label>
                <select
                  value={novoMes}
                  onChange={(e) => setNovoMes(parseInt(e.target.value))}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                >
                  {meses.map((mes, index) => (
                    <option key={index} value={index + 1}>{mes}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Ano</label>
                <input
                  type="number"
                  value={novoAno}
                  onChange={(e) => setNovoAno(parseInt(e.target.value))}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                  min="2020"
                  max="2100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Valor da Mensalidade (R$)</label>
                <input
                  type="text"
                  value={valorMensalidade}
                  onChange={(e) => setValorMensalidade(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="345.00"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={criarPlanilha}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Criar
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
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
