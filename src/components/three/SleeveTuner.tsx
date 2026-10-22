"use client";

import { useEffect, useState } from "react";
import { SLEEVE, SLEEVE_TUNED } from "./Gown";

type Key = keyof typeof SLEEVE;

const SLIDERS: { key: Key; label: string; min: number; max: number; step: number }[] = [
  { key: "width", label: "width (radius over the arm, m)", min: 0.05, max: 0.15, step: 0.001 },
  { key: "opening", label: "opening (radius at the wrist, m)", min: 0.03, max: 0.2, step: 0.001 },
];

/** Dev aid, shown with `?tune` in the URL: sliders that resize the gown's sleeves live, and the line to paste back. */
export function SleeveTuner() {
  const [on, setOn] = useState(false);
  const [values, setValues] = useState({ ...SLEEVE });
  // Read after hydration: the server never sees the query.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOn(new URLSearchParams(location.search).has("tune")), []);
  // The gown rebuilds its sleeves from SLEEVE on this event.
  useEffect(() => {
    Object.assign(SLEEVE, values);
    dispatchEvent(new Event(SLEEVE_TUNED));
  }, [values]);
  if (!on) return null;

  const set = (key: Key, v: number) => setValues((old) => ({ ...old, [key]: v }));
  const line = `SLEEVE = ${JSON.stringify(values)}`;

  return (
    <div className="fixed top-20 right-4 z-50 w-80 rounded-2xl bg-white/90 p-4 text-xs shadow-lg ring-1 ring-black/10">
      <p className="mb-2 font-semibold">Gown sleeves (education page)</p>
      {SLIDERS.map(({ key, label, min, max, step }) => (
        <label key={key} className="mb-1 block">
          {label}: {values[key]}
          <input type="range" className="block w-full" min={min} max={max} step={step} value={values[key]} onChange={(e) => set(key, Number(e.target.value))} />
        </label>
      ))}
      <code className="mt-2 block break-all rounded bg-black/5 p-2 select-all">{line}</code>
      <button type="button" className="mt-2 cursor-pointer rounded-full bg-black/80 px-3 py-1 text-white" onClick={() => navigator.clipboard.writeText(line)}>
        Copy
      </button>
    </div>
  );
}
