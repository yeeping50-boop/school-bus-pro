
import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { 
  BusFront, ChevronLeft, User, Phone, MapPin, FileText, ChevronRight,
  Navigation, GripVertical, ChevronDown, Plus, Trash2, Settings, Download,
  ShieldCheck, CreditCard, MessageSquare, List, Sparkles, Send, Loader2,
  CheckCircle, Crown, Bot, AlertTriangle, Clock, Users
} from 'lucide-react';

// --- CONSOLIDATED TYPES ---
export interface Student {
  id: string;
  name: string;
  address: string;
  parentName: string;
  parentContact: string;
  notes: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

type RouteType = 'Morning Route' | 'Afternoon Route';
type DirectionType = 'Go to School' | 'Back from School';
type AppTab = 'list' | 'assistant' | 'settings';

// --- CONSTANTS ---
const INITIAL_STUDENTS: Student[] = [
  { id: '1', name: 'Alex Johnson', address: '123 Maple Avenue, Springfield', parentName: 'Sarah Johnson', parentContact: '(555) 123-4567', notes: 'Needs front seat.' },
  { id: '2', name: 'Emma Rodriguez', address: '456 Oak Lane, Springfield', parentName: 'David Rodriguez', parentContact: '(555) 987-6543', notes: 'Last stop.' },
  { id: '3', name: 'Liam Chen', address: '789 Pine Terrace, Springfield', parentName: 'Mei Chen', parentContact: '(555) 456-7890', notes: 'Sibling of Chloe.' },
  { id: '4', name: 'Sophia Smith', address: '101 Cedar Street, Springfield', parentName: 'Michael Smith', parentContact: '(555) 222-3333', notes: 'Orange backpack.' },
  { id: '5', name: 'Noah Williams', address: '202 Birch Blvd, Springfield', parentName: 'Jessica Williams', parentContact: '(555) 888-9999', notes: 'Often late.' }
];

// --- AI SERVICE ---
const getAssistantResponse = async (query: string, students: Student[], route: string, dir: string) => {
  // Use a fallback to ensure we don't crash if API_KEY is missing
  const apiKey = (window as any).process?.env?.API_KEY || (typeof process !== 'undefined' ? process.env.API_KEY : '');
  
  if (!apiKey) return "Error: Gemini API Key not detected.";
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `You are 'BusPro Assistant', a helpful tool for a school bus driver. Current context: ${route} - ${dir}. Current stop list: ${JSON.stringify(students)}. Be extremely brief and professional.`,
      },
    });
    return response.text || "No response received.";
  } catch (e) { 
    console.error("Assistant Error:", e);
    return "AI connection failed. Check your network."; 
  }
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [isPro, setIsPro] = useState(() => localStorage.getItem('is_pro') === 'true');
  const [activeTab, setActiveTab] = useState<AppTab>('list');
  const [selectedRoute, setSelectedRoute] = useState<RouteType>('Morning Route');
  const [selectedDirection, setSelectedDirection] = useState<DirectionType>('Go to School');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeNavId, setActiveNavId] = useState<string | null>(null);
  
  const [routeState, setRouteState] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('bus_data');
    if (saved) return JSON.parse(saved);
    return {
      'Morning Route': { 'Go to School': [...INITIAL_STUDENTS], 'Back from School': [...INITIAL_STUDENTS] },
      'Afternoon Route': { 'Go to School': [...INITIAL_STUDENTS], 'Back from School': [...INITIAL_STUDENTS] }
    };
  });

  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'model', text: "Ready to assist with your route list." }]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => { localStorage.setItem('bus_data', JSON.stringify(routeState)); }, [routeState]);
  useEffect(() => { localStorage.setItem('is_pro', isPro.toString()); }, [isPro]);

  // Transition: Remove loading screen once App is mounted
  useEffect(() => {
    if ((window as any).hideLoader) {
      (window as any).hideLoader();
    }
  }, []);

  const currentStudents = useMemo<Student[]>(() => routeState[selectedRoute][selectedDirection], [routeState, selectedRoute, selectedDirection]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiLoading(true);
    const resp = await getAssistantResponse(userMsg, currentStudents, selectedRoute, selectedDirection);
    setMessages(prev => [...prev, { role: 'model', text: resp }]);
    setIsAiLoading(false);
  };

  const saveStudent = (s: Student) => {
    setRouteState(prev => {
      const copy = { ...prev };
      const list = prev[selectedRoute][selectedDirection];
      const idx = list.findIndex((item: any) => item.id === s.id);
      if (idx > -1) list[idx] = s; else list.push(s);
      return copy;
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 overflow-hidden">
      <header className="bg-yellow-400 px-6 pt-10 pb-6 border-b-4 border-slate-900 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-900 text-white rounded-full transition-transform active:scale-90"><ChevronLeft size={20} /></button>
            ) : (
              <div className="p-2 bg-slate-900 rounded-xl text-yellow-400"><BusFront size={24} /></div>
            )}
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">{isEditing ? 'Details' : activeTab === 'list' ? 'Route' : activeTab === 'assistant' ? 'AI' : 'Admin'}</h1>
              {isPro && <p className="text-[8px] font-black uppercase text-slate-900/50">Pro Enabled</p>}
            </div>
          </div>
          {!isEditing && activeTab === 'list' && (
            <button onClick={() => { setSelectedStudent({id: Date.now().toString(), name: '', address: '', parentName: '', parentContact: '', notes: ''}); setIsEditing(true); }} className="p-2 bg-slate-900 text-yellow-400 rounded-xl shadow-lg transition-transform active:scale-95"><Plus /></button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {isEditing ? (
          <div className="p-6 space-y-4 animate-in slide-in-from-right duration-300">
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Student Information</label>
               <input className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-yellow-400 outline-none transition-colors" placeholder="Student Name" value={selectedStudent?.name} onChange={e => setSelectedStudent({...selectedStudent!, name: e.target.value})} />
            </div>
            <input className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-yellow-400 outline-none transition-colors" placeholder="Home Address" value={selectedStudent?.address} onChange={e => setSelectedStudent({...selectedStudent!, address: e.target.value})} />
            <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Parent / Emergency Contact</label>
               <input className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-yellow-400 outline-none transition-colors" placeholder="Parent Name" value={selectedStudent?.parentName} onChange={e => setSelectedStudent({...selectedStudent!, parentName: e.target.value})} />
               <input className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-yellow-400 outline-none transition-colors" placeholder="Contact Phone" value={selectedStudent?.parentContact} onChange={e => setSelectedStudent({...selectedStudent!, parentContact: e.target.value})} />
            </div>
            <textarea className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-yellow-400 outline-none transition-colors min-h-[100px]" placeholder="Medical notes or stop instructions..." value={selectedStudent?.notes} onChange={e => setSelectedStudent({...selectedStudent!, notes: e.target.value})} />
            <button onClick={() => saveStudent(selectedStudent!)} className="w-full py-4 bg-yellow-400 text-slate-900 font-black uppercase rounded-2xl shadow-xl shadow-yellow-200 transition-transform active:scale-95">Save Changes</button>
          </div>
        ) : (
          <div className="p-4 animate-in fade-in duration-500">
            {activeTab === 'list' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Shift</label>
                    <select value={selectedRoute} onChange={e => setSelectedRoute(e.target.value as any)} className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-xs shadow-sm"><option>Morning Route</option><option>Afternoon Route</option></select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Way</label>
                    <select value={selectedDirection} onChange={e => setSelectedDirection(e.target.value as any)} className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-xs shadow-sm"><option>Go to School</option><option>Back from School</option></select>
                  </div>
                </div>
                
                {currentStudents.length === 0 ? (
                    <div className="py-20 text-center space-y-4 opacity-30">
                        <div className="flex justify-center"><BusFront size={48} /></div>
                        <p className="font-bold">No stops found for this route.</p>
                    </div>
                ) : (
                    currentStudents.map((s: Student) => (
                    <div key={s.id} onClick={() => { setSelectedStudent(s); setIsEditing(true); }} className={`bg-white p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 ${activeNavId === s.id ? 'border-yellow-400 shadow-lg shadow-yellow-100' : 'border-slate-100'}`}>
                        <div onClick={(e) => { e.stopPropagation(); setActiveNavId(s.id); }} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${activeNavId === s.id ? 'bg-yellow-400 border-slate-900 scale-110' : 'bg-slate-50'}`}>
                            {activeNavId === s.id && <div className="w-2 h-2 bg-slate-900 rounded-full animate-pulse" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-sm">{s.name || 'Untitled Stop'}</h3>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{s.address || 'Location missing'}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-200" />
                    </div>
                    ))
                )}
                
                <div className="h-4" />
                <button onClick={() => { const s = currentStudents.find((x:any)=>x.id===activeNavId); if(s) window.open(`https://maps.google.com/?daddr=${encodeURIComponent(s.address)}`); }} disabled={!activeNavId} className={`w-full py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-xl ${activeNavId ? 'bg-slate-900 text-yellow-400 shadow-slate-200 active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}><Navigation size={16}/> Start Navigation</button>
              </div>
            )}
            
            {activeTab === 'assistant' && (
              <div className="space-y-4 flex flex-col h-[70vh]">
                <div className="flex-1 overflow-y-auto space-y-4 p-2">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border-2 border-slate-100 rounded-tl-none'}`}>
                            {m.text}
                        </div>
                    </div>
                  ))}
                  {isAiLoading && (
                      <div className="flex justify-start">
                          <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl rounded-tl-none flex items-center gap-2">
                            <Loader2 className="animate-spin text-yellow-400" size={16} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processing...</span>
                          </div>
                      </div>
                  )}
                  <div className="h-10" />
                </div>
                <div className="flex gap-2 p-2 bg-white border-2 border-slate-100 rounded-2xl shadow-lg">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 p-2 bg-transparent outline-none text-sm" placeholder="Search address, notes..." />
                    <button onClick={handleSendMessage} className="p-3 bg-yellow-400 text-slate-900 rounded-xl transition-transform active:scale-90"><Send size={18}/></button>
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-slate-900 p-8 rounded-[32px] text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-10 -mt-10" />
                    <Crown className="mb-4 text-yellow-400" size={32} />
                    <h3 className="text-xl font-black uppercase mb-1">Upgrade to Pro</h3>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">Unlock advanced logistics including route optimization, bulk CSV student import, and offline mode.</p>
                    <button onClick={() => setIsPro(true)} className="w-full py-4 bg-yellow-400 text-slate-900 rounded-2xl font-black uppercase text-xs shadow-xl shadow-yellow-900/50 transition-transform active:scale-95">Enable Lifetime Access</button>
                </div>
                
                <div className="bg-white p-6 rounded-[32px] border-2 border-slate-100 space-y-4">
                    <h4 className="font-bold text-xs uppercase text-slate-400 tracking-widest">Data Management</h4>
                    <button onClick={() => { 
                        if(confirm("Wipe all locally stored data? This cannot be undone.")) {
                            localStorage.clear(); 
                            location.reload(); 
                        }
                    }} className="w-full p-4 border-2 border-red-50 text-red-500 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"><Trash2 size={16}/> Wipe App Database</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {!isEditing && (
        <nav className="fixed bottom-6 left-6 right-6 h-18 bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-900/40 flex items-center justify-around px-4 border-t border-white/10 backdrop-blur-md">
          <button onClick={() => setActiveTab('list')} className={`p-4 rounded-2xl transition-all ${activeTab === 'list' ? 'text-yellow-400 bg-white/10 scale-110' : 'text-slate-500'}`}><List /></button>
          <button onClick={() => setActiveTab('assistant')} className={`p-4 rounded-2xl transition-all ${activeTab === 'assistant' ? 'text-yellow-400 bg-white/10 scale-110' : 'text-slate-500'}`}><MessageSquare /></button>
          <button onClick={() => setActiveTab('settings')} className={`p-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'text-yellow-400 bg-white/10 scale-110' : 'text-slate-500'}`}><Settings /></button>
        </nav>
      )}
    </div>
  );
};

// --- INITIALIZE ---
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
}
