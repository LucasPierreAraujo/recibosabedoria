"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, FileText, FolderOpen, AlertCircle } from 'lucide-react';

export default function FinanceiroPage() {
  const router = useRouter();
  const [planilhas, setPlanilhas] = useState([]);
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [novoMes, setNovoMes] = useState(new Date().getMonth() + 1);
  const [novoAno, setNovoAno] = useState(new Date().getFullYear());
  
  // Dados Padrão e Saldos
  const [valorMensalidade, setValorMensalidade] = useState('0,00');
  const [saldoInicialCaixa, setSaldoInicialCaixa] = useState('0,00'); 
  const [saldoInicialTronco, setSaldoInicialTronco] = useState('0,00');

  // Mensalidade de Exceção
  const [valorMensalidadeExcecao, setValorMensalidadeExcecao] = useState('0,00');
  const [membrosExcecaoSelecionados, setMembrosExcecaoSelecionados] = useState([]);
  
  // NOVO: Sistema de Inadimplência Individual
  const [mostrarInadimplencia, setMostrarInadimplencia] = useState(false);
  const [membroSelecionadoInadimplencia, setMembroSelecionadoInadimplencia] = useState(null);
  const [inadimplenciaPorMembro, setInadimplenciaPorMembro] = useState({});

  const meses = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = async () => {
    try {
      const [resPlanilhas, resMembros] = await Promise.all([
        fetch('/api/planilhas'),
        fetch('/api/membros?financeiro=true')
      ]);
      
      const dataPlanilhas = await resPlanilhas.json();
      const dataMembros = await resMembros.json();
      
      // Validar se é array antes de setar
      setPlanilhas(Array.isArray(dataPlanilhas) ? dataPlanilhas : []);
      setMembros(Array.isArray(dataMembros) ? dataMembros : []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setPlanilhas([]);
      setMembros([]);
    } finally {
      setLoading(false);
    }
  };
  
  const formatarInputValor = (valor) => {
    let v = String(valor).replace(/\D/g, '');
    v = (parseInt(v) / 100).toFixed(2);
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return v === 'NaN' ? '' : v;
  };
  
  const handleValorChange = (e, setter) => {
      setter(formatarInputValor(e.target.value));
  };
  
  const handleToggleExcecao = (membroId) => {
    setMembrosExcecaoSelecionados(prev => 
      prev.includes(membroId) 
        ? prev.filter(id => id !== membroId)
        : [...prev, membroId]
    );
  };
  
  // NOVO: Abrir modal de inadimplência para um membro específico
  const abrirModalInadimplencia = (membro) => {
    setMembroSelecionadoInadimplencia(membro);
    setMostrarInadimplencia(true);
  };

  // NOVO: Adicionar/remover mês de inadimplência para o membro selecionado
  const toggleMesInadimplente = (mes, ano) => {
    const membroId = membroSelecionadoInadimplencia.id;
    const chave = `${mes}-${ano}`;
    
    setInadimplenciaPorMembro(prev => {
      const mesesDoMembro = prev[membroId] || [];
      const jaExiste = mesesDoMembro.some(m => m.mes === mes && m.ano === ano);
      
      if (jaExiste) {
        // Remove
        return {
          ...prev,
          [membroId]: mesesDoMembro.filter(m => !(m.mes === mes && m.ano === ano))
        };
      } else {
        // Adiciona
        return {
          ...prev,
          [membroId]: [...mesesDoMembro, { mes, ano }]
        };
      }
    });
  };

  // NOVO: Verificar se um mês está marcado como inadimplente
  const isMesInadimplente = (mes, ano) => {
    if (!membroSelecionadoInadimplencia) return false;
    const mesesDoMembro = inadimplenciaPorMembro[membroSelecionadoInadimplencia.id] || [];
    return mesesDoMembro.some(m => m.mes === mes && m.ano === ano);
  };

  // NOVO: Remover todas as inadimplências de um membro
  const removerInadimplenciaMembro = (membroId) => {
    setInadimplenciaPorMembro(prev => {
      const novo = { ...prev };
      delete novo[membroId];
      return novo;
    });
  };

  // NOVO: Gerar lista de meses disponíveis (12 meses anteriores)
  const gerarMesesDisponiveis = () => {
    const mesesDisponiveis = [];
    let mesAtual = novoMes;
    let anoAtual = novoAno;
    
    // Gera 12 meses anteriores ao mês da planilha
    for (let i = 1; i <= 12; i++) {
      mesAtual--;
      if (mesAtual < 1) {
        mesAtual = 12;
        anoAtual--;
      }
      mesesDisponiveis.push({ mes: mesAtual, ano: anoAtual });
    }
    
    return mesesDisponiveis;
  };

  const criarPlanilha = async () => {
    try {
      const valorMensalidadeFloat = parseFloat(valorMensalidade.replace(/\./g, '').replace(',', '.')) || 0;
      const valorExcecaoFloat = parseFloat(valorMensalidadeExcecao.replace(/\./g, '').replace(',', '.')) || 0;
      
      const payload = {
          mes: novoMes,
          ano: novoAno,
          valorMensalidade: valorMensalidadeFloat,
          saldoInicialCaixa: parseFloat(saldoInicialCaixa.replace(/\./g, '').replace(',', '.')) || 0,
          saldoInicialTronco: parseFloat(saldoInicialTronco.replace(/\./g, '').replace(',', '.')) || 0,
          
          valorMensalidadeExcecao: valorExcecaoFloat,
          membrosExcecaoIds: membrosExcecaoSelecionados.join(','),
          
          inadimplenciaPorMembro: inadimplenciaPorMembro
      };

      const response = await fetch('/api/planilhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || data.details || 'Erro desconhecido no servidor';
        console.error('Falha na criação da planilha:', errorMessage);
        alert(errorMessage);
        return;
      }

      if (data.success) {
        console.log('Planilha criada com sucesso.'); 
        setShowCreateModal(false);
        // Resetar estados
        setInadimplenciaPorMembro({});
        setMembrosExcecaoSelecionados([]);
        carregarDadosIniciais();
      } else {
        console.error(data.error || 'Erro ao criar planilha');
        alert(data.error || 'Erro ao criar planilha'); 
      }
    } catch (error) {
      console.error('Erro de rede ou JSON:', error);
      alert('Erro ao criar planilha. Verifique sua conexão e o console.');
    }
  };

  const excluirPlanilha = async (id, mes, ano) => {
    if (!confirm(`Deseja realmente excluir a planilha de ${meses[mes - 1]}/${ano}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/planilhas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Falha ao excluir planilha.');
        return;
      }
      
      console.log('Planilha excluída com sucesso.'); 
      carregarDadosIniciais();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir planilha');
    }
  };
  
  const planilhasPorAno = Array.isArray(planilhas) ? planilhas.reduce((acc, planilha) => {
    if (!acc[planilha.ano]) {
      acc[planilha.ano] = [];
    }
    acc[planilha.ano].push(planilha);
    return acc;
  }, {}) : {};

  // Contar quantos membros têm inadimplência marcada
  const totalMembrosInadimplentes = Object.keys(inadimplenciaPorMembro).length;
  const totalMesesInadimplentes = Object.values(inadimplenciaPorMembro).reduce(
    (sum, meses) => sum + meses.length, 0
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="hover:bg-blue-800 p-2 rounded">
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
            <p className="text-sm">Clique em Nova Planilha para começar</p>
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
                          <span className="text-gray-600">Sld. Inicial (Caixa):</span>
                          <span className="font-semibold text-gray-800">
                            R$ {Number(planilha.saldoInicialCaixa || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sld. Inicial (Tronco):</span>
                          <span className="font-semibold text-gray-800">
                            R$ {Number(planilha.saldoInicialTronco || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Receitas (Caixa):</span>
                          <span className="font-semibold text-green-600">
                            R$ {Number(planilha.totalReceitas).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Despesas (Caixa):</span>
                          <span className="font-semibold text-red-600">
                            R$ {Number(planilha.totalDespesas).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-gray-700 font-bold">Saldo Total:</span>
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
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 sticky top-0 bg-white z-10">
              Nova Planilha Financeira
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Coluna 1: Dados Básicos e Saldo */}
                <div className="space-y-4 border-r pr-4">
                    <h3 className="text-lg font-semibold text-blue-800 border-b pb-2 mb-2">Dados da Planilha</h3>
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
                        <label className="block text-sm font-bold mb-1 text-gray-700">Mensalidade Padrão (R$)</label>
                        <input
                            type="text"
                            value={valorMensalidade}
                            onChange={(e) => handleValorChange(e, setValorMensalidade)}
                            className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                            placeholder="345,00"
                        />
                    </div>

                    <h3 className="text-lg font-semibold text-blue-800 border-b pb-2 pt-4 mb-2">Saldos Iniciais</h3>
                    
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Saldo Inicial do Caixa (R$)</label>
                        <input
                            type="text"
                            value={saldoInicialCaixa}
                            onChange={(e) => handleValorChange(e, setSaldoInicialCaixa)}
                            className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                            placeholder="0,00"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Saldo Inicial do Tronco (R$)</label>
                        <input
                            type="text"
                            value={saldoInicialTronco}
                            onChange={(e) => handleValorChange(e, setSaldoInicialTronco)}
                            className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                            placeholder="0,00"
                        />
                    </div>
                </div>

                {/* Coluna 2: Exceção de Mensalidade */}
                <div className="space-y-4 border-r pr-4">
                    <h3 className="text-lg font-semibold text-blue-800 border-b pb-2 mb-2">Mensalidade de Exceção</h3>
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">Valor de Exceção (R$)</label>
                        <input 
                            type="text" 
                            value={valorMensalidadeExcecao} 
                            onChange={(e) => handleValorChange(e, setValorMensalidadeExcecao)} 
                            className="w-full text-gray-900 border-2 border-gray-300 rounded px-3 py-2" 
                            placeholder="Ex: 0,00 para isenção total" 
                        />
                        <p className="text-xs text-gray-500 mt-1">Aplica-se apenas aos irmãos selecionados abaixo</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-700">Irmãos com Pagamento Diferente</label>
                        <div className="border border-gray-300 rounded p-3 max-h-60 overflow-y-auto space-y-1">
                            {membros.map(membro => (
                                <div key={membro.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`membro-excecao-${membro.id}`}
                                        checked={membrosExcecaoSelecionados.includes(membro.id)}
                                        onChange={() => handleToggleExcecao(membro.id)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`membro-excecao-${membro.id}`} className="ml-2 text-sm text-gray-900 cursor-pointer">
                                        {membro.nome}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Coluna 3: Inadimplência Individual (NOVA) */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-red-800 border-b pb-2 mb-2 flex items-center gap-2">
                      <AlertCircle size={20} />
                      Inadimplência (Individual)
                    </h3>
                    
                    {totalMembrosInadimplentes > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                        <p className="text-sm text-red-800 font-semibold">
                          {totalMembrosInadimplentes} irmão(s) com inadimplência
                        </p>
                        <p className="text-xs text-red-600">
                          Total: {totalMesesInadimplentes} mês(es) devendo
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {membros.map(membro => {
                        const mesesDevidos = inadimplenciaPorMembro[membro.id] || [];
                        const temInadimplencia = mesesDevidos.length > 0;
                        
                        return (
                          <div key={membro.id} className={`border-2 rounded p-2 ${temInadimplencia ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">{membro.nome}</span>
                              <button
                                type="button"
                                onClick={() => abrirModalInadimplencia(membro)}
                                className={`text-xs px-2 py-1 rounded ${temInadimplencia ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                              >
                                {temInadimplencia ? `${mesesDevidos.length} mês(es)` : 'Marcar'}
                              </button>
                            </div>
                            {temInadimplencia && (
                              <div className="mt-2 text-xs text-red-700">
                                {mesesDevidos.map((m, idx) => (
                                  <span key={idx} className="inline-block bg-red-200 rounded px-2 py-0.5 mr-1 mb-1">
                                    {meses[m.mes - 1].substring(0, 3)}/{m.ano}
                                  </span>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => removerInadimplenciaMembro(membro.id)}
                                  className="text-red-600 hover:text-red-800 ml-2"
                                >
                                  <Trash2 size={14} className="inline" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 mt-6 border-t pt-4 sticky bottom-0 bg-white z-10">
              <button
                onClick={criarPlanilha}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Criar Planilha
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setInadimplenciaPorMembro({});
                  setMembrosExcecaoSelecionados([]);
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Selecionar Meses de Inadimplência (NOVO) */}
      {mostrarInadimplencia && membroSelecionadoInadimplencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              Marcar Inadimplência
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Irmão: <span className="font-bold">{membroSelecionadoInadimplencia.nome}</span>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2 text-gray-700">
                Selecione os meses em atraso (até 12 meses anteriores):
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-gray-300 rounded p-3">
                {gerarMesesDisponiveis().map(({ mes, ano }) => {
                  const isSelected = isMesInadimplente(mes, ano);
                  return (
                    <button
                      key={`${mes}-${ano}`}
                      type="button"
                      onClick={() => toggleMesInadimplente(mes, ano)}
                      className={`p-2 rounded text-xs font-semibold transition ${
                        isSelected 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {meses[mes - 1].substring(0, 3)}/{ano}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMostrarInadimplencia(false);
                  setMembroSelecionadoInadimplencia(null);
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  // Limpar seleção deste membro
                  removerInadimplenciaMembro(membroSelecionadoInadimplencia.id);
                  setMostrarInadimplencia(false);
                  setMembroSelecionadoInadimplencia(null);
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                Limpar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}