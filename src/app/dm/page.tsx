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

  // form state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'public'|'private'>('public');
  const [saving, setSaving] = useState(false);

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

  async function createLore(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setMsg(null);
    if (!title.trim()) { setMsg('Title is required.'); setSaving(false); return; }
    const { error } = await supabase.from('lore').insert([{ title, summary, body, visibility }]);
    setSaving(false);
    if (error) { setMsg(`Create failed: ${error.message}`); return; }
    setTitle(''); setSummary(''); setBody(''); setVisibility('public');
    await refresh();
    setMsg('Lore created.');
  }

  if (!authed) {
    return (
      <main style={{ padding: 24, maxWidth: 720 }}>
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
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1>DM – Lore Admin</h1>
      {msg && <p style={{ color: msg.startsWith('Error') ? 'crimson' : 'limegreen' }}>{msg}</p>}

      {/* Create form */}
      <form onSubmit={createLore} style={{ display: 'grid', gap: 8, margin: '16px 0 24px' }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title *"
          style={{ padding: 10 }}
        />
        <input
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="Short summary"
          style={{ padding: 10 }}
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Body (full text)"
          rows={6}
          style={{ padding: 10 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label>
            Visibility:&nbsp;
            <select value={visibility} onChange={e => setVisibility(e.target.value as 'public'|'private')}>
              <option value="public">public</option>
              <option value="private">private</option>
            </select>
          </label>
          <button type="submit" disabled={saving} style={{ padding: '8px 12px' }}>
            {saving ? 'Saving…' : 'Create'}
          </button>
          <button type="button" onClick={refresh} style={{ padding: '8px 12px' }}>Refresh</button>
        </div>
      </form>

      {/* List */}
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
