'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

type Lore = {
  id: string;
  title: string;
  summary: string | null;
  kind: string | null;
  tags: string[] | null;
  unlock_session: number | null;
};

export default function PlayerPage() {
  const supabase = useMemo(() => getSupabase(), []);

  // raw data and filtered view
  const [allItems, setAllItems] = useState<Lore[]>([]);
  const [items, setItems] = useState<Lore[]>([]);

  // ui state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [q, setQ] = useState('');                 // search text
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>(''); // when a chip is clicked

  // fetch once
  useEffect(() => {
    if (!supabase) {
      setError('Supabase client unavailable');
      setLoading(false);
      return;
    }

    (async () => {
      // read current session (public)
      const { data: ss, error: ssErr } = await supabase
        .from('site_state')
        .select('current_session')
        .eq('id', 1)
        .maybeSingle();

      if (ssErr) {
        setError(ssErr.message);
        setLoading(false);
        return;
      }

      const current = ss?.current_session ?? 0;

      // fetch *public + unlocked* lore
      const { data, error } = await supabase
        .from('lore')
        .select('id,title,summary,kind,tags,unlock_session')
        .eq('visibility', 'public')
        .lte('unlock_session', current)
        .order('created_at', { ascending: false });

      if (error) setError(error.message);
      else {
        const rows = (data ?? []) as Lore[];
        setAllItems(rows);
        setItems(rows); // initial view unfiltered
      }
      setLoading(false);
    })();
  }, [supabase]);

  // apply filters anytime q/kind/tag/allItems changes
  useEffect(() => {
    const needle = q.trim().toLowerCase();

    const filtered = allItems.filter((i) => {
      if (kindFilter !== 'all' && (i.kind ?? 'misc') !== kindFilter) return false;

      if (tagFilter) {
        const has = (i.tags ?? []).some((t) => t.toLowerCase() === tagFilter.toLowerCase());
        if (!has) return false;
      }

      if (!needle) return true;

      const hay =
        `${i.title} ${i.summary ?? ''} ${(i.tags ?? []).join(' ')}`.toLowerCase();
      return hay.includes(needle);
    });

    setItems(filtered);
  }, [q, kindFilter, tagFilter, allItems]);

  const kinds = useMemo(() => {
    const set = new Set<string>();
    for (const i of allItems) set.add((i.kind ?? 'misc'));
    return ['all', ...Array.from(set).sort()];
  }, [allItems]);

  function clearFilters() {
    setQ('');
    setKindFilter('all');
    setTagFilter('');
  }

  if (loading) return <main style={{ padding: 20 }}>Loading…</main>;
  if (error)   return <main style={{ padding: 20, color: 'crimson' }}>Error: {error}</main>;

  return (
    <main style={{ padding: 20 }}>
      <h1>Player Lore</h1>
      <p style={{ opacity: 0.7, marginBottom: 12 }}>Public, unlocked entries only.</p>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, summary, or tags…"
          style={{ padding: 8, minWidth: 240 }}
        />

        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          style={{ padding: 8 }}
        >
          {kinds.map(k => <option key={k} value={k}>{k}</option>)}
        </select>

        {tagFilter && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #555',
            padding: '4px 8px',
            borderRadius: 999
          }}>
            tag: {tagFilter}
            <button onClick={() => setTagFilter('')} style={{ padding: '2px 6px' }}>✕</button>
          </span>
        )}

        <button onClick={clearFilters} style={{ padding: '8px 10px' }}>
          Clear
        </button>
      </div>

      {/* Results */}
      {items.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No entries match your filters.</p>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i.id} style={{ margin: '14px 0' }}>
              <strong>
                <Link href={`/player/lore/${i.id}`}>{i.title}</Link>
              </strong>

              <div style={{ opacity: 0.8, marginTop: 2 }}>
                {i.kind ? `[${i.kind}] ` : ''}{i.summary}
              </div>

              {/* tag chips */}
              {!!i.tags?.length && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  {i.tags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTagFilter(t)}
                      title="Filter by tag"
                      style={{
                        padding: '4px 8px',
                        borderRadius: 999,
                        border: '1px solid #555',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 12,
                        opacity: 0.9
                      }}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
