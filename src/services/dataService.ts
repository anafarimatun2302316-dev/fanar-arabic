import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Note, TaskItem, AiLog } from '../types';

// Initial starter seed for fresh workspaces
export const initialNotesSeed = (userId: string): Note[] => [
  {
    id: 'note-1',
    userId,
    title: 'Strategi Pengembangan ThinkLog AI 2026',
    content: `ThinkLog AI dirancang sebagai second-brain modern yang menggabungkan:
1. Ruang catatan kontekstual dengan kategorisasi visual.
2. Firestore per-user data isolation untuk keamanan tingkat enterprise.
3. Server-side Gemini AI API untuk otomatisasi ekstraksi tugas, intisari eksekutif, dan brainstorming.
4. Dukungan dual login: Google Sign-In & Kredensial khusus ananabila.

Target kuartal ini:
- Integrasi real-time sync Firestore
- Deploy ke Vercel dengan serverless function Express di /api/index.ts
- Pengujian performa model gemini-3.8-flash`,
    category: 'Productivity',
    tags: ['Architecture', 'Gemini AI', 'Roadmap'],
    aiSummary: '💡 Intisari: Konsep second-brain cerdas dengan keamanan data per-user di Firestore dan pemrosesan AI di sisi server.\n📌 Wawasan Kunci:\n• Keamanan data terisolasi di Firestore subcollection /users/{uid}/notes\n• Ekstensi serverless Vercel dengan Express router\n• Model gemini-3.8-flash untuk pemrosesan cepat',
    isPinned: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    userId,
    title: 'Catatan Riset UI/UX: Zero-Pill & Deep Dark Aesthetic',
    content: `Filosofi desain untuk ThinkLog AI:
- Palet gelap Slate-950 dengan aksen Indigo & Violet glowing gradients.
- Typography: Plus Jakarta Sans untuk readability tinggi dan JetBrains Mono untuk metrik.
- Card dengan border halus (slate-800/80) dan backdrop blur glassmorphism.
- Micro-interactions dengan Motion untuk transisi halus antar tab dan modal.`,
    category: 'Design',
    tags: ['UI/UX', 'Tailwind', 'Design System'],
    isPinned: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const initialTasksSeed = (userId: string): TaskItem[] => [
  {
    id: 'task-1',
    userId,
    title: 'Validasi login kredensial ananabila / pakailogikamu86',
    completed: true,
    priority: 'high',
    dueDate: '2026-10-30',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    userId,
    title: 'Verifikasi endpoint Express serverless /api/health di Vercel',
    completed: true,
    priority: 'high',
    dueDate: '2026-10-31',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    userId,
    title: 'Eksplorasi sintesis AI otomatis pada catatan proyek baru',
    completed: false,
    priority: 'medium',
    dueDate: '2026-11-02',
    createdAt: new Date().toISOString(),
  },
];

function getLocalStoreKey(userId: string, key: string) {
  return `thinklog_${userId}_${key}`;
}

export const dataService = {
  // NOTES MANAGEMENT
  subscribeNotes(userId: string, onUpdate: (notes: Note[]) => void): () => void {
    const isGoogleAuth = auth.currentUser && auth.currentUser.uid === userId;
    
    if (isGoogleAuth) {
      const notesPath = `users/${userId}/notes`;
      try {
        const q = query(collection(db, 'users', userId, 'notes'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const notes: Note[] = [];
            snapshot.forEach((docSnap) => {
              notes.push(docSnap.data() as Note);
            });
            
            // If empty on first load, seed with demo notes
            if (notes.length === 0 && snapshot.empty) {
              const seeds = initialNotesSeed(userId);
              seeds.forEach((seed) => {
                setDoc(doc(db, 'users', userId, 'notes', seed.id), seed).catch(() => {});
              });
              onUpdate(seeds);
            } else {
              onUpdate(notes);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, notesPath);
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Falling back to local storage for notes:', err);
      }
    }

    // Fallback or Credential session (ananabila)
    const localKey = getLocalStoreKey(userId, 'notes');
    const existing = localStorage.getItem(localKey);
    let initialList: Note[] = [];
    if (existing) {
      try {
        initialList = JSON.parse(existing);
      } catch {
        initialList = initialNotesSeed(userId);
      }
    } else {
      initialList = initialNotesSeed(userId);
      localStorage.setItem(localKey, JSON.stringify(initialList));
    }
    onUpdate(initialList);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === localKey && e.newValue) {
        try {
          onUpdate(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  },

  async saveNote(userId: string, note: Note): Promise<void> {
    const isGoogleAuth = auth.currentUser && auth.currentUser.uid === userId;
    const localKey = getLocalStoreKey(userId, 'notes');

    // Always update local storage first for instant feedback
    const raw = localStorage.getItem(localKey);
    let list: Note[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((n) => n.id === note.id);
    if (idx >= 0) {
      list[idx] = note;
    } else {
      list.unshift(note);
    }
    localStorage.setItem(localKey, JSON.stringify(list));

    // If Google Auth, sync to Firestore
    if (isGoogleAuth) {
      const notePath = `users/${userId}/notes/${note.id}`;
      try {
        await setDoc(doc(db, 'users', userId, 'notes', note.id), note);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, notePath);
      }
    }
  },

  async deleteNote(userId: string, noteId: string): Promise<void> {
    const isGoogleAuth = auth.currentUser && auth.currentUser.uid === userId;
    const localKey = getLocalStoreKey(userId, 'notes');

    const raw = localStorage.getItem(localKey);
    if (raw) {
      const list: Note[] = JSON.parse(raw);
      const filtered = list.filter((n) => n.id !== noteId);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }

    if (isGoogleAuth) {
      const notePath = `users/${userId}/notes/${noteId}`;
      try {
        await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, notePath);
      }
    }
  },

  // TASKS MANAGEMENT
  subscribeTasks(userId: string, onUpdate: (tasks: TaskItem[]) => void): () => void {
    const isGoogleAuth = auth.currentUser && auth.currentUser.uid === userId;

    if (isGoogleAuth) {
      const tasksPath = `users/${userId}/tasks`;
      try {
        const q = query(collection(db, 'users', userId, 'tasks'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const tasks: TaskItem[] = [];
            snapshot.forEach((docSnap) => {
              tasks.push(docSnap.data() as TaskItem);
            });

            if (tasks.length === 0 && snapshot.empty) {
              const seeds = initialTasksSeed(userId);
              seeds.forEach((seed) => {
                setDoc(doc(db, 'users', userId, 'tasks', seed.id), seed).catch(() => {});
              });
              onUpdate(seeds);
            } else {
              onUpdate(tasks);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, tasksPath);
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Falling back to local storage for tasks:', err);
      }
    }

    const localKey = getLocalStoreKey(userId, 'tasks');
    const existing = localStorage.getItem(localKey);
    let initialList: TaskItem[] = [];
    if (existing) {
      try {
        initialList = JSON.parse(existing);
      } catch {
        initialList = initialTasksSeed(userId);
      }
    } else {
      initialList = initialTasksSeed(userId);
      localStorage.setItem(localKey, JSON.stringify(initialList));
    }
    onUpdate(initialList);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === localKey && e.newValue) {
        try {
          onUpdate(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  },

  async saveTask(userId: string, task: TaskItem): Promise<void> {
    const isGoogleAuth = auth.currentUser && auth.currentUser.uid === userId;
    const localKey = getLocalStoreKey(userId, 'tasks');

    const raw = localStorage.getItem(localKey);
    let list: TaskItem[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      list[idx] = task;
    } else {
      list.unshift(task);
    }
    localStorage.setItem(localKey, JSON.stringify(list));

    if (isGoogleAuth) {
      const taskPath = `users/${userId}/tasks/${task.id}`;
      try {
        await setDoc(doc(db, 'users', userId, 'tasks', task.id), task);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, taskPath);
      }
    }
  },

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const isGoogleAuth = auth.currentUser && auth.currentUser.uid === userId;
    const localKey = getLocalStoreKey(userId, 'tasks');

    const raw = localStorage.getItem(localKey);
    if (raw) {
      const list: TaskItem[] = JSON.parse(raw);
      const filtered = list.filter((t) => t.id !== taskId);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }

    if (isGoogleAuth) {
      const taskPath = `users/${userId}/tasks/${taskId}`;
      try {
        await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, taskPath);
      }
    }
  },

  // AI LOGS & BRAINSTORMS
  subscribeAiLogs(userId: string, onUpdate: (logs: AiLog[]) => void): () => void {
    const isGoogleAuth = auth.currentUser && auth.currentUser.uid === userId;

    if (isGoogleAuth) {
      const logsPath = `users/${userId}/ai_logs`;
      try {
        const q = query(collection(db, 'users', userId, 'ai_logs'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const logs: AiLog[] = [];
            snapshot.forEach((docSnap) => {
              logs.push(docSnap.data() as AiLog);
            });
            onUpdate(logs);
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, logsPath);
          }
        );
        return unsubscribe;
      } catch (err) {
        console.warn('Falling back to local storage for AI logs:', err);
      }
    }

    const localKey = getLocalStoreKey(userId, 'ai_logs');
    const existing = localStorage.getItem(localKey);
    let initialList: AiLog[] = [];
    if (existing) {
      try {
        initialList = JSON.parse(existing);
      } catch {}
    }
    onUpdate(initialList);

    return () => {};
  },

  async saveAiLog(userId: string, log: AiLog): Promise<void> {
    const isGoogleAuth = auth.currentUser && auth.currentUser.uid === userId;
    const localKey = getLocalStoreKey(userId, 'ai_logs');

    const raw = localStorage.getItem(localKey);
    let list: AiLog[] = raw ? JSON.parse(raw) : [];
    list.unshift(log);
    localStorage.setItem(localKey, JSON.stringify(list.slice(0, 50)));

    if (isGoogleAuth) {
      const logPath = `users/${userId}/ai_logs/${log.id}`;
      try {
        await setDoc(doc(db, 'users', userId, 'ai_logs', log.id), log);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, logPath);
      }
    }
  },
};
