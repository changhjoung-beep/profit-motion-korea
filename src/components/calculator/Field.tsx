import type { ReactNode } from "react";

// 관련 입력 필드를 묶는 섹션 — 연한 회색 그룹 배경 + 섹션 제목/설명
export function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-muted/60 p-5 md:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
        {desc && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>}
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

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
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-sm font-semibold text-foreground tracking-tight">{label}</span>
        {suffix && (
          <span className="text-xs font-semibold text-muted-foreground tabular-nums shrink-0">{suffix}</span>
        )}
      </div>
      {children}
      {hint && <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{hint}</p>}
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
      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none rounded-lg px-4 py-3 font-mono text-lg text-foreground placeholder:text-muted-foreground/60 transition-all"
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
      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none rounded-lg px-4 py-3 text-lg text-foreground placeholder:text-muted-foreground/60 transition-all"
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
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-mono text-2xl text-foreground font-bold tabular-nums">
          {value}
          <span className="text-sm text-muted-foreground font-semibold ml-1">{unit}</span>
        </span>
        <span className="text-xs text-muted-foreground font-mono">
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
      className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none rounded-lg px-4 py-3 text-base text-foreground transition-all"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-card text-foreground">
          {o.label}
        </option>
      ))}
    </select>
  );
}