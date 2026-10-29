import React, { useState } from 'react';
import { Note, TaskItem } from '../types';
import { dataService } from '../services/dataService';
import { 
  Plus, 
  Search, 
  Pin, 
  Sparkles, 
  Trash2, 
  Edit3, 
  Tag, 
  ListPlus, 
  Clock, 
  CheckCircle,
  Copy,
  X,
  FileText
} from 'lucide-react';

interface NotesViewProps {
  userId: string;
  notes: Note[];
  onTaskExtracted?: (task: TaskItem) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({ userId, notes, onTaskExtracted }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Productivity');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // AI states
  const [activeAiSummaryNoteId, setActiveAiSummaryNoteId] = useState<string | null>(null);
  const [isAiSummarizing, setIsAiSummarizing] = useState<string | null>(null);
  const [isAiExtractingTasks, setIsAiExtractingTasks] = useState<string | null>(null);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const categories = ['All', 'Productivity', 'Design', 'Roadmap', 'Ide', 'Riset'];

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat = selectedCategory === 'All' || note.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const openCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setCategory('Productivity');
    setTagsInput('');
    setIsPinned(false);
    setIsCreateOpen(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || 'Productivity');
    setTagsInput(note.tags ? note.tags.join(', ') : '');
    setIsPinned(Boolean(note.isPinned));
    setIsCreateOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const notePayload: Note = {
      id: editingNote ? editingNote.id : `note-${Date.now()}`,
      userId,
      title: title.trim(),
      content: content.trim(),
      category,
      tags,
      aiSummary: editingNote?.aiSummary,
      isPinned,
      createdAt: editingNote ? editingNote.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dataService.saveNote(userId, notePayload);
    setIsCreateOpen(false);
  };

  const handleDelete = async (noteId: string) => {
    if (confirm('Hapus catatan ini secara permanen?')) {
      await dataService.deleteNote(userId, noteId);
    }
  };

  const togglePin = async (note: Note) => {
    await dataService.saveNote(userId, {
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString(),
    });
  };

  // Call Server-Side Express API /api/ai/summarize
  const handleAiSummarize = async (note: Note) => {
    setIsAiSummarizing(note.id);
    setActionSuccessMsg(null);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          style: 'comprehensive',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal merangkum catatan dengan Gemini.');
      }

      const updated: Note = {
        ...note,
        aiSummary: data.summary,
        updatedAt: new Date().toISOString(),
      };
      await dataService.saveNote(userId, updated);
      setActiveAiSummaryNoteId(note.id);
      setActionSuccessMsg('✨ Rangkuman Gemini 3.8 Flash berhasil dibuat dan disimpan!');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Error AI: ' + err.message);
    } finally {
      setIsAiSummarizing(null);
    }
  };

  // Call Server-Side Express API /api/ai/extract-tasks
  const handleAiExtractTasks = async (note: Note) => {
    setIsAiExtractingTasks(note.id);
    setActionSuccessMsg(null);
    try {
      const res = await fetch('/api/ai/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${note.title}\n\n${note.content}` }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengekstrak tugas.');
      }

      if (data.tasks && Array.isArray(data.tasks)) {
        for (const t of data.tasks) {
          const newTask: TaskItem = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            userId,
            title: t.title,
            completed: false,
            priority: t.priority || 'medium',
            dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
          };
          await dataService.saveTask(userId, newTask);
          onTaskExtracted?.(newTask);
        }
        setActionSuccessMsg(`✅ ${data.tasks.length} action item berhasil diekstrak ke tab Tugas!`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      alert('Error Ekstraksi: ' + err.message);
    } finally {
      setIsAiExtractingTasks(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNoteId(id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ide, judul, atau tag..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catatan Baru</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Belum Ada Catatan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Mulai inkubasi ide pertama Anda. Simpan catatan, ide proyek, atau rangkum secara instan menggunakan Gemini 3.8 Flash.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Catatan Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const isSummarizingThis = isAiSummarizing === note.id;
            const isExtractingThis = isAiExtractingTasks === note.id;

            return (
              <div
                key={note.id}
                className={`group flex flex-col justify-between bg-slate-900/70 border rounded-2xl p-5 hover:border-slate-700 transition-all relative ${
                  note.isPinned
                    ? 'border-indigo-500/40 bg-gradient-to-b from-indigo-950/20 to-slate-900/80 shadow-md'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {note.category || 'General'}
                      </span>
                      {note.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                          <Pin className="w-3 h-3 fill-amber-400" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-500">
                      <button
                        type="button"
                        onClick={() => togglePin(note)}
                        className={`p-1 hover:text-amber-400 transition-colors cursor-pointer ${
                          note.isPinned ? 'text-amber-400' : ''
                        }`}
                        title={note.isPinned ? 'Lepas Pin' : 'Sematkan Catatan'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(note)}
                        className="p-1 hover:text-slate-300 transition-colors cursor-pointer"
                        title="Edit Catatan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        className="p-1 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-200 transition-colors line-clamp-2">
                    {note.title}
                  </h3>

                  {/* Content Preview */}
                  <p className="mt-2 text-xs text-slate-400 whitespace-pre-line line-clamp-4 leading-relaxed font-sans">
                    {note.content}
                  </p>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {note.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 bg-slate-950 rounded text-slate-400 border border-slate-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI Summary Section (if present) */}
                  {note.aiSummary && (
                    <div className="mt-3.5 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Gemini AI Synthesis</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(note.aiSummary || '', note.id)}
                          className="text-[10px] text-slate-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1"
                        >
                          {copiedNoteId === note.id ? (
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedNoteId === note.id ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-300 leading-relaxed font-sans whitespace-pre-line max-h-36 overflow-y-auto pr-1">
                        {note.aiSummary}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer AI Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Gemini Summarize Button */}
                    <button
                      type="button"
                      onClick={() => handleAiSummarize(note)}
                      disabled={isSummarizingThis || isExtractingThis}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-medium transition-all cursor-pointer disabled:opacity-50"
                      title="Rangkum catatan dengan Gemini 3.8 Flash via Express backend"
                    >
                      {isSummarizingThis ? (
                        <div className="w-3 h-3 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                      )}
                      <span>{isSummarizingThis ? 'Merangkum...' : 'Rangkum AI'}</span>
                    </button>

                    {/* AI Task Extraction */}
                    <button
                      type="button"
                      onClick={() => handleAiExtractTasks(note)}
                      disabled={isSummarizingThis || isExtractingThis}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium transition-all cursor-pointer disabled:opacity-50"
                      title="Ekstrak action item tugas langsung ke daftar tugas"
                    >
                      {isExtractingThis ? (
                        <div className="w-3 h-3 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                      ) : (
                        <ListPlus className="w-3 h-3" />
                      )}
                      <span className="hidden sm:inline">Ekstrak Tugas</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Note Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4">
              {editingNote ? 'Edit Catatan' : 'Catatan Baru'}
            </h3>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Judul Catatan
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Arsitektur Microservices & Gemini Integration"
                  required
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Productivity">Productivity</option>
                    <option value="Design">Design</option>
                    <option value="Roadmap">Roadmap</option>
                    <option value="Ide">Ide</option>
                    <option value="Riset">Riset</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tags (pisahkan koma)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="AI, Cloud, Database"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Isi Catatan / Ide
                </label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan pemikiran, konsep, atau catatan penting..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheckbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="pinCheckbox" className="text-xs text-slate-300 cursor-pointer">
                  Sematkan catatan ini di posisi atas (Pinned)
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  {editingNote ? 'Simpan Perubahan' : 'Buat Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
