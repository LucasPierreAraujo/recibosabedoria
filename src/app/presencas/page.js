"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Users, Calendar, CheckCircle, XCircle, Plus, BarChart3, X, Download } from 'lucide-react';

export default function PresencasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reunioes, setReunioes] = useState([]);
  const [membros, setMembros] = useState([]);
  const [reuniaoSelecionada, setReuniaoSelecionada] = useState(null);
  const [presencas, setPresencas] = useState({});
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const [novaReuniao, setNovaReuniao] = useState({
    data: '',
    grau: 'APRENDIZ'
  });
  const [periodoRelatorio, setPeriodoRelatorio] = useState({
    dataInicio: '',
    dataFim: ''
  });
  const [gerandoPDF, setGerandoPDF] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carregar membros
      const resMembros = await fetch('/api/membros');
      const membrosData = await resMembros.json();

      if (Array.isArray(membrosData)) {
        setMembros(membrosData);
      }

      // Carregar reuniões da API
      const resReunioes = await fetch('/api/reunioes');
      const reunioesData = await resReunioes.json();

      if (Array.isArray(reunioesData)) {
        setReunioes(reunioesData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarReuniao = async () => {
    if (!novaReuniao.data) {
      alert('Por favor, selecione uma data');
      return;
    }

    try {
      const response = await fetch('/api/reunioes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: novaReuniao.data,
          grau: novaReuniao.grau
        })
      });

      const data = await response.json();

      if (data.success) {
        // Adicionar a nova reunião à lista
        setReunioes([...reunioes, data.reuniao]);
        setNovaReuniao({ data: '', grau: 'APRENDIZ' });
        setMostrarFormulario(false);
        alert('Reunião criada com sucesso!');
      } else {
        alert('Erro ao criar reunião: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao criar reunião:', error);
      alert('Erro ao criar reunião');
    }
  };

  const excluirReuniao = async (id) => {
    if (!confirm('Deseja realmente excluir esta reunião?')) return;

    try {
      const response = await fetch('/api/reunioes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });

      const data = await response.json();

      if (data.success) {
        const novasReunioes = reunioes.filter(r => r.id !== id);
        setReunioes(novasReunioes);

        if (reuniaoSelecionada?.id === id) {
          setReuniaoSelecionada(null);
        }

        alert('Reunião excluída com sucesso!');
      } else {
        alert('Erro ao excluir reunião: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao excluir reunião:', error);
      alert('Erro ao excluir reunião');
    }
  };

  const selecionarReuniao = (reuniao) => {
    setReuniaoSelecionada(reuniao);
    setPresencas(reuniao.presencas || {});
  };

  const togglePresenca = (membroId) => {
    setPresencas(prev => ({
      ...prev,
      [membroId]: !prev[membroId]
    }));
  };

  const salvarPresencas = async () => {
    if (!reuniaoSelecionada) return;

    try {
      const response = await fetch('/api/presencas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reuniaoId: reuniaoSelecionada.id,
          presencas
        })
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar a lista de reuniões localmente
        const reunioesAtualizadas = reunioes.map(r => {
          if (r.id === reuniaoSelecionada.id) {
            return { ...r, presencas };
          }
          return r;
        });

        setReunioes(reunioesAtualizadas);
        alert('Presenças salvas com sucesso!');
      } else {
        alert('Erro ao salvar presenças: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao salvar presenças:', error);
      alert('Erro ao salvar presenças');
    }
  };

  const getMembrosPermitidos = (grauReuniao, dataReuniao) => {
    const hierarquia = {
      'APRENDIZ': ['APRENDIZ', 'COMPANHEIRO', 'MESTRE'],
      'COMPANHEIRO': ['COMPANHEIRO', 'MESTRE'],
      'MESTRE': ['MESTRE']
    };

    return membros.filter(m => {
      // Filtrar por grau
      if (!hierarquia[grauReuniao]?.includes(m.grau)) {
        return false;
      }

      // Filtrar por data de iniciação
      if (m.dataIniciacao && dataReuniao) {
        const dataIniciacao = new Date(m.dataIniciacao);
        const dataReuniaoDate = new Date(dataReuniao);

        // Só incluir se o membro já foi iniciado na data da reunião
        if (dataIniciacao > dataReuniaoDate) {
          return false;
        }
      }

      return true;
    });
  };

  const calcularRelatorio = (dataInicio = null, dataFim = null) => {
    const relatorio = {};

    // Filtrar apenas membros com grau (excluir candidatos)
    const membrosAtivos = membros.filter(m => m.grau && m.grau !== 'CANDIDATO');

    membrosAtivos.forEach(membro => {
      const reunioesPermitidas = reunioes.filter(r => {
        const hierarquia = {
          'APRENDIZ': ['APRENDIZ'],
          'COMPANHEIRO': ['APRENDIZ', 'COMPANHEIRO'],
          'MESTRE': ['APRENDIZ', 'COMPANHEIRO', 'MESTRE']
        };

        // Verificar se o grau da reunião está permitido para o membro
        if (!hierarquia[membro.grau]?.includes(r.grau)) {
          return false;
        }

        // Verificar se a reunião aconteceu após a iniciação do membro
        if (membro.dataIniciacao && r.data) {
          const dataIniciacao = new Date(membro.dataIniciacao);
          const dataReuniao = new Date(r.data);

          // Só contar se a reunião foi após ou na data de iniciação
          if (dataReuniao < dataIniciacao) {
            return false;
          }
        }

        // Filtrar por período se especificado
        if (dataInicio && dataFim && r.data) {
          const dataReuniao = new Date(r.data);
          const inicio = new Date(dataInicio);
          const fim = new Date(dataFim);

          if (dataReuniao < inicio || dataReuniao > fim) {
            return false;
          }
        }

        return true;
      });

      const totalReunioes = reunioesPermitidas.length;
      const presencasCount = reunioesPermitidas.filter(r => r.presencas?.[membro.id]).length;
      const porcentagem = totalReunioes > 0 ? ((presencasCount / totalReunioes) * 100).toFixed(1) : 0;

      relatorio[membro.id] = {
        nome: membro.nome,
        grau: membro.grau,
        total: totalReunioes,
        presencas: presencasCount,
        porcentagem
      };
    });

    return relatorio;
  };

  const gerarPDFRelatorio = async () => {
    setGerandoPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
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

      // Cabeçalho
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('A.R.L.S. Sabedoria de Salomão Nº 4774', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;

      pdf.setFontSize(12);
      pdf.text('Relatório de Frequência', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Período
      if (periodoRelatorio.dataInicio && periodoRelatorio.dataFim) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const inicio = new Date(periodoRelatorio.dataInicio).toLocaleDateString('pt-BR');
        const fim = new Date(periodoRelatorio.dataFim).toLocaleDateString('pt-BR');
        pdf.text(`Período: ${inicio} a ${fim}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
      } else {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Período: Todas as reuniões', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 8;
      }

      // Cabeçalho da tabela
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');

      const colWidths = {
        nome: 80,
        grau: 30,
        aplicaveis: 30,
        presencas: 30,
        frequencia: 30
      };

      let xPos = margin;
      pdf.text('Membro', xPos, yPosition);
      xPos += colWidths.nome;
      pdf.text('Grau', xPos, yPosition);
      xPos += colWidths.grau;
      pdf.text('Reuniões', xPos, yPosition);
      xPos += colWidths.aplicaveis;
      pdf.text('Presenças', xPos, yPosition);
      xPos += colWidths.presencas;
      pdf.text('Frequência', xPos, yPosition);

      yPosition += 2;
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Calcular relatório com período
      const relatorio = calcularRelatorio(periodoRelatorio.dataInicio, periodoRelatorio.dataFim);

      // Dados da tabela
      pdf.setFont('helvetica', 'normal');
      Object.values(relatorio).forEach((item) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin;
        }

        xPos = margin;
        pdf.text(item.nome, xPos, yPosition);
        xPos += colWidths.nome;
        pdf.text(item.grau, xPos, yPosition);
        xPos += colWidths.grau;
        pdf.text(String(item.total), xPos, yPosition);
        xPos += colWidths.aplicaveis;
        pdf.text(String(item.presencas), xPos, yPosition);
        xPos += colWidths.presencas;
        pdf.text(`${item.porcentagem}%`, xPos, yPosition);

        yPosition += 6;
      });

      // Rodapé com regras
      yPosition += 5;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Regras de contabilização:', margin, yPosition);
      yPosition += 4;
      pdf.text('• Aprendizes: contam apenas reuniões de Aprendiz após sua iniciação', margin, yPosition);
      yPosition += 4;
      pdf.text('• Companheiros: contam reuniões de Aprendiz e Companheiro após sua iniciação', margin, yPosition);
      yPosition += 4;
      pdf.text('• Mestres: contam todas as reuniões após sua iniciação', margin, yPosition);

      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const periodoTexto = periodoRelatorio.dataInicio && periodoRelatorio.dataFim
        ? `_${periodoRelatorio.dataInicio}_a_${periodoRelatorio.dataFim}`
        : '';

      pdf.save(`Relatorio_Frequencia${periodoTexto}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF do relatório');
    } finally {
      setGerandoPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-600">Carregando...</div>
      </div>
    );
  }

  const membrosPermitidos = reuniaoSelecionada ? getMembrosPermitidos(reuniaoSelecionada.grau, reuniaoSelecionada.data) : [];
  const relatorio = calcularRelatorio(periodoRelatorio.dataInicio, periodoRelatorio.dataFim);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="hover:bg-blue-800 p-2 rounded">
              <Home size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Controle de Presenças</h1>
              <p className="text-sm text-blue-200">Gerenciar reuniões e presenças</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMostrarRelatorio(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
            >
              <BarChart3 size={20} />
              Relatório
            </button>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
            >
              <Plus size={20} />
              Nova Reunião
            </button>
          </div>
        </div>
      </header>

      {/* Modal - Nova Reunião */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">Nova Reunião</h2>
              <button onClick={() => setMostrarFormulario(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Data da Reunião</label>
                <input
                  type="date"
                  value={novaReuniao.data}
                  onChange={(e) => setNovaReuniao({ ...novaReuniao, data: e.target.value })}
                  className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Grau da Reunião</label>
                <select
                  value={novaReuniao.grau}
                  onChange={(e) => setNovaReuniao({ ...novaReuniao, grau: e.target.value })}
                  className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="APRENDIZ">Aprendiz</option>
                  <option value="COMPANHEIRO">Companheiro</option>
                  <option value="MESTRE">Mestre</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={criarReuniao}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Criar Reunião
                </button>
                <button
                  onClick={() => setMostrarFormulario(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Relatório */}
      {mostrarRelatorio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-gray-700 font-bold">Relatório de Frequência</h2>
              <button onClick={() => setMostrarRelatorio(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            {/* Filtros de Período */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Data Início</label>
                  <input
                    type="date"
                    value={periodoRelatorio.dataInicio}
                    onChange={(e) => setPeriodoRelatorio({ ...periodoRelatorio, dataInicio: e.target.value })}
                    className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold  text-gray-700 mb-2">Data Fim</label>
                  <input
                    type="date"
                    value={periodoRelatorio.dataFim}
                    onChange={(e) => setPeriodoRelatorio({ ...periodoRelatorio, dataFim: e.target.value })}
                    className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={gerarPDFRelatorio}
                  disabled={gerandoPDF}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  <Download size={18} />
                  {gerandoPDF ? 'Gerando...' : 'Gerar PDF'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Deixe as datas em branco para considerar todas as reuniões
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200 text-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left">Membro</th>
                    <th className="px-4 py-2 text-center">Grau</th>
                    <th className="px-4 py-2 text-center">Reuniões Aplicáveis</th>
                    <th className="px-4 py-2 text-center">Presenças</th>
                    <th className="px-4 py-2 text-center">Frequência</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(relatorio).map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 text-gray-900">
                      <td className="px-4 py-3">{item.nome}</td>
                      <td className="px-4 py-3 text-center ">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold  ${
                          item.grau === 'APRENDIZ' ? 'bg-blue-100 text-blue-800' :
                          item.grau === 'COMPANHEIRO' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {item.grau}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{item.total}</td>
                      <td className="px-4 py-3 text-center">{item.presencas}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${
                          parseFloat(item.porcentagem) >= 75 ? 'text-green-600' :
                          parseFloat(item.porcentagem) >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {item.porcentagem}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Regras de contabilização:</strong></p>
              <ul className="list-disc list-inside mt-2">
                <li>Aprendizes: contam apenas reuniões de Aprendiz após sua iniciação</li>
                <li>Companheiros: contam reuniões de Aprendiz e Companheiro após sua iniciação</li>
                <li>Mestres: contam todas as reuniões (Aprendiz, Companheiro e Mestre) após sua iniciação</li>
                <li>Apenas reuniões realizadas na data de iniciação ou após são contabilizadas</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Reuniões */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Reuniões ({reunioes.length})
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {reunioes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhuma reunião criada<br />
                    <span className="text-sm">Clique em "Nova Reunião" para começar</span>
                  </p>
                ) : (
                  reunioes
                    .sort((a, b) => new Date(b.data) - new Date(a.data))
                    .map((reuniao) => (
                    <div
                      key={reuniao.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        reuniaoSelecionada?.id === reuniao.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <button
                        onClick={() => selecionarReuniao(reuniao)}
                        className="w-full text-left"
                      >
                        <div className="font-semibold text-gray-800">
                          {new Date(reuniao.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            reuniao.grau === 'APRENDIZ' ? 'bg-blue-100 text-blue-800' :
                            reuniao.grau === 'COMPANHEIRO' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {reuniao.grau}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Object.keys(reuniao.presencas || {}).filter(k => reuniao.presencas[k]).length} presentes
                        </div>
                      </button>
                      <button
                        onClick={() => excluirReuniao(reuniao.id)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800 w-full text-center py-1 hover:bg-red-50 rounded"
                      >
                        Excluir
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Lista de Membros para Marcar Presença */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={20} />
                {reuniaoSelecionada
                  ? `Presenças - ${new Date(reuniaoSelecionada.data + 'T00:00:00').toLocaleDateString('pt-BR')} (${reuniaoSelecionada.grau})`
                  : 'Selecione uma reunião'}
              </h2>

              {!reuniaoSelecionada ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Selecione uma reunião ao lado para registrar presenças</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <strong>{Object.values(presencas).filter(p => p).length}</strong> de <strong>{membrosPermitidos.length}</strong> membros presentes
                    </div>
                    <button
                      onClick={salvarPresencas}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                      Salvar Presenças
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                    {membrosPermitidos.map((membro) => (
                      <button
                        key={membro.id}
                        onClick={() => togglePresenca(membro.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          presencas[membro.id]
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-800">{membro.nome}</div>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs text-gray-500">CIM: {membro.cim}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                membro.grau === 'APRENDIZ' ? 'bg-blue-100 text-blue-800' :
                                membro.grau === 'COMPANHEIRO' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {membro.grau}
                              </span>
                            </div>
                          </div>
                          <div>
                            {presencas[membro.id] ? (
                              <CheckCircle size={24} className="text-green-600" />
                            ) : (
                              <XCircle size={24} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
