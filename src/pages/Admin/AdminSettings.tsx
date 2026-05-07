import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../../store';
import { ArrowLeft, Save, Trash2, Upload, Image as ImageIcon, Plus, GripVertical, Settings2, X } from 'lucide-react';
import { CustomField, FieldType } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const FIELD_TYPES: {value: FieldType, label: string}[] = [
  { value: 'text', label: 'Texto Curto' },
  { value: 'date', label: 'Data' },
  { value: 'select', label: 'Lista de Seleção' },
  { value: 'radio', label: 'Opções Abertas (Radio)' },
  { value: 'checkbox', label: 'Caixa de Confirmação' },
];

function CustomFieldsEditor({ 
  fields, 
  setFields 
}: { 
  fields: CustomField[], 
  setFields: (f: CustomField[]) => void 
}) {
  const [editingField, setEditingField] = useState<CustomField | null>(null);

  const handleAddField = () => {
    setEditingField({
      id: uuidv4(),
      name: 'Novo Campo',
      type: 'text',
      options: [],
      required: true,
    });
  };

  const handleSaveField = () => {
    if (editingField) {
      if (!editingField.name.trim()) return;
      const exists = fields.find(f => f.id === editingField.id);
      if (exists) {
        setFields(fields.map(f => f.id === editingField.id ? editingField : f));
      } else {
        setFields([...fields, editingField]);
      }
      setEditingField(null);
    }
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newFields = [...fields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      setFields(newFields);
    } else if (direction === 'down' && index < fields.length - 1) {
      const newFields = [...fields];
      [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
      setFields(newFields);
    }
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Campos de Identificação do Aluno</h3>
          <p className="text-sm text-gray-500">Defina quais informações o aluno deve preencher antes de iniciar o quiz.</p>
        </div>
        <button 
          onClick={handleAddField}
          className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar Campo
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {fields.length === 0 && (
           <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-gray-500">
             Nenhum campo definido. Clique em Adicionar Campo para criar.
           </div>
        )}
        {fields.map((f, idx) => (
          <div key={f.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl group hover:border-gray-300 transition-colors gap-4">
            <div className="flex items-center gap-4 w-full">
              <div className="flex flex-col gap-1 text-gray-400">
                <button onClick={() => handleMove(idx, 'up')} disabled={idx===0} className="hover:text-gray-700 disabled:opacity-30">▲</button>
                <button onClick={() => handleMove(idx, 'down')} disabled={idx===fields.length-1} className="hover:text-gray-700 disabled:opacity-30">▼</button>
              </div>
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 text-gray-500">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  {f.name}
                  {f.required && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Obrigatório</span>}
                </h4>
                <p className="text-sm text-gray-500">
                  {FIELD_TYPES.find(t => t.value === f.type)?.label} 
                  {(f.type === 'select' || f.type === 'radio') && f.options && ` • ${f.options.length} opções`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200">
              <button 
                onClick={() => setEditingField(f)}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Editar
              </button>
              <button 
                 onClick={() => handleRemoveField(f.id)}
                 className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                 title="Remover Campo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Configurar Campo</h3>
              <button onClick={() => setEditingField(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título do Campo</label>
                <input 
                  type="text" 
                  value={editingField.name} 
                  onChange={e => setEditingField({...editingField, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-600 border-gray-300"
                  placeholder="Ex: Nome da Mãe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Resposta</label>
                <select 
                  value={editingField.type} 
                  onChange={e => setEditingField({...editingField, type: e.target.value as FieldType})}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-600 border-gray-300 bg-white"
                >
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {(editingField.type === 'select' || editingField.type === 'radio') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Opções de Resposta</label>
                  
                  <div className="flex gap-2 mb-3">
                    <input 
                      type="text" 
                      id="newOptionInput"
                      className="flex-1 px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-600 border-gray-300"
                      placeholder="Nova opção..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.currentTarget;
                          const val = input.value.trim();
                          if (val && !editingField.options?.includes(val)) {
                            setEditingField({
                              ...editingField, 
                              options: [...(editingField.options || []), val]
                            });
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('newOptionInput') as HTMLInputElement;
                        const val = input?.value.trim();
                        if (val && !editingField.options?.includes(val)) {
                          setEditingField({
                            ...editingField, 
                            options: [...(editingField.options || []), val]
                          });
                          if(input) input.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>

                  {editingField.options && editingField.options.length > 0 ? (
                    <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                       {editingField.options.map((opt, idx) => (
                         <li key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                           <span className="text-sm text-gray-700">{opt}</span>
                           <button 
                             onClick={() => setEditingField({
                               ...editingField, 
                               options: editingField.options?.filter(o => o !== opt)
                             })}
                             className="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </li>
                       ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic p-3 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      Nenhuma opção adicionada
                    </p>
                  )}
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer py-2">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={editingField.required} onChange={e => setEditingField({...editingField, required: e.target.checked})} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${editingField.required ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editingField.required ? 'translate-x-4' : ''}`}></div>
                </div>
                <span className="text-sm font-medium text-gray-700">Resposta Obrigatória</span>
              </label>

            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setEditingField(null)} className="px-5 py-2 font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveField} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                Salvar Campo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const addItem = (list: string[], setList: (v: string[]) => void, item: string, setItem: (v: string) => void) => {
  if (item.trim() && !list.includes(item.trim())) {
    setList([...list, item.trim()]);
    setItem('');
  }
};

const removeItem = (list: string[], setList: (v: string[]) => void, item: string) => {
  setList(list.filter((i) => i !== item));
};

function ListEditor({ 
  title, 
  list, 
  setList, 
  newItem, 
  setNewItem,
  placeholder
}: { 
  title: string; list: string[]; setList: (v: string[]) => void; newItem: string; setNewItem: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
               e.preventDefault();
               addItem(list, setList, newItem, setNewItem);
            }
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-600"
        />
        <button 
          onClick={() => addItem(list, setList, newItem, setNewItem)}
          className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 font-medium whitespace-nowrap transition-colors"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.length === 0 && <span className="text-gray-400 text-sm">Nenhum item adicionado</span>}
        {list.map((item) => (
          <div key={item} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-sm text-gray-700">
            {item}
            <button onClick={() => removeItem(list, setList, item)} className="text-gray-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const settings = useQuizStore((state) => state.settings) || {
    logoUrl: '',
    schools: [],
    shifts: ['Manhã', 'Tarde', 'Noite', 'Integral'],
    grades: [],
    classes: [],
  };
  const updateSettings = useQuizStore((state) => state.updateSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [customFields, setCustomFields] = useState<CustomField[]>(settings.customFields || []);

  const [schools, setSchools] = useState<string[]>(settings.schools || []);
  const [shifts, setShifts] = useState<string[]>(settings.shifts || []);
  const [grades, setGrades] = useState<string[]>(settings.grades || []);
  const [classes, setClasses] = useState<string[]>(settings.classes || []);

  const [newSchool, setNewSchool] = useState('');
  const [newShift, setNewShift] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newClass, setNewClass] = useState('');

  const [adminUser, setAdminUser] = useState(settings.adminUser || 'admin');
  const [adminPass, setAdminPass] = useState(settings.adminPass || 'admin');
  const [toast, setToast] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateSettings({
      ...settings,
      logoUrl,
      customFields,
      schools,
      shifts,
      grades,
      classes,
      adminUser,
      adminPass,
    });
    setToast('Configurações salvas com sucesso!');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Configurações Gerais</h1>
            <p className="text-gray-500">Logo, escolas, turmas, turnos e séries.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Save className="w-5 h-5" />
          Salvar
        </button>
      </div>

      {toast && (
        <div className="mb-6 mx-auto bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-3 rounded-lg w-full text-center font-medium">
          {toast}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Credenciais de Acesso</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <input
                type="text"
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="text"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:border-indigo-500 transition-all border-gray-300"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Anote essas credenciais, você precisará delas para fazer login no painel administrativo.</p>
        </div>

        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Logo da Escola / Instituição</h3>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative group">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <ImageIcon className="w-10 h-10 text-gray-300" />
              )}
              {logoUrl && (
                <button 
                  onClick={() => setLogoUrl('')}
                  className="absolute p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Adicione a logo para aparecer na tela inicial dos quizzes e dar uma aparência mais profissional.
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                Vincular Imagem
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
           <CustomFieldsEditor fields={customFields} setFields={setCustomFields} />
        </div>
      </div>
    </div>
  );
}
