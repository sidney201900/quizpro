import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuizStore } from '../../store';
import { ArrowLeft, Download, FileText,   Users, CheckCircle2, ChevronDown } from 'lucide-react';
import * as xlsx from 'xlsx';
import { useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';

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
  
  // Modal de Exportação
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel'>('pdf');
  const [tempFilterFieldId, setTempFilterFieldId] = useState(filterFieldId);
  const [tempSelectedFilterValue, setTempSelectedFilterValue] = useState(selectedFilterValue);

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
    setFilterFieldId(tempFilterFieldId);
    setSelectedFilterValue(tempSelectedFilterValue);
    setIsExportModalOpen(false);
    
    setIsExportingPDF(true);
    
    try {
      const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
      await wait(500); 
      
      const pdf = new jsPDF('l', 'pt', 'a4'); // Paisagem para caber as colunas
      const pageWidth = pdf.internal.pageSize.getWidth();
      let currentY = 40;

      pdf.setFontSize(18);
      pdf.setTextColor(31, 41, 55);
      pdf.text(quiz.title, pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;
      
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Relatório de Resultados - ${tempSelectedFilterValue === 'all' ? 'Geral' : tempSelectedFilterValue}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 30;

      const targetSubmissions = tempSelectedFilterValue === 'all' 
        ? submissions 
        : submissions.filter(s => (s.studentInfo[tempFilterFieldId] || '-') === tempSelectedFilterValue);

      const tableColumn = [];
      tableColumn.push('Aluno');
      if (settings?.customFields) {
         settings.customFields.forEach(f => tableColumn.push(f.name));
      } else {
        tableColumn.push('Turma', 'Escola');
      }
      tableColumn.push('Data');
      quiz.questions.forEach((q, i) => tableColumn.push(`Q${i + 1}`));

      const tableRows = targetSubmissions.map(sub => {
        const rowData = [];
        rowData.push(sub.studentInfo.name || sub.studentInfo[settings?.customFields?.[0]?.id || ''] || 'Anônimo');
        if (settings?.customFields) {
           settings.customFields.forEach(f => rowData.push(sub.studentInfo[f.id] || '-'));
        } else {
          rowData.push(sub.studentInfo.classRoom || '-', sub.studentInfo.school || '-');
        }
        rowData.push(new Date(sub.submittedAt).toLocaleDateString());

        quiz.questions.forEach((q) => {
          const answer = sub.answers.find(a => a.questionId === q.id);
          if (q.type === 'multiple_choice' || q.type === 'survey') {
            const selectedOpt = q.options?.find(o => o.id === answer?.selectedOptionId);
            let text = selectedOpt ? selectedOpt.text : '-';
            if (q.type === 'multiple_choice') {
              const isCorrect = answer?.selectedOptionId === q.correctOptionId;
              text += isCorrect ? ' (Certo)' : ' (Erro)';
            }
            rowData.push(text.length > 25 ? text.substring(0, 25) + '...' : text);
          } else {
            const t = answer?.answerText || '-';
            rowData.push(t.length > 25 ? t.substring(0, 25) + '...' : t);
          }
        });
        return rowData;
      });

      autoTable(pdf, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [79, 70, 229] },
        margin: { top: 40, right: 20, bottom: 40, left: 20 },
      });

      const chartsContainer = document.getElementById('pdf-charts-container');
      if (chartsContainer) {
        // html-to-image usa SVG nativo do navegador, suportando oklch nativamente sem erros de parse
        const imgData = await toPng(chartsContainer, { 
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });
        
        const finalY = (pdf as any).lastAutoTable.finalY || currentY;
        const chartPdfWidth = pdf.internal.pageSize.getWidth() - 40;
        const chartPdfHeight = (chartsContainer.offsetHeight * chartPdfWidth) / chartsContainer.offsetWidth;
        
        if (finalY + chartPdfHeight + 20 > pdf.internal.pageSize.getHeight()) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 20, 40, chartPdfWidth, chartPdfHeight);
        } else {
          pdf.addImage(imgData, 'PNG', 20, finalY + 20, chartPdfWidth, chartPdfHeight);
        }
      }

      pdf.save(`relatorio_${quiz.title.replace(/\s+/g, '_')}_${tempSelectedFilterValue}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = () => {
    setFilterFieldId(tempFilterFieldId);
    setSelectedFilterValue(tempSelectedFilterValue);
    setIsExportModalOpen(false);

    // Filter subsmissions based on modal selection for Excel too
    const targetSubmissions = tempSelectedFilterValue === 'all' 
      ? submissions 
      : submissions.filter(s => (s.studentInfo[tempFilterFieldId] || '-') === tempSelectedFilterValue);

    const data = targetSubmissions.map(sub => {
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

  const ChartsSection = () => (
    <div className="space-y-8 mt-8">
      {totalFilteredSubmissions > 0 && surveyQuestions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Resultados da Enquete / Pesquisa (Sem certa)</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {surveyQuestions.map((q, qIndex) => {
               const counts: Record<string, number> = {};
               q.options?.forEach(opt => counts[opt.id] = 0);
               filteredSubmissions.forEach(sub => {
                 const currentAns = sub.answers.find(a => a.questionId === q.id);
                 if (currentAns?.selectedOptionId && counts[currentAns.selectedOptionId] !== undefined) {
                   counts[currentAns.selectedOptionId]++;
                 }
               });
               const barData = q.options?.map(opt => ({
                 name: opt.text.length > 20 ? opt.text.substring(0, 20) + '...' : opt.text,
                 Votos: counts[opt.id]
               })) || [];
               return (
                 <div key={q.id} className="flex flex-col items-center">
                   <p className="text-sm font-medium text-gray-600 text-center mb-4 h-10 w-full line-clamp-2">Q{quiz.questions.indexOf(q) + 1}. {q.text}</p>
                   <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={barData} layout="vertical">
                         <XAxis type="number" allowDecimals={false} />
                         <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                         <Tooltip />
                         <Bar dataKey="Votos" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                           {barData.map((entry, index) => <Cell key={`c-${index}`} fill={chartColors[index % chartColors.length]} />)}
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Taxa de Acerto por Questão</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {multipleChoiceQuestions.map((q, qIndex) => {
               let correct = 0;
               let wrong = 0;
               filteredSubmissions.forEach(sub => {
                 const currentAns = sub.answers.find(a => a.questionId === q.id);
                 if (currentAns?.selectedOptionId === q.correctOptionId) correct++;
                 else wrong++;
               });
               const pieData = [{ name: 'Acertos', value: correct }, { name: 'Erros', value: wrong }];
               return (
                 <div key={q.id} className="flex flex-col items-center">
                   <p className="text-sm font-medium text-gray-600 text-center mb-2 line-clamp-2 h-10">Q{quiz.questions.indexOf(q) + 1}. {q.text}</p>
                   <div className="h-48 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" isAnimationActive={false}>
                           {pieData.map((entry, index) => <Cell key={`pc-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />)}
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
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto" ref={reportRef}>
      {/* Modal de Exportação */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4" data-html2canvas-ignore>
           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 {exportType === 'pdf' ? <FileText className="text-emerald-600" /> : <Download className="text-indigo-600" />}
                 Exportar Relatório ({exportType.toUpperCase()})
               </h3>
               <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                 <ArrowLeft className="w-5 h-5 rotate-90" />
               </button>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1.5">Agrupar por:</label>
                 <select 
                   value={tempFilterFieldId} 
                   onChange={(e) => {
                     setTempFilterFieldId(e.target.value);
                     setTempSelectedFilterValue('all');
                   }}
                   className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:border-indigo-500 border-gray-300 bg-gray-50 font-medium"
                 >
                   {availableFilterFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1.5">Escolher Valor (Filtro):</label>
                 <select 
                   value={tempSelectedFilterValue} 
                   onChange={(e) => setTempSelectedFilterValue(e.target.value)}
                   className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:border-indigo-500 border-gray-300 bg-gray-50 font-medium"
                 >
                   <option value="all">Todos os registros</option>
                   {Array.from(new Set(submissions.map(s => s.studentInfo[tempFilterFieldId] || '-'))).sort().map(c => (
                     <option key={c} value={c}>{c}</option>
                   ))}
                 </select>
               </div>

               <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-700 border border-blue-100 mt-4 leading-relaxed">
                 <p className="font-bold mb-1">Aviso:</p>
                 {exportType === 'pdf' 
                   ? "O PDF incluirá a lista detalhada de respostas seguida pelos gráficos estatísticos do filtro selecionado." 
                   : "O arquivo Excel conterá uma planilha com todos os dados dos alunos e suas respostas individuais."}
               </div>
             </div>

             <div className="flex gap-3 mt-8">
               <button 
                 onClick={() => setIsExportModalOpen(false)} 
                 className="flex-1 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-all"
               >
                 Cancelar
               </button>
               <button 
                 onClick={exportType === 'pdf' ? handleExportPDF : handleExportExcel}
                 className={`flex-1 py-3 text-white rounded-xl font-bold transition-all shadow-md ${exportType === 'pdf' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
               >
                 Gerar {exportType.toUpperCase()}
               </button>
             </div>
           </div>
        </div>
      )}

      {/* Logo da Instituição - aparece na tela e no PDF */}
      {settings?.logoUrl && (
        <div className="flex justify-center mb-6">
          <img src={settings.logoUrl} alt="Logo" className="h-20 object-contain" crossOrigin="anonymous" />
        </div>
      )}

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
            onClick={() => { setExportType('pdf'); setIsExportModalOpen(true); }}
            disabled={submissions.length === 0 || isExportingPDF}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5" />
            Exportar PDF
          </button>
          <button
            onClick={() => { setExportType('excel'); setIsExportModalOpen(true); }}
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

      {/* Gráficos na tela (apenas para visualização rápida, escondidos no PDF pois estarão no fim) */}
      <div data-html2canvas-ignore>
        <ChartsSection />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8" data-html2canvas-ignore={isExportingPDF ? false : undefined}>
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Lista Geral de Respostas</h2>
          <span className="text-sm text-gray-500">{filteredSubmissions.length} registros encontrados</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Aluno / Identificação</th>
                {settings?.customFields?.map(f => (
                  <th key={f.id} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{f.name}</th>
                )) || (
                  <>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Escola</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Turma</th>
                  </>
                )}
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-500">Nenhuma resposta encontrada para este filtro.</td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <React.Fragment key={sub.id}>
                    <tr className={`hover:bg-gray-50 transition-colors ${expandedSub === sub.id ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900 truncate max-w-[200px]">
                          {sub.studentInfo.name || sub.studentInfo[settings?.customFields?.[0]?.id || ''] || 'Sem Nome'}
                        </div>
                      </td>
                      {settings?.customFields ? (
                        settings.customFields.map(f => (
                          <td key={f.id} className="px-4 py-4 text-sm text-gray-600">
                            {sub.studentInfo[f.id] || '-'}
                          </td>
                        ))
                      ) : (
                        <>
                          <td className="px-4 py-4 text-sm text-gray-600">{sub.studentInfo.school || '-'}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{sub.studentInfo.classRoom || '-'}</td>
                        </>
                      )}
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-center" data-html2canvas-ignore>
                        <button 
                          onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
                          className={`p-1.5 rounded-lg transition-colors ${expandedSub === sub.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                        >
                          <ChevronDown className={`w-5 h-5 transition-transform ${expandedSub === sub.id ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    </tr>
                    {(expandedSub === sub.id || isExportingPDF) && (
                      <tr className={isExportingPDF ? '' : 'bg-gray-50/50'}>
                        <td colSpan={10} className="px-8 py-6">
                          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                              <FileText className="w-4 h-4" /> Respostas de {sub.studentInfo.name || 'Aluno'}
                            </h4>
                            <div className="space-y-6">
                              {quiz.questions.map((q, i) => {
                                const answer = sub.answers.find(a => a.questionId === q.id);
                                return (
                                  <div key={q.id} className="border-l-4 border-indigo-100 pl-4">
                                    <p className="font-semibold text-gray-800 mb-2">{i + 1}. {q.text}</p>
                                    {q.type === 'open_ended' ? (
                                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 italic text-gray-700">
                                        {answer?.answerText || "Não respondido"}
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        {q.options?.map(opt => {
                                          const isSelected = answer?.selectedOptionId === opt.id;
                                          const isCorrectOpt = q.type === 'multiple_choice' && q.correctOptionId === opt.id;
                                          return (
                                            <div 
                                              key={opt.id} 
                                              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                                                isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 
                                                isCorrectOpt ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
                                                'bg-white border-gray-200 text-gray-500'
                                              }`}
                                            >
                                              {opt.text} {isSelected && " (Selecionado)"}
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
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráficos no final do PDF (Renderizados apenas para captura se isExportingPDF) */}
      {(isExportingPDF) && (
        <div id="pdf-charts-container" className="mt-12 border-t pt-8 bg-white p-4">
           <div className="text-center mb-8">
             <h2 className="text-2xl font-bold text-indigo-900">Resumo Estatístico do Filtro</h2>
             <p className="text-gray-500">Filtrado por: {tempSelectedFilterValue === 'all' ? 'Geral' : tempSelectedFilterValue}</p>
           </div>
           <ChartsSection />
        </div>
      )}
    </div>
  );
}
