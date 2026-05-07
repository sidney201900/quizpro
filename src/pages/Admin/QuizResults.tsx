import { useParams, useNavigate } from 'react-router-dom';
import { useQuizStore } from '../../store';
import { ArrowLeft, Download, FileText,   Users, CheckCircle2, ChevronDown } from 'lucide-react';
import * as xlsx from 'xlsx';
import { useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function QuizResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getSubmissionsByQuizId = useQuizStore((state) => state.getSubmissionsByQuizId);
  const quizzes = useQuizStore((state) => state.quizzes);
  const settings = useQuizStore((state) => state.settings);
  const quiz = quizzes.find((q) => q.id === id);
  const submissions = quiz ? getSubmissionsByQuizId(quiz.id) : [];

  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [filterFieldId, setFilterFieldId] = useState<string>(
    settings?.customFields && settings.customFields.length > 0 
      ? settings.customFields.find(f => f.name.toLowerCase().includes('turma'))?.id || settings.customFields[0].id
      : 'classRoom'
  );
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>('all');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!quiz) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900">Quiz não encontrado</h2>
        <button onClick={() => navigate('/admin')} className="mt-4 text-indigo-600 hover:underline">Voltar ao painel</button>
      </div>
    );
  }

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExportingPDF(true);
    
    try {
      const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
      await wait(300); // Allow react rendering or layout shifts to settle
      
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`relatorio_${quiz.title.replace(/\s+/g, '_')}_${filterFieldId}_${selectedFilterValue}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExport = () => {
    const data = submissions.map(sub => {
      const row: any = {};
      
      if (settings?.customFields) {
         settings.customFields.forEach(f => {
           row[f.name] = sub.studentInfo[f.id] || '';
         });
      } else {
        row['Nome'] = sub.studentInfo.name;
        row['Nascimento'] = sub.studentInfo.birthDate;
        row['Escola'] = sub.studentInfo.school;
        row['Série'] = sub.studentInfo.grade;
        row['Turma'] = sub.studentInfo.classRoom;
        row['Turno'] = sub.studentInfo.shift;
      }
      
      row['Data Resposta'] = new Date(sub.submittedAt).toLocaleString();

      quiz.questions.forEach((q, index) => {
        const answer = sub.answers.find(a => a.questionId === q.id);
        if (q.type === 'multiple_choice' || q.type === 'survey') {
          const selectedOpt = q.options?.find(o => o.id === answer?.selectedOptionId);
          row[`Q${index + 1} (${q.type === 'survey' ? 'Enquete' : 'Multipla'})`] = selectedOpt ? selectedOpt.text : 'Não respondida';
          if (q.type === 'multiple_choice') {
            row[`Q${index + 1} Correta?`] = answer?.selectedOptionId === q.correctOptionId ? 'Sim' : 'Não';
          }
        } else {
          row[`Q${index + 1} (Aberta)`] = answer?.answerText || 'Não respondida';
        }
      });

      return row;
    });

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Resultados");
    xlsx.writeFile(wb, `resultados_${quiz.title.replace(/\s+/g, '_')}.xlsx`);
  };

  // Available fields for filtering
  const availableFilterFields = settings?.customFields || [
    { id: 'classRoom', name: 'Turma' },
    { id: 'shift', name: 'Turno' },
    { id: 'grade', name: 'Série' },
    { id: 'school', name: 'Escola' }
  ];

  // Stats for charts
  const filterValues = Array.from(new Set(submissions.map(s => s.studentInfo[filterFieldId] || '-'))).sort();
  const filteredSubmissions = selectedFilterValue === 'all' 
    ? submissions 
    : submissions.filter(s => (s.studentInfo[filterFieldId] || '-') === selectedFilterValue);

  const multipleChoiceQuestions = quiz.questions.filter(q => q.type === 'multiple_choice');
  const surveyQuestions = quiz.questions.filter(q => q.type === 'survey');
  const totalSubmissions = submissions.length;
  const totalFilteredSubmissions = filteredSubmissions.length;

  const chartColors = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']; // Extended colors

  return (
    <div className="max-w-6xl mx-auto" ref={reportRef}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" data-html2canvas-ignore>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{quiz.title}</h1>
            <p className="text-gray-500">Resultados e Estatísticas</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto gap-3" data-html2canvas-ignore>
          <button
            onClick={handleExportPDF}
            disabled={submissions.length === 0 || isExportingPDF}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5" />
            {isExportingPDF ? 'Gerando...' : 'Exportar PDF'}
          </button>
          <button
            onClick={handleExport}
            disabled={submissions.length === 0}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-gray-500 font-medium text-sm">Total Geral (Quiz)</p>
            <p className="text-3xl font-bold text-gray-900">{totalSubmissions}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left justify-between md:col-span-2 gap-4">
           <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 w-full flex flex-col items-center sm:items-start">
                 <p className="text-gray-500 font-medium text-sm">
                   Filtrando: {selectedFilterValue === 'all' ? 'Ver Todos' : `${availableFilterFields.find(f => f.id === filterFieldId)?.name}: ${selectedFilterValue}`}
                 </p>
                 <p className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">{totalFilteredSubmissions} {totalFilteredSubmissions === 1 ? 'resposta' : 'respostas'}</p>
              </div>
           </div>
           
           <div className="w-full sm:w-auto mt-4 sm:mt-0 flex flex-col sm:flex-row items-center gap-3">
             <div className="flex flex-col items-center sm:items-end">
               <label className="block text-sm font-medium text-gray-700 mb-1">Agrupar por</label>
               <select 
                 value={filterFieldId} 
                 onChange={(e) => {
                   setFilterFieldId(e.target.value);
                   setSelectedFilterValue('all');
                 }}
                 className="w-40 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300 bg-white text-sm"
               >
                 {availableFilterFields.map(f => (
                   <option key={f.id} value={f.id}>{f.name}</option>
                 ))}
               </select>
             </div>
             <div className="flex flex-col items-center sm:items-end">
               <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar Valor</label>
               <select 
                 value={selectedFilterValue} 
                 onChange={(e) => setSelectedFilterValue(e.target.value)}
                 className="w-48 px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300 bg-white text-sm"
               >
                 <option value="all">Forma Geral (Todos)</option>
                 {filterValues.map(c => (
                   <option key={c} value={c}>{c}</option>
                 ))}
               </select>
             </div>
           </div>
        </div>
      </div>

      {totalFilteredSubmissions > 0 && surveyQuestions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Resultados da Enquete / Pesquisa (Sem certa)</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {surveyQuestions.map((q, qIndex) => {
               const counts: Record<string, number> = {};
               q.options?.forEach(opt => counts[opt.id] = 0);
               let noneCount = 0;

               filteredSubmissions.forEach(sub => {
                 const currentAns = sub.answers.find(a => a.questionId === q.id);
                 if (currentAns?.selectedOptionId && counts[currentAns.selectedOptionId] !== undefined) {
                   counts[currentAns.selectedOptionId]++;
                 } else {
                   noneCount++;
                 }
               });
               
               const barData = q.options?.map(opt => ({
                 name: opt.text.length > 20 ? opt.text.substring(0, 20) + '...' : opt.text,
                 fullName: opt.text,
                 Votos: counts[opt.id]
               })) || [];

               return (
                 <div key={q.id} className="flex flex-col items-center">
                   <p className="text-sm font-medium text-gray-600 text-center mb-4 line-clamp-2 h-10 w-full">
                     Q{quiz.questions.indexOf(q) + 1}. {q.text}
                   </p>
                   <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                         <XAxis type="number" allowDecimals={false} />
                         <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                         <Tooltip formatter={(value: number) => [`${value} votos`, 'Quantidade']} />
                         <Bar dataKey="Votos" fill="#8b5cf6" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                           {barData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                           ))}
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               )
            })}
          </div>
        </div>
      )}

      {totalFilteredSubmissions > 0 && multipleChoiceQuestions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Taxa de Acerto por Questão (Múltipla Escolha)</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {multipleChoiceQuestions.map((q, qIndex) => {
               let correct = 0;
               let wrong = 0;
               filteredSubmissions.forEach(sub => {
                 const currentAns = sub.answers.find(a => a.questionId === q.id);
                 if (currentAns?.selectedOptionId === q.correctOptionId) {
                   correct++;
                 } else {
                   wrong++;
                 }
               });
               
               const pieData = [
                 { name: 'Acertos', value: correct },
                 { name: 'Erros', value: wrong }
               ];

               return (
                 <div key={q.id} className="flex flex-col items-center">
                   <p className="text-sm font-medium text-gray-600 text-center mb-2 line-clamp-2 h-10">
                     Q{quiz.questions.indexOf(q) + 1}. {q.text}
                   </p>
                   <div className="h-48 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={pieData}
                           cx="50%"
                           cy="50%"
                           innerRadius={40}
                           outerRadius={60}
                           paddingAngle={5}
                           dataKey="value"
                           isAnimationActive={false}
                         >
                           {pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                           ))}
                         </Pie>
                         <Tooltip />
                         <Legend />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               )
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Respostas Detalhadas</h2>
        </div>
        
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhuma resposta registrada ainda.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {submissions.map((sub) => (
              <div key={sub.id} className="p-4">
                <div 
                  className="flex justify-between items-center cursor-pointer hover:bg-gray-50/50 p-2 rounded-lg transition-colors"
                  onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
                >
                  <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
                    {settings?.customFields ? (
                      <>
                        {settings.customFields.slice(0, 3).map((f, idx) => (
                           <span key={f.id} className={idx === 0 ? "font-semibold text-gray-900 min-w-32 max-w-48 truncate" : "text-sm text-gray-500"}>
                             {idx !== 0 && `${f.name}: `}{sub.studentInfo[f.id] || '-'}
                           </span>
                        ))}
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-gray-900 min-w-32 max-w-48 truncate">{sub.studentInfo.name}</span>
                        <span className="text-sm text-gray-500 min-w-24">Série: {sub.studentInfo.grade || '-'}</span>
                        <span className="text-sm text-gray-500 min-w-24">Turma: {sub.studentInfo.classRoom || '-'}</span>
                      </>
                    )}
                    <span className="text-sm text-gray-400">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSub === sub.id ? 'rotate-180' : ''}`} />
                </div>
                
                {expandedSub === sub.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 px-2 pl-6 pb-4">
                    <div className="space-y-6">
                      {quiz.questions.map((q, i) => {
                        const answer = sub.answers.find(a => a.questionId === q.id);
                        const isCorrect = q.type === 'multiple_choice' && answer?.selectedOptionId === q.correctOptionId;
                        return (
                          <div key={q.id}>
                            <p className="font-medium text-gray-800 mb-2">{i + 1}. {q.text}</p>
                            {q.type === 'open_ended' ? (
                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-gray-700 whitespace-pre-wrap">{answer?.answerText || <span className="text-gray-400 italic">Não respondido</span>}</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {q.options?.map(opt => {
                                  const isSelected = answer?.selectedOptionId === opt.id;
                                  const isCorrectOpt = q.type === 'multiple_choice' && q.correctOptionId === opt.id;
                                  const isSurvey = q.type === 'survey';
                                  
                                  return (
                                    <div 
                                      key={opt.id} 
                                      className={`p-2 rounded-lg text-sm border flex justify-between items-center ${
                                        isSurvey && isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-medium' :
                                        !isSurvey && isSelected && isCorrectOpt ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium' :
                                        !isSurvey && isSelected && !isCorrectOpt ? 'bg-red-50 border-red-200 text-red-800 font-medium' :
                                        !isSurvey && !isSelected && isCorrectOpt ? 'bg-gray-50 border-emerald-400 border-dashed text-gray-700' :
                                        'bg-white border-transparent text-gray-600'
                                      }`}
                                    >
                                      <span>{opt.text}</span>
                                      {isSelected && <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-black/5 opacity-70">Sua Resposta</span>}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
