"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit, ArrowLeft, Save, X } from 'lucide-react';

export default function MembrosPage() {
  const router = useRouter();
  const [membros, setMembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    grau: '',
    status: 'ATIVO'
  });

  

  const graus = ['APRENDIZ', 'COMPANHEIRO', 'MESTRE', 'CANDIDATO' ];
  const statusOptions = ['ATIVO', 'INATIVO'];

    

  const carregarMembros = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/membros');
      const data = await response.json();
      setMembros(data);
    } catch (error) {
      alert('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  carregarMembros();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Atualizar
        await fetch('/api/membros', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: editingId })
        });
      } else {
        // Adicionar
        await fetch('/api/membros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      
      setFormData({ nome: '', grau: '', status: 'ATIVO' });
      setShowForm(false);
      setEditingId(null);
      carregarMembros();
    } catch (error) {
      alert('Erro ao salvar membro');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Deseja realmente excluir este membro?')) {
      try {
        await fetch('/api/membros', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        carregarMembros();
      } catch (error) {
        alert('Erro ao excluir membro');
      }
    }
  };

  const handleEdit = (membro) => {
    setFormData({
      nome: membro.nome,
      grau: membro.grau,
      status: membro.status
    });
    setEditingId(membro.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setFormData({ nome: '', grau: '', status: 'ATIVO' });
    setShowForm(false);
    setEditingId(null);
  };

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
            <h1 className="text-2xl font-bold">Gerenciar Membros</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
          >
            <Plus size={20} />
            Novo Membro
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">
        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {editingId ? 'Editar Membro' : 'Novo Membro'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">
                    Grau *
                  </label>
                  <select
                    value={formData.grau}
                    onChange={(e) => setFormData({ ...formData, grau: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                    required
                  >
                    <option value="">Selecione</option>
                    {graus.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded px-3 py-2 text-gray-800"
                    required
                  >
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Save size={20} />
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  <X size={20} />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Membros */}
        {loading ? (
          <div className="text-center py-8 text-gray-600">Carregando...</div>
        ) : membros.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-600">
            Nenhum membro cadastrado
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-max"></table>
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-700 font-bold">Nome</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-bold">Grau</th>
                  <th className="px-6 py-3 text-left text-gray-700 font-bold">Status</th>
                  <th className="px-6 py-3 text-center text-gray-700 font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {membros.map((membro) => (
                  <tr key={membro.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800">{membro.nome}</td>
                    <td className="px-6 py-4 text-gray-800">{membro.grau}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        membro.status === 'ATIVO' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {membro.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEdit(membro)}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(membro.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={20} />
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
