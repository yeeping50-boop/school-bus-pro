
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
// We define these here because Babel Standalone cannot resolve relative local imports easily
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

// --- INITIAL LOGGING ---
const debugLog = (window as any).log || console.log;
debugLog("App: Executing internal bundle...");

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
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Error: No API Key found.";
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: `Driver Assistant. Context: ${route} - ${dir}. List: ${JSON.stringify(students)}. Be brief (1-2 sentences).`,
      },
    });
    return response.text || "No response.";
  } catch (e) { 
    console.error("Assistant Error:", e);
    return "AI connection failed."; 
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
              <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-900 text-white rounded-full"><ChevronLeft size={20} /></button>
            ) : (
              <div className="p-2 bg-slate-900 rounded-xl text-yellow-400"><BusFront size={24} /></div>
            )}
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">{isEditing ? 'Details' : activeTab === 'list' ? 'Route' : activeTab === 'assistant' ? 'AI' : 'Admin'}</h1>
              {isPro && <p className="text-[8px] font-black uppercase text-slate-900/50">Pro Enabled</p>}
            </div>
          </div>
          {!isEditing && activeTab === 'list' && (
            <button onClick={() => { setSelectedStudent({id: Date.now().toString(), name: '', address: '', parentName: '', parentContact: '', notes: ''}); setIsEditing(true); }} className="p-2 bg-slate-900 text-yellow-400 rounded-xl"><Plus /></button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {isEditing ? (
          <div className="p-6 space-y-4">
            <input className="w-full p-4 rounded-xl border-2" placeholder="Student Name" value={selectedStudent?.name} onChange={e => setSelectedStudent({...selectedStudent!, name: e.target.value})} />
            <input className="w-full p-4 rounded-xl border-2" placeholder="Address" value={selectedStudent?.address} onChange={e => setSelectedStudent({...selectedStudent!, address: e.target.value})} />
            <input className="w-full p-4 rounded-xl border-2" placeholder="Parent Name" value={selectedStudent?.parentName} onChange={e => setSelectedStudent({...selectedStudent!, parentName: e.target.value})} />
            <input className="w-full p-4 rounded-xl border-2" placeholder="Contact" value={selectedStudent?.parentContact} onChange={e => setSelectedStudent({...selectedStudent!, parentContact: e.target.value})} />
            <textarea className="w-full p-4 rounded-xl border-2" placeholder="Notes" value={selectedStudent?.notes} onChange={e => setSelectedStudent({...selectedStudent!, notes: e.target.value})} />
            <button onClick={() => saveStudent(selectedStudent!)} className="w-full py-4 bg-yellow-400 font-bold rounded-xl">Save Stop</button>
          </div>
        ) : (
          <div className="p-4">
            {activeTab === 'list' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <select value={selectedRoute} onChange={e => setSelectedRoute(e.target.value as any)} className="p-3 bg-white border-2 rounded-xl font-bold text-xs"><option>Morning Route</option><option>Afternoon Route</option></select>
                  <select value={selectedDirection} onChange={e => setSelectedDirection(e.target.value as any)} className="p-3 bg-white border-2 rounded-xl font-bold text-xs"><option>Go to School</option><option>Back from School</option></select>
                </div>
                {currentStudents.map((s: Student) => (
                  <div key={s.id} onClick={() => { setSelectedStudent(s); setIsEditing(true); }} className={`bg-white p-4 rounded-2xl border-2 flex items-center gap-4 ${activeNavId === s.id ? 'border-yellow-400' : 'border-slate-100'}`}>
                    <div onClick={(e) => { e.stopPropagation(); setActiveNavId(s.id); }} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${activeNavId === s.id ? 'bg-yellow-400 border-slate-900' : 'bg-slate-50'}`}>{activeNavId === s.id && <div className="w-2 h-2 bg-slate-900 rounded-full" />}</div>
                    <div className="flex-1"><h3 className="font-bold text-sm">{s.name || 'New'}</h3><p className="text-[10px] text-slate-400">{s.address || 'No Address'}</p></div>
                    <ChevronRight size={16} className="text-slate-200" />
                  </div>
                ))}
                <button onClick={() => { const s = currentStudents.find((x:any)=>x.id===activeNavId); if(s) window.open(`https://maps.google.com/?daddr=${encodeURIComponent(s.address)}`); }} disabled={!activeNavId} className={`w-full py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 ${activeNavId ? 'bg-slate-900 text-yellow-400' : 'bg-slate-200 text-slate-400'}`}><Navigation size={16}/> Start Navigation</button>
              </div>
            )}
            {activeTab === 'assistant' && (
              <div className="space-y-4 flex flex-col h-[70vh]">
                <div className="flex-1 overflow-y-auto space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-3 rounded-2xl text-xs max-w-[80%] ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border'}`}>{m.text}</div></div>
                  ))}
                  {isAiLoading && <Loader2 className="animate-spin" size={16} />}
                </div>
                <div className="flex gap-2"><input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 p-3 border rounded-xl" placeholder="Ask about route..." /><button onClick={handleSendMessage} className="p-3 bg-yellow-400 rounded-xl"><Send size={18}/></button></div>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div className="bg-slate-900 p-6 rounded-3xl text-white"><Crown className="mb-2 text-yellow-400" /><h3 className="font-bold">Upgrade to Pro</h3><p className="text-xs text-slate-400 mb-4">Unlock offline maps and CSV export.</p><button onClick={() => setIsPro(true)} className="w-full py-3 bg-yellow-400 text-slate-900 rounded-xl font-bold">Buy Lifetime - $14.99</button></div>
                <button onClick={() => { localStorage.clear(); location.reload(); }} className="w-full p-4 border-2 text-red-500 font-bold rounded-xl text-xs">Reset All Data</button>
              </div>
            )}
          </div>
        )}
      </main>

      {!isEditing && (
        <nav className="fixed bottom-6 left-6 right-6 h-16 bg-slate-900 rounded-3xl flex items-center justify-around px-2">
          <button onClick={() => setActiveTab('list')} className={activeTab === 'list' ? 'text-yellow-400' : 'text-slate-500'}><List /></button>
          <button onClick={() => setActiveTab('assistant')} className={activeTab === 'assistant' ? 'text-yellow-400' : 'text-slate-500'}><MessageSquare /></button>
          <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? 'text-yellow-400' : 'text-slate-500'}><Settings /></button>
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
    debugLog("App: React Render triggered.");
} else {
    debugLog("App: CRITICAL - Root element not found!", "ERROR");
}
