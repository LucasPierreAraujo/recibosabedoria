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
    cargo: '',
    assinaturaUrl: '',
    dataIniciacao: '',
    dataFiliacao: '',
    dataPassagemGrau: '',
    dataElevacao: ''
  });

  const graus = ['CANDIDATO', 'APRENDIZ', 'COMPANHEIRO', 'MESTRE'];
  const statusOptions = ['ATIVO', 'INATIVO'];
  const cargos = [
    '',
    'VENERÁVEL MESTRE',
    'ORADOR / MEMBRO DO MINISTÉRIO PÚBLICO',
    'SECRETÁRIO',
    'TESOUREIRO',    
  ];

  // ================== CARREGAR MEMBROS ==================
  const carregarMembros = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/membros');
      const data = await response.json();

      if (Array.isArray(data)) {
        setMembros(data);
      } else if (data.membros && Array.isArray(data.membros)) {
        setMembros(data.membros);
      } else {
        console.error('Resposta inesperada:', data);
        setMembros([]);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      alert('Erro ao carregar membros');
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
    const { grau, cim, dataIniciacao, dataFiliacao, dataPassagemGrau, dataElevacao } = formData;

    if (grau === 'MESTRE') {
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

    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert('Imagem muito grande! Máximo 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, assinaturaUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  // ================== SUBMIT ==================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarCampos()) return;

    try {
      if (editingId) {
        await fetch('/api/membros', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: editingId })
        });
      } else {
        await fetch('/api/membros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

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
        dataElevacao: ''
      });
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
      dataElevacao: membro.dataElevacao || ''
    });
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
      dataElevacao: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  // ================== CAMPOS CONDICIONAIS ==================
  const mostrarCIM = ['APRENDIZ', 'COMPANHEIRO', 'MESTRE'].includes(formData.grau);
  const mostrarDataIniciacao = ['APRENDIZ', 'COMPANHEIRO', 'MESTRE'].includes(formData.grau);
  const mostrarDataFiliacao = formData.grau === 'MESTRE';
  const mostrarDataPassagemGrau = ['COMPANHEIRO', 'MESTRE'].includes(formData.grau);
  const mostrarDataElevacao = formData.grau === 'MESTRE';
  const mostrarCargo = ['APRENDIZ', 'COMPANHEIRO', 'MESTRE'].includes(formData.grau);

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

              {/* Datas */}
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

              {(mostrarDataPassagemGrau || mostrarDataElevacao) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              )}

              {/* Cargo */}
              {mostrarCargo && (
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Cargo em Loja</label>
                  <select
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                  >
                    {cargos.map(c => <option key={c} value={c}>{c || 'Sem cargo'}</option>)}
                  </select>
                </div>
              )}

              {/* Upload de Assinatura */}
              {formData.cargo && formData.cargo !== '' && (
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
              )}

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
          <div className="bg-white rounded-lg shadow-lg overflow-hidden overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700 font-bold">Nome</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-bold">Grau</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-bold">CIM</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-bold">Cargo</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-bold">Status</th>
                  <th className="px-6 py-3 text-center text-gray-700 font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(membros) && membros.map((membro) => (
                  <tr key={membro.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800">{membro.nome}</td>
                    <td className="px-6 py-4 text-gray-800">{membro.grau}</td>
                    <td className="px-6 py-4 text-gray-800">{membro.cim || '-'}</td>
                    <td className="px-6 py-4 text-gray-800">{membro.cargo || '-'}</td>
                    <td className="px-6 py-4 text-gray-800">{membro.status}</td>
                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                      <button onClick={() => handleEdit(membro)} className="text-blue-600 hover:text-blue-800">
                        <Edit size={20}/>
                      </button>
                      <button onClick={() => handleDelete(membro.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={20}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
