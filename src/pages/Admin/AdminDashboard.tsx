import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BarChart3, Trash2, Link as LinkIcon, FileText, Settings, X, Check } from 'lucide-react';
import { useQuizStore } from '../../store';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const quizzes = useQuizStore((state) => state.quizzes);
  const deleteQuiz = useQuizStore((state) => state.deleteQuiz);
  const submissions = useQuizStore((state) => state.submissions);

  const [activeTab, setActiveTab] = useState<'quizzes' | 'responses'>('quizzes');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<string | null>(null);
  const settings = useQuizStore((state) => state.settings);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyLink = (quizId: string, customSlug?: string) => {
    const idToUse = customSlug || quizId;
    const url = `${window.location.origin}/responder/${idToUse}`;
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => showToast('Link copiado com sucesso!'));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('Link copiado com sucesso!');
      } catch (err) {
        showToast('Link: ' + url);
      }
      textArea.remove();
    }
  };

  const confirmDelete = (id: string) => {
    deleteQuiz(id);
    setDeleteModalOpen(null);
    showToast('Quiz excluído.');
  };

  return (
    <div>
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5">
           <Check className="w-5 h-5 text-emerald-400" />
           {toastMessage}
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
             <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Quiz?</h3>
             <p className="text-gray-500 mb-6">Tem certeza? Esta ação é irreversível e apagará todas as respostas dos alunos também.</p>
             <div className="flex gap-3 justify-end">
               <button onClick={() => setDeleteModalOpen(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
               <button onClick={() => confirmDelete(deleteModalOpen)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Sim, Excluir</button>
             </div>
           </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Painel Administrativo</h1>
          <p className="text-gray-500 mt-2">Gerencie seus quizzes e acompanhe os resultados.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/create')}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors w-full sm:w-auto shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Novo Quiz
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-6 py-3 font-semibold text-sm transition-colors whitespace-nowrap border-b-2 ${
            activeTab === 'quizzes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Meus Quizzes
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={`px-6 py-3 font-semibold text-sm transition-colors whitespace-nowrap border-b-2 ${
            activeTab === 'responses' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Visualizar Respostas (Cards)
        </button>
      </div>

      {activeTab === 'quizzes' ? (
        quizzes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum quiz encontrado</h3>
            <p className="text-gray-500 mb-6 max-w-md text-center">
              Você ainda não criou nenhum questionário. Clique no botão acima para começar.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => {
              const subCount = submissions.filter((s) => s.quizId === quiz.id).length;
              
              return (
                <div key={quiz.id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{quiz.title}</h3>
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 whitespace-nowrap ml-3">
                      {quiz.questions.length} questões
                    </span>
                  </div>
                  
                  <p className="text-gray-500 text-sm mb-6 flex-1 line-clamp-3">
                    {quiz.description || 'Sem descrição'}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-700">
                      {subCount} respostas
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/admin/results/${quiz.id}`)}
                        title="Resultados"
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <BarChart3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/edit/${quiz.id}`)}
                        title="Editar"
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button
                        onClick={() => copyLink(quiz.id, quiz.slug)}
                        title="Copiar Link"
                        className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <LinkIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDeleteModalOpen(quiz.id)}
                        title="Excluir"
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Aba de Respostas (Cards) */
        <div className="space-y-10">
          {quizzes.length === 0 ? (
            <div className="text-center py-20 text-gray-500">Crie um quiz primeiro para ver as respostas aqui.</div>
          ) : (
            quizzes.map((quiz) => {
              const quizSubmissions = submissions.filter(s => s.quizId === quiz.id).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
              
              return (
                <div key={quiz.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-indigo-900 px-6 py-4 flex justify-between items-center text-white">
                    <div>
                      <h3 className="font-bold text-lg">{quiz.title}</h3>
                      <p className="text-indigo-200 text-xs">Total de {quizSubmissions.length} respostas registradas</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/admin/results/${quiz.id}`)}
                      className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Ver Relatório Completo
                    </button>
                  </div>
                  
                  <div className="p-6">
                    {quizSubmissions.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 italic text-sm">Ninguém respondeu este quiz ainda.</div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {quizSubmissions.map((sub) => (
                          <div key={sub.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <span className="font-bold text-gray-900 truncate pr-2">
                                {sub.studentInfo.name || sub.studentInfo[settings?.customFields?.[0]?.id || ''] || 'Aluno Anônimo'}
                              </span>
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                                {new Date(sub.submittedAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="space-y-1 mb-4">
                              {settings?.customFields?.slice(0, 3).map(f => (
                                <p key={f.id} className="text-xs text-gray-500 truncate">
                                  <span className="font-medium text-gray-700">{f.name}:</span> {sub.studentInfo[f.id] || '-'}
                                </p>
                              ))}
                              {!settings?.customFields && (
                                <>
                                  <p className="text-xs text-gray-500 truncate"><span className="font-medium text-gray-700">Turma:</span> {sub.studentInfo.classRoom || '-'}</p>
                                  <p className="text-xs text-gray-500 truncate"><span className="font-medium text-gray-700">Escola:</span> {sub.studentInfo.school || '-'}</p>
                                </>
                              )}
                            </div>
                            
                            <button 
                              onClick={() => navigate(`/admin/results/${quiz.id}`)}
                              className="w-full py-2 bg-white border border-gray-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
                            >
                              Ver Respostas Detalhadas
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  );
}
