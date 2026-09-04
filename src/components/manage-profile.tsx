'use client';
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { readReceiptKey, forgetReceipt } from '@/lib/receipt';
const subscribe = (cb: () => void) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); };
export function ManageProfile({ id }: { id: string }) {
  const savedKey = useSyncExternalStore(subscribe, () => new URLSearchParams(location.hash.slice(1)).get('key') ?? readReceiptKey(id), () => '');
  const [manualKey, setManualKey] = useState('');
  const [state, setState] = useState<'ready' | 'confirm' | 'busy' | 'deleted'>('ready');
  const [error, setError] = useState('');
  const deletionKey = manualKey || savedKey;
  async function remove() {
    setState('busy'); setError('');
    try {
      const response = await fetch(`/api/profiles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${deletionKey}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      forgetReceipt(id); history.replaceState(null, '', `/manage/${id}`); setState('deleted');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not delete this Dock. Please retry.'); setState('ready'); }
  }
  return <main className="narrow-page management-page"><Link href="/" className="back-link"><ArrowLeft size={16} /> DockFold</Link>
    <h1>{state === 'deleted' ? 'Your Dock is deleted.' : 'Your Dock. Your call.'}</h1>
    <p>{state === 'deleted' ? 'The shared link no longer shows your profile. Your Mac’s Dock is unchanged.' : 'Delete your shared profile whenever you like. This only removes the profile on DockFold.'}</p>
    {state !== 'deleted' ? <><Link className="text-button" href={`/p/${id}`}>View shared Dock</Link>
      <label className="key-input"><span>Deletion key</span><input type="password" value={deletionKey} onChange={event => setManualKey(event.target.value)} autoComplete="off" placeholder="Paste the key from your saved management link" /></label>
      <p className="form-privacy">The key is included after #key= in your saved management link. Without it, this page cannot delete the Dock.</p>
      {state === 'confirm' || state === 'busy' ? <div className="delete-confirm"><h2>Delete this shared Dock?</h2><p>The link will stop working. This cannot be undone; you can create a new share from your Mac.</p><div className="share-actions"><button className="button button-danger" disabled={state === 'busy'} onClick={() => void remove()}>{state === 'busy' ? 'Deleting…' : 'Delete permanently'}</button><button className="button button-line" disabled={state === 'busy'} onClick={() => setState('ready')}>Keep Dock</button></div></div> : <button className="button button-danger" disabled={!/^[a-f0-9]{64}$/.test(deletionKey)} onClick={() => setState('confirm')}><Trash2 size={16} /> Delete this Dock</button>}
    </> : <Link className="button button-dark" href="/">Back to DockFold</Link>}
    {error ? <p role="alert" className="form-error">{error}</p> : null}
  </main>;
}
