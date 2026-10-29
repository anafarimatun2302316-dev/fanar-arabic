import React, { useState } from 'react';
import { TaskItem } from '../types';
import { dataService } from '../services/dataService';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Calendar, 
  AlertTriangle,
  Clock,
  CheckCheck,
  ListTodo
} from 'lucide-react';

interface TasksViewProps {
  userId: string;
  tasks: TaskItem[];
}

export const TasksView: React.FC<TasksViewProps> = ({ userId, tasks }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task: TaskItem = {
      id: `task-${Date.now()}`,
      userId,
      title: newTitle.trim(),
      completed: false,
      priority,
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    await dataService.saveTask(userId, task);
    setNewTitle('');
    setDueDate('');
    setIsAdding(false);
  };

  const handleToggle = async (task: TaskItem) => {
    await dataService.saveTask(userId, {
      ...task,
      completed: !task.completed,
    });
  };

  const handleDelete = async (taskId: string) => {
    await dataService.deleteTask(userId, taskId);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'high':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> High
          </span>
        );
      case 'low':
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Low
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Medium
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400">Total Tugas</div>
            <div className="text-2xl font-bold text-white mt-1">{tasks.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <ListTodo className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400">Selesai</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Penyelesaian</span>
            <span className="text-indigo-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="mt-2.5 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">{pendingCount} tugas tersisa</div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              filter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              filter === 'active' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Aktif ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              filter === 'completed' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Selesai ({completedCount})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tugas</span>
        </button>
      </div>

      {/* Add Task Box */}
      {isAdding && (
        <form
          onSubmit={handleAddTask}
          className="p-4 bg-slate-900/90 border border-indigo-500/30 rounded-2xl shadow-xl space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Judul Action Item</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Contoh: Evaluasi performa model gemini-3.8-flash pada API Express"
              required
              autoFocus
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="high">Tinggi (High)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="low">Rendah (Low)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tenggat Waktu</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Simpan Tugas
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6">
          <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Tidak ada tugas dalam kategori ini.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3.5 bg-slate-900/70 border rounded-xl hover:border-slate-700 transition-all ${
                task.completed ? 'border-slate-800/60 opacity-60' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                <button
                  type="button"
                  onClick={() => handleToggle(task)}
                  className="cursor-pointer shrink-0 text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-medium truncate ${
                      task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getPriorityBadge(task.priority)}
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>{task.dueDate}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(task.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                title="Hapus tugas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
