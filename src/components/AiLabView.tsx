import React, { useState, useEffect } from 'react';
import { AiLog, Note, TaskItem } from '../types';
import { dataService } from '../services/dataService';
import { 
  Sparkles, 
  Send, 
  Lightbulb, 
  BookmarkPlus, 
  Copy, 
  CheckCircle, 
  Clock, 
  Zap,
  Bot,
  ListPlus
} from 'lucide-react';

interface AiLabViewProps {
  userId: string;
  onNoteCreated?: (note: Note) => void;
  onTaskExtracted?: (task: TaskItem) => void;
}

export const AiLabView: React.FC<AiLabViewProps> = ({ userId, onNoteCreated, onTaskExtracted }) => {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Tech & Product');
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [aiLogs, setAiLogs] = useState<AiLog[]>([]);
  const [copied, setCopied] = useState(false);
  const [savedToNotes, setSavedToNotes] = useState(false);

  useEffect(() => {
    const unsub = dataService.subscribeAiLogs(userId, (logs) => {
      setAiLogs(logs);
    });
    return () => unsub();
  }, [userId]);

  const presetTopics = [
    { title: 'Sistem Knowledge Management untuk Developer & Mahasiswa', category: 'Productivity' },
    { title: 'Integrasi Firebase Firestore Realtime dengan Vercel Serverless', category: 'Tech & Product' },
    { title: 'Desain Dashboard Modern Dark-Mode Zero-Pill', category: 'UI/UX Design' },
  ];

  const handleBrainstorm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setResult(null);
    setSavedToNotes(false);

    try {
      const res = await fetch('/api/ai/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          category,
          context: context.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses brainstorming.');
      }

      const generatedText = data.result || 'Tidak ada hasil ide.';
      setResult(generatedText);

      // Save log to Firestore per-user
      const logItem: AiLog = {
        id: `ai-log-${Date.now()}`,
        userId,
        prompt: topic.trim(),
        response: generatedText,
        mode: 'brainstorm',
        createdAt: new Date().toISOString(),
      };
      await dataService.saveAiLog(userId, logItem);
    } catch (err: any) {
      alert('Error Brainstorming AI: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsNote = async () => {
    if (!result || !topic) return;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      userId,
      title: `Brainstorm: ${topic}`,
      content: result,
      category,
      tags: ['AI-Generated', 'Brainstorm', category],
      aiSummary: '💡 Hasil inkubasi ide otomatis dari ThinkLog AI Lab (Gemini 3.8 Flash).',
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dataService.saveNote(userId, newNote);
    onNoteCreated?.(newNote);
    setSavedToNotes(true);
    setTimeout(() => setSavedToNotes(false), 3000);
  };

  const handleExtractTasksFromResult = async () => {
    if (!result) return;
    try {
      const res = await fetch('/api/ai/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: result }),
      });
      const data = await res.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        for (const t of data.tasks) {
          const newTask: TaskItem = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            userId,
            title: t.title,
            completed: false,
            priority: t.priority || 'medium',
            createdAt: new Date().toISOString(),
          };
          await dataService.saveTask(userId, newTask);
          onTaskExtracted?.(newTask);
        }
        alert(`✅ ${data.tasks.length} action item telah ditambahkan ke tab Tugas!`);
      }
    } catch (err: any) {
      alert('Gagal mengekstrak tugas: ' + err.message);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Form & Preset Topics */}
      <div className="lg:col-span-5 space-y-5">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gemini 3.8 Flash Incubator</h3>
              <p className="text-[11px] text-slate-400">Inkubasi ide, framework, dan strategi eksekusi</p>
            </div>
          </div>

          <form onSubmit={handleBrainstorm} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Topik / Ide Utama
              </label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Aplikasi pelacak kebiasaan mikro dengan evaluasi berbasis AI..."
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Tech & Product">Tech & Product</option>
                  <option value="Productivity">Productivity</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Business & Startup">Business & Startup</option>
                  <option value="Research & Study">Research & Study</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Model</label>
                <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-indigo-300 font-mono flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>gemini-3.8-flash</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Konteks Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Fokus pada implementasi praktis dan cepat..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Jalankan Brainstorming AI</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preset Quick Starters */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Inspirasi Cepat</span>
          </div>
          <div className="space-y-2">
            {presetTopics.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(item.title);
                  setCategory(item.category);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/80 transition-all text-xs text-slate-300 hover:text-indigo-300 cursor-pointer"
              >
                <div className="font-medium line-clamp-1">{item.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.category}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Output & History */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg min-h-[460px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Hasil Eksplorasi Ide</span>
                {result && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Selesai
                  </span>
                )}
              </div>

              {result && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                    title="Salin hasil"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsNote}
                    disabled={savedToNotes}
                    className="p-1.5 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-950/50 text-xs flex items-center gap-1 cursor-pointer"
                    title="Simpan sebagai catatan"
                  >
                    {savedToNotes ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[11px]">{savedToNotes ? 'Tersimpan!' : 'Simpan Catatan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExtractTasksFromResult}
                    className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                    title="Ekstrak ke tugas"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Ekstrak Tugas</span>
                  </button>
                </div>
              )}
            </div>

            {/* Content area */}
            {isLoading ? (
              <div className="py-24 text-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-300">
                  Gemini 3.8 Flash sedang menginkubasi ide...
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Memproses strategi, sudut pandang unik, dan langkah eksekusi via Express /api/ai/brainstorm
                </p>
              </div>
            ) : result ? (
              <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {result}
              </div>
            ) : (
              <div className="py-24 text-center">
                <Sparkles className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-medium text-slate-400">
                  Masukkan topik ide di sebelah kiri untuk menghasilkan kerangka kerja & rencana eksekusi.
                </p>
              </div>
            )}
          </div>

          {/* Previous AI Logs */}
          {aiLogs.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Riwayat Brainstorm Firestore ({aiLogs.length})</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 text-[11px]">
                {aiLogs.slice(0, 5).map((log) => (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => {
                      setTopic(log.prompt);
                      setResult(log.response);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white shrink-0 truncate max-w-[200px] cursor-pointer"
                  >
                    {log.prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
