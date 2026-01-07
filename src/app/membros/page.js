// SEU ARQUIVO: MembrosPage.js

"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit, ArrowLeft, Save, X, Upload } from 'lucide-react';

export default function MembrosPage() {
  const router = useRouter();
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    grau: '',
    status: 'ATIVO',
    cim: '',
    cargo: '', // Será string com cargos separados por " / "
    assinaturaUrl: '',
    dataIniciacao: '',
    dataFiliacao: '',
    dataPassagemGrau: '',
    dataElevacao: '',
    dataInstalacao: '' // <--- CAMPO ADICIONADO NO ESTADO
  });

  // Estado para controlar checkboxes de cargos
  const [cargosSelecionados, setCargosSelecionados] = useState([]);

  const graus = ['CANDIDATO', 'APRENDIZ', 'COMPANHEIRO', 'MESTRE', 'MESTRE INSTALADO'];
  const statusOptions = ['ATIVO', 'INATIVO'];
  const cargosDisponiveis = [
    'VENERÁVEL MESTRE',
    'ORADOR',
    'MEMBRO DO MINISTÉRIO PÚBLICO',
    'SECRETÁRIO',
    'TESOUREIRO',
  ];

  // ================== CARREGAR MEMBROS ==================
  const carregarMembros = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/membros');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setMembros(data);
      } else if (data.membros && Array.isArray(data.membros)) {
        setMembros(data.membros);
      } else {
        console.error('Resposta inesperada. Tipo:', typeof data, 'Dados:', data);
        setMembros([]);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      setMembros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMembros();
  }, []);

  // ================== VALIDAÇÃO ==================
  const validarCampos = () => {
    const { grau, cim, dataIniciacao, dataFiliacao, dataPassagemGrau, dataElevacao, dataInstalacao } = formData;

    if (grau === 'MESTRE INSTALADO') {
      if (!cim) { alert('CIM é obrigatório para Mestre Instalado'); return false; }
      if (!dataIniciacao && !dataFiliacao) { alert('Data de Iniciação ou Filiação é obrigatória para Mestre Instalado'); return false; }
      if (!dataPassagemGrau) { alert('Data de Passagem de Grau é obrigatória para Mestre Instalado'); return false; }
      if (!dataElevacao) { alert('Data de Elevação é obrigatória para Mestre Instalado'); return false; }
      if (!dataInstalacao) { alert('Data de Instalação é obrigatória para Mestre Instalado'); return false; }
    } else if (grau === 'MESTRE') {
      if (!cim) { alert('CIM é obrigatório para Mestre'); return false; }
      if (!dataIniciacao && !dataFiliacao) { alert('Data de Iniciação ou Filiação é obrigatória para Mestre'); return false; }
      if (!dataPassagemGrau) { alert('Data de Passagem de Grau é obrigatória para Mestre'); return false; }
      if (!dataElevacao) { alert('Data de Elevação é obrigatória para Mestre'); return false; }
    } else if (grau === 'COMPANHEIRO') {
      if (!cim) { alert('CIM é obrigatório para Companheiro'); return false; }
      if (!dataIniciacao) { alert('Data de Iniciação é obrigatória para Companheiro'); return false; }
      if (!dataPassagemGrau) { alert('Data de Passagem de Grau é obrigatória para Companheiro'); return false; }
    } else if (grau === 'APRENDIZ') {
      if (!cim) { alert('CIM é obrigatório para Aprendiz'); return false; }
      if (!dataIniciacao) { alert('Data de Iniciação é obrigatória para Aprendiz'); return false; }
    }

    return true;
  };

  // ================== UPLOAD DE ASSINATURA ==================
  const handleAssinaturaUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validar tamanho (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Imagem muito grande! Máximo 5MB');
    return;
  }

  // Validar tipo
  if (!file.type.startsWith('image/')) {
    alert('Apenas imagens são permitidas!');
    return;
  }

  // Mostrar loading
  const loadingElement = document.createElement('div');
  loadingElement.className = 'text-center text-sm text-gray-600 mt-2';
  loadingElement.textContent = 'Fazendo upload...';
  e.target.parentElement.appendChild(loadingElement);

  try {
    // Converter para base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        // Enviar para API de upload
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result })
        });

        const data = await response.json();

        if (data.success) {
          setFormData({ ...formData, assinaturaUrl: data.url });
          alert('Upload realizado com sucesso!');
        } else {
          alert('Erro no upload. Tente novamente.');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao fazer upload');
      } finally {
        loadingElement.remove();
      }
    };
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Erro ao ler arquivo:', error);
    alert('Erro ao processar imagem');
    loadingElement.remove();
  }
};

  // ================== GERENCIAR CARGOS ==================
  const handleCargoToggle = (cargo) => {
    let novosCargos;
    if (cargosSelecionados.includes(cargo)) {
      novosCargos = cargosSelecionados.filter(c => c !== cargo);
    } else {
      novosCargos = [...cargosSelecionados, cargo];
    }

    // Ordenar para que "Membro do Ministério Público" sempre fique por último
    const cargosOrdenados = novosCargos.sort((a, b) => {
      if (a === 'MEMBRO DO MINISTÉRIO PÚBLICO') return 1;
      if (b === 'MEMBRO DO MINISTÉRIO PÚBLICO') return -1;
      return 0;
    });

    setCargosSelecionados(cargosOrdenados);
    // Atualizar formData.cargo como string separada por " / "
    setFormData({ ...formData, cargo: cargosOrdenados.join(' / ') });
  };

  // ================== SUBMIT ==================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarCampos()) return;

    try {
      const method = editingId ? 'PUT' : 'POST';
      const bodyData = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch('/api/membros', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      
      const data = await response.json();

      if (!response.ok) {
        console.error('Erro na API:', data);
        alert(`Erro ao salvar membro: ${data.details || data.error || 'Erro desconhecido'}`);
        return;
      }

      // Resetar formulário após sucesso
      setFormData({
        nome: '',
        grau: '',
        status: 'ATIVO',
        cim: '',
        cargo: '',
        assinaturaUrl: '',
        dataIniciacao: '',
        dataFiliacao: '',
        dataPassagemGrau: '',
        dataElevacao: '',
        dataInstalacao: '' // <--- RESETADO
      });
      setCargosSelecionados([]);
      setShowForm(false);
      setEditingId(null);
      carregarMembros();
    } catch (error) {
      console.error('Erro ao salvar membro:', error);
      alert('Erro ao salvar membro');
    }
  };

  // ================== DELETE ==================
  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este membro?')) return;

    try {
      await fetch('/api/membros', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      carregarMembros();
    } catch (error) {
      console.error('Erro ao excluir membro:', error);
      alert('Erro ao excluir membro');
    }
  };

  // ================== EDIT ==================
  const handleEdit = (membro) => {
    setFormData({
      nome: membro.nome,
      grau: membro.grau,
      status: membro.status,
      cim: membro.cim || '',
      cargo: membro.cargo || '',
      assinaturaUrl: membro.assinaturaUrl || '',
      dataIniciacao: membro.dataIniciacao || '',
      dataFiliacao: membro.dataFiliacao || '',
      dataPassagemGrau: membro.dataPassagemGrau || '',
      dataElevacao: membro.dataElevacao || '',
      dataInstalacao: membro.dataInstalacao || '' // <--- CARREGADO
    });

    // Inicializar cargos selecionados a partir do cargo salvo
    if (membro.cargo) {
      const cargos = membro.cargo.split(' / ').map(c => c.trim());
      setCargosSelecionados(cargos);
    } else {
      setCargosSelecionados([]);
    }

    setEditingId(membro.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({
      nome: '',
      grau: '',
      status: 'ATIVO',
      cim: '',
      cargo: '',
      assinaturaUrl: '',
      dataIniciacao: '',
      dataFiliacao: '',
      dataPassagemGrau: '',
      dataElevacao: '',
      dataInstalacao: '' // <--- RESETADO
    });
    setCargosSelecionados([]);
    setShowForm(false);
    setEditingId(null);
  };

  // ================== CAMPOS CONDICIONAIS ==================
  const mostrarCIM = ['APRENDIZ', 'COMPANHEIRO', 'MESTRE', 'MESTRE INSTALADO'].includes(formData.grau);
  const mostrarDataIniciacao = ['APRENDIZ', 'COMPANHEIRO', 'MESTRE', 'MESTRE INSTALADO'].includes(formData.grau);
  const mostrarDataFiliacao = ['MESTRE', 'MESTRE INSTALADO'].includes(formData.grau);
  const mostrarDataPassagemGrau = ['COMPANHEIRO', 'MESTRE', 'MESTRE INSTALADO'].includes(formData.grau);
  const mostrarDataElevacao = ['MESTRE', 'MESTRE INSTALADO'].includes(formData.grau);
  const mostrarCargo = ['APRENDIZ', 'COMPANHEIRO', 'MESTRE', 'MESTRE INSTALADO'].includes(formData.grau);
  // Mostrar Data de Instalação se grau for MESTRE INSTALADO
  const mostrarDataInstalacao = formData.grau === 'MESTRE INSTALADO'; 

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="hover:bg-blue-800 p-2 rounded">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Gerenciar Membros</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition">
            <Plus size={20} /> Novo Membro
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {editingId ? 'Editar Membro' : 'Novo Membro'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome e Grau */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Nome Completo *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Grau *</label>
                  <select
                    value={formData.grau}
                    onChange={(e) => setFormData({ ...formData, grau: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                    required
                  >
                    <option value="">Selecione</option>
                    {graus.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              {/* CIM e Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mostrarCIM && (
                  <div>
                    <label className="block text-sm font-bold mb-1 text-gray-700">
                      CIM *
                    </label>
                    <input
                      type="text"
                      value={formData.cim}
                      onChange={(e) => setFormData({ ...formData, cim: e.target.value })}
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                      placeholder="Número do CIM"
                      required={mostrarCIM}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Cargo */}
              {mostrarCargo && (
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Cargo em Loja (pode selecionar múltiplos)</label>
                  <div className="border-2 border-gray-300 rounded p-3 space-y-2">
                    {cargosDisponiveis.map(cargo => (
                      <label key={cargo} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cargosSelecionados.includes(cargo)}
                          onChange={() => handleCargoToggle(cargo)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-800">{cargo}</span>
                      </label>
                    ))}
                    {cargosSelecionados.length === 0 && (
                      <p className="text-sm text-gray-500 italic">Nenhum cargo selecionado</p>
                    )}
                  </div>
                  {formData.cargo && (
                    <p className="text-sm text-gray-600 mt-2">
                      Cargos: <strong>{formData.cargo}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Datas de Iniciação/Filiação */}
              {(mostrarDataIniciacao || mostrarDataFiliacao) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mostrarDataIniciacao && (
                    <div>
                      <label className="block text-sm font-bold mb-1 text-gray-700">Data de Iniciação *</label>
                      <input
                        type="date"
                        value={formData.dataIniciacao}
                        onChange={(e) => setFormData({ ...formData, dataIniciacao: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                      />
                    </div>
                  )}
                  {mostrarDataFiliacao && (
                    <div>
                      <label className="block text-sm font-bold mb-1 text-gray-700">Data de Filiação *</label>
                      <input
                        type="date"
                        value={formData.dataFiliacao}
                        onChange={(e) => setFormData({ ...formData, dataFiliacao: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Datas de Grau/Elevação/Instalação */}
              {(mostrarDataPassagemGrau || mostrarDataElevacao || mostrarDataInstalacao) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mostrarDataPassagemGrau && (
                    <div>
                      <label className="block text-sm font-bold mb-1 text-gray-700">Data de Passagem de Grau *</label>
                      <input
                        type="date"
                        value={formData.dataPassagemGrau}
                        onChange={(e) => setFormData({ ...formData, dataPassagemGrau: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                      />
                    </div>
                  )}
                  {mostrarDataElevacao && (
                    <div>
                      <label className="block text-sm font-bold mb-1 text-gray-700">Data de Elevação *</label>
                      <input
                        type="date"
                        value={formData.dataElevacao}
                        onChange={(e) => setFormData({ ...formData, dataElevacao: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                      />
                    </div>
                  )}
                  {mostrarDataInstalacao && ( // <--- CAMPO ADICIONADO NO FORM
                    <div>
                      <label className="block text-sm font-bold mb-1 text-gray-700">Data de Instalação *</label>
                      <input
                        type="date"
                        value={formData.dataInstalacao}
                        onChange={(e) => setFormData({ ...formData, dataInstalacao: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                        required={mostrarDataInstalacao}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Upload de Assinatura */}
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Assinatura (Opcional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAssinaturaUpload}
                    className="hidden"
                    id="assinatura-upload"
                  />
                  <label htmlFor="assinatura-upload" className="flex flex-col items-center cursor-pointer">
                    {formData.assinaturaUrl ? (
                      <img src={formData.assinaturaUrl} alt="Assinatura" className="max-h-32 mb-2"/>
                    ) : (
                      <Upload size={32} className="text-gray-400 mb-2" />
                    )}
                    <span className="text-sm text-gray-600">{formData.assinaturaUrl ? 'Clique para alterar' : 'Clique para adicionar assinatura'}</span>
                    <span className="text-xs text-gray-500 mt-1">PNG, JPG até 2MB</span>
                  </label>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  <Save size={20}/> Salvar
                </button>
                <button type="button" onClick={handleCancel} className="flex items-center gap-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                  <X size={20}/> Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Membros */}
        {loading ? (
          <div className="text-center py-8 text-gray-600">Carregando...</div>
        ) : !Array.isArray(membros) || membros.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-600">
            Nenhum membro cadastrado
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Nome</th>
                    <th className="px-4 py-3 text-left font-bold">Grau</th>
                    <th className="px-4 py-3 text-left font-bold">CIM</th>
                    <th className="px-4 py-3 text-left font-bold">Cargo</th>
                    <th className="px-4 py-3 text-center font-bold">Status</th>
                    <th className="px-4 py-3 text-center font-bold sticky right-0 bg-blue-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(membros) && membros.map((membro, index) => (
                    <tr
                      key={membro.id}
                      className={`border-b hover:bg-blue-50 transition ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-900 font-semibold">{membro.nome}</td>
                      <td className="px-4 py-3 text-gray-800">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          membro.grau === 'APRENDIZ' ? 'bg-blue-100 text-blue-800' :
                          membro.grau === 'COMPANHEIRO' ? 'bg-green-100 text-green-800' :
                          membro.grau === 'MESTRE' ? 'bg-purple-100 text-purple-800' :
                          membro.grau === 'MESTRE INSTALADO' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {membro.grau}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800">{membro.cim || '-'}</td>
                      <td className="px-4 py-3 text-gray-800 text-sm max-w-xs truncate" title={membro.cargo || '-'}>
                        {membro.cargo || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          membro.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {membro.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 sticky right-0 bg-inherit">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(membro)}
                            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
                            title="Editar"
                          >
                            <Edit size={18}/>
                          </button>
                          <button
                            onClick={() => handleDelete(membro.id)}
                            className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition"
                            title="Excluir"
                          >
                            <Trash2 size={18}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}