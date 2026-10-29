import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Server, 
  Database, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Code2
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const [backendHealth, setBackendHealth] = useState<{
    status?: string;
    hasGeminiKey?: boolean;
    service?: string;
    timestamp?: string;
  } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const checkHealth = async () => {
    setCheckingHealth(true);
    setHealthError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`Status ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setBackendHealth(data);
    } catch (err: any) {
      setHealthError(err.message || 'Gagal menghubungi Express backend.');
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* User Session Profile Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-14 h-14 rounded-2xl border-2 border-indigo-500/40 object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-indigo-950 border-2 border-indigo-500/40 flex items-center justify-center text-xl font-bold text-indigo-300">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{user?.displayName}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                  {user?.authMethod === 'credentials' ? 'Kredensial ananabila' : 'Firebase Google'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email || 'Akun Lokal Terverifikasi'}</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span>UID: {user?.uid}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backend & Deployment Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Express Serverless API Status */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Express Backend (api/index.ts)</h3>
                <p className="text-[10px] text-slate-400">Vercel Serverless Function & Vite dev</p>
              </div>
            </div>
            <button
              type="button"
              onClick={checkHealth}
              disabled={checkingHealth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Perbarui status backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Endpoint:</span>
              <span className="text-indigo-300 font-bold">/api/health</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              {backendHealth?.status === 'ok' ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK (Online)
                </span>
              ) : healthError ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Gagal ({healthError})
                </span>
              ) : (
                <span className="text-slate-500">Memeriksa...</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Server GEMINI_API_KEY:</span>
              {backendHealth?.hasGeminiKey ? (
                <span className="text-emerald-400 font-semibold">Tersedia & Terhubung</span>
              ) : (
                <span className="text-amber-400 font-semibold">Default / Pending</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Arsitektur Ekspor:</span>
              <span className="text-slate-200">export default app (no listen)</span>
            </div>
          </div>
        </div>

        {/* Firestore Configuration */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Firebase & Firestore</h3>
              <p className="text-[10px] text-slate-400">Database per-user real-time</p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Project ID:</span>
              <span className="text-slate-200 truncate max-w-[200px]">{firebaseConfig.projectId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Database ID:</span>
              <span className="text-emerald-400 truncate max-w-[200px]">{firebaseConfig.firestoreDatabaseId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Auth Rules:</span>
              <span className="text-indigo-300">Hardened ABAC (/users/{'{uid}'})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Provider:</span>
              <span className="text-slate-200">Google Sign-in + ananabila</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vercel Deployment Checklist */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white">Spesifikasi Deploy Vercel (vercel.json)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Rewrite /api/* ke /api
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Rute serverless function Vercel di api/index.ts
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Output: dist
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Build Vite teroptimasi untuk SPA client
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Server-side Gemini API
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              GEMINI_API_KEY aman di environment backend
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
