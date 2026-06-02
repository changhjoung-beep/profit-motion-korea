import { useEffect, useState } from "react";
import type { EngineResult, Verdict } from "./types";
import {
  downloadPricingGuide,
  downloadAdCopyPack,
  downloadScoutSummary,
  downloadDesignBrief,
} from "./reportGenerators";

const krw = (n?: number) =>
  n == null ? "—" : new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(n));

const verdictStyle: Record<Verdict, string> = {
  GO: "bg-secondary text-secondary-foreground",
  WAIT: "bg-warning text-warning-foreground",
  NO: "bg-danger text-white",
};
const verdictLabel: Record<Verdict, string> = {
  GO: "GO · 진입 권장",
  WAIT: "WAIT · 조건부 보류",
  NO: "NO · 진입 비권장",
};

// ════════════════════════════════════════════════════════════════
// 1장 요약 대시보드 + 다운로드
// ════════════════════════════════════════════════════════════════
export function EngineDashboard({ result }: { result: EngineResult }) {
  const { scout, pricing, gtm } = result;

  return (
    <div className="grid gap-6 animate-fade-in-up">
      {/* BLOCKED 안내 배너 */}
      {result.blocked && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
          <div className="font-mono text-xs tracking-widest text-warning mb-1">
            // SCOUT 게이트 — 파이프라인 일부 생략됨
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Scout 판정이 <b>{result.verdict}</b>이라 가격·카피·디자인 단계는 실행되지 않았습니다.
            아래 시장 분석으로 진입 여부를 먼저 검토하세요.
            {result.message ? ` (${result.message})` : ""}
          </p>
        </div>
      )}
      {/* ── 의사결정 스트립 (상단 한눈에) ── */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-7 shadow-sm relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(circle at 15% 0%, rgba(198,241,53,0.22), transparent 60%)" }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-2">
                최종 판정 {result.source ? `· ${result.source}` : ""}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center px-4 py-2 rounded-lg font-bold tracking-widest ${verdictStyle[result.verdict]}`}>
                  {verdictLabel[result.verdict]}
                </span>
                {gtm.launchMode && (
                  <span className="font-mono text-xs text-muted-foreground border border-border rounded px-2 py-1">
                    {gtm.launchMode}
                  </span>
                )}
              </div>
            </div>
            {pricing.targetPrice != null && (
              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-1">목표 판매가</div>
                <div className="font-mono text-4xl md:text-5xl font-bold text-foreground tabular-nums">₩{krw(pricing.targetPrice)}</div>
              </div>
            )}
          </div>

          {/* 핵심 지표 3개 */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <KeyStat label="BEP ROAS" value={pricing.bepRoas != null ? pricing.bepRoas.toFixed(2) : "—"} />
            <KeyStat label="단위 순이익" value={`₩${krw(pricing.unitProfitKrw)}`} />
            <KeyStat label="실현 마진" value={pricing.marginPct ?? "—"} />
          </div>
        </div>
      </div>

      {/* ── 핵심 요약 카드 (대표 정보만) ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 시장 한 줄 */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-3">시장 스냅샷</div>
          {scout.scores.final != null && (
            <div className="flex gap-2 mb-4">
              {[
                { k: "시장", v: scout.scores.market },
                { k: "트렌드", v: scout.scores.trend },
                { k: "경쟁", v: scout.scores.competition },
                { k: "종합", v: scout.scores.final },
              ].map((x) => (
                <div key={x.k} className="flex-1 rounded-md border border-border px-2 py-1.5 text-center">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{x.k}</div>
                  <div className="font-mono text-base font-semibold tabular-nums">{x.v ?? "—"}</div>
                </div>
              ))}
            </div>
          )}
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">핵심 페인포인트</div>
          <div className="flex flex-wrap gap-2">
            {scout.painHigh.slice(0, 3).map((p, i) => (
              <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md border border-border bg-muted text-foreground text-xs font-mono">
                {p}
              </span>
            ))}
            {scout.painHigh.length === 0 &&
              scout.painMed.slice(0, 3).map((p, i) => (
                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md border border-border text-muted-foreground text-xs font-mono">
                  {p}
                </span>
              ))}
          </div>
        </div>

        {/* 전략 한 줄 */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-3">추천 전략</div>
          {gtm.heroCopy && (
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">히어로 카피</div>
              <div className="text-sm font-bold text-foreground leading-snug">{gtm.heroCopy}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">획득 채널</div>
              <div className="font-mono text-sm font-semibold text-foreground">{gtm.channel ?? "—"}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">최대 소싱가</div>
              <div className="font-mono text-sm font-bold text-foreground tabular-nums">
                {pricing.maxSourcingUsd != null ? `$${pricing.maxSourcingUsd.toFixed(2)}` : "—"} · ₩{krw(pricing.maxSourcingKrw)}
              </div>
              {pricing.fxRateUsed != null && (
                <div className="mt-1 text-[10px] text-muted-foreground">
                  적용 환율 <span className="font-mono tabular-nums text-foreground/80">{krw(pricing.fxRateUsed)}</span>원/USD
                  {" · "}
                  <span className="font-semibold text-foreground/70">실시간</span>
                </div>
              )}
            </div>
          </div>
          {gtm.nextAction && (
            <div className="mt-3 rounded-lg border border-primary/40 bg-primary/10 p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">다음 액션</div>
              <div className="text-xs font-medium text-foreground">{gtm.nextAction}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── 다운로드 리포트 4종 ── */}
      <ReportDownloads result={result} blocked={result.blocked} />

      {/* 원본 JSON (디버깅용, 접힘) */}
      <details className="bg-card border border-border rounded-xl p-4">
        <summary className="cursor-pointer font-mono text-xs text-muted-foreground hover:text-foreground">
          {"// 원본 응답 JSON 보기 (디버깅용)"}
        </summary>
        <pre className="mt-3 max-h-96 overflow-auto text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">
          {JSON.stringify(result.raw, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function KeyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 p-3 sm:p-4 text-center">
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

// ── 다운로드 버튼 4개 ──
function ReportDownloads({ result, blocked }: { result: EngineResult; blocked: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async (key: string, fn: () => void | Promise<void>) => {
    setErr(null);
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      setErr("PDF 생성 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(null);
    }
  };

  const reports = [
    {
      key: "scout",
      title: "Scout 시장 리포트",
      desc: "점수 · 페인포인트 · 경쟁사 · 타이밍",
      tag: "PDF",
      accent: "primary" as const,
      disabled: false,
      fn: () => downloadScoutSummary(result),
    },
    {
      key: "pricing",
      title: "가격 검증 가이드",
      desc: blocked ? "Scout 보류로 생략됨" : "목표가 · 원가 · 협상가 · KPI 가드레일",
      tag: "PDF · 복사 가능",
      accent: "primary" as const,
      disabled: blocked,
      fn: () => downloadPricingGuide(result),
    },
    {
      key: "copy",
      title: "광고 카피 팩",
      desc: blocked ? "Scout 보류로 생략됨" : "AIDA 카피 9종 + 키워드 태그",
      tag: "PDF · 복사 가능",
      accent: "lime" as const,
      disabled: blocked,
      fn: () => downloadAdCopyPack(result),
    },
    {
      key: "design",
      title: "디자인 브리프",
      desc: blocked ? "Scout 보류로 생략됨" : "상세페이지 8섹션 디자인 디렉션",
      tag: "PDF · 디자이너 전달용",
      accent: "orange" as const,
      disabled: blocked,
      fn: () => downloadDesignBrief(result),
    },
  ];

  const accentMap = {
    primary: "border-border hover:border-primary text-foreground",
    lime: "border-border hover:border-secondary text-foreground",
    orange: "border-border hover:border-warning text-foreground",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">상세 리포트 다운로드</div>
        <div className="font-mono text-[10px] text-muted-foreground">필요한 것만 골라 받으세요</div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {reports.map((r) => (
          <button
            key={r.key}
            onClick={() => !r.disabled && run(r.key, r.fn)}
            disabled={busy !== null || r.disabled}
            className={`text-left rounded-lg border bg-background/40 p-4 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${r.disabled ? "border-border text-muted-foreground" : accentMap[r.accent]}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{r.title}</span>
              <span className="font-mono text-base">{r.disabled ? "—" : busy === r.key ? "⏳" : "↓"}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
            <div className="mt-2 font-mono text-[10px] tracking-wider opacity-70">{r.tag}</div>
          </button>
        ))}
      </div>
      {err && <div className="mt-3 text-xs text-danger font-mono">⚠ {err}</div>}
    </div>
  );
}

