import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { initialState, computeResult, type CalcState, type Mode, type CalcResult } from "@/components/calculator/types";
import { Step1, Step2, Step3 } from "@/components/calculator/Steps";
import { ResultDashboard, LoadingDashboard } from "@/components/calculator/Result";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MotionX GTM Engine — 한국 이커머스 수익성 계산기" },
      { name: "description", content: "소싱부터 판매까지, 한 번에 검증하는 GTM 수익성 엔진." },
    ],
  }),
  component: Index,
});

const TOTAL_STEPS = 3;

function Index() {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [state, setState] = useState<CalcState>(initialState);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalcResult | null>(null);

  const patch = (p: Partial<CalcState>) => setState((s) => ({ ...s, ...p }));

  const selectMode = (mode: Mode) => {
    setState({ ...initialState, mode });
    setStep(1);
  };

  const validate = (s: 1 | 2 | 3): string | null => {
    if (s === 1) {
      if (!state.keyword.trim()) return "제품 키워드를 입력하세요";
      if (state.mode === "pricing" && state.sourcingCostUsd <= 0) return "소싱 원가를 입력하세요";
      if (state.fxRate <= 0) return "환율을 확인하세요";
    }
    if (s === 2) {
      if (state.overseasShippingUsd < 0) return "해외 물류비를 확인하세요";
    }
    if (s === 3) {
      if (state.platform === "etc" && state.platformFeeManualPct <= 0)
        return "플랫폼 수수료를 입력하세요";
    }
    return null;
  };

  const [error, setError] = useState<string | null>(null);

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
      return;
    }
    if (step === 0) return;
    setStep((step - 1) as 0 | 1 | 2);
  };

  const runAnalysis = () => {
    setStep(4);
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(computeResult(state));
      setLoading(false);
    }, 3000);
  };

  const reset = () => {
    setStep(0);
    setState(initialState);
    setResult(null);
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
            {loading || !result ? <LoadingDashboard /> : <ResultDashboard result={result} />}
          </ResultShell>
        )}
      </div>
      <FooterMark />
    </main>
  );
}

function Header() {
  return (
    <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-8">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center font-mono font-bold text-primary-foreground">
          MX
        </div>
        <div>
          <div className="font-mono text-sm tracking-[0.3em] text-primary">MOTIONX</div>
          <div className="font-mono text-[10px] tracking-[0.4em] text-muted-foreground -mt-0.5">
            GTM ENGINE / v1.0
          </div>
        </div>
      </div>
    </header>
  );
}

function FooterMark() {
  return (
    <footer className="text-center pb-8">
      <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/60">
        // BUILT FOR KOREAN SELLERS
      </span>
    </footer>
  );
}

function ModeSelect({ onSelect }: { onSelect: (m: Mode) => void }) {
  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-12">
        <div className="font-mono text-xs tracking-[0.4em] text-primary mb-3">
          // STEP 00 / MODE
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
          GTM 수익성을<br />
          <span className="text-primary">3분</span>안에 검증하세요.
        </h1>
        <p className="text-muted-foreground font-mono text-sm">
          시작 시나리오를 선택하세요
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <ModeCard
          tag="MODE A"
          title="소싱 원가를 알고 있어요"
          desc="이미 알리바바/공장 견적을 받았어요. 권장 판매가와 BEP ROAS를 계산합니다."
          accent="primary"
          onClick={() => onSelect("pricing")}
        />
        <ModeCard
          tag="MODE B"
          title="시장 조사 중이에요"
          desc="아직 소싱 전. 시장가에서 역산하여 목표 소싱 원가와 마진 여력을 분석합니다."
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
  const accentCls = accent === "primary" ? "text-primary border-primary/40" : "text-secondary border-secondary/40";
  const glowCls = accent === "primary"
    ? "hover:shadow-[0_0_40px_-10px_rgba(0,212,255,0.5)]"
    : "hover:shadow-[0_0_40px_-10px_rgba(170,255,0,0.4)]";
  return (
    <button
      onClick={onClick}
      className={`group text-left bg-card border border-border rounded-xl p-7 hover:border-foreground/30 transition-all duration-300 ${glowCls}`}
    >
      <div className={`inline-flex items-center px-2 py-1 rounded font-mono text-[10px] tracking-[0.3em] border ${accentCls} mb-5`}>
        {tag}
      </div>
      <h3 className="text-xl font-bold mb-3 group-hover:translate-x-1 transition-transform">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      <div className={`mt-6 font-mono text-xs ${accentCls.split(" ")[0]} flex items-center gap-2`}>
        시작하기 <span className="group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </button>
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
  const titles = ["제품 정보", "물류 & 숨은 비용", "전략"];
  const pct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-mono text-xs tracking-[0.3em] text-primary">
            STEP {String(step).padStart(2, "0")} / 03 · {titles[step - 1]}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {state.mode === "pricing" ? "MODE A · 소싱원가 기반" : "MODE B · 시장조사 기반"}
          </div>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 md:p-8" key={step}>
        <div className="animate-fade-in-up">{children}</div>

        {error && (
          <div className="mt-6 px-4 py-3 rounded-md border border-warning/40 bg-warning/10 text-warning text-sm font-mono">
            ⚠ {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="font-mono text-sm px-5 py-3 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
          >
            ← 이전
          </button>
          <button
            onClick={onNext}
            className="font-mono text-sm font-bold px-6 py-3 rounded-md bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {step === 3 ? "분석 시작 →" : "다음 →"}
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
    <div>
      <div className="mb-8 flex items-baseline justify-between">
        <div className="font-mono text-xs tracking-[0.3em] text-secondary">
          STEP 04 / RESULT · 수익성 리포트
        </div>
        <button
          onClick={onReset}
          className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ↻ 처음부터
        </button>
      </div>
      {children}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="font-mono text-sm px-5 py-3 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
        >
          ← 전략 수정
        </button>
      </div>
    </div>
  );
}
