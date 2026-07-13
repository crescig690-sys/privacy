import React, { useEffect, useState } from 'react';
import { LogOut, Home, Activity, Plug, Users, Share2, Settings } from 'lucide-react';

export default function Dashboard({ onLogout }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/auth/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('nuve_token')}` }
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => onLogout());
  }, []);

  if (!user) return <div className="min-h-screen flex items-center justify-center nuve-mono text-xs uppercase tracking-widest text-sky-400">Loading...</div>;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 glass hidden md:flex flex-col border-r border-slate-800/50">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tighter" style={{letterSpacing: '-0.05em'}}>
            nuve<span className="text-sky-400">.</span>
          </h1>
        </div>
        <nav className="flex-1 mt-4 block">
          <a href="#" className="flex items-center px-8 py-4 bg-sky-500/10 text-sky-400 border-r-2 border-sky-400">
            <Home className="mr-3 w-5 h-5" /> <span className="nuve-mono text-xs uppercase tracking-widest">Dashboard</span>
          </a>
          <a href="#" className="flex items-center px-8 py-4 text-slate-400 hover:text-white transition hover:bg-white/5">
            <Activity className="mr-3 w-5 h-5" /> <span className="nuve-mono text-xs uppercase tracking-widest">Access Logs</span>
          </a>
          <a href="#" className="flex items-center px-8 py-4 text-slate-400 hover:text-white transition hover:bg-white/5">
            <Plug className="mr-3 w-5 h-5" /> <span className="nuve-mono text-xs uppercase tracking-widest">Integrações</span>
          </a>
          {user.role === 'admin' && (
            <>
              <a href="#" className="flex items-center px-8 py-4 text-slate-400 hover:text-white transition hover:bg-white/5">
                <Users className="mr-3 w-5 h-5" /> <span className="nuve-mono text-xs uppercase tracking-widest">Clientes</span>
              </a>
              <a href="#" className="flex items-center px-8 py-4 text-slate-400 hover:text-white transition hover:bg-white/5">
                <Share2 className="mr-3 w-5 h-5" /> <span className="nuve-mono text-xs uppercase tracking-widest">Referrals</span>
              </a>
              <a href="#" className="flex items-center px-8 py-4 text-slate-400 hover:text-white transition hover:bg-white/5">
                <Settings className="mr-3 w-5 h-5" /> <span className="nuve-mono text-xs uppercase tracking-widest">Sistema</span>
              </a>
            </>
          )}
        </nav>
        <div className="p-8 border-t border-white/10">
          <button onClick={onLogout} className="flex items-center text-rose-500 hover:text-rose-400 transition nuve-mono text-xs uppercase tracking-widest">
            <LogOut className="mr-3 w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 glass sticky top-0 z-10">
          <h2 className="text-sm nuve-mono uppercase tracking-widest text-slate-400">Olá, <span className="text-white">{user.name}</span></h2>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 border border-sky-500/20 nuve-mono text-xs uppercase">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="nuve-card">
              <div className="flex items-center justify-between mb-6">
                <span className="nuve-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Views Totais</span>
              </div>
              <div className="text-4xl font-black nuve-mono tracking-tighter">0</div>
            </div>
            <div className="nuve-card">
              <div className="flex items-center justify-between mb-6">
                <span className="nuve-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Conversões</span>
              </div>
              <div className="text-4xl font-black nuve-mono tracking-tighter">0</div>
            </div>
            <div className="nuve-card">
              <div className="flex items-center justify-between mb-6">
                <span className="nuve-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Receita Total</span>
              </div>
              <div className="text-4xl font-black nuve-mono tracking-tighter">R$ 0,00</div>
            </div>
            <div className="nuve-card">
              <div className="flex items-center justify-between mb-6">
                <span className="nuve-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Bloqueados</span>
              </div>
              <div className="text-4xl font-black nuve-mono tracking-tighter">0</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
