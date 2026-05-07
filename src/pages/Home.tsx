import { useNavigate } from 'react-router-dom';
import { UserSquare2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight text-center mb-6">
        Bem-vindo ao Quiz Master
      </h1>
      <p className="text-xl text-gray-500 mb-12 text-center max-w-2xl">
        A plataforma completa para criar, aplicar e analisar questionários.
      </p>

      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/admin')}
          className="w-full flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <UserSquare2 className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Painel Administrativo</h2>
          <p className="text-gray-500 text-center">
            Crie quizzes, gerencie links e visualize os resultados.
          </p>
        </button>
      </div>
    </div>
  );
}
