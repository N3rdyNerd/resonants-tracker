'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Lore = { id: string; title: string; summary: string | null };

export default function PlayerPage() {
  const [items, setItems] = useState<Lore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('lore')
        .select('id,title,summary')
        .order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <main style={{padding:20}}>Loading…</main>;
  if (error)   return <main style={{padding:20, color:'crimson'}}>Error: {error}</main>;

  return (
    <main style={{padding:20}}>
      <h1>Player Lore</h1>
      <p style={{opacity:.7}}>Public entries only.</p>
      <ul>
        {items.map(i => (
          <li key={i.id} style={{margin:'12px 0'}}>
            <strong>{i.title}</strong>
            <div style={{opacity:.8}}>{i.summary}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
