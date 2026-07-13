import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao logar');
      localStorage.setItem('nuve_token', data.token);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tighter mb-2" style={{letterSpacing: '-0.05em'}}>
            nuve<span className="text-sky-400">.</span>
          </h1>
          <p className="nuve-mono text-[10px] text-slate-500 uppercase tracking-[0.3em]">
            Access Console V2.0
          </p>
        </div>

        <div className="nuve-card">
          {error && (
            <div className="nuve-mono text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 p-4 mb-6 uppercase tracking-widest text-center">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block nuve-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2 ml-1">Email_Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required 
                className="nuve-input" 
                placeholder="admin@nuve.dev" 
              />
            </div>
            <div>
              <label className="block nuve-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2 ml-1">Access_Key</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
                className="nuve-input" 
                placeholder="••••••••" 
              />
            </div>

            <button type="submit" className="w-full nuve-btn-primary mt-4">
              Authenticate
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="nuve-mono text-[10px] text-slate-500 uppercase tracking-widest">
              Ainda não tem conta? <a href="#" className="text-sky-400 hover:text-sky-300">Criar Acesso</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
