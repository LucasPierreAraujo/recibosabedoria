"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Calendar, Trash2, Edit, Home, Eye } from 'lucide-react';

export default function AtasPage() {
  const router = useRouter();
  const [atas, setAtas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAtas();
  }, []);

  const carregarAtas = async () => {
    try {
      const response = await fetch('/api/atas');
      const data = await response.json();

      // Verificar se data é um array
      if (Array.isArray(data)) {
        setAtas(data);
      } else {
        console.error('API retornou dados inválidos:', data);
        setAtas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar atas:', error);
      setAtas([]);
    } finally {
      setLoading(false);
    }
  };

  const excluirAta = async (id) => {
    if (!confirm('Deseja realmente excluir esta ata?')) return;

    try {
      const response = await fetch(`/api/atas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Ata excluída com sucesso!');
        carregarAtas();
      } else {
        alert('Erro ao excluir ata');
      }
    } catch (error) {
      console.error('Erro ao excluir ata:', error);
      alert('Erro ao excluir ata');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl font-bold text-gray-600">Carregando...</div>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold">Atas de Sessões</h1>
              <p className="text-sm text-blue-200">Gerenciar atas maçônicas</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/atas/nova')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
          >
            <Plus size={20} /> Nova Ata
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-gray-700">Nº Ata</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700">Livro</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-700">Data</th>
                  <th className="px-6 py-3 text-center font-bold text-gray-700">Presentes</th>
                  <th className="px-6 py-3 text-right font-bold text-gray-700">Tronco</th>
                  <th className="px-6 py-3 text-center font-bold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {atas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-semibold">Nenhuma ata cadastrada</p>
                      <p className="text-sm">Clique em "Nova Ata" para criar a primeira ata</p>
                    </td>
                  </tr>
                ) : (
                  atas.map((ata) => (
                    <tr key={ata.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-800 font-bold">
                        <div className="flex items-center gap-2">
                          <FileText size={20} className="text-blue-600" />
                          {ata.numeroAta}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          ata.livro === 'APRENDIZ' ? 'bg-blue-100 text-blue-800' :
                          ata.livro === 'COMPANHEIRO' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {ata.livro}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          {new Date(ata.data).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-800">
                        {ata.numeroPresentes}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-800 font-semibold">
                        R$ {Number(ata.valorTronco).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => router.push(`/atas/${ata.id}/visualizar`)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                            title="Visualizar"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => router.push(`/atas/${ata.id}/editar`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => excluirAta(ata.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estatísticas */}
        {atas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Total de Atas</div>
              <div className="text-3xl font-bold text-blue-600">{atas.length}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Aprendiz</div>
              <div className="text-3xl font-bold text-blue-600">
                {atas.filter(a => a.livro === 'APRENDIZ').length}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Companheiro</div>
              <div className="text-3xl font-bold text-green-600">
                {atas.filter(a => a.livro === 'COMPANHEIRO').length}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-1">Mestre</div>
              <div className="text-3xl font-bold text-purple-600">
                {atas.filter(a => a.livro === 'MESTRE').length}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}