'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

type Lore = { id: string; title: string; visibility: 'public'|'private' };

export default function DMPage() {
  const supabase = useMemo(() => getSupabase(), []);
  const [email, setEmail] = useState('');
  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState<Lore[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      if (data.session) refresh();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s);
      if (s) refresh();
    });
    return () => sub?.subscription.unsubscribe();
  }, [supabase]);

  async function sendMagicLink() {
    if (!supabase) return;
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/dm' },
    });
    setMsg(error ? `Error: ${error.message}` : 'Check your email for the login link.');
  }

  async function refresh() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('lore')
      .select('id,title,visibility')
      .order('created_at', { ascending: false });
    if (error) setMsg(`Error: ${error.message}`); else setItems(data ?? []);
  }

  async function toggleVisibility(id: string, current: 'public'|'private') {
    if (!supabase) return;
    const next = current === 'public' ? 'private' : 'public';
    const { error } = await supabase.from('lore').update({ visibility: next }).eq('id', id);
    if (error) setMsg(`Update failed: ${error.message}`); else refresh();
  }

  if (!authed) {
    return (
      <main style={{ padding: 24, maxWidth: 520 }}>
        <h1>DM Login</h1>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ width: '100%', padding: 10, margin: '12px 0' }}
        />
        <button onClick={sendMagicLink} style={{ padding: '10px 14px' }}>Send Login Link</button>
        {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>DM – Lore Admin</h1>
      {msg && <p style={{ color: 'crimson' }}>{msg}</p>}
      <button onClick={refresh} style={{ padding: '6px 10px', margin: '8px 0 16px' }}>Refresh</button>
      <ul>
        {items.map(i => (
          <li key={i.id} style={{ margin: '10px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
            <strong style={{ minWidth: 260 }}>{i.title}</strong>
            <span style={{ opacity: .8 }}>{i.visibility}</span>
            <button onClick={() => toggleVisibility(i.id, i.visibility)} style={{ padding: '6px 10px' }}>
              {i.visibility === 'public' ? 'Make Private' : 'Make Public'}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
