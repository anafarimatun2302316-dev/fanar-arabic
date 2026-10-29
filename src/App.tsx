/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { NotesView } from './components/NotesView';
import { TasksView } from './components/TasksView';
import { AiLabView } from './components/AiLabView';
import { SettingsView } from './components/SettingsView';
import { dataService } from './services/dataService';
import { Note, TaskItem, ActiveTab } from './types';
import { Sparkles, Loader2 } from 'lucide-react';

const WorkspaceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setIsDataLoading(true);

    // Subscribe to Firestore per-user data
    const unsubNotes = dataService.subscribeNotes(user.uid, (updatedNotes) => {
      setNotes(updatedNotes);
      setIsDataLoading(false);
    });

    const unsubTasks = dataService.subscribeTasks(user.uid, (updatedTasks) => {
      setTasks(updatedTasks);
    });

    return () => {
      unsubNotes();
      unsubTasks();
    };
  }, [user]);

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notesCount={notes.length}
        tasksCount={tasks.filter((t) => !t.completed).length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isDataLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-xs text-slate-400">Sinkronisasi data workspace Firestore...</p>
          </div>
        ) : (
          <>
            {activeTab === 'notes' && (
              <NotesView
                userId={user.uid}
                notes={notes}
                onTaskExtracted={(newTask) => setTasks((prev) => [newTask, ...prev])}
              />
            )}

            {activeTab === 'tasks' && (
              <TasksView userId={user.uid} tasks={tasks} />
            )}

            {activeTab === 'ai-lab' && (
              <AiLabView
                userId={user.uid}
                onNoteCreated={(newNote) => setNotes((prev) => [newNote, ...prev])}
                onTaskExtracted={(newTask) => setTasks((prev) => [newTask, ...prev])}
              />
            )}

            {activeTab === 'settings' && <SettingsView />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-4 text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ThinkLog AI — Second Brain & Workspace</span>
          <span className="font-mono text-slate-600">
            Express /api • Firebase Firestore • Gemini 3.8 Flash • Vercel Ready
          </span>
        </div>
      </footer>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 font-mono">
          Memuat ThinkLog AI...
        </p>
      </div>
    );
  }

  // Wajib Login constraint
  if (!user) {
    return <LoginPage />;
  }

  return <WorkspaceDashboard />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
