import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuizStore } from '../../store';
import { Question, Option, QuestionType } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const addQuiz = useQuizStore((state) => state.addQuiz);
  const updateQuiz = useQuizStore((state) => state.updateQuiz);
  const quizzes = useQuizStore((state) => state.quizzes);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (isEditing) {
      const quizToEdit = quizzes.find(q => q.id === id);
      if (quizToEdit) {
        setTitle(quizToEdit.title);
        setDescription(quizToEdit.description);
        setSlug(quizToEdit.slug || '');
        setQuestions(quizToEdit.questions);
      } else {
        navigate('/admin');
      }
    }
  }, [id, isEditing, quizzes, navigate]);

  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: uuidv4(),
      type,
      text: '',
      options: (type === 'multiple_choice' || type === 'survey') ? [
        { id: uuidv4(), text: '' },
        { id: uuidv4(), text: '' },
      ] : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleQuestionTextChange = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  // For multiple choice
  const handleAddOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && (q.type === 'multiple_choice' || q.type === 'survey')) {
        return {
          ...q,
          options: [...(q.options || []), { id: uuidv4(), text: '' }]
        };
      }
      return q;
    }));
  };

  const handleOptionTextChange = (questionId: string, optionId: string, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return {
          ...q,
          options: q.options.map(opt => opt.id === optionId ? { ...opt, text } : opt)
        };
      }
      return q;
    }));
  };

  const handleSetCorrectOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return { ...q, correctOptionId: optionId };
      }
      return q;
    }));
  };

  const handleDeleteOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return {
          ...q,
          options: q.options.filter(opt => opt.id !== optionId)
        };
      }
      return q;
    }));
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMsg('Por favor, insira um título para o quiz.');
      return;
    }
    if (questions.length === 0) {
      setErrorMsg('Por favor, adicione pelo menos uma questão.');
      return;
    }

    // Validation
    for (const q of questions) {
      if (!q.text.trim()) {
        setErrorMsg('Todas as questões devem ter um enunciado.');
        return;
      }
      if (q.type === 'multiple_choice' || q.type === 'survey') {
        if (!q.options || q.options.length < 2) {
          setErrorMsg('Questões de múltipla escolha e enquete devem ter pelo menos duas opções.');
          return;
        }
        if (q.type === 'multiple_choice' && !q.correctOptionId) {
          setErrorMsg('Selecione a resposta correta para as questões de múltipla escolha.');
          return;
        }
        for (const opt of q.options) {
          if (!opt.text.trim()) {
            setErrorMsg('Todas as opções devem ter um texto.');
            return;
          }
        }
      }
    }

    if (slug.trim() && !/^[a-zA-Z0-9_-]+$/.test(slug.trim())) {
      setErrorMsg('O link personalizado só pode conter letras, números, hífen e underline.');
      return;
    }

    const quizzesState = useQuizStore.getState().quizzes;
    if (slug.trim() && quizzesState.some(q => q.slug === slug.trim() && q.id !== id)) {
      setErrorMsg('Esse link personalizado já está em uso por outro quiz.');
      return;
    }

    setErrorMsg(null);
    if (isEditing && id) {
      updateQuiz(id, { title, description, slug: slug.trim() || undefined, questions });
    } else {
      addQuiz({ title, description, slug: slug.trim() || undefined, questions });
    }
    navigate('/admin');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{isEditing ? 'Editar Quiz' : 'Criar Novo Quiz'}</h1>
      </div>

      {errorMsg && (
        <div className="mb-6 bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg font-medium">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
              Título do Quiz
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Prova de História - 1º Bimestre"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="slug">
              Link Personalizado (Opcional)
            </label>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-600 focus-within:border-indigo-600 transition-all">
              <span className="bg-gray-50 text-gray-500 px-3 py-2 border-r border-gray-300 flex items-center text-sm">
                .../responder/
              </span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                placeholder="Ex: prova-historia-1bim"
                className="flex-1 px-4 py-2 outline-none w-full"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Deixe em branco para usar um link aleatório.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
              Descrição (Opcional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruções adicionais para os alunos..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative group">
            <button
              onClick={() => handleDeleteQuestion(q.id)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Excluir Questão"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                {index + 1}
              </span>
              <h3 className="font-semibold text-gray-900">
                {q.type === 'multiple_choice' ? 'Múltipla Escolha' : q.type === 'survey' ? 'Enquete / Pesquisa' : 'Aberta (Dissertativa)'}
              </h3>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={q.text}
                onChange={(e) => handleQuestionTextChange(q.id, e.target.value)}
                placeholder="Digite o enunciado da questão..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-lg transition-all"
              />
            </div>

            { (q.type === 'multiple_choice' || q.type === 'survey') && (
              <div className="space-y-3 pl-11">
                {q.options?.map((opt, optIndex) => (
                  <div key={opt.id} className="flex items-center gap-3 relative group/opt">
                    {q.type === 'multiple_choice' ? (
                      <button
                        onClick={() => handleSetCorrectOption(q.id, opt.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          q.correctOptionId === opt.id 
                            ? 'border-emerald-500 bg-emerald-500 text-white' 
                            : 'border-gray-300 hover:border-emerald-400 bg-white'
                        }`}
                        title="Marcar como correta"
                      >
                        {q.correctOptionId === opt.id && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ) : (
                       <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 bg-gray-50 flex items-center justify-center"></div>
                    )}
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionTextChange(q.id, opt.id, e.target.value)}
                      placeholder={`Opção ${optIndex + 1}`}
                      className={`flex-1 px-4 py-2 border rounded-lg outline-none transition-all ${
                        q.correctOptionId === opt.id ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                      }`}
                    />
                    <button
                      onClick={() => handleDeleteOption(q.id, opt.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover/opt:opacity-100"
                      disabled={q.options && q.options.length <= 2}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => handleAddOption(q.id)}
                  className="flex items-center gap-2 text-sm text-indigo-600 font-medium mt-4 hover:text-indigo-800"
                >
                  <Plus className="w-4 h-4" /> Adicionar Opção
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8 justify-center flex-wrap">
        <button
          onClick={() => handleAddQuestion('multiple_choice')}
          className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 px-4 py-2 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" /> Questão Múltipla Escolha
        </button>
        <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
        <button
          onClick={() => handleAddQuestion('survey')}
          className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 px-4 py-2 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" /> Enquete / Pesquisa (Sem certa)
        </button>
        <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
        <button
          onClick={() => handleAddQuestion('open_ended')}
          className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 px-4 py-2 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" /> Questão Aberta
        </button>
      </div>

      <div className="flex justify-end sticky bottom-6 z-20">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-full hover:bg-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all"
        >
          <Save className="w-5 h-5" />
          Salvar Quiz e Publicar
        </button>
      </div>
    </div>
  );
}
