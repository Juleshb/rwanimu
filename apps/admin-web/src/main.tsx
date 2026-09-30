import React from 'react';
import { createRoot } from 'react-dom/client';
import logo from './assets/rwanimu-logo.png';
import './styles.css';
import { api, User } from './api';
import { Screen } from './screens';

const navByRole: Record<User['role'], string[]> = {
  ADMIN: ['Dashboard', 'Products', 'Stock', 'Purchases', 'Sales', 'Customers', 'Transfers', 'Expenses', 'Reports', 'Users', 'Messaging', 'Website CMS', 'Trusted Devices', 'Backup & Restore', 'Monitoring'],
  MANAGER: ['Dashboard', 'Stock', 'Sales', 'Customers', 'Transfers', 'Expenses', 'Reports', 'Messaging'],
  STOREKEEPER: ['Dashboard', 'Physical Stock Count'],
  BRANCH_USER: ['Dashboard', 'Stock', 'Sales', 'Customers', 'Transfers', 'Expenses', 'Reports'],
};

function Login({ onLogin }: { onLogin: (t: string, u: User) => void }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [err, setErr] = React.useState('');
  return <div className="login"><img src={logo} alt="RWANIMU" /><h1>RWANIMU Company Ltd</h1><p>Shop Management System</p>
    <form onSubmit={async e => { e.preventDefault(); setErr(''); try { const d = await api('/auth/login', '', { method: 'POST', body: JSON.stringify({ username, password }) }); onLogin(d.accessToken, d.user); } catch (x: any) { setErr(x.message); } }}>
      <label>Username<input value={username} onChange={e => setUsername(e.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
      {err && <div className="error">{err}</div>}<button>Sign in</button>
    </form></div>;
}

function App() {
  const [token, setToken] = React.useState(localStorage.getItem('access_token') || '');
  const [user, setUser] = React.useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('auth_user') || 'null'); } catch { return null; } });
  const [page, setPage] = React.useState('Dashboard');
  const [lang, setLang] = React.useState<'en' | 'rw'>('en');
  if (!token || !user) return <Login onLogin={(t, u) => { localStorage.setItem('access_token', t); localStorage.setItem('auth_user', JSON.stringify(u)); setToken(t); setUser(u); }} />;
  const pages = navByRole[user.role] || [];
  const current = pages.includes(page) ? page : pages[0];
  return <div className="app"><aside><div className="brand"><img src={logo} alt="" /><div><b>RWANIMU</b><small>Shop Management System</small></div></div>
    <div className="identity"><b>{user.username}</b><span>{user.role.replace('_', ' ')}</span></div>
    <nav>{pages.map(n => <button className={current === n ? 'active' : ''} onClick={() => setPage(n)} key={n} type="button">{n}</button>)}</nav></aside>
    <main><header className="top"><div><h1>{current}</h1><span>Musanze / Muhoza · 0783005604 WhatsApp · 0788542392 Telephone</span></div>
      <div><button type="button" onClick={() => setLang(lang === 'en' ? 'rw' : 'en')}>{lang === 'en' ? 'Kinyarwanda' : 'English'}</button><button type="button" onClick={() => { localStorage.clear(); setToken(''); setUser(null); }}>Sign out</button></div></header>
      <Screen name={current} token={token} user={user} /></main></div>;
}

createRoot(document.getElementById('root')!).render(<App />);
