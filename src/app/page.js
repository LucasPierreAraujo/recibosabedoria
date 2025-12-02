"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Verifica se está autenticado
    const isAuth = localStorage.getItem('isAuthenticated');
    
    if (isAuth) {
      // Se está autenticado, vai para o dashboard
      router.push('/dashboard');
    } else {
      // Se não está autenticado, vai para o login
      router.push('/login');
    }
  }, [router]);

  // Tela de carregamento enquanto redireciona
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-xl font-bold">Carregando...</p>
      </div>
    </div>
  );
}