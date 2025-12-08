"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Download, Check, X, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function DetalhePlanilhaPage() {
  const router = useRouter();
  const params = useParams();
  const planilhaId = params.id;

  const [planilha, setPlanilha] = useState(null);
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para pagamento
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [membroSelecionado, setMembroSelecionado] = useState(null);
  const [mesesPagar, setMesesPagar] = useState(1);

  // Estados para receitas/despesas
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [tipoLancamento, setTipoLancamento] = useState('receita');
  const [descricaoLancamento, setDescricaoLancamento] = useState('');
  const [valorLancamento, setValorLancamento] = useState('');
  const [categoriaLancamento, setCategoriaLancamento] = useState('');

  const meses = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
    'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
  ];

  const categoriasDespesas = [
    'DESPESAS DE CUSTEIO',
    'DESPESAS DE ORDEM SOCIAL',
    'DESPESAS ADMINISTRATIVAS',
    'OUTRAS DESPESAS'
  ];

  useEffect(() => {
    if (planilhaId) {
      carregarDados();
    }
  }, [planilhaId]);

  const carregarDados = async () => {
    try {
      const resPlanilha = await fetch(`/api/planilhas/${planilhaId}`);
      const dataPlanilha = await resPlanilha.json();

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

  // ========== ADICIONAR RECEITA/DESPESA ==========
  const abrirModalLancamento = (tipo) => {
    setTipoLancamento(tipo);
    setDescricaoLancamento('');
    setValorLancamento('');
    setCategoriaLancamento('');
    setShowLancamentoModal(true);
  };

  const adicionarLancamento = async () => {
    if (!descricaoLancamento || !valorLancamento) {
      alert('Preencha todos os campos');
      return;
    }

    if (tipoLancamento === 'despesa' && !categoriaLancamento) {
      alert('Selecione a categoria da despesa');
      return;
    }

    try {
      const response = await fetch('/api/planilhas/lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoLancamento,
          planilhaId,
          descricao: descricaoLancamento,
          valor: parseFloat(valorLancamento.replace(/\./g, '').replace(',', '.')),
          categoria: tipoLancamento === 'despesa' ? categoriaLancamento : null
        })
      });

      if (response.ok) {
        alert(`${tipoLancamento === 'receita' ? 'Receita' : 'Despesa'} adicionada com sucesso!`);
        setShowLancamentoModal(false);
        carregarDados();
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao adicionar lançamento');
    }
  };

  const excluirLancamento = async (tipo, id) => {
    if (!confirm(`Deseja excluir esta ${tipo}?`)) return;

    try {
      await fetch('/api/planilhas/lancamentos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, id, planilhaId })
      });

      alert(`${tipo === 'receita' ? 'Receita' : 'Despesa'} excluída com sucesso!`);
      carregarDados();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir');
    }
  };

  // ========== EXPORTAR PDF ==========
  const exportarPDF = async () => {
    const elemento = document.getElementById('planilha-completa');
    
    try {
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`planilha_${meses[planilha.mes - 1]}_${planilha.ano}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao exportar PDF');
    }
  };

  const formatarValor = (valor) => {
    let v = valor.toString().replace(/\D/g, '');
    v = (parseInt(v) / 100).toFixed(2);
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return v;
  };

  const handleValorChange = (e) => {
    setValorLancamento(formatarValor(e.target.value));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!planilha) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-600">Planilha não encontrada</div>
          <button onClick={() => router.push('/financeiro')} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg">
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
      <header className="bg-blue-900 text-white p-4 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/financeiro')} className="hover:bg-blue-800 p-2 rounded">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{meses[planilha.mes - 1]} / {planilha.ano}</h1>
              <p className="text-sm text-blue-200">Mensalidade: R$ {Number(planilha.valorMensalidade).toFixed(2)}</p>
            </div>
          </div>
          <button onClick={exportarPDF} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg">
            <Download size={20} /> Exportar PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Conteúdo para PDF */}
        <div id="planilha-completa" className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">A.R.L.S. SABEDORIA DE SALOMÃO Nº 4774</h1>
            <h2 className="text-xl text-gray-600 mt-2">Planilha Financeira - {meses[planilha.mes - 1]}/{planilha.ano}</h2>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <div className="text-sm text-gray-600 mb-1">Total Receitas</div>
              <div className="text-2xl font-bold text-green-600">R$ {Number(planilha.totalReceitas).toFixed(2)}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
              <div className="text-sm text-gray-600 mb-1">Total Despesas</div>
              <div className="text-2xl font-bold text-red-600">R$ {Number(planilha.totalDespesas).toFixed(2)}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Saldo Final</div>
              <div className={`text-2xl font-bold ${Number(planilha.saldoFinal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {Number(planilha.saldoFinal).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Tabela de Mensalidades */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Mensalidades Recebidas</h3>
            <table className="w-full border-2 border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-4 py-2 text-left">Nome</th>
                  <th className="border px-4 py-2 text-left">CIM</th>
                  <th className="border px-4 py-2 text-center">Status</th>
                  <th className="border px-4 py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {membros.map(membro => {
                  const pagou = membrosPagaram.includes(membro.id);
                  return (
                    <tr key={membro.id}>
                      <td className="border px-4 py-2">{membro.nome}</td>
                      <td className="border px-4 py-2">{membro.cim || '-'}</td>
                      <td className="border px-4 py-2 text-center">
                        {pagou ? (
                          <span className="text-green-600 font-bold">✓ Pago</span>
                        ) : (
                          <span className="text-red-600 font-bold">✗ Pendente</span>
                        )}
                      </td>
                      <td className="border px-4 py-2 text-right">
                        {pagou ? `R$ ${Number(planilha.valorMensalidade).toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Receitas Extras */}
          {planilha.receitas && planilha.receitas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Receitas Extras</h3>
              <table className="w-full border-2 border-gray-300">
                <thead className="bg-green-100">
                  <tr>
                    <th className="border px-4 py-2 text-left">Descrição</th>
                    <th className="border px-4 py-2 text-right">Valor</th>
                    <th className="border px-4 py-2 text-center print:hidden">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {planilha.receitas.map(receita => (
                    <tr key={receita.id}>
                      <td className="border px-4 py-2">{receita.descricao}</td>
                      <td className="border px-4 py-2 text-right text-green-600 font-bold">
                        R$ {Number(receita.valor).toFixed(2)}
                      </td>
                      <td className="border px-4 py-2 text-center print:hidden">
                        <button onClick={() => excluirLancamento('receita', receita.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Despesas */}
          {planilha.despesas && planilha.despesas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Despesas</h3>
              <table className="w-full border-2 border-gray-300">
                <thead className="bg-red-100">
                  <tr>
                    <th className="border px-4 py-2 text-left">Categoria</th>
                    <th className="border px-4 py-2 text-left">Descrição</th>
                    <th className="border px-4 py-2 text-right">Valor</th>
                    <th className="border px-4 py-2 text-center print:hidden">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {planilha.despesas.map(despesa => (
                    <tr key={despesa.id}>
                      <td className="border px-4 py-2 text-sm">{despesa.categoria}</td>
                      <td className="border px-4 py-2">{despesa.descricao}</td>
                      <td className="border px-4 py-2 text-right text-red-600 font-bold">
                        R$ {Number(despesa.valor).toFixed(2)}
                      </td>
                      <td className="border px-4 py-2 text-center print:hidden">
                        <button onClick={() => excluirLancamento('despesa', despesa.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botões de Ação (apenas na tela) */}
        <div className="mt-6 flex gap-4 print:hidden">
          <button onClick={() => abrirModalLancamento('receita')} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <Plus size={20} /> Adicionar Receita
          </button>
          <button onClick={() => abrirModalLancamento('despesa')} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
            <Plus size={20} /> Adicionar Despesa
          </button>
        </div>

        {/* Tabela de Controle (apenas na tela) */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-6 print:hidden">
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
                          <button onClick={() => abrirModalPagamento(membro)} className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm">
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
              <label className="block text-sm font-bold mb-1 text-gray-700">Quantidade de Meses</label>
              <select value={mesesPagar} onChange={(e) => setMesesPagar(parseInt(e.target.value))} className="w-full border-2 border-gray-300 rounded px-3 py-2">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'mês' : 'meses'}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <div className="text-sm text-gray-600">Valor Total:</div>
              <div className="text-2xl font-bold text-green-600">R$ {(Number(planilha.valorMensalidade) * mesesPagar).toFixed(2)}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={registrarPagamento} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Confirmar</button>
              <button onClick={() => setShowPagamentoModal(false)} className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Receita/Despesa */}
      {showLancamentoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Adicionar {tipoLancamento === 'receita' ? 'Receita' : 'Despesa'}
            </h2>
            
            <div className="space-y-4">
              {tipoLancamento === 'despesa' && (
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Categoria</label>
                  <select value={categoriaLancamento} onChange={(e) => setCategoriaLancamento(e.target.value)} className="w-full border-2 border-gray-300 rounded px-3 py-2">
                    <option value="">Selecione</option>
                    {categoriasDespesas.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Descrição</label>
                <input type="text" value={descricaoLancamento} onChange={(e) => setDescricaoLancamento(e.target.value)} className="w-full border-2 border-gray-300 rounded px-3 py-2" placeholder="Ex: Doação, Aluguel, etc." />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Valor (R$)</label>
                <input type="text" value={valorLancamento} onChange={handleValorChange} className="w-full border-2 border-gray-300 rounded px-3 py-2" placeholder="0,00" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={adicionarLancamento} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Adicionar</button>
              <button onClick={() => setShowLancamentoModal(false)} className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}