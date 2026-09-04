'use client';
import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
const subscribe = (cb: () => void) => { window.addEventListener('dockfold-theme', cb); return () => window.removeEventListener('dockfold-theme', cb); };
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme ?? 'light', () => 'light');
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('dockfold:theme', next); } catch { /* continue without persistence */ }
    window.dispatchEvent(new Event('dockfold-theme'));
  }
  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance`}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
