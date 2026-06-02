import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { initialState, fetchEngine, type CalcState, type Mode, type EngineResult } from "@/components/calculator/types";
import { Step1, Step2, Step3 } from "@/components/calculator/Steps";
import { EngineDashboard, EngineLoading } from "@/components/calculator/Result";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MX Commerce GTM Engine — AI 멀티 에이전트 GTM 자동화" },
      { name: "description", content: "키워드 하나로 시장분석·가격검증·카피·GTM 전략·디자인 브리프까지 자동 생성." },
    ],
  }),
  component: Index,
});

function Index() {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [state, setState] = useState<CalcState>(initialState);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const patch = (p: Partial<CalcState>) => setState((s) => ({ ...s, ...p }));

  const selectMode = (mode: Mode) => {
    setState({ ...initialState, mode });
    setStep(1);
  };

  const validate = (s: 1 | 2 | 3): string | null => {
    if (s === 1) {
      if (!state.keyword.trim()) return "제품 키워드를 입력하세요";
      if (state.mode === "pricing" && state.sourcingCostUsd <= 0) return "소싱 원가를 입력하세요";
      if (state.mode === "sourcing" && state.targetPriceKrw <= 0) return "목표 시장가를 입력하세요";
      if (state.fxRate <= 0) return "환율을 확인하세요";
    }
    if (s === 3) {
      if (state.platform === "etc" && state.platformFeeManualPct <= 0) return "플랫폼 수수료를 입력하세요";
    }
    return null;
  };

  const next = () => {
    if (step >= 1 && step <= 3) {
      const s = step as 1 | 2 | 3;
      const err = validate(s);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      if (s === 3) {
        runAnalysis();
        return;
      }
      setStep(((s as number) + 1) as 1 | 2 | 3);
    }
  };

  const back = () => {
    setError(null);
    if (step === 4) {
      setStep(3);
      setResult(null);
      setApiError(null);
      return;
    }
    if (step === 0) return;
    setStep((step - 1) as 0 | 1 | 2);
  };

  const runAnalysis = async () => {
    setStep(4);
    setLoading(true);
    setResult(null);
    setApiError(null);
    try {
      const r = await fetchEngine(state);
      setResult(r);
    } catch (e) {
      console.error(e);
      const aborted = e instanceof DOMException && e.name === "AbortError";
      setApiError(
        aborted
          ? "분석 중입니다. 최대 8분 소요될 수 있습니다."
          : "엔진 호출 실패 — n8n·ngrok 실행 여부와 Webhook CORS 허용(Allowed Origins=*)을 확인하세요.",
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setState(initialState);
    setResult(null);
    setApiError(null);
    setError(null);
  };

  return (
    <main className="min-h-screen text-foreground">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        {step === 0 && <ModeSelect onSelect={selectMode} />}

        {step >= 1 && step <= 3 && (
          <WizardShell step={step as 1 | 2 | 3} state={state} error={error} onBack={back} onNext={next}>
            {step === 1 && <Step1 s={state} patch={patch} />}
            {step === 2 && <Step2 s={state} patch={patch} />}
            {step === 3 && <Step3 s={state} patch={patch} />}
          </WizardShell>
        )}

        {step === 4 && (
          <ResultShell onBack={back} onReset={reset}>
            {loading || (!result && !apiError) ? (
              <EngineLoading />
            ) : apiError ? (
              <ErrorCard message={apiError} onRetry={runAnalysis} />
            ) : result ? (
              <EngineDashboard result={result} />
            ) : null}
          </ResultShell>
        )}
      </div>
      <FooterMark />
    </main>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-card border border-danger/40 rounded-xl p-8 text-center animate-fade-in-up">
      <div className="font-mono text-sm tracking-widest text-danger mb-3">// ENGINE ERROR</div>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">{message}</p>
      <button
        onClick={onRetry}
        className="mt-6 font-mono text-sm font-bold px-6 py-3 rounded-md bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all"
      >
        다시 시도 →
      </button>
    </div>
  );
}

function Header() {
  return (
    <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-mono font-bold text-primary-foreground">
          MX
        </div>
        <div>
          <div className="font-mono text-sm font-bold tracking-[0.25em] text-foreground">MX COMMERCE</div>
          <div className="font-mono text-[10px] tracking-[0.35em] text-muted-foreground -mt-0.5">GTM ENGINE / v1.0</div>
        </div>
      </div>
    </header>
  );
}

function FooterMark() {
  return (
    <footer className="text-center pb-8">
      <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60">// BUILT FOR KOREAN SELLERS</span>
    </footer>
  );
}

function ModeSelect({ onSelect }: { onSelect: (m: Mode) => void }) {
  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-12">
        <div className="font-mono text-xs tracking-[0.4em] text-muted-foreground mb-3">// STEP 00 / MODE</div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
          GTM 전략을{" "}
          <span className="inline-block bg-primary text-primary-foreground px-2 rounded-md">1분</span>
          {" "}안에 검증하세요.
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          시장분석 · 가격검증 · 카피 · GTM 전략 · 디자인 브리프
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <ModeCard
          tag="MODE A"
          title="소싱 원가를 알고 있어요"
          desc="이미 견적을 받았어요. 권장 판매가와 KPI 가드레일을 계산합니다."
          accent="primary"
          onClick={() => onSelect("pricing")}
        />
        <ModeCard
          tag="MODE B"
          title="시장 조사 중이에요"
          desc="아직 소싱 전. 목표 시장가에서 역산하여 최대 소싱가와 풀 GTM 전략을 분석합니다."
          accent="secondary"
          onClick={() => onSelect("sourcing")}
        />
      </div>
    </div>
  );
}

function ModeCard({
  tag,
  title,
  desc,
  accent,
  onClick,
}: {
  tag: string;
  title: string;
  desc: string;
  accent: "primary" | "secondary";
  onClick: () => void;
}) {
  const tagCls =
    accent === "primary"
      ? "bg-primary text-primary-foreground"
      : "bg-secondary text-secondary-foreground";
  const hoverBorder = accent === "primary" ? "hover:border-primary" : "hover:border-secondary";
  return (
    <button
      onClick={onClick}
      className={`group text-left bg-card border border-border rounded-2xl p-7 shadow-sm hover:shadow-md transition-all duration-300 ${hoverBorder}`}
    >
      <div className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono text-[10px] font-bold tracking-[0.25em] ${tagCls} mb-5`}>
        {tag}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:translate-x-1 transition-transform">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      <div className="mt-6 font-mono text-xs font-semibold text-foreground flex items-center gap-2">
        시작하기 <span className="group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </button>
  );
}

const STEP_LABELS = ["제품 정보", "물류·비용", "전략", "GTM 리포트"];

function Stepper({ current, mode }: { current: 1 | 2 | 3 | 4; mode?: Mode }) {
  return (
    <div className="mb-8">
      {mode && (
        <div className="flex justify-end mb-3">
          <span className="font-mono text-xs text-muted-foreground">
            {mode === "pricing" ? "MODE A · 소싱원가 기반" : "MODE B · 시장조사 기반"}
          </span>
        </div>
      )}
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li key={label} className="flex items-center gap-2 sm:gap-3 flex-1 last:flex-none">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`grid place-items-center w-8 h-8 rounded-full font-mono text-sm font-bold shrink-0 border transition-all ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : done
                        ? "bg-foreground text-background border-foreground"
                        : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  {done ? "✓" : n}
                </span>
                <span
                  className={`hidden sm:inline text-sm whitespace-nowrap ${
                    active ? "font-bold text-foreground" : done ? "font-medium text-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {n < STEP_LABELS.length && (
                <span className={`h-px flex-1 ${done ? "bg-foreground/40" : "bg-border"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function WizardShell({
  step,
  state,
  error,
  onBack,
  onNext,
  children,
}: {
  step: 1 | 2 | 3;
  state: CalcState;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in-up">
      <Stepper current={step} mode={state.mode} />

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm" key={step}>
        <div className="animate-fade-in-up">{children}</div>

        {error && (
          <div className="mt-6 px-4 py-3 rounded-lg border border-warning/50 bg-warning/10 text-foreground text-sm font-mono">
            ⚠ {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="font-mono text-sm px-5 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
          >
            ← 이전
          </button>
          <button
            onClick={onNext}
            className="font-mono text-sm font-bold px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.98] transition-all"
          >
            {step === 3 ? "엔진 실행 →" : "다음 →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultShell({
  onBack,
  onReset,
  children,
}: {
  onBack: () => void;
  onReset: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Stepper current={4} />
        </div>
        <button onClick={onReset} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 pt-1">
          ↻ 처음부터
        </button>
      </div>
      {children}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="font-mono text-sm px-5 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
        >
          ← 입력 수정
        </button>
      </div>
    </div>
  );
}
