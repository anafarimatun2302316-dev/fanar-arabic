export interface AppUser {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  username?: string;
  role?: string;
  authMethod: 'google' | 'credentials';
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  aiSummary?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
}

export interface AiLog {
  id: string;
  userId: string;
  prompt: string;
  response: string;
  mode: 'summarize' | 'brainstorm' | 'extract-tasks';
  createdAt: string;
}

export type ActiveTab = 'notes' | 'tasks' | 'ai-lab' | 'settings';
