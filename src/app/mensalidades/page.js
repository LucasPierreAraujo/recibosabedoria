"use client"
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MensalidadesPage() {
  const router = useRouter();
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anoAtual] = useState(new Date().getFullYear());
  const [showConfig, setShowConfig] = useState(false);

  // Configurações de valores por mês - estrutura: { mes: { valorMensalidade, valorParcial } }
  const [configuracoes, setConfiguracoes] = useState({});

  // Estado dos pagamentos - estrutura: { membroId: { mes: 'ok'|'x'|'p'|'i' } }
  const [pagamentos, setPagamentos] = useState({});

  const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  useEffect(() => {
    carregarMembros();
    carregarPagamentos();
    carregarConfiguracoes();
  }, []);

  const carregarMembros = async () => {
    try {
      const response = await fetch('/api/membros');
      const data = await response.json();

      // Filtrar apenas Aprendiz, Companheiro, Mestre e Mestre Instalado
      const membrosFiltrados = data.filter(m => {
        const grauUpper = m.grau ? m.grau.toUpperCase() : '';
        return ['APRENDIZ', 'COMPANHEIRO', 'MESTRE', 'MESTRE INSTALADO'].includes(grauUpper);
      });

      setMembros(membrosFiltrados);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarPagamentos = async () => {
    try {
      const response = await fetch(`/api/mensalidades?ano=${anoAtual}`);
      if (response.ok) {
        const data = await response.json();
        setPagamentos(data.pagamentos || {});
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    }
  };

  const carregarConfiguracoes = async () => {
    try {
      const response = await fetch(`/api/mensalidades/config?ano=${anoAtual}`);
      if (response.ok) {
        const data = await response.json();

        // Se não houver configurações, inicializar com valores padrão
        const configsIniciais = {};
        meses.forEach(mes => {
          configsIniciais[mes] = data.configs?.[mes] || {
            valorMensalidade: '120.00',
            valorParcial: '60.00'
          };
        });

        setConfiguracoes(configsIniciais);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const atualizarConfigMes = (mes, campo, valor) => {
    setConfiguracoes({
      ...configuracoes,
      [mes]: {
        ...configuracoes[mes],
        [campo]: valor
      }
    });
  };

  const salvarConfiguracoes = async () => {
    try {
      // Salvar cada mês individualmente
      const promises = meses.map(mes =>
        fetch('/api/mensalidades/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ano: anoAtual,
            mes,
            valorMensalidade: configuracoes[mes]?.valorMensalidade || '120.00',
            valorParcial: configuracoes[mes]?.valorParcial || '60.00'
          })
        })
      );

      await Promise.all(promises);
      alert('Configurações salvas com sucesso!');
      setShowConfig(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    }
  };

  const alterarStatus = async (membroId, mes, statusAtual) => {
    try {
      console.log('=== alterarStatus iniciado ===');
      console.log('Parâmetros:', { membroId, mes, statusAtual });

      // Ciclo: null -> ok -> p -> x -> i -> null
      const ciclo = [null, 'ok', 'p', 'x', 'i'];
      const indexAtual = ciclo.indexOf(statusAtual);
      const novoStatus = ciclo[(indexAtual + 1) % ciclo.length];

      console.log('Novo status calculado:', novoStatus);

      const novosPagamentos = {
        ...pagamentos,
        [membroId]: {
          ...(pagamentos[membroId] || {}),
          [mes]: novoStatus
        }
      };

      setPagamentos(novosPagamentos);

      // Salvar no backend
      console.log('Enviando requisição para salvar pagamento...', { ano: anoAtual, membroId, mes, status: novoStatus });

      const response = await fetch('/api/mensalidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ano: anoAtual,
          membroId,
          mes,
          status: novoStatus
        })
      });

      console.log('Resposta recebida:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Erro ao processar resposta' };
        }
        console.error('Erro ao salvar pagamento:', errorData);
        alert('Erro ao salvar pagamento. Por favor, tente novamente.');
        // Reverter mudança local
        setPagamentos(pagamentos);
      } else {
        const data = await response.json();
        console.log('Pagamento salvo com sucesso:', data);
      }
    } catch (error) {
      console.error('Erro ao salvar pagamento:', error);
      console.error('Stack trace:', error.stack);
      alert('Erro ao salvar pagamento. Verifique sua conexão.');
    }
  };

  const calcularTotais = (membroId) => {
    const pagamentosMembro = pagamentos[membroId] || {};
    let pago = 0;
    let pendente = 0;

    meses.forEach(mes => {
      const status = pagamentosMembro[mes];
      const valorMensalidade = parseFloat(configuracoes[mes]?.valorMensalidade || '120.00');
      const valorParcial = parseFloat(configuracoes[mes]?.valorParcial || '60.00');

      if (status === 'ok') {
        pago += valorMensalidade;
      } else if (status === 'p') {
        pago += valorParcial;
        pendente += valorMensalidade - valorParcial;
      } else if (status === 'x') {
        pendente += valorMensalidade;
      }
      // 'i' (isento) não conta
    });

    return { pago, pendente };
  };

  const renderCelula = (membroId, mes) => {
    const status = pagamentos[membroId]?.[mes];

    let bgcolor = 'white';
    let texto = '';
    let textColor = 'black';

    if (status === 'ok') {
      bgcolor = '#22c55e'; // verde
      texto = 'OK';
      textColor = 'white';
    } else if (status === 'x') {
      bgcolor = '#ef4444'; // vermelho
      texto = 'X';
      textColor = 'white';
    } else if (status === 'p') {
      bgcolor = '#eab308'; // amarelo
      texto = 'P';
      textColor = 'white';
    } else if (status === 'i') {
      bgcolor = '#3b82f6'; // azul
      texto = 'I';
      textColor = 'white';
    }

    return (
      <td
        key={mes}
        onClick={() => alterarStatus(membroId, mes, status)}
        className="border border-gray-400 text-center cursor-pointer font-bold hover:opacity-80"
        style={{
          backgroundColor: bgcolor,
          color: textColor,
          minWidth: '50px',
          padding: '8px'
        }}
      >
        {texto}
      </td>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Controle de Mensalidades - {anoAtual}
            </h1>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <Settings size={20} />
            Configurações
          </button>
        </div>

        {/* Painel de Configurações */}
        {showConfig && (
          <div className="mt-4 p-4 bg-gray-50 rounded border-2 border-blue-300 max-h-96 overflow-y-auto">
            <h3 className="text-lg text-gray-900 font-bold mb-3">Configurar Valores por Mês</h3>
            <p className="text-sm text-gray-600 mb-4">
              Configure valores diferentes para cada mês do ano {anoAtual}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meses.map(mes => (
                <div key={mes} className="border-2 border-gray-300 rounded p-3 bg-white">
                  <h4 className="font-bold text-center mb-2 text-blue-900">{mes}</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-900 font-bold mb-1">Mensalidade (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={configuracoes[mes]?.valorMensalidade || '120.00'}
                        onChange={(e) => atualizarConfigMes(mes, 'valorMensalidade', e.target.value)}
                        className="w-full border-2 text-gray-900 border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-900 font-bold mb-1">Parcial (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={configuracoes[mes]?.valorParcial || '60.00'}
                        onChange={(e) => atualizarConfigMes(mes, 'valorParcial', e.target.value)}
                        className="w-full border-2 text-gray-900 border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={salvarConfiguracoes}
              className="mt-4 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              <Save size={20} />
              Salvar Todas as Configurações
            </button>
          </div>
        )}

        {/* Instruções de Uso */}
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p className="text-sm font-bold text-blue-900">
            💡 Como usar: Clique na célula do mês para alterar o status de pagamento. Cada clique alterna entre os status na ordem: Vazio → OK → P → X → I → Vazio
          </p>
        </div>

        {/* Legenda */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500  rounded flex items-center justify-center text-white font-bold">OK</div>
            <span className='text-gray-900'>PAGO</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center text-white font-bold">P</div>
            <span className='text-gray-900'>PARCIAL</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold">X</div>
            <span className='text-gray-900'>PENDENTE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">I</div>
            <span className='text-gray-900'>ISENTO</span>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white text-gray-900 rounded-lg shadow-lg overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="border border-gray-400 px-4 py-2 text-left sticky left-0 bg-blue-900 z-10">NOME</th>
              {meses.map(mes => (
                <th key={mes} className="border border-gray-400 px-2 py-2">{mes}</th>
              ))}
              <th className="border border-gray-400 px-4 py-2 bg-green-700">PAGO</th>
              <th className="border border-gray-400 px-4 py-2 bg-red-700">PENDENTE</th>
            </tr>
          </thead>
          <tbody>
            {membros.map(membro => {
              const totais = calcularTotais(membro.id);
              return (
                <tr key={membro.id} className="hover:bg-gray-50">
                  <td className="border border-gray-400 px-4 py-2 font-semibold sticky left-0 bg-white">
                    {membro.nome}
                  </td>
                  {meses.map(mes => renderCelula(membro.id, mes))}
                  <td className="border border-gray-400 px-4 py-2 text-right font-bold text-green-700">
                    R$ {totais.pago.toFixed(2)}
                  </td>
                  <td className="border border-gray-400 px-4 py-2 text-right font-bold text-red-700">
                    R$ {totais.pendente.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
