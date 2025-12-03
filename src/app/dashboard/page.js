"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Users, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            A.R.L.S. Sabedoria de Salomão Nº 4774
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Gerar Recibo */}
          <div
            onClick={() => router.push('/recibo')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-blue-600"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <FileText size={32} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Gerar Recibo</h3>
            </div>
            <p className="text-gray-600">
              Crie e exporte recibos em PDF para os membros da loja
            </p>
          </div>

          {/* Card Gerenciar Membros */}
          <div
            onClick={() => router.push('/membros')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-green-600"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <Users size={32} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Gerenciar Membros</h3>
            </div>
            <p className="text-gray-600">
              Adicione, edite ou remova membros do cadastro da loja
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
