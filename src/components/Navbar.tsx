import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from '../types';
import { 
  Sparkles, 
  BookOpen, 
  CheckSquare, 
  Lightbulb, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Cloud,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  notesCount: number;
  tasksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  notesCount,
  tasksCount,
}) => {
  const { user, logout } = useAuth();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowConfirmLogout(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">ThinkLog AI</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Pro
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span>Firestore Sync</span>
                </div>
              </div>
            </div>

            {/* Middle: Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => onTabChange('notes')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Catatan & Ide</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'notes' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {notesCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('tasks')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Action Items</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'tasks' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tasksCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('ai-lab')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'ai-lab'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Brainstorm Lab</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('settings')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Akun & Sistem</span>
              </button>
            </nav>

            {/* Right: User & Logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 pl-2">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>{user?.displayName || 'User'}</span>
                    {user?.authMethod === 'credentials' && (
                      <span className="text-[10px] text-amber-400 font-mono">(@ananabila)</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{user?.authMethod === 'google' ? 'Google Auth' : 'Verified Login'}</span>
                  </div>
                </div>
              </div>

              {/* Explicit Logout Button */}
              <button
                type="button"
                onClick={() => setShowConfirmLogout(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-medium transition-all cursor-pointer"
                title="Keluar dari akun"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden border-t border-slate-800 bg-slate-950/80 px-2 py-2 flex items-center justify-around">
          <button
            type="button"
            onClick={() => onTabChange('notes')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium ${
              activeTab === 'notes' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Catatan</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('tasks')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium ${
              activeTab === 'tasks' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tugas</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('ai-lab')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium ${
              activeTab === 'ai-lab' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-300" />
            <span>AI Lab</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('settings')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium ${
              activeTab === 'settings' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Sistem</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <LogOut className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Konfirmasi Logout</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin keluar dari workspace ThinkLog AI? Anda dapat masuk kembali kapan saja menggunakan kredensial ananabila atau Google Sign-in.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmLogout(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Ya, Logout Sekarang</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
