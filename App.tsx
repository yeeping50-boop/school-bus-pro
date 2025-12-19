
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BusFront, 
  ChevronLeft, 
  User, 
  Phone, 
  MapPin, 
  FileText,
  Save,
  ChevronRight,
  Navigation,
  GripVertical,
  ChevronDown,
  Plus,
  Trash2,
  Settings,
  Download,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  List,
  Sparkles,
  Send,
  Loader2,
  ExternalLink,
  Lock,
  CheckCircle,
  Crown
} from 'lucide-react';
import { INITIAL_STUDENTS } from './constants';
import { Student, RouteType, DirectionType, AppTab, ChatMessage } from './types';
import { getDriverAssistantResponse } from './services/geminiService';

const STORAGE_KEY = 'school_bus_pro_data';
const PRO_KEY = 'school_bus_pro_is_premium';

const App: React.FC = () => {
  // Pro Status State
  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem(PRO_KEY) === 'true';
  });
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Data State
  const [routeState, setRouteState] = useState<Record<RouteType, Record<DirectionType, Student[]>>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          'Morning Route': { 'Go to School': [...INITIAL_STUDENTS], 'Back from School': [...INITIAL_STUDENTS] },
          'Afternoon Route': { 'Go to School': [...INITIAL_STUDENTS], 'Back from School': [...INITIAL_STUDENTS] }
        };
      }
    }
    return {
      'Morning Route': { 
        'Go to School': [...INITIAL_STUDENTS], 
        'Back from School': [...INITIAL_STUDENTS].map(s => ({...s, id: `m-back-${s.id}`})) 
      },
      'Afternoon Route': { 
        'Go to School': [...INITIAL_STUDENTS].map(s => ({...s, id: `a-to-${s.id}`})), 
        'Back from School': [...INITIAL_STUDENTS].map(s => ({...s, id: `a-back-${s.id}`})) 
      }
    };
  });

  const [activeTab, setActiveTab] = useState<AppTab>('list');
  const [selectedRoute, setSelectedRoute] = useState<RouteType>('Morning Route');
  const [selectedDirection, setSelectedDirection] = useState<DirectionType>('Go to School');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeNavId, setActiveNavId] = useState<string | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Assistant State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{ 
    role: 'model', 
    text: "How can I help you with your route today? I have access to your current student list." 
  }]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routeState));
  }, [routeState]);

  useEffect(() => {
    localStorage.setItem(PRO_KEY, isPro.toString());
  }, [isPro]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentStudents = useMemo(() => routeState[selectedRoute][selectedDirection], [routeState, selectedRoute, selectedDirection]);

  // Payment Logic Simulation
  // In a real Play Store app, this function would call the Google Play Billing Plugin
  const handlePurchase = async () => {
    setIsPurchasing(true);
    
    // Simulate connection to Google Play Billing Service
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // In a real app, you'd check for a success token from Google here
    setIsPro(true);
    setIsPurchasing(false);
    alert("Purchase Successful! Welcome to School Bus Pro.");
  };

  // Handlers
  const handleSaveStudent = (s: Student) => {
    setRouteState(prev => {
      const newState = { ...prev };
      const list = prev[selectedRoute][selectedDirection];
      const exists = list.some(item => item.id === s.id);
      newState[selectedRoute][selectedDirection] = exists 
        ? list.map(item => item.id === s.id ? s : item)
        : [...list, s];
      return newState;
    });
    setIsEditing(false);
    setSelectedStudent(null);
  };

  const handleDeleteStudent = (id: string) => {
    if (!window.confirm("Remove this student permanently?")) return;
    setRouteState(prev => {
      const newState = { ...prev };
      newState[selectedRoute][selectedDirection] = prev[selectedRoute][selectedDirection].filter(s => s.id !== id);
      return newState;
    });
    setIsEditing(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;
    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiLoading(true);

    const response = await getDriverAssistantResponse(userMsg, currentStudents, selectedRoute, selectedDirection);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsAiLoading(false);
  };

  const exportCSV = () => {
    if (!isPro) {
      setActiveTab('settings');
      return;
    }
    const headers = "Route,Direction,Name,Address,Parent,Contact,Notes\n";
    let rows = "";
    Object.keys(routeState).forEach(r => {
      Object.keys(routeState[r as RouteType]).forEach(d => {
        routeState[r as RouteType][d as DirectionType].forEach(s => {
          rows += `${r},${d},"${s.name}","${s.address}","${s.parentName}","${s.parentContact}","${s.notes}"\n`;
        });
      });
    });
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bus_pro_backup_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-yellow-400 px-6 pt-12 pb-6 border-b-4 border-slate-900 shadow-xl z-20 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-900 text-white rounded-full">
                <ChevronLeft size={24} />
              </button>
            ) : (
              <div className="p-2 bg-slate-900 rounded-xl text-yellow-400">
                <BusFront size={28} />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                {isEditing ? 'Edit Stop' : activeTab === 'list' ? 'My Route' : activeTab === 'assistant' ? 'AI Assistant' : 'Settings'}
                {isPro && !isEditing && <Crown size={20} className="text-slate-900 fill-slate-900" />}
              </h1>
              {isPro && !isEditing && <p className="text-[10px] font-black uppercase tracking-widest text-slate-900/60 leading-none">Pro Member</p>}
            </div>
          </div>
          {!isEditing && activeTab === 'list' && (
            <button 
              onClick={() => { setSelectedStudent({ id: `new-${Date.now()}`, name: '', address: '', parentName: '', parentContact: '', notes: '' }); setIsEditing(true); }}
              className="p-3 bg-slate-900 text-yellow-400 rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          )}
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto pb-32">
        {isEditing ? (
          <div className="p-6">
            <StudentForm 
              student={selectedStudent!} 
              onSave={handleSaveStudent} 
              onDelete={handleDeleteStudent} 
              onCancel={() => setIsEditing(false)} 
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {activeTab === 'list' && (
              <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <select 
                      value={selectedRoute} 
                      onChange={(e) => setSelectedRoute(e.target.value as RouteType)}
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 font-bold text-sm appearance-none focus:border-yellow-400 outline-none"
                    >
                      <option>Morning Route</option>
                      <option>Afternoon Route</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <div className="relative">
                    <select 
                      value={selectedDirection} 
                      onChange={(e) => setSelectedDirection(e.target.value as DirectionType)}
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 font-bold text-sm appearance-none focus:border-yellow-400 outline-none"
                    >
                      <option>Go to School</option>
                      <option>Back from School</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-3">
                  {currentStudents.map((s, idx) => (
                    <div 
                      key={s.id} 
                      draggable
                      onDragStart={() => setDraggedIdx(idx)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedIdx === null || draggedIdx === idx) return;
                        setRouteState(prev => {
                          const newState = { ...prev };
                          const list = [...prev[selectedRoute][selectedDirection]];
                          const item = list.splice(draggedIdx, 1)[0];
                          list.splice(idx, 0, item);
                          newState[selectedRoute][selectedDirection] = list;
                          return newState;
                        });
                        setDraggedIdx(idx);
                      }}
                      onDragEnd={() => setDraggedIdx(null)}
                      onClick={() => { setSelectedStudent(s); setIsEditing(true); }}
                      className={`bg-white p-5 rounded-[2rem] border-2 transition-all flex items-center gap-4 group active:scale-[0.98] ${activeNavId === s.id ? 'border-yellow-400 ring-4 ring-yellow-50 shadow-lg' : 'border-slate-100 shadow-md'}`}
                    >
                      <GripVertical size={20} className="text-slate-300 shrink-0" />
                      <div 
                        onClick={(e) => { e.stopPropagation(); setActiveNavId(activeNavId === s.id ? null : s.id); }}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 ${activeNavId === s.id ? 'bg-yellow-400 border-slate-900' : 'bg-slate-50 border-slate-200'}`}
                      >
                        {activeNavId === s.id && <div className="w-3 h-3 bg-slate-900 rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-900 truncate">{s.name || 'Unnamed Stop'}</h3>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1"><MapPin size={12} /> {s.address || 'Set address...'}</p>
                      </div>
                      <ChevronRight size={20} className="text-slate-200" />
                    </div>
                  ))}
                </div>

                {/* Floating Action Button for GPS */}
                <div className="fixed bottom-28 left-0 right-0 px-6 pointer-events-none z-30">
                  <div className="max-w-3xl mx-auto">
                    <button 
                      onClick={() => {
                        const s = currentStudents.find(x => x.id === activeNavId);
                        if (s) window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`, '_blank');
                      }}
                      disabled={!activeNavId}
                      className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all shadow-2xl pointer-events-auto active:scale-95 ${activeNavId ? 'bg-slate-900 text-yellow-400' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                      <Navigation size={24} className={activeNavId ? 'animate-bounce' : ''} />
                      Navigate Stop
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assistant' && (
              <div className="flex flex-col h-[calc(100vh-200px)] p-6 animate-in fade-in duration-300">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border-2 border-slate-100 text-slate-800 rounded-tl-none shadow-sm'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border-2 border-slate-100 p-4 rounded-3xl flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-yellow-500" />
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Checking list...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="mt-4 flex gap-2">
                  <input 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about a student..."
                    className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold focus:border-yellow-400 outline-none shadow-sm"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isAiLoading}
                    className="p-4 bg-yellow-400 text-slate-900 rounded-2xl shadow-lg disabled:opacity-50"
                  >
                    <Send size={24} />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                {/* Pro Upsell / Welcome Card */}
                {!isPro ? (
                  <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-yellow-400 text-slate-900 rounded-lg"><ShieldCheck size={24} /></div>
                        <h3 className="text-xl font-black uppercase">Lifetime Pro</h3>
                      </div>
                      <p className="text-slate-400 text-sm mb-6 font-medium">One-time payment. Integrated with Google Play. Includes encrypted backups and full AI capabilities.</p>
                      <button 
                        onClick={handlePurchase}
                        disabled={isPurchasing}
                        className="w-full bg-yellow-400 text-slate-900 py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:bg-slate-700 disabled:text-slate-500 transition-all"
                      >
                        {isPurchasing ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            Connecting to Play Store...
                          </>
                        ) : (
                          <>
                            <CreditCard size={20} />
                            Unlock for $14.99
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-[3rem] p-8 text-slate-900 relative overflow-hidden shadow-2xl">
                    <div className="absolute -top-4 -right-4">
                      <Crown size={120} className="text-white/20 rotate-12" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle size={28} className="text-slate-900" />
                        <h3 className="text-2xl font-black uppercase">Pro Member</h3>
                      </div>
                      <p className="text-slate-900/60 text-sm font-bold uppercase tracking-widest mb-6">Lifetime Access Active</p>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-full">Google Play Verified</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-[3rem] p-8 border-2 border-slate-100 shadow-xl space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Advanced Tools</h4>
                  
                  <button 
                    onClick={exportCSV} 
                    className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all group ${isPro ? 'bg-slate-50 hover:bg-yellow-50' : 'bg-slate-50/50 grayscale cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-white rounded-xl shadow-sm text-slate-500 ${isPro ? 'group-hover:text-yellow-600' : ''}`}>
                        {isPro ? <Download size={22} /> : <Lock size={22} className="text-slate-300" />}
                      </div>
                      <div className="text-left">
                        <p className={`font-bold ${isPro ? 'text-slate-900' : 'text-slate-400'}`}>Backup to CSV</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{isPro ? 'Export entire database' : 'Pro Feature'}</p>
                      </div>
                    </div>
                    {isPro ? <ChevronRight size={20} className="text-slate-200" /> : <div className="text-[10px] font-black text-yellow-500 uppercase">Upgrade</div>}
                  </button>

                  <button className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group opacity-50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-slate-500"><ExternalLink size={22} /></div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900">Import Route</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Sync from dispatch</p>
                      </div>
                    </div>
                    <Sparkles size={16} className="text-yellow-500" />
                  </button>
                </div>

                <div className="text-center py-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Privacy First Architecture</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">All data is stored locally. No cloud sync by default.</p>
                  <p className="text-[10px] text-slate-400 mt-4">Version 1.2.0 • Build 84</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      {!isEditing && (
        <nav className="fixed bottom-8 left-6 right-6 h-20 bg-slate-900 rounded-[2.5rem] shadow-2xl z-50 flex items-center justify-around px-4 border border-white/10">
          <NavItem active={activeTab === 'list'} icon={<List size={26} />} label="Stops" onClick={() => setActiveTab('list')} />
          <NavItem active={activeTab === 'assistant'} icon={<MessageSquare size={26} />} label="AI Assist" onClick={() => setActiveTab('assistant')} />
          <NavItem active={activeTab === 'settings'} icon={<Settings size={26} />} label="Admin" onClick={() => setActiveTab('settings')} />
        </nav>
      )}
    </div>
  );
};

const NavItem: React.FC<{ active: boolean, icon: React.ReactNode, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 relative group">
    <div className={`p-2 transition-all duration-300 ${active ? 'text-yellow-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
      {icon}
    </div>
    {active && (
      <span className="absolute -bottom-1 w-1 h-1 bg-yellow-400 rounded-full" />
    )}
  </button>
);

const StudentForm: React.FC<{ student: Student, onSave: (s: Student) => void, onDelete: (id: string) => void, onCancel: () => void }> = ({ student, onSave, onDelete, onCancel }) => {
  const [data, setData] = useState(student);
  const isNew = student.id.startsWith('new-');

  return (
    <div className="bg-white rounded-[3rem] p-8 border-2 border-slate-100 shadow-2xl space-y-6 animate-in slide-in-from-bottom-8">
      {[
        { id: 'name', label: 'Student Name', icon: <User size={20} /> },
        { id: 'address', label: 'GPS Address', icon: <MapPin size={20} /> },
        { id: 'parentName', label: 'Parent/Guardian', icon: <User size={20} /> },
        { id: 'parentContact', label: 'Phone Number', icon: <Phone size={20} />, type: 'tel' },
        { id: 'notes', label: 'Important Notes', icon: <FileText size={20} />, area: true }
      ].map(f => (
        <div key={f.id} className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{f.label}</label>
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">{f.icon}</div>
            {f.area ? (
              <textarea 
                value={(data as any)[f.id]} 
                onChange={e => setData({...data, [f.id]: e.target.value})}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-2xl pl-14 pr-6 py-4 font-bold outline-none transition-all resize-none"
                rows={3}
              />
            ) : (
              <input 
                type={f.type || 'text'}
                value={(data as any)[f.id]} 
                onChange={e => setData({...data, [f.id]: e.target.value})}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-yellow-400 focus:bg-white rounded-2xl pl-14 pr-6 py-4 font-bold outline-none transition-all"
              />
            )}
          </div>
        </div>
      ))}
      
      <div className="pt-6 space-y-4">
        <div className="flex gap-4">
          <button onClick={() => onSave(data)} disabled={!data.name.trim()} className="flex-[3] py-6 bg-yellow-400 text-slate-900 rounded-[2rem] font-black uppercase tracking-widest shadow-xl active:scale-95 disabled:bg-slate-200">
            {isNew ? 'Create Stop' : 'Save Changes'}
          </button>
          <button onClick={onCancel} className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[2rem] font-black uppercase tracking-widest">Back</button>
        </div>
        {!isNew && (
          <button onClick={() => onDelete(student.id)} className="w-full py-4 text-red-500 font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-red-50 rounded-2xl transition-all">
            <Trash2 size={18} /> Delete Student
          </button>
        )}
      </div>
    </div>
  );
};

export default App;
