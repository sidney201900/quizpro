import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/Admin/AdminDashboard';
import CreateQuiz from './pages/Admin/CreateQuiz';
import QuizResults from './pages/Admin/QuizResults';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminLogin from './pages/Admin/AdminLogin';
import TakeQuiz from './pages/Student/TakeQuiz';
import AdminRoute from './components/AdminRoute';
import { BookOpen, Settings, LogOut } from 'lucide-react';
import { useQuizStore } from './store';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const isResponder = location.pathname.startsWith('/responder');
  const isAuthenticated = useQuizStore((state) => state.isAuthenticated);
  const logout = useQuizStore((state) => state.logout);

  if (isResponder) {
    return null; // Do not show header on quiz answering page
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            <span className="font-bold text-xl text-gray-900 tracking-tight">Quiz Master</span>
          </Link>
          
          {isAdmin && isAuthenticated && (
            <div className="flex items-center gap-4">
               <Link to="/admin" className="text-gray-600 hover:text-indigo-600 font-medium text-sm">Dashboard</Link>
               <Link to="/admin/settings" className="text-gray-600 hover:text-indigo-600 font-medium text-sm flex items-center gap-1">
                 <Settings className="w-4 h-4" />
                 Configurações
               </Link>
               <button onClick={handleLogout} className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1 transition-colors">
                 <LogOut className="w-4 h-4" />
                 Sair
               </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const fetchInitialData = useQuizStore((state) => state.fetchInitialData);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/create" element={<CreateQuiz />} />
              <Route path="/admin/edit/:id" element={<CreateQuiz />} />
              <Route path="/admin/results/:id" element={<QuizResults />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            <Route path="/responder/:id" element={<TakeQuiz />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
