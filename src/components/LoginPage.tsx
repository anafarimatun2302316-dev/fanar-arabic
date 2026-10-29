import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Database, 
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithCredentials, loginWithGoogle, authError, clearError } = useAuth();
  const [username, setUsername] = useState('ananabila');
  const [password, setPassword] = useState('pakailogikamu86');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!username.trim() || !password) {
      setLocalError('Harap masukkan username dan password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithCredentials(username, password);
      if (!res.success) {
        setLocalError(res.error || 'Login gagal.');
      }
    } catch {
      setLocalError('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    clearError();
    setLocalError(null);
    setIsGoogleSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.warn('Google sign in aborted or failed:', err);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const quickFillCredentials = () => {
    setUsername('ananabila');
    setPassword('pakailogikamu86');
    setLocalError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            AI Workspace & Second Brain
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            ThinkLog AI
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Akses workspace pribadi Anda dengan Firebase Auth & Express Backend
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40">
          {/* Preset Credentials Banner */}
          <div className="mb-6 p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-indigo-300">Akun Pengguna Khusus:</span>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-indigo-200">
                  user: ananabila
                </span>
                <span className="font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-indigo-200">
                  pass: pakailogikamu86
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={quickFillCredentials}
              className="ml-auto text-xs font-medium text-indigo-400 hover:text-indigo-300 underline cursor-pointer shrink-0"
              title="Isi otomatis kredensial"
            >
              Isi Otomatis
            </button>
          </div>

          {(localError || authError) && (
            <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localError || authError}</span>
            </div>
          )}

          {/* Form Login: ananabila / pakailogikamu86 */}
          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username (ananabila)"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password (pakailogikamu86)"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-slate-900 text-slate-400">Atau gunakan Firebase Auth</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSubmit}
            disabled={isGoogleSubmitting}
            className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-sm font-medium text-slate-200 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 group hover:border-slate-600"
          >
            {isGoogleSubmitting ? (
              <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Masuk dengan Google (Popup)</span>
              </>
            )}
          </button>
        </div>

        {/* Feature Badges */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
            <Database className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Firestore Per-User</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Subcollections aman</div>
          </div>
          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
            <Zap className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Gemini 3.8 Flash</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Express Server-side</div>
          </div>
          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-violet-400 mx-auto mb-1" />
            <div className="text-[11px] font-semibold text-slate-200">Vercel Ready</div>
            <div className="text-[10px] text-slate-400 mt-0.5">api/index.ts rewrite</div>
          </div>
        </div>
      </div>
    </div>
  );
};
