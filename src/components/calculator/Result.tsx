import type { CalcResult } from "./types";

const krw = (n: number) =>
  new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(n));

export function ResultDashboard({ result }: { result: CalcResult }) {
  const { breakdown } = result;
  const total = Math.max(
    1,
    breakdown.sourcing + breakdown.logistics + breakdown.platformFee + breakdown.marketing + breakdown.margin,
  );

  const verdictStyle = {
    GO: "bg-secondary text-secondary-foreground",
    WAIT: "bg-warning text-warning-foreground",
    NO: "bg-danger text-foreground",
  }[result.verdict];

  const positionStyle = {
    LOW: "border-muted-foreground/40 text-muted-foreground",
    MID: "border-primary/60 text-primary",
    PREMIUM: "border-secondary/60 text-secondary",
  }[result.marketPosition];

  const segments = [
    { key: "소싱원가", value: breakdown.sourcing, color: "var(--primary)" },
    { key: "물류", value: breakdown.logistics, color: "oklch(0.65 0.18 200)" },
    { key: "플랫폼수수료", value: breakdown.platformFee, color: "oklch(0.7 0.18 290)" },
    { key: "광고비", value: breakdown.marketing, color: "var(--warning)" },
    { key: "마진", value: breakdown.margin, color: "var(--secondary)" },
  ];

  return (
    <div className="grid gap-6 animate-fade-in-up">
      {/* Top row */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none"
               style={{ background: "radial-gradient(circle at 20% 0%, rgba(0,212,255,0.18), transparent 60%)" }} />
          <div className="relative">
            <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-3">
              권장 판매가
            </div>
            <div className="font-mono text-5xl md:text-6xl font-bold text-primary tabular-nums leading-none">
              ₩{krw(result.recommendedPrice)}
            </div>
            <div className="mt-4 flex gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-md border font-mono text-xs tracking-widest ${positionStyle}`}>
                {result.marketPosition}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-md font-mono text-xs tracking-widest ${verdictStyle}`}>
                · 시장 포지션
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-3">
            BEP ROAS
          </div>
          <div className="font-mono text-5xl font-bold text-foreground tabular-nums">
            {result.bepRoas.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-2">손익분기 광고효율</div>
          <div className="mt-auto pt-4">
            <div className={`text-center font-bold tracking-[0.4em] py-3 rounded-lg ${verdictStyle}`}>
              {result.verdict}
            </div>
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            비용 구조
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            총 ₩{krw(total)}
          </div>
        </div>

        <div className="flex h-10 rounded-md overflow-hidden border border-border">
          {segments.map((seg) => {
            const pct = (seg.value / total) * 100;
            if (pct < 0.5) return null;
            return (
              <div
                key={seg.key}
                style={{ width: `${pct}%`, background: seg.color }}
                className="flex items-center justify-center text-[10px] font-mono font-bold text-background"
                title={`${seg.key}: ₩${krw(seg.value)}`}
              >
                {pct > 8 ? `${pct.toFixed(0)}%` : ""}
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          {segments.map((seg) => (
            <div key={seg.key} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: seg.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                  {seg.key}
                </div>
                <div className="font-mono text-sm font-semibold tabular-nums">
                  ₩{krw(seg.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LoadingDashboard() {
  const lines = [
    "시장 데이터 수집 중...",
    "경쟁사 가격 분석 중...",
    "ROAS 시뮬레이션 계산 중...",
  ];
  return (
    <div className="bg-card border border-border rounded-xl p-10 grid gap-6">
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        분석 진행
      </div>
      <div className="font-mono text-2xl text-primary animate-pulse">
        시장 데이터 수집 중...
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden shimmer" />
      <ul className="space-y-2 font-mono text-xs text-muted-foreground">
        {lines.map((l, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}