import { Field, NumInput, TextInput, RangeSlider, Select } from "./Field";
import type { CalcState, Platform } from "./types";
import { PLATFORM_FEES, PLATFORM_LABELS } from "./types";

type Patch = (p: Partial<CalcState>) => void;

export function Step1({ s, patch }: { s: CalcState; patch: Patch }) {
  return (
    <div className="grid gap-6">
      <Field label="제품 키워드" hint="검색되는 정확한 제품명을 입력하세요">
        <TextInput
          value={s.keyword}
          onChange={(v) => patch({ keyword: v })}
          placeholder="예: 무릎 보호대"
        />
      </Field>

      {s.mode === "pricing" && (
        <Field label="소싱 원가" suffix="USD">
          <NumInput
            value={s.sourcingCostUsd}
            onChange={(v) => patch({ sourcingCostUsd: v })}
            placeholder="0.00"
          />
        </Field>
      )}

      <Field label="적용 환율" suffix="KRW / USD" hint="기본 1380 — 보수적으로 설정 권장">
        <NumInput value={s.fxRate} onChange={(v) => patch({ fxRate: v })} />
      </Field>
    </div>
  );
}

export function Step2({ s, patch }: { s: CalcState; patch: Patch }) {
  return (
    <div className="grid gap-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="해외 물류비" suffix="USD">
          <NumInput
            value={s.overseasShippingUsd}
            onChange={(v) => patch({ overseasShippingUsd: v })}
          />
        </Field>
        <Field label="국내 택배비" suffix="KRW">
          <NumInput
            value={s.domesticShippingKrw}
            onChange={(v) => patch({ domesticShippingKrw: v })}
          />
        </Field>
        <Field label="포장 부자재비" suffix="KRW">
          <NumInput value={s.packagingKrw} onChange={(v) => patch({ packagingKrw: v })} />
        </Field>
      </div>

      <Field label="예상 반품률" hint="카테고리 평균: 의류 8-15%, 잡화 3-7%">
        <RangeSlider
          value={s.returnRatePct}
          onChange={(v) => patch({ returnRatePct: v })}
          min={0}
          max={30}
        />
      </Field>

      <Field label="반품 귀책 비율" hint="셀러 부담 비율 (불량/오배송 등)">
        <RangeSlider
          value={s.returnLiabilityPct}
          onChange={(v) => patch({ returnLiabilityPct: v })}
          min={0}
          max={100}
        />
      </Field>
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
      <Field label="판매 플랫폼">
        <Select
          value={s.platform}
          onChange={(v) => patch({ platform: v })}
          options={platformOpts}
        />
      </Field>

      {s.platform === "etc" && (
        <Field label="플랫폼 수수료" suffix="%">
          <NumInput
            value={s.platformFeeManualPct}
            onChange={(v) => patch({ platformFeeManualPct: v })}
          />
        </Field>
      )}

      <Field label="PG 수수료" suffix="%">
        <NumInput value={s.pgFeePct} onChange={(v) => patch({ pgFeePct: v })} />
      </Field>

      <Field label="마케팅 예산 비중" hint="매출 대비 광고비 비중">
        <RangeSlider
          value={s.marketingBudgetPct}
          onChange={(v) => patch({ marketingBudgetPct: v })}
          min={0}
          max={50}
        />
      </Field>

      <Field label="타겟 마진율" hint="순이익 목표 — 보수적 15-25% 권장">
        <RangeSlider
          value={s.targetMarginPct}
          onChange={(v) => patch({ targetMarginPct: v })}
          min={5}
          max={60}
        />
      </Field>
    </div>
  );
}