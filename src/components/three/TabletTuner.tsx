"use client";

import { useEffect, useState } from "react";
import { TABLET } from "./props";

type Key = keyof typeof TABLET;

const SLIDERS: { key: Key; label: string; min: number; max: number; step: number }[] = [
  { key: "reach", label: "reach (to fingertips, m)", min: -0.15, max: 0.25, step: 0.002 },
  { key: "side", label: "side (across the palm, m)", min: -0.15, max: 0.15, step: 0.002 },
  { key: "lift", label: "lift (off the hand, m)", min: -0.05, max: 0.1, step: 0.001 },
  { key: "pitch", label: "pitch (°)", min: -90, max: 90, step: 1 },
  { key: "roll", label: "roll (°)", min: -90, max: 90, step: 1 },
  { key: "yaw", label: "yaw (°)", min: -180, max: 180, step: 1 },
  { key: "scale", label: "scale", min: 0.5, max: 3, step: 0.05 },
];

/** Dev aid, shown with `?tune` in the URL: sliders that move the Mobileye tablet live, and the line to paste back. */
export function TabletTuner() {
  const [on, setOn] = useState(false);
  const [values, setValues] = useState({ ...TABLET });
  // Read after hydration: the server never sees the query.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOn(new URLSearchParams(location.search).has("tune")), []);
  // The scene reads TABLET every frame.
  useEffect(() => void Object.assign(TABLET, values), [values]);
  if (!on) return null;

  const set = (key: Key, v: number) => setValues((old) => ({ ...old, [key]: v }));
  const line = `TABLET = ${JSON.stringify(values)}`;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 rounded-2xl bg-white/90 p-4 text-xs shadow-lg ring-1 ring-black/10">
      <p className="mb-2 font-semibold">Tablet (Mobileye page)</p>
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