// ── 로딩 (단계 + 타이머) ──
export function EngineLoading() {
  const stages = [
    "시장 인텔리전스 수집 (Scout)",
    "가격·마진 검증 (Pricing)",
    "AIDA 카피 생성 (Copy)",
    "GTM 전략 판단 (Planner)",
    "AI 분석 마무리 중... (최대 8분)",
  ];
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec((s) => Math.min(480, s + 1)), 1000); // 표시 상한 480초(8분)
    return () => clearInterval(t);
  }, []);
  const active = Math.min(stages.length - 1, Math.floor(sec / 35));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  return (
    <div className="bg-card border border-border rounded-2xl p-8 md:p-10 grid gap-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">파이프라인 실행 중</div>
        <div className="font-mono text-sm font-semibold text-foreground tabular-nums">{mm}:{ss}</div>
      </div>
      <div className="font-mono text-xl md:text-2xl font-bold text-foreground animate-pulse">{stages[active]}</div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden shimmer" />
      <ul className="space-y-2 font-mono text-xs">
        {stages.map((l, i) => (
          <li key={i} className={`flex items-center gap-2 ${i <= active ? "text-foreground" : "text-muted-foreground/50"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${i < active ? "bg-secondary" : i === active ? "bg-primary animate-pulse" : "bg-muted"}`} />
            {l}
            {i < active && <span className="text-secondary ml-1">✓</span>}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground/80 font-mono">
        // 새 키워드 분석은 최대 8분 걸릴 수 있습니다. 캐시된 키워드는 즉시 응답됩니다.
      </p>
    </div>
  );
}
