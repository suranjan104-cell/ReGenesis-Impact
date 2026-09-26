import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from './Icons';

export type Cmd = {
  id: string; group: string; label: string; hint?: string; keywords?: string; run: () => void;
};

/* Every token must appear somewhere in the item; earlier and tighter matches
   rank higher. Deliberately simple — the whole index is a few dozen items. */
function score(c: Cmd, q: string) {
  if (!q) return 1;
  const hay = `${c.label} ${c.hint ?? ''} ${c.keywords ?? ''} ${c.group}`.toLowerCase();
  let s = 0;
  for (const tok of q.toLowerCase().split(/\s+/).filter(Boolean)) {
    const i = hay.indexOf(tok);
    if (i < 0) return 0;
    s += 100 - Math.min(i, 90) + (c.label.toLowerCase().startsWith(tok) ? 50 : 0);
  }
  return s;
}

export function Palette({ open, onClose, commands, quiet }: {
  open: boolean; onClose: () => void; commands: Cmd[]; quiet: string[];
}) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) { back.current = document.activeElement as HTMLElement; setQ(''); setI(0); setTimeout(() => input.current?.focus(), 0); }
    else back.current?.focus?.();
  }, [open]);

  // Groups in `quiet` (the factor register) only appear once you type.
  const results = useMemo(() => commands
    .filter(c => q || !quiet.includes(c.group))
    .map(c => ({ c, s: score(c, q) })).filter(x => x.s > 0)
    .sort((a, b) => (q ? b.s - a.s : 0))
    .slice(0, 40).map(x => x.c), [commands, q, quiet]);

  useEffect(() => { setI(0); }, [q]);
  useEffect(() => {
    list.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [i]);

  if (!open) return null;
  const run = (c: Cmd | undefined) => { if (!c) return; onClose(); setTimeout(c.run, 0); };

  let lastGroup = '';
  return (
    <div className="pal-scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pal" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="pal-in">
          <Search size={16} />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Jump to, open, search factors…" role="combobox" aria-expanded="true"
            aria-controls="pal-list" aria-activedescendant={results[i] ? `pal-${results[i].id}` : undefined}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setI(v => Math.min(v + 1, results.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setI(v => Math.max(v - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); run(results[i]); }
              else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            }} />
          <kbd>esc</kbd>
        </div>
        <div className="pal-list" id="pal-list" role="listbox" ref={list} aria-label="Results">
          {results.length === 0 && <p className="pal-none">No match. Try a regime, an instrument, or a fuel.</p>}
          {results.map((c, n) => {
            const head = c.group !== lastGroup ? (lastGroup = c.group) : null;
            return (
              <div key={c.id}>
                {head && <p className="pal-group" role="presentation">{head}</p>}
                <div id={`pal-${c.id}`} data-i={n} role="option" aria-selected={n === i}
                  className={`pal-item${n === i ? ' on' : ''}`}
                  onMouseMove={() => setI(n)} onClick={() => run(c)}>
                  <span className="pal-label">{c.label}</span>
                  {c.hint && <span className="pal-hint">{c.hint}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="pal-foot" aria-hidden><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span></div>
      </div>
    </div>
  );
}
