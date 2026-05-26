import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
  suffix,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  suffix?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          {label}
        </span>
        {suffix && (
          <span className="text-[10px] uppercase tracking-widest text-primary/70">{suffix}</span>
        )}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground/80">{hint}</p>}
    </label>
  );
}

export function NumInput({
  value,
  onChange,
  placeholder,
  min = 0,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  min?: number;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder={placeholder}
      className="w-full bg-input/60 border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none rounded-md px-4 py-3 font-mono text-lg text-foreground transition-all"
    />
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-input/60 border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none rounded-md px-4 py-3 font-mono text-lg text-foreground transition-all"
    />
  );
}

export function RangeSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "%",
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-2xl text-primary font-semibold tabular-nums">
          {value}
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          {min} — {max}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
        style={{
          background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, var(--muted) ${pct}%, var(--muted) 100%)`,
        }}
      />
    </div>
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full bg-input/60 border border-border focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none rounded-md px-4 py-3 font-mono text-base text-foreground transition-all"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-card text-foreground">
          {o.label}
        </option>
      ))}
    </select>
  );
}