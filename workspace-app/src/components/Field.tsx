import { useEffect, useId, useState } from 'react';

/* A number field that shows thousands separators while you read it and a
   plain number while you type it. Empty means "not given" (null), never 0 —
   the engine treats a missing input as unknown, and 0 would be a real answer. */
export function NumberField(props: {
  label: string; unit: string; value: number | null | undefined; onChange: (v: number | null) => void;
  hint?: string; placeholder?: string; step?: number;
}) {
  const id = useId();
  const [focus, setFocus] = useState(false);
  const [text, setText] = useState(props.value == null ? '' : String(props.value));
  useEffect(() => { if (!focus) setText(props.value == null ? '' : String(props.value)); }, [props.value, focus]);
  const shown = focus || props.value == null ? text : props.value.toLocaleString('en-GB');
  return (
    <div className="field">
      <label htmlFor={id}>{props.label}</label>
      <div className="field-box">
        <input id={id} inputMode="decimal" autoComplete="off" spellCheck={false}
          placeholder={props.placeholder ?? 'not given'} value={shown}
          aria-describedby={props.hint ? `${id}-h` : undefined}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onChange={e => {
            const raw = e.target.value.replace(/[^\d.]/g, '');
            setText(raw);
            props.onChange(raw === '' || raw === '.' ? null : Number(raw));
          }} />
        <span className="field-unit">{props.unit}</span>
      </div>
      {props.hint && <p className="field-hint" id={`${id}-h`}>{props.hint}</p>}
    </div>
  );
}

export function Segmented<T extends string | boolean | null>(props: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      <span className="field-label" id={id}>{props.label}</span>
      <div className="seg" role="radiogroup" aria-labelledby={id}>
        {props.options.map(o => (
          <button key={String(o.value)} type="button" role="radio" aria-checked={props.value === o.value}
            className={props.value === o.value ? 'on' : ''} onClick={() => props.onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Switch(props: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="switch-row">
      <button type="button" role="switch" id={id} aria-checked={props.checked}
        className={`switch${props.checked ? ' on' : ''}`} onClick={() => props.onChange(!props.checked)}>
        <span className="switch-knob" />
      </button>
      <label htmlFor={id}>
        {props.label}
        {props.hint && <span className="switch-hint">{props.hint}</span>}
      </label>
    </div>
  );
}
