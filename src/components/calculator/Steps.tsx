import { Field, NumInput, TextInput, RangeSlider, Select, Section } from "./Field";
import type { CalcState, Platform, ProductCategory } from "./types";
import { PLATFORM_FEES, PLATFORM_LABELS, PRODUCT_CATEGORY_LABELS } from "./types";

type Patch = (p: Partial<CalcState>) => void;

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left w-full rounded-xl border border-border bg-card p-4 hover:border-foreground/30 transition-all"
    >
      <span
        className={`mt-0.5 w-10 h-6 rounded-full shrink-0 transition-all ${checked ? "bg-primary" : "bg-muted-foreground/30"} relative`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow-sm transition-all ${checked ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">{hint}</span>}
      </span>
    </button>
  );
}

export function Step1({ s, patch }: { s: CalcState; patch: Patch }) {
  const categoryOpts = (Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[]).map((k) => ({
    value: k,
    label: PRODUCT_CATEGORY_LABELS[k],
  }));

  return (
    <div className="grid gap-6">
      <Section title="제품" desc="Scout 에이전트가 분석할 제품을 정의합니다">
        <Field label="제품 키워드" hint="이 키워드로 네이버·유튜브 시장을 분석합니다">
          <TextInput
            value={s.keyword}
            onChange={(v) => patch({ keyword: v })}
            placeholder="예: 러닝 무릎 보호대"
          />
        </Field>

        <Field label="제품 카테고리" hint="카테고리별 규제·반품 특성을 반영합니다">
          <Select
            value={s.product_category}
            onChange={(v) => patch({ product_category: v })}
            options={categoryOpts}
          />
        </Field>
      </Section>

      <Section title="가격 조건" desc="역산 계산의 기준이 되는 값입니다">
        {s.mode === "pricing" && (
          <Field label="소싱 원가" suffix="USD">
            <NumInput value={s.sourcingCostUsd} onChange={(v) => patch({ sourcingCostUsd: v })} placeholder="0.00" />
          </Field>
        )}

        {s.mode === "sourcing" && (
          <Field label="목표 시장가" suffix="KRW" hint="이 가격에서 역산해 최대 허용 소싱가를 계산합니다">
            <NumInput value={s.targetPriceKrw} onChange={(v) => patch({ targetPriceKrw: v })} placeholder="25000" />
          </Field>
        )}
      </Section>

      <Section title="선택 입력" desc="비우면 키워드 기반으로 자동 생성됩니다">
        <Field label="브랜드명">
          <TextInput
            value={s.brand}
            onChange={(v) => patch({ brand: v })}
            placeholder="예: MotionX (비우면 자동)"
          />
        </Field>

        <Field label="제품명">
          <TextInput
            value={s.product_name}
            onChange={(v) => patch({ product_name: v })}
            placeholder="예: 러닝 무릎 보호대 (비우면 자동)"
          />
        </Field>

        <Field label="핵심 특징" hint="주요 기능·차별점 (쉼표로 구분)">
          <TextInput
            value={s.key_features}
            onChange={(v) => patch({ key_features: v })}
            placeholder="예: 통기성, 미끄럼 방지, 초경량"
          />
        </Field>

        <Field label="타겟 페르소나" hint="핵심 구매 고객층">
          <TextInput
            value={s.target_persona}
            onChange={(v) => patch({ target_persona: v })}
            placeholder="예: 30-40대 러닝 입문자"
          />
        </Field>
      </Section>

      <Toggle
        checked={s.freshRun}
        onChange={(v) => patch({ freshRun: v })}
        label="항상 새로 분석 (캐시 무시)"
        hint="켜면 매번 풀 파이프라인 재실행(최대 8분). 끄면 같은 키워드는 캐시에서 즉시 응답."
      />
    </div>
  );
}

export function Step2({ s, patch }: { s: CalcState; patch: Patch }) {
  return (
    <div className="grid gap-6">
      <Section title="원가 구조" desc="제품 1개당 들어가는 변동 비용입니다">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="해외 물류비" suffix="USD">
            <NumInput value={s.overseasShippingUsd} onChange={(v) => patch({ overseasShippingUsd: v })} />
          </Field>
          <Field label="국내 택배비" suffix="KRW">
            <NumInput value={s.domesticShippingKrw} onChange={(v) => patch({ domesticShippingKrw: v })} />
          </Field>
          <Field label="포장 부자재비" suffix="KRW">
            <NumInput value={s.packagingKrw} onChange={(v) => patch({ packagingKrw: v })} />
          </Field>
        </div>
      </Section>

      <Section title="반품 리스크" desc="반품으로 인한 숨은 비용을 마진에 반영합니다">
        <Field label="예상 반품률" hint="카테고리 평균: 의류 8-15%, 잡화 3-7%">
          <RangeSlider value={s.returnRatePct} onChange={(v) => patch({ returnRatePct: v })} min={0} max={30} />
        </Field>

        <Field label="반품 귀책 비율" hint="셀러 부담 비율 (불량/오배송 등)">
          <RangeSlider value={s.returnLiabilityPct} onChange={(v) => patch({ returnLiabilityPct: v })} min={0} max={100} />
        </Field>
      </Section>
    </div>
  );
}

export function Step3({ s, patch }: { s: CalcState; patch: Patch }) {
  const platformOpts = (Object.keys(PLATFORM_LABELS) as Platform[]).map((k) => ({
    value: k,
    label: `${PLATFORM_LABELS[k]}${k === "etc" ? "" : ` · ${PLATFORM_FEES[k]}%`}`,
  }));

  return (
    <div className="grid gap-6">
      <Section title="판매 채널" desc="플랫폼·결제 수수료가 마진에 반영됩니다">
        <Field label="판매 플랫폼">
          <Select value={s.platform} onChange={(v) => patch({ platform: v })} options={platformOpts} />
        </Field>

        {s.platform === "etc" && (
          <Field label="플랫폼 수수료" suffix="%">
            <NumInput value={s.platformFeeManualPct} onChange={(v) => patch({ platformFeeManualPct: v })} />
          </Field>
        )}

        <Field label="PG 수수료" suffix="%">
          <NumInput value={s.pgFeePct} onChange={(v) => patch({ pgFeePct: v })} />
        </Field>
      </Section>

      <Section title="마케팅 & 목표" desc="광고 예산과 목표 마진으로 KPI 가드레일을 계산합니다">
        <Field label="마케팅 예산 비중" hint="매출 대비 광고비 비중">
          <RangeSlider value={s.marketingBudgetPct} onChange={(v) => patch({ marketingBudgetPct: v })} min={0} max={50} />
        </Field>

        <Field label="타겟 마진율" hint="순이익 목표 — 보수적 25-30% 권장">
          <RangeSlider value={s.targetMarginPct} onChange={(v) => patch({ targetMarginPct: v })} min={5} max={60} />
        </Field>
      </Section>
    </div>
  );
}
