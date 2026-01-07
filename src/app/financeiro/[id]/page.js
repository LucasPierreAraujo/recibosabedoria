"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Download, Check, X, DollarSign, Briefcase, BookOpen, Home, Undo2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DetalhePlanilhaPage() {
  const router = useRouter();
  const params = useParams();
  const planilhaId = params.id;

  const [planilha, setPlanilha] = useState(null);
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [assinaturas, setAssinaturas] = useState({});
  const [localidade, setLocalidade] = useState('CRATO-CE'); 
  const [diaAssinatura, setDiaAssinatura] = useState(new Date().getDate()); 
  const [mesAssinatura, setMesAssinatura] = useState(new Date().getMonth() + 1); 
  const [anoAssinatura, setAnoAssinatura] = useState(new Date().getFullYear()); 
  
  // Mensalidade de Exceção
  const [membrosExcecaoSelecionados, setMembrosExcecaoSelecionados] = useState([]);

  // Estados para pagamento
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [membroSelecionado, setMembroSelecionado] = useState(null);
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState(null);
  const [mesesPagar, setMesesPagar] = useState(1);
  const [mesReferenciaPagamento, setMesReferenciaPagamento] = useState(new Date().getMonth() + 1);
  const [anoReferenciaPagamento, setAnoReferenciaPagamento] = useState(new Date().getFullYear());
  const [valorCustomizado, setValorCustomizado] = useState('');
  const [usarValorCustomizado, setUsarValorCustomizado] = useState(false);

  // Estados para Outros Recebimentos/Despesas
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [tipoLancamento, setTipoLancamento] = useState('receita'); 
  const [descricaoLancamento, setDescricaoLancamento] = useState('');
  const [valorLancamento, setValorLancamento] = useState('');
  const [categoriaLancamento, setCategoriaLancamento] = useState('');
  const [tipoGasto, setTipoGasto] = useState('VARIAVEL');
  const [dataLancamento, setDataLancamento] = useState(new Date().toISOString().split('T')[0]);

  // Estados para Tronco de Beneficência
  const [showTroncoModal, setShowTroncoModal] = useState(false);
  const [grauSessao, setGrauSessao] = useState(''); 
  const [descricaoFilantropia, setDescricaoFilantropia] = useState(''); 
  const [valorTronco, setValorTronco] = useState('');
  const [dataSessaoTronco, setDataSessaoTronco] = useState(new Date().toISOString().split('T')[0]);
  const [dataDepositoTronco, setDataDepositoTronco] = useState(new Date().toISOString().split('T')[0]);
  const [dataFilantropia, setDataFilantropia] = useState(new Date().toISOString().split('T')[0]);

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
  
  const grausSessao = [
    'APRENDIZ', 'COMPANHEIRO', 'MESTRE'
  ];

  useEffect(() => {
    if (planilhaId) {
      carregarDados();
      carregarAssinaturas();
    }
  }, [planilhaId]);

  const carregarAssinaturas = async () => {
    try {
      const res = await fetch('/api/membros?assinaturas=true');
      const data = await res.json();
      if (data.success) {
        setAssinaturas(data.assinaturas);
      }
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
    }
  };

  const carregarDados = async () => {
    console.log("Planilha ID sendo buscado na rota:", planilhaId); 
    
    try {
      setLoading(true);
      
      const resPlanilha = await fetch(`/api/planilhas?id=${planilhaId}`);
      
      if (!resPlanilha.ok) {
          if (resPlanilha.status === 404) {
              console.error(`Planilha ID ${planilhaId} não encontrada no banco (404).`);
              setPlanilha(null);
              return; 
          }
          throw new Error(`Erro ao buscar planilha: ${resPlanilha.statusText}`);
      }
      
      const dataPlanilha = await resPlanilha.json(); 

      const resMembros = await fetch('/api/membros?financeiro=true'); 
      const dataMembros = await resMembros.json();

      setPlanilha(dataPlanilha);
      setMembros(dataMembros);
      
      setMesReferenciaPagamento(dataPlanilha.mes);
      setAnoReferenciaPagamento(dataPlanilha.ano);
      
      if (dataPlanilha.membrosExcecaoIds) {
        setMembrosExcecaoSelecionados(dataPlanilha.membrosExcecaoIds.split(','));
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert(`Falha ao carregar dados: ${error.message}. Verifique o console.`); 
    } finally {
      setLoading(false);
    }
  };

  const abrirModalPagamento = (membro, pagamento = null) => {
    setMembroSelecionado(membro);
    setPagamentoSelecionado(pagamento);
    setUsarValorCustomizado(false);
    setValorCustomizado('');
    
    if (pagamento && pagamento.quantidadeMeses < 0) {
      setMesesPagar(Math.abs(pagamento.quantidadeMeses));
    } else {
      setMesesPagar(1);
    }
    
    setShowPagamentoModal(true);
  };

  const registrarPagamento = async () => {
    if (!membroSelecionado || !planilha) return;

    // Calcular valor da mensalidade PRIMEIRO
    const idsExcecao = planilha.membrosExcecaoIds ? planilha.membrosExcecaoIds.split(',') : [];
    const isExcecao = idsExcecao.includes(membroSelecionado.id);
    
    let valorMensalidadeUnitario = Number(planilha.valorMensalidade);

    if (isExcecao && planilha.valorMensalidadeExcecao !== null && Number(planilha.valorMensalidadeExcecao) >= 0) {
        valorMensalidadeUnitario = Number(planilha.valorMensalidadeExcecao);
    }

    // Usar valor customizado se habilitado
    let valorTotal;
    if (usarValorCustomizado && valorCustomizado) {
      valorTotal = parseFloat(valorCustomizado.replace(/\./g, '').replace(',', '.'));
      if (isNaN(valorTotal) || valorTotal <= 0) {
        alert('Valor inválido. Digite um valor maior que zero.');
        return;
      }
    } else {
      valorTotal = valorMensalidadeUnitario * mesesPagar;
    }

    // Se for inadimplência, usa os meses do registro de dívida
    let mesesRef = [];

    if (pagamentoSelecionado && pagamentoSelecionado.quantidadeMeses < 0) {
      mesesRef = [pagamentoSelecionado.mesesReferentes];
    } else {
      for (let i = 0; i < mesesPagar; i++) {
        const mesAtual = mesReferenciaPagamento - i;
        const anoAtual = mesAtual > 0 ? anoReferenciaPagamento : anoReferenciaPagamento - 1;
        const mesAjustado = mesAtual > 0 ? mesAtual : 12 + mesAtual;
        mesesRef.push(`${meses[mesAjustado - 1].substring(0,3)}/${String(anoAtual).slice(-2)}`);
      }
      mesesRef = mesesRef.reverse();
    }

    // VALIDAÇÃO: Verificar se algum dos meses que está tentando pagar já foi pago (se não for inadimplência)
    if (!pagamentoSelecionado || pagamentoSelecionado.quantidadeMeses >= 0) {
      const mesesParaPagar = mesesRef.join(', ');
      const mesesJaPagos = [];

      for (const pagamento of planilha.pagamentos) {
        if (pagamento.membroId === membroSelecionado.id && pagamento.quantidadeMeses > 0) {
          const mesesDoPagamento = pagamento.mesesReferentes.split(',').map(m => m.trim());
          for (const mes of mesesDoPagamento) {
            if (mesesParaPagar.includes(mes)) {
              mesesJaPagos.push(mes);
            }
          }
        }
      }

      if (mesesJaPagos.length > 0) {
        alert(`Este membro já pagou o(s) seguinte(s) mês(es): ${mesesJaPagos.join(', ')}`);
        return;
      }
    }

    try {
      // Se estiver pagando uma inadimplência, atualiza o registro removendo apenas o mês quitado
      if (pagamentoSelecionado && pagamentoSelecionado.quantidadeMeses < 0) {
        const mesesDevidos = pagamentoSelecionado.mesesReferentes.split(',').map(m => m.trim());
        const mesQuitado = mesesDevidos.shift();
        
        if (mesesDevidos.length > 0) {
          await fetch('/api/planilhas/pagamentos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              pagamentoId: pagamentoSelecionado.id,
              quantidadeMeses: -mesesDevidos.length,
              mesesReferentes: mesesDevidos.join(', '),
              planilhaId
            })
          });
        } else {
          await fetch('/api/planilhas/pagamentos', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              pagamentoId: pagamentoSelecionado.id, 
              planilhaId 
            })
          });
        }
        
        mesesRef = [mesQuitado];
      }

      // Registra o pagamento
      const response = await fetch('/api/planilhas/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planilhaId,
          membroId: membroSelecionado.id,
          quantidadeMeses: mesesPagar,
          valorPago: valorTotal,
          mesesReferentes: Array.isArray(mesesRef) ? mesesRef.join(', ') : mesesRef
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao registrar pagamento.');
      }

      console.log('Pagamento registrado com sucesso!'); 
      setShowPagamentoModal(false);
      setPagamentoSelecionado(null);
      setUsarValorCustomizado(false);
      setValorCustomizado('');
      carregarDados();
    } catch (error) {
      console.error('Erro:', error);
      alert(error.message);
    }
  };
  
  const cancelarPagamento = async (pagamentoId) => {
      if (!confirm("Deseja realmente cancelar este pagamento? O saldo será revertido.")) return;

      try {
          const response = await fetch('/api/planilhas/pagamentos', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pagamentoId, planilhaId })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao cancelar pagamento.');
          }
          
          console.log('Pagamento cancelado com sucesso!');
          carregarDados();
      } catch (error) {
          console.error('Erro ao cancelar pagamento:', error);
          alert(error.message);
      }
  };

  const adicionarLancamento = async () => {
    let payload = { planilhaId };

    if (tipoLancamento === 'receita' || tipoLancamento === 'despesa') {
      if (!descricaoLancamento || !valorLancamento || !dataLancamento) {
        alert('Preencha a descrição, o valor e a data');
        return;
      }
      
      const valorNumerico = parseFloat(valorLancamento.replace(/\./g, '').replace(',', '.'));

      payload = {
        ...payload,
        tipo: tipoLancamento,
        descricao: descricaoLancamento,
        valor: valorNumerico,
        data: dataLancamento,
      };

      if (tipoLancamento === 'despesa') {
        if (!tipoGasto) {
          alert('Selecione o tipo de gasto');
          return;
        }
        payload.tipoGasto = tipoGasto; 
      }
    } 
    
    else if (tipoLancamento === 'tronco' || tipoLancamento === 'filantropia') {
      if (!valorTronco) {
        alert('Preencha o valor.');
        return;
      }
      
      const valorNumerico = parseFloat(valorTronco.replace(/\./g, '').replace(',', '.'));

      payload = {
        ...payload,
        tipo: tipoLancamento,
        valor: valorNumerico,
      };
      
      if (tipoLancamento === 'tronco') {
        if (!grauSessao || !dataSessaoTronco || !dataDepositoTronco) { 
          alert('Selecione o grau da sessão, data da sessão e data do depósito.'); 
          return; 
        }
        payload.grauSessao = grauSessao;
        payload.dataSessao = dataSessaoTronco;
        payload.dataDeposito = dataDepositoTronco;
      }
      if (tipoLancamento === 'filantropia') {
        if (!descricaoFilantropia || !dataFilantropia) { 
          alert('Preencha a descrição da doação e a data.'); 
          return; 
        }
        payload.descricao = descricaoFilantropia;
        payload.data = dataFilantropia;
      }
    }

    try {
      const response = await fetch(`/api/planilhas/${planilhaId}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`Lançamento (${tipoLancamento}) adicionado com sucesso!`); 
        setShowLancamentoModal(false);
        setShowTroncoModal(false);
        carregarDados();
      } else {
        const errorData = await response.json();
        console.error('Erro ao adicionar lançamento:', response.status, errorData.error);
        alert(`Erro ao adicionar lançamento: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar lançamento:', error);
      alert('Erro ao adicionar lançamento. Verifique a conexão.');
    }
  };

  const excluirLancamento = async (tipo, id) => {
    if (!confirm(`Deseja excluir esta ${tipo}?`)) return;

    try {
      await fetch(`/api/planilhas/${planilhaId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, id, planilhaId })
      });

      console.log(`${tipo} excluída com sucesso!`); 
      carregarDados();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir lançamento.');
    }
  };

  const abrirModalLancamentoCaixa = (tipo) => {
      setTipoLancamento(tipo);
      setDescricaoLancamento('');
      setValorLancamento('');
      setCategoriaLancamento('');
      setTipoGasto('VARIAVEL');
      setDataLancamento(new Date().toISOString().split('T')[0]);
      setShowLancamentoModal(true);
  };

  const abrirModalTronco = (tipo) => {
      setTipoLancamento(tipo); 
      setValorTronco('');
      setGrauSessao('');
      setDescricaoFilantropia('');
      setDataSessaoTronco(new Date().toISOString().split('T')[0]);
      setDataDepositoTronco(new Date().toISOString().split('T')[0]);
      setDataFilantropia(new Date().toISOString().split('T')[0]);
      setShowTroncoModal(true);
  };
  
  const excluirLancamentoTronco = (tipo, id) => excluirLancamento(tipo, id);

  const exportarPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const margin = 15;
      let yPosition = margin;

      // Carregar logo
      let logoImg;
      try {
        logoImg = await fetch('/logo.jpeg').then(r => r.blob()).then(b => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(b);
        }));
      } catch (error) {
        console.error('Erro ao carregar logo:', error);
      }

      // Adicionar logo
      if (logoImg) {
        pdf.addImage(logoImg, 'JPEG', pageWidth / 2 - 15, yPosition, 30, 30);
        yPosition += 40;
      }

      // Cabeçalho
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('A.R.L.S. SABEDORIA DE SALOMÃO Nº 4774', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 7;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Planilha Financeira - ${meses[planilha.mes - 1]} / ${planilha.ano}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Tabela de Mensalidades
      const dadosMensalidades = membros.map(membro => {
        const pagou = pagamentosPorMembro[membro.id];
        return [
          membro.nome,
          membro.cim || '-',
          pagou ? 'Pago' : 'Pendente',
          pagou ? pagou.mesesReferentes.join(', ') : '-',
          pagou ? `R$ ${pagou.valorTotal.toFixed(2)}` : '-'
        ];
      });

      autoTable(pdf, {
        startY: yPosition,
        head: [['Nome', 'CIM', 'Status', 'Mês Ref.', 'Valor']],
        body: dadosMensalidades,
        theme: 'grid',
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        showHead: 'firstPage'
      });

      yPosition = pdf.lastAutoTable.finalY + 5;

      // Outros Recebimentos
      if (planilha.receitas && planilha.receitas.length > 0) {
        const dadosReceitas = planilha.receitas.map(r => [
          r.descricao,
          new Date(r.data).toLocaleDateString(),
          `R$ ${Number(r.valor).toFixed(2)}`
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Outros Recebimentos', 'Data', 'Valor']],
          body: dadosReceitas,
          theme: 'grid',
          headStyles: { fillColor: [200, 240, 200], textColor: [0, 0, 0] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 2 },
          showHead: 'firstPage'
        });

        yPosition = pdf.lastAutoTable.finalY + 5;
      }

      // Despesas
      if (planilha.despesas && planilha.despesas.length > 0) {
        const dadosDespesas = planilha.despesas.map(d => [
          d.descricao,
          new Date(d.data).toLocaleDateString(),
          d.tipoGasto,
          `R$ ${Number(d.valor).toFixed(2)}`
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Despesas', 'Data', 'Tipo', 'Valor']],
          body: dadosDespesas,
          theme: 'grid',
          headStyles: { fillColor: [255, 200, 200], textColor: [0, 0, 0] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 2 },
          showHead: 'firstPage'
        });

        yPosition = pdf.lastAutoTable.finalY + 5;
      }

      // Tronco
      if (planilha.troncos && planilha.troncos.length > 0) {
        const dadosTronco = planilha.troncos.map(t => [
          t.grauSessao,
          new Date(t.data).toLocaleDateString(),
          new Date(t.dataDeposito).toLocaleDateString(),
          `R$ ${Number(t.valor).toFixed(2)}`
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Tronco - Grau', 'Data Sessão', 'Data Depósito', 'Valor']],
          body: dadosTronco,
          theme: 'grid',
          headStyles: { fillColor: [255, 255, 200], textColor: [0, 0, 0] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 2 },
          showHead: 'firstPage'
        });

        yPosition = pdf.lastAutoTable.finalY + 5;
      }

      // Doações Filantrópicas
      if (planilha.doacoesFilantropicas && planilha.doacoesFilantropicas.length > 0) {
        const dadosDoacoes = planilha.doacoesFilantropicas.map(d => [
          d.descricao,
          new Date(d.dataPagamento).toLocaleDateString(),
          `R$ ${Number(d.valor).toFixed(2)}`
        ]);

        autoTable(pdf, {
          startY: yPosition,
          head: [['Doações Filantrópicas', 'Data', 'Valor']],
          body: dadosDoacoes,
          theme: 'grid',
          headStyles: { fillColor: [255, 220, 200], textColor: [0, 0, 0] },
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 2 },
          showHead: 'firstPage'
        });

        yPosition = pdf.lastAutoTable.finalY + 5;
      }

      // Resumos em tabela
      yPosition += 5;

      const totalMensalidades = planilha.pagamentos?.filter(p => p.quantidadeMeses > 0).reduce((sum, p) => sum + Number(p.valorPago), 0) || 0;
      const totalReceitas = planilha.receitas?.reduce((sum, r) => sum + Number(r.valor), 0) || 0;

      // Tabela Resumo Caixa
      autoTable(pdf, {
        startY: yPosition,
        head: [['Resumo Caixa Geral', 'Valor']],
        body: [
          ['Saldo Inicial', `R$ ${Number(planilha.saldoInicialCaixa).toFixed(2)}`],
          ['Total Mensalidades', `R$ ${totalMensalidades.toFixed(2)}`],
          ['Outros Recebimentos', `R$ ${totalReceitas.toFixed(2)}`],
          ['Total Despesas', `R$ ${Number(planilha.totalDespesas).toFixed(2)}`],
          ['SALDO FINAL CAIXA', `R$ ${Number(planilha.saldoFinalCaixa).toFixed(2)}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [100, 150, 200], textColor: [255, 255, 255], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        bodyStyles: { 0: { fontStyle: 'bold' } },
        showHead: 'firstPage'
      });

      yPosition = pdf.lastAutoTable.finalY + 5;

      // Tabela Resumo Tronco
      autoTable(pdf, {
        startY: yPosition,
        head: [['Resumo Tronco de Beneficência', 'Valor']],
        body: [
          ['Saldo Inicial', `R$ ${Number(planilha.saldoInicialTronco).toFixed(2)}`],
          ['Total Recebido', `R$ ${Number(planilha.totalTroncoRecebido).toFixed(2)}`],
          ['Doações Filantrópicas', `R$ ${Number(planilha.totalDoacoesFilantropicas).toFixed(2)}`],
          ['SALDO FINAL TRONCO', `R$ ${Number(planilha.saldoFinalTronco).toFixed(2)}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [200, 180, 100], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        showHead: 'firstPage'
      });

      yPosition = pdf.lastAutoTable.finalY + 5;

      // Saldo Total
      const saldoTotal = Number(planilha.saldoFinalCaixa) + Number(planilha.saldoFinalTronco);

      autoTable(pdf, {
        startY: yPosition,
        body: [[`SALDO FINAL TOTAL (Caixa + Tronco): R$ ${saldoTotal.toFixed(2)}`]],
        theme: 'plain',
        styles: { fontSize: 12, fontStyle: 'bold', halign: 'right', cellPadding: 3 },
        margin: { left: margin, right: margin },
        showHead: 'firstPage'
      });

      yPosition = pdf.lastAutoTable.finalY + 10;

      // Assinaturas
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${localidade.toUpperCase()}, ${diaAssinatura} de ${meses[mesAssinatura - 1].toLowerCase()} de ${anoAssinatura}.`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Carregar assinaturas
      let vmAssinaturaImg, tesAssinaturaImg;

      try {
        if (veneravelMestre?.assinaturaUrl) {
          vmAssinaturaImg = await fetch(veneravelMestre.assinaturaUrl).then(r => r.blob()).then(b => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(b);
          }));
        }

        if (tesoureiro?.assinaturaUrl) {
          tesAssinaturaImg = await fetch(tesoureiro.assinaturaUrl).then(r => r.blob()).then(b => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(b);
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar assinaturas:', error);
      }

      // Assinaturas com imagens
      if (veneravelMestre) {
        const col1X = pageWidth / 4;
        const col2X = (pageWidth / 4) * 3;
        const assinaturaY = yPosition;

        // Assinatura VM
        if (vmAssinaturaImg) {
          pdf.addImage(vmAssinaturaImg, 'PNG', col1X - 20, assinaturaY, 40, 15);
        }

        // Assinatura Tesoureiro
        if (tesAssinaturaImg) {
          pdf.addImage(tesAssinaturaImg, 'PNG', col2X - 20, assinaturaY, 40, 15);
        }

        yPosition += 17;

        pdf.setFontSize(9);
        pdf.text(veneravelMestre.nome, col1X, yPosition, { align: 'center' });
        pdf.text(tesoureiro?.nome || '', col2X, yPosition, { align: 'center' });
        yPosition += 4;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Venerável Mestre', col1X, yPosition, { align: 'center' });
        pdf.text('Tesoureiro', col2X, yPosition, { align: 'center' });
        yPosition += 4;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`CIM: ${veneravelMestre.cim}`, col1X, yPosition, { align: 'center' });
        pdf.text(`CIM: ${tesoureiro?.cim || ''}`, col2X, yPosition, { align: 'center' });
      }

      pdf.save(`planilha_${meses[planilha.mes - 1]}_${planilha.ano}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const formatarValor = (valor) => {
    let v = String(valor).replace(/\D/g, '');
    v = (parseInt(v) / 100).toFixed(2);
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return v === 'NaN' ? '' : v;
  };

  const handleValorChange = (e, setter) => {
    setter(formatarValor(e.target.value));
  };
  
  const getCorSaldo = (valor) => {
    return Number(valor) >= 0 ? 'text-green-600' : 'text-red-600';
  }

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
            Voltar para Listagem
          </button>
        </div>
      </div>
    );
  }

  // Agrupar pagamentos por membro
  const pagamentosPorMembro = {};
  planilha.pagamentos?.forEach(p => {
    if (p.quantidadeMeses > 0) {
      if (!pagamentosPorMembro[p.membroId]) {
        pagamentosPorMembro[p.membroId] = {
          valorTotal: 0,
          mesesReferentes: [],
          pagamento: p
        };
      }
      pagamentosPorMembro[p.membroId].valorTotal += Number(p.valorPago);
      pagamentosPorMembro[p.membroId].mesesReferentes.push(p.mesesReferentes);
    }
  });
  
  const saldoFinalTotal = Number(planilha.saldoFinalCaixa || 0) + Number(planilha.saldoFinalTronco || 0);

  const tesoureiro = assinaturas.tesoureiro;
  const veneravelMestre = assinaturas.veneravelmestre;

  // Criar array de exibição para a tabela de controle
  const linhasTabela = [];
  const mesAtualPlanilha = planilha.mes;
  const anoAtualPlanilha = planilha.ano;
  const mesAtualFormatado = `${meses[mesAtualPlanilha - 1].substring(0,3)}/${String(anoAtualPlanilha).slice(-2)}`;

  membros.forEach(membro => {
    const pagamentosDoMembro = planilha.pagamentos?.filter(p => p.membroId === membro.id) || [];
    const inadimplencias = pagamentosDoMembro.filter(p => p.quantidadeMeses < 0);
    const pagamentosReais = pagamentosDoMembro.filter(p => p.quantidadeMeses > 0);

    // 1. Adicionar inadimplências (cada mês como linha separada)
    inadimplencias.forEach(inad => {
      const mesesDevidos = inad.mesesReferentes.split(',').map(m => m.trim());

      mesesDevidos.forEach(mesDevido => {
        linhasTabela.push({
          membro,
          tipo: 'inadimplencia',
          pagamento: {
            ...inad,
            mesesReferentes: mesDevido,
            quantidadeMeses: -1
          },
          status: 'devendo'
        });
      });
    });

    // 2. Adicionar linha do mês atual
    const pagouEspecificamenteMesAtual = pagamentosReais.some(p => {
      return p.mesesReferentes === mesAtualFormatado ||
             p.mesesReferentes.includes(mesAtualFormatado);
    });

    if (pagouEspecificamenteMesAtual) {
      const pag = pagamentosReais.find(p => p.mesesReferentes.includes(mesAtualFormatado));
      linhasTabela.push({
        membro,
        tipo: 'pago',
        pagamento: {
          ...pag,
          mesesReferentes: mesAtualFormatado
        },
        status: 'pago'
      });
    } else {
      linhasTabela.push({
        membro,
        tipo: 'normal',
        pagamento: null,
        status: 'pendente'
      });
    }
  });

  // Filtro: Remove pagamentos de meses passados
  const linhasFiltradas = linhasTabela.filter(linha => {
    if (linha.tipo === 'inadimplencia') return true;
    if (linha.tipo === 'normal') return true;
    if (linha.tipo === 'pago') {
      return linha.pagamento.mesesReferentes === mesAtualFormatado;
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="hover:bg-blue-800 p-2 rounded">
              <Home size={24} />
            </button>
            <button onClick={() => router.push('/financeiro')} className="hover:bg-blue-800 p-2 rounded">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{meses[planilha.mes - 1]} / {planilha.ano}</h1>
              <p className="text-sm text-blue-200">Mensalidade Padrão: R$ {Number(planilha.valorMensalidade).toFixed(2)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportarPDF} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg">
              <Download size={20} /> Exportar PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Controle de Data/Local de Assinatura */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 print:hidden">
            <h3 className="text-xl font-bold mb-3 text-gray-800">Ajustar Local e Data da Aprovação</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Local</label>
                    <input 
                        type="text" 
                        value={localidade} 
                        onChange={(e) => setLocalidade(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Dia</label>
                    <input 
                        type="number" 
                        value={diaAssinatura} 
                        onChange={(e) => setDiaAssinatura(parseInt(e.target.value) || 1)}
                        className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                        min="1" max="31"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mês</label>
                    <select 
                        value={mesAssinatura} 
                        onChange={(e) => setMesAssinatura(parseInt(e.target.value))}
                        className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                    >
                        {meses.map((m, index) => (
                            <option key={index} value={index + 1}>{m}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ano</label>
                    <input 
                        type="number" 
                        value={anoAssinatura} 
                        onChange={(e) => setAnoAssinatura(parseInt(e.target.value) || new Date().getFullYear())}
                        className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                        min="2000"
                    />
                </div>
            </div>
        </div>

        {/* Conteúdo para PDF */}
        <div id="planilha-completa" className="bg-white p-6 rounded-lg shadow-lg">
          {/* Cabeçalho */}
          <div className="text-center mb-4">
            <img
              src="/logo.jpeg"
              alt="Logo A.R.L.S. Sabedoria de Salomão"
              className="h-20 w-auto mx-auto mb-3"
            />
            <h1 className="text-2xl font-bold text-gray-800">A.R.L.S. SABEDORIA DE SALOMÃO Nº 4774</h1>
            <h2 className="text-lg text-gray-600 mt-1">Planilha Financeira - {meses[planilha.mes - 1]} / {planilha.ano}</h2>
          </div>

          {/* Tabela de Mensalidades (para PDF) */}
          <div className="mb-3 break-inside-avoid">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Mensalidades Recebidas</h3>
            <table className="w-full border-2 border-gray-300 text-sm">
              <thead className="bg-gray-200 text-gray-900 font-semibold">
                <tr>
                  <th className="border px-2 py-1 text-left">Nome</th>
                  <th className="border px-2 py-1 text-left">CIM</th>
                  <th className="border px-2 py-1 text-center">Status</th>
                  <th className="border px-2 py-1 text-left">Mês Ref.</th>
                  <th className="border px-2 py-1 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {membros.map(membro => {
                  const pagou = pagamentosPorMembro[membro.id];
                  return (
                    <tr key={membro.id}>
                      <td className="border text-gray-900 px-2 py-1">{membro.nome}</td>
                      <td className="border text-gray-900 px-2 py-1">{membro.cim || '-'}</td>
                      <td className="border px-2 py-1 text-center">
                        {pagou ? (
                          <span className="text-green-600 font-bold">✓ Pago</span>
                        ) : (
                          <span className="text-red-600 font-bold">✗ Pendente</span>
                        )}
                      </td>
                      <td className="border text-gray-900 px-2 py-1 text-left text-xs">
                        {pagou ? pagou.mesesReferentes.join(', ') : '-'}
                      </td>
                      <td className="border text-gray-900 px-2 py-1 text-right">
                        {pagou ? `R$ ${pagou.valorTotal.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tabela de Outros Recebimentos */}
          {planilha.receitas && planilha.receitas.length > 0 && (
            <div className="mb-3 break-inside-avoid">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Outros Recebimentos</h3>
              <table className="w-full border-2 border-gray-300 text-sm">
                <thead className="bg-green-100 text-gray-900">
                  <tr>
                    <th className="border px-2 py-1 text-left">Descrição</th>
                    <th className="border px-2 py-1 text-left">Data</th>
                    <th className="border px-2 py-1 text-right">Valor</th>
                    <th className="border px-2 py-1 text-center print:hidden">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {planilha.receitas.map(receita => (
                    <tr key={receita.id}>
                      <td className="border text-gray-900 px-2 py-1">{receita.descricao}</td>
                      <td className="border text-gray-900 px-2 py-1 text-xs">{new Date(receita.data).toLocaleDateString()}</td>
                      <td className="border px-2 py-1 text-right text-green-600 font-bold">
                        R$ {Number(receita.valor).toFixed(2)}
                      </td>
                      <td className="border px-2 py-1 text-center print:hidden">
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

          {/* Tabela de Despesas */}
          {planilha.despesas && planilha.despesas.length > 0 && (
            <div className="mb-3 break-inside-avoid">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Despesas</h3>
              <table className="w-full border-2 border-gray-300 text-sm">
                <thead className="bg-red-100 text-gray-900">
                  <tr>
                    <th className="border px-2 py-1 text-left">Descrição</th>
                    <th className="border px-2 py-1 text-left">Data de Pagamento</th>
                    <th className="border px-2 py-1 text-center">Tipo de Gasto</th>
                    <th className="border px-2 py-1 text-right">Valor</th>
                    <th className="border px-2 py-1 text-center print:hidden">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {planilha.despesas.map(despesa => (
                    <tr key={despesa.id}>
                      <td className="border text-gray-900 px-2 py-1">{despesa.descricao}</td>
                      <td className="border text-gray-900 px-2 py-1 text-xs">{new Date(despesa.data).toLocaleDateString('pt-BR')}</td>
                      <td className="border text-gray-900 px-2 py-1 text-center text-xs font-semibold">{despesa.tipoGasto}</td>
                      <td className="border px-2 py-1 text-right text-red-600 font-bold">
                        R$ {Number(despesa.valor).toFixed(2)}
                      </td>
                      <td className="border px-2 py-1 text-center print:hidden">
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

          {/* Tabela de Tronco de Beneficência */}
          {planilha.troncos && planilha.troncos.length > 0 && (
            <div className="mb-3 break-inside-avoid">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Recebimentos Tronco de Beneficência</h3>
              <table className="w-full border-2 border-gray-300 text-sm">
                <thead className="bg-yellow-100 text-gray-900">
                  <tr>
                    <th className="border px-2 py-1 text-left">Grau da Sessão</th>
                    <th className="border px-2 py-1 text-left">Data da Sessão</th>
                    <th className="border px-2 py-1 text-left">Data do Depósito</th>
                    <th className="border px-2 py-1 text-right">Valor</th>
                    <th className="border px-2 py-1 text-center print:hidden">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {planilha.troncos.map(tronco => (
                    <tr key={tronco.id}>
                      <td className="border text-gray-900 px-2 py-1">{tronco.grauSessao}</td>
                      <td className="border text-gray-900 px-2 py-1 text-xs">{new Date(tronco.data).toLocaleDateString('pt-BR')}</td>
                      <td className="border text-gray-900 px-2 py-1 text-xs">{new Date(tronco.dataDeposito).toLocaleDateString('pt-BR')}</td>
                      <td className="border px-2 py-1 text-right text-green-600 font-bold">
                        R$ {Number(tronco.valor).toFixed(2)}
                      </td>
                      <td className="border px-2 py-1 text-center print:hidden">
                        <button onClick={() => excluirLancamentoTronco('tronco', tronco.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabela de Doações Filantrópicas */}
          {planilha.doacoesFilantropicas && planilha.doacoesFilantropicas.length > 0 && (
            <div className="mb-3 break-inside-avoid">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Doações Filantrópicas (Gastos do Tronco)</h3>
              <table className="w-full border-2 border-gray-300 text-sm">
                <thead className="bg-orange-100 text-gray-900">
                  <tr>
                    <th className="border px-2 py-1 text-left">Descrição</th>
                    <th className="border px-2 py-1 text-left">Data do Pagamento</th>
                    <th className="border px-2 py-1 text-right">Valor</th>
                    <th className="border px-2 py-1 text-center print:hidden">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {planilha.doacoesFilantropicas.map(doacao => (
                    <tr key={doacao.id}>
                      <td className="border text-gray-900 px-2 py-1">{doacao.descricao}</td>
                      <td className="border text-gray-900 px-2 py-1 text-xs">{new Date(doacao.dataPagamento).toLocaleDateString()}</td>
                      <td className="border px-2 py-1 text-right text-red-600 font-bold">
                        R$ {Number(doacao.valor).toFixed(2)}
                      </td>
                      <td className="border px-2 py-1 text-center print:hidden">
                        <button onClick={() => excluirLancamentoTronco('filantropia', doacao.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Resumo Movimento de Caixa */}
          <div className="mb-4 p-3 border-b-4 border-blue-500 bg-blue-50 rounded-lg break-inside-avoid mt-6">
            <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2"><Briefcase size={20} /> Resumo Movimento de Caixa (Caixa Geral)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm font-semibold">
                <div className="p-2 border-r">
                    <div className="text-gray-600">Saldo Inicial</div>
                    <div className="text-gray-800">R$ {Number(planilha.saldoInicialCaixa).toFixed(2)}</div>
                </div>
                <div className="p-2 border-r">
                    <div className="text-gray-600">Total Mensalidades</div>
                    <div className="text-green-600">R$ {planilha.pagamentos.filter(p => p.quantidadeMeses > 0).reduce((sum, p) => sum + Number(p.valorPago), 0).toFixed(2)}</div>
                </div>
                <div className="p-2 border-r">
                    <div className="text-gray-600">Outros Recebimentos</div>
                    <div className="text-green-600">R$ {planilha.receitas.reduce((sum, r) => sum + Number(r.valor), 0).toFixed(2)}</div>
                </div>
                <div className="p-2 border-r">
                    <div className="text-gray-600">Total Despesas</div>
                    <div className="text-red-600">R$ {Number(planilha.totalDespesas).toFixed(2)}</div>
                </div>
                <div className="p-2 font-bold text-lg">
                    <div className="text-gray-700">Saldo Final Caixa</div>
                    <div className={getCorSaldo(planilha.saldoFinalCaixa)}>R$ {Number(planilha.saldoFinalCaixa).toFixed(2)}</div>
                </div>
            </div>
          </div>

          {/* Resumo Tronco de Beneficência */}
          <div className="mb-4 p-3 border-b-4 border-yellow-500 bg-yellow-50 rounded-lg break-inside-avoid">
            <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2"><DollarSign size={20} /> Resumo Tronco de Beneficência</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm font-semibold">
                <div className="p-2 border-r">
                    <div className="text-gray-600">Saldo Inicial</div>
                    <div className="text-gray-800">R$ {Number(planilha.saldoInicialTronco).toFixed(2)}</div>
                </div>
                <div className="p-2 border-r">
                    <div className="text-gray-600">Total Recebido Mês</div>
                    <div className="text-green-600">R$ {Number(planilha.totalTroncoRecebido).toFixed(2)}</div>
                </div>
                <div className="p-2 border-r">
                    <div className="text-gray-600">Total Doações Filantrópicas</div>
                    <div className="text-red-600">R$ {Number(planilha.totalDoacoesFilantropicas).toFixed(2)}</div>
                </div>
                <div className="p-2 font-bold text-lg col-span-2 md:col-span-2">
                    <div className="text-gray-700">Saldo Final Tronco</div>
                    <div className={getCorSaldo(planilha.saldoFinalTronco)}>R$ {Number(planilha.saldoFinalTronco).toFixed(2)}</div>
                </div>
            </div>
          </div>

          {/* Saldo Final Total */}
          <div className="mb-4 text-right p-2 bg-gray-200 rounded-lg break-inside-avoid">
              <span className="text-xl font-bold text-gray-800">SALDO FINAL TOTAL (Caixa + Tronco): </span>
              <span className={`text-2xl font-extrabold ${getCorSaldo(saldoFinalTotal)}`}>R$ {saldoFinalTotal.toFixed(2)}</span>
          </div>

          {/* Local e Assinaturas */}
          <div className="mt-6 text-center text-base font-serif text-gray-900 break-inside-avoid">
            <p className="mb-6 text-gray-900 font-bold">
                {localidade.toUpperCase()}, {diaAssinatura} de {meses[mesAssinatura - 1].toLowerCase()} de {anoAssinatura}.
            </p>

            <div className="grid grid-cols-2 gap-12 pt-4 px-4">
                <div className="flex flex-col items-center">
                    <div className="h-14 w-full mb-1">
                        {veneravelMestre && veneravelMestre.assinaturaUrl && (
                          <img
                            src={veneravelMestre.assinaturaUrl}
                            alt="Assinatura VM"
                            className="h-full w-auto mx-auto object-contain"
                          />
                        )}
                    </div>
                    {veneravelMestre && (
                        <div className="flex flex-col items-center gap-0">
                          <p className="text-sm text-gray-900 whitespace-nowrap leading-tight">{veneravelMestre.nome}</p>
                          <p className="font-bold text-sm whitespace-nowrap leading-tight">Venerável Mestre</p>
                          <span className="text-xs text-gray-900 whitespace-nowrap leading-tight">CIM: {veneravelMestre.cim}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center">
                    <div className="h-14 w-full mb-1">
                        {tesoureiro && tesoureiro.assinaturaUrl && (
                          <img
                            src={tesoureiro.assinaturaUrl}
                            alt="Assinatura Tesoureiro"
                            className="h-full w-auto mx-auto object-contain"
                          />
                        )}
                    </div>
                    {tesoureiro && (
                        <div className="flex flex-col items-center gap-0">
                          <p className="text-sm text-gray-900 whitespace-nowrap leading-tight">{tesoureiro.nome}</p>
                          <p className="font-bold text-sm whitespace-nowrap leading-tight">Tesoureiro</p>
                          <span className="text-xs text-gray-900 whitespace-nowrap leading-tight">CIM: {tesoureiro.cim}</span>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            .break-inside-avoid {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .page-break-before {
              break-before: auto;
              page-break-before: auto;
            }
          }
        `}</style>

        {/* Botões de Ação */}
        <div className="mt-6 flex gap-4 print:hidden flex-wrap">
          <button onClick={() => abrirModalLancamentoCaixa('receita')} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <Plus size={20} /> Outros Recebimentos
          </button>
          <button onClick={() => abrirModalLancamentoCaixa('despesa')} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
            <Plus size={20} /> Despesa (Caixa)
          </button>
          <button onClick={() => abrirModalTronco('tronco')} className="flex items-center gap-2 bg-yellow-600 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-700">
            <DollarSign size={20} /> Lançar Tronco
          </button>
          <button onClick={() => abrirModalTronco('filantropia')} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
            <BookOpen size={20} /> Doação Filantrópica
          </button>
        </div>

        {/* Tabela de Controle */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-6 print:hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Controle de Mensalidades</h2>
            {planilha.valorMensalidadeExcecao && Number(planilha.valorMensalidadeExcecao) > 0 && (
                <span className="text-sm font-semibold text-red-600">
                    * {membrosExcecaoSelecionados.length} Irmão(s) pagam R$ {Number(planilha.valorMensalidadeExcecao).toFixed(2)}
                </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-gray-700">Nome</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700">CIM</th>
                  <th className="px-6 py-3 text-center font-bold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700">Mês Ref.</th>
                  <th className="px-6 py-3 text-center font-bold text-gray-700">Ação</th>
                </tr>
              </thead>
              <tbody>
                {linhasFiltradas.map((linha, idx) => {
                  const { membro, tipo, pagamento, status } = linha;
                  const idsExcecao = planilha.membrosExcecaoIds ? planilha.membrosExcecaoIds.split(',') : [];
                  const isExcecao = idsExcecao.includes(membro.id);
                  let valorMensalidadeUnitario = Number(planilha.valorMensalidade);

                  if (isExcecao && planilha.valorMensalidadeExcecao !== null && Number(planilha.valorMensalidadeExcecao) >= 0) {
                      valorMensalidadeUnitario = Number(planilha.valorMensalidadeExcecao);
                  }
                  
                  const chaveUnica = `${membro.id}-${tipo}-${pagamento?.id || idx}`;
                  
                  return (
                    <tr key={chaveUnica} className={`border-b hover:bg-gray-50 ${tipo === 'inadimplencia' ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 text-gray-800">
                          {membro.nome}
                          {isExcecao && tipo !== 'inadimplencia' && (
                            <span className="ml-2 text-xs text-red-500 font-semibold">
                                (Exceção: R$ {valorMensalidadeUnitario.toFixed(2)})
                            </span>
                          )}
                          {tipo === 'inadimplencia' && (
                            <span className="ml-2 text-xs text-orange-600 font-bold">
                                (DEVENDO)
                            </span>
                          )}
                          {tipo === 'normal' && (
                            <span className="ml-2 text-xs text-blue-600 font-semibold">
                                (MÊS ATUAL)
                            </span>
                          )}
                      </td>
                      <td className="px-6 py-4 text-gray-800">{membro.cim || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        {status === 'pago' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                            <Check size={16} /> Pago
                          </span>
                        ) : tipo === 'inadimplencia' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-bold">
                            <X size={16} /> Devendo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                            <X size={16} /> Mês Atual
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-800 text-xs">
                        {pagamento ? pagamento.mesesReferentes : tipo === 'normal' ? `${meses[planilha.mes - 1].substring(0,3)}/${planilha.ano}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center flex justify-center gap-2">
                        {status === 'pago' && tipo !== 'inadimplencia' ? (
                          <button 
                              onClick={() => cancelarPagamento(pagamento.id)} 
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm flex items-center gap-1"
                              title="Cancelar Pagamento"
                          >
                              <Undo2 size={16} /> Cancelar
                          </button>
                        ) : (
                          <button 
                            onClick={() => abrirModalPagamento(membro, pagamento)} 
                            className={`text-white px-4 py-1 rounded text-sm font-semibold ${
                              tipo === 'inadimplencia' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {tipo === 'inadimplencia' ? 'Quitar Dívida' : 'Registrar Pagamento'}
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
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {pagamentoSelecionado && pagamentoSelecionado.quantidadeMeses < 0 ? 'Quitar Inadimplência' : 'Registrar Pagamento'}
            </h2>
            <div className="mb-4">
              <div className="text-sm font-bold text-gray-600">Membro:</div>
              <div className="font-bold text-lg text-gray-900">{membroSelecionado.nome}</div>
            </div>
            
            {pagamentoSelecionado && pagamentoSelecionado.quantidadeMeses < 0 && (
              <div className="mb-4 p-3 bg-orange-50 border-2 border-orange-300 rounded-lg">
                <p className="text-sm text-orange-800 font-bold mb-1">
                  🔔 Quitando mês específico:
                </p>
                <p className="text-lg text-orange-900 font-extrabold">
                  {pagamentoSelecionado.mesesReferentes}
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  Os outros meses devidos permanecerão pendentes e poderão ser quitados separadamente.
                </p>
              </div>
            )}
            
            {(() => {
                const idsExcecao = planilha.membrosExcecaoIds ? planilha.membrosExcecaoIds.split(',') : [];
                const isExcecao = idsExcecao.includes(membroSelecionado.id);
                
                let valorMensalidadeUnitario = Number(planilha.valorMensalidade);
                
                if (isExcecao && planilha.valorMensalidadeExcecao !== null && Number(planilha.valorMensalidadeExcecao) >= 0) {
                    valorMensalidadeUnitario = Number(planilha.valorMensalidadeExcecao);
                }
                
                const valorCalculadoPadrao = valorMensalidadeUnitario * mesesPagar;
                const valorFinal = usarValorCustomizado && valorCustomizado 
                  ? parseFloat(valorCustomizado.replace(/\./g, '').replace(',', '.')) 
                  : valorCalculadoPadrao;
                
                const isInadimplencia = pagamentoSelecionado && pagamentoSelecionado.quantidadeMeses < 0;

                return (
                    <>
                    {!isInadimplencia && (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-bold mb-1 text-gray-700">Mês Referência (Mais Recente)</label>
                          <select value={mesReferenciaPagamento} onChange={(e) => setMesReferenciaPagamento(parseInt(e.target.value))} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900">
                            {meses.map((m, index) => (
                              <option key={index} value={index + 1}>{m}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-bold mb-1 text-gray-700">Quantidade de Meses</label>
                          <select value={mesesPagar} onChange={(e) => setMesesPagar(parseInt(e.target.value))} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                              <option key={n} value={n}>{n} {n === 1 ? 'mês' : 'meses'}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    
                    {isInadimplencia && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={usarValorCustomizado}
                            onChange={(e) => setUsarValorCustomizado(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-bold text-yellow-800">
                            ✏️ Editar valor (mensalidade era diferente na época)
                          </span>
                        </label>
                        
                        {usarValorCustomizado && (
                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-yellow-700 mb-1">
                              Valor Customizado (R$)
                            </label>
                            <input 
                              type="text"
                              value={valorCustomizado}
                              onChange={(e) => handleValorChange(e, setValorCustomizado)}
                              className="w-full border-2 border-yellow-400 rounded px-3 py-2 text-gray-900 font-bold"
                              placeholder="0,00"
                            />
                            <p className="text-xs text-yellow-600 mt-1">
                              💡 Use este campo se o valor da mensalidade era diferente naquele mês
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <div className="text-sm text-gray-700 mb-1">
                        {usarValorCustomizado ? 'Valor Customizado:' : `Valor a Pagar (${isExcecao ? 'Exceção' : 'Padrão'}):`}
                      </div>
                      <div className="text-3xl font-extrabold text-green-700">
                        R$ {isNaN(valorFinal) ? '0,00' : valorFinal.toFixed(2)}
                      </div>
                      {isInadimplencia && (
                        <div className="text-xs text-green-600 mt-2">
                          ✓ Este valor quitará apenas o mês selecionado
                        </div>
                      )}
                    </div>
                    </>
                )
            })()}
            
            <div className="flex gap-2">
              <button 
                onClick={registrarPagamento} 
                className={`flex-1 text-white py-3 rounded-lg font-bold ${
                  pagamentoSelecionado && pagamentoSelecionado.quantidadeMeses < 0 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {pagamentoSelecionado && pagamentoSelecionado.quantidadeMeses < 0 ? '✓ Quitar Este Mês' : 'Confirmar Pagamento'}
              </button>
              <button onClick={() => {
                setShowPagamentoModal(false);
                setPagamentoSelecionado(null);
                setUsarValorCustomizado(false);
                setValorCustomizado('');
              }} className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Outros Recebimentos/Despesa */}
      {showLancamentoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Adicionar {tipoLancamento === 'receita' ? 'Outro Recebimento' : 'Despesa (Caixa)'}
            </h2>
            
            <div className="space-y-4">
              {tipoLancamento === 'despesa' && (
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Tipo de Gasto</label>
                  <select value={tipoGasto} onChange={(e) => setTipoGasto(e.target.value)} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900">
                      <option value="VARIAVEL">VARIÁVEL</option>
                      <option value="FIXO">FIXO</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Descrição</label>
                <input type="text" value={descricaoLancamento} onChange={(e) => setDescricaoLancamento(e.target.value)} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900" placeholder="Ex: Doação, Aluguel, etc." />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Data</label>
                <input type="date" value={dataLancamento} onChange={(e) => setDataLancamento(e.target.value)} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Valor (R$)</label>
                <input type="text" value={valorLancamento} onChange={(e) => handleValorChange(e, setValorLancamento)} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900" placeholder="0,00" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={adicionarLancamento} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Adicionar</button>
              <button onClick={() => setShowLancamentoModal(false)} className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal: Tronco de Beneficência / Doação Filantrópica */}
      {showTroncoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Lançamento {tipoLancamento === 'tronco' ? 'Tronco de Beneficência' : 'Doação Filantrópica'}
            </h2>
            
            <div className="space-y-4">
              {tipoLancamento === 'tronco' && (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700">Grau da Sessão</label>
                    <select value={grauSessao} onChange={(e) => setGrauSessao(e.target.value)} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900">
                        <option value="">Selecione</option>
                        {grausSessao.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700">Data da Sessão</label>
                    <input type="date" value={dataSessaoTronco} onChange={(e) => setDataSessaoTronco(e.target.value)} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700">Data do Depósito</label>
                    <input type="date" value={dataDepositoTronco} onChange={(e) => setDataDepositoTronco(e.target.value)} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900" />
                  </div>
                </>
              )}
              
              {tipoLancamento === 'filantropia' && (
                <>
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700">Descrição da Doação</label>
                    <input type="text" value={descricaoFilantropia} onChange={(e) => setDescricaoFilantropia(e.target.value)} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900" placeholder="Ex: Doação para Lar da Criança" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700">Data da Doação</label>
                    <input type="date" value={dataFilantropia} onChange={(e) => setDataFilantropia(e.target.value)} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Valor (R$)</label>
                <input type="text" value={valorTronco} onChange={(e) => handleValorChange(e, setValorTronco)} className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-900" placeholder="0,00" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={adicionarLancamento} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Adicionar</button>
              <button onClick={() => setShowTroncoModal(false)} className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}