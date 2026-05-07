import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuizStore } from '../../store';
import { StudentInfo, AnswerItem } from '../../types';
import { Send, UserCircle2 } from 'lucide-react';

export default function TakeQuiz() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quizzes = useQuizStore((state) => state.quizzes);
  const addSubmission = useQuizStore((state) => state.addSubmission);
  
  // Use settings or fallback to static defaults
  const settings = useQuizStore((state) => state.settings) || {
    logoUrl: '',
    schools: [],
    shifts: ['Manhã', 'Tarde', 'Noite', 'Integral'],
    grades: [],
    classes: [],
  };
  
  const quiz = quizzes.find((q) => q.slug === id || q.id === id);

  const [step, setStep] = useState<'quiz' | 'success'>('quiz');
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({});

  const [currentIndex, setCurrentIndex] = useState(-1);

  const [answers, setAnswers] = useState<AnswerItem[]>([]);

  useEffect(() => {
    if (quiz && answers.length === 0) {
      setAnswers(quiz.questions.map(q => ({ questionId: q.id })));
    }
  }, [quiz]);

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz não encontrado</h1>
        <p className="text-gray-500 mb-8">Verifique o link fornecido pelo seu professor.</p>
        <button onClick={() => navigate('/')} className="text-indigo-600 hover:underline">Voltar para Início</button>
      </div>
    );
  }

  const handleAnswerChange = (questionId: string, value: string, isMultipleChoice: boolean) => {
    setAnswers(prev => prev.map(ans => {
      if (ans.questionId === questionId) {
        if (isMultipleChoice) {
          return { ...ans, selectedOptionId: value };
        } else {
          return { ...ans, answerText: value };
        }
      }
      return ans;
    }));
  };

  const handleNext = () => {
    if (currentIndex === -1) {
      if (settings.customFields) {
        const missing = settings.customFields.filter(f => f.required && !studentInfo[f.id]);
        if (missing.length > 0) {
          alert(`Por favor, preencha os campos obrigatórios:\n${missing.map(m => m.name).join(', ')}`);
          return;
        }
      } else {
        if (!studentInfo.name || !studentInfo.birthDate || !studentInfo.school || !studentInfo.grade || !studentInfo.classRoom || !studentInfo.shift) {
           alert("Por favor, preencha todos os campos da identificação.");
           return;
        }
      }
      setCurrentIndex(0);
    } else {
      const q = quiz.questions[currentIndex];
      const ans = answers.find(a => a.questionId === q.id);
      if (!ans || (!ans.answerText && !ans.selectedOptionId)) {
        alert("Por favor, responda a questão antes de avançar.");
        return;
      }
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentIndex(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    
    // Check if the current (last) question is answered
    if (currentIndex >= 0 && currentIndex < quiz.questions.length) {
      const q = quiz.questions[currentIndex];
      const ans = answers.find(a => a.questionId === q.id);
      if (!ans || (!ans.answerText && !ans.selectedOptionId)) {
        alert("Por favor, responda a questão antes de finalizar.");
        return;
      }
    }

    addSubmission({
      quizId: quiz.id,
      studentInfo,
      answers,
    });
    setStep('success');
  };

  if (step === 'success') {
    return (
       <div className="max-w-md mx-auto text-center py-20">
         <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 text-emerald-600" />
         </div>
         <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Enviado!</h2>
         <p className="text-gray-500 mb-8">Suas respostas foram salvas com sucesso. Boa sorte!</p>
       </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4 sm:px-0 pt-10">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 text-center">
        {settings.logoUrl && (
          <img src={settings.logoUrl} alt="Logo" className="h-20 md:h-24 object-contain mx-auto mb-6" />
        )}
        <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">{quiz.title}</h1>
        <p className="text-gray-500">{quiz.description}</p>
      </div>

      {currentIndex === -1 ? (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <UserCircle2 className="w-7 h-7 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Sua Identificação</h2>
          </div>
          
          <div className="space-y-5">
            {settings.customFields ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.customFields.map((field) => (
                  <div key={field.id} className={field.type === 'text' || field.type === 'date' ? "col-span-1 md:col-span-2" : "col-span-1"}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.name} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select 
                        required={field.required}
                        value={studentInfo[field.id] || ''}
                        onChange={e => setStudentInfo({ ...studentInfo, [field.id]: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300 bg-white"
                      >
                        <option value="" disabled>Selecione...</option>
                        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : field.type === 'radio' ? (
                      <div className="flex flex-wrap gap-4 mt-2">
                        {field.options?.map(o => (
                          <label key={o} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="radio" 
                              required={field.required && !studentInfo[field.id]} 
                              name={`cf_${field.id}`} 
                              value={o} 
                              checked={studentInfo[field.id] === o} 
                              onChange={e => setStudentInfo({ ...studentInfo, [field.id]: e.target.value })} 
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <span className="text-gray-700">{o}</span>
                          </label>
                        ))}
                      </div>
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 cursor-pointer mt-2">
                        <input 
                          type="checkbox" 
                          required={field.required} 
                          checked={studentInfo[field.id] === 'true'} 
                          onChange={e => setStudentInfo({ ...studentInfo, [field.id]: e.target.checked ? 'true' : '' })} 
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-gray-700">Sim, eu concordo / confirmo</span>
                      </label>
                    ) : (
                      <input 
                        required={field.required} 
                        type={field.type === 'date' ? 'date' : 'text'} 
                        value={studentInfo[field.id] || ''} 
                        onChange={e => setStudentInfo({ ...studentInfo, [field.id]: e.target.value })} 
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300"
                        placeholder={`Digite ${field.name.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input required type="text" value={studentInfo.name || ''} onChange={e => setStudentInfo({...studentInfo, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300" placeholder="Ex: João da Silva"/>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Nasc.</label>
                    <input required type="date" value={studentInfo.birthDate || ''} onChange={e => setStudentInfo({...studentInfo, birthDate: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                    {settings.shifts && settings.shifts.length > 0 ? (
                      <select required value={studentInfo.shift || ''} onChange={e => setStudentInfo({...studentInfo, shift: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300 bg-white">
                        <option value="" disabled>Selecione...</option>
                        {settings.shifts.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input required type="text" value={studentInfo.shift || ''} onChange={e => setStudentInfo({...studentInfo, shift: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300" placeholder="Ex: Manhã"/>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Escola</label>
                  {settings.schools && settings.schools.length > 0 ? (
                    <select required value={studentInfo.school || ''} onChange={e => setStudentInfo({...studentInfo, school: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300 bg-white">
                      <option value="" disabled>Selecione...</option>
                      {settings.schools.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input required type="text" value={studentInfo.school || ''} onChange={e => setStudentInfo({...studentInfo, school: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300" placeholder="Nome da Escola"/>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Série/Ano</label>
                    {settings.grades && settings.grades.length > 0 ? (
                      <select required value={studentInfo.grade || ''} onChange={e => setStudentInfo({...studentInfo, grade: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300 bg-white">
                        <option value="" disabled>Selecione...</option>
                        {settings.grades.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input required type="text" value={studentInfo.grade || ''} onChange={e => setStudentInfo({...studentInfo, grade: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300" placeholder="Ex: 8º Ano"/>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
                    {settings.classes && settings.classes.length > 0 ? (
                      <select required value={studentInfo.classRoom || ''} onChange={e => setStudentInfo({...studentInfo, classRoom: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300 bg-white">
                        <option value="" disabled>Selecione...</option>
                        {settings.classes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input required type="text" value={studentInfo.classRoom || ''} onChange={e => setStudentInfo({...studentInfo, classRoom: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300" placeholder="Ex: A"/>
                    )}
                  </div>
                </div>
              </>
            )}
            
            <div className="pt-4 flex justify-end">
              <button 
                type="button" 
                onClick={handleNext}
                className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-full hover:bg-indigo-700 transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {(() => {
             const q = quiz.questions[currentIndex];
             if (!q) return null;
             const answer = answers.find(a => a.questionId === q.id);

             return (
               <div key={q.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
                 <h3 className="text-lg font-semibold text-gray-900 mb-6">
                   <span className="text-indigo-600 mr-2">{currentIndex + 1}.</span> {q.text}
                 </h3>
                 
                 {(q.type === 'multiple_choice' || q.type === 'survey') ? (
                   <div className="space-y-3">
                     {q.options?.map(opt => (
                       <label 
                         key={opt.id} 
                         className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                           answer?.selectedOptionId === opt.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'
                         }`}
                       >
                         <input 
                           type="radio" 
                           name={`q_${q.id}`} 
                           value={opt.id}
                           checked={answer?.selectedOptionId === opt.id}
                           onChange={() => handleAnswerChange(q.id, opt.id, true)}
                           className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-600"
                         />
                         <span className="text-gray-800">{opt.text}</span>
                       </label>
                     ))}
                   </div>
                 ) : (
                   <div>
                     <textarea 
                       rows={5}
                       value={answer?.answerText || ''}
                       onChange={(e) => handleAnswerChange(q.id, e.target.value, false)}
                       placeholder="Digite sua resposta aqui..."
                       className="w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:border-indigo-600 transition-all resize-y"
                     />
                   </div>
                 )}
               </div>
             )
          })()}
        </div>
      )}

      {currentIndex >= 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <div className="max-w-3xl mx-auto flex justify-between items-center gap-4">
            <button 
              type="button" 
              onClick={handlePrev}
              className="bg-gray-100 text-gray-700 font-bold px-6 py-3 rounded-full hover:bg-gray-200 transition-colors"
            >
              Voltar
            </button>
            <p className="text-sm font-medium text-gray-500 hidden md:block">
              Questão {currentIndex + 1} de {quiz.questions.length}
            </p>
            
            {currentIndex === quiz.questions.length - 1 ? (
              <button 
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-8 py-3 rounded-full hover:bg-indigo-700 transition-colors justify-center"
              >
                Finalizar e Enviar
                <Send className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleNext}
                className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-full hover:bg-indigo-700 transition-colors"
              >
                Próximo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
