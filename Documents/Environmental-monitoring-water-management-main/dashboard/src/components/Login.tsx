import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        onLogin(data.token);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection refused. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117] flex items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md">
        <div className="glass-card border border-slate-200 dark:border-white/10 p-8 relative z-10 shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30">
              <Shield size={32} className="text-emerald-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2 tracking-tight">EcoGuard Secure</h2>
          <p className="text-slate-400 text-center text-sm mb-8">Authenticate to access environmental controls</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6 flex items-center gap-3">
               <AlertCircle size={16} className="text-red-400" />
               <span className="text-red-400 text-sm font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 rounded-xl transition-all mt-6 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access System'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
