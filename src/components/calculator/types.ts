export type Mode = "pricing" | "sourcing";

export type Platform = "smartstore" | "coupang" | "toss" | "etc";

export type ProductCategory = "general" | "health" | "cosmetic" | "food" | "electronics";

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  general: "일반 공산품",
  health: "헬스·의료보조",
  cosmetic: "화장품·뷰티",
  food: "식품·건기식",
  electronics: "전자·디지털",
};

export const PLATFORM_FEES: Record<Platform, number> = {
  smartstore: 5.85,
  coupang: 10.8,
  toss: 5.85,
  etc: 0,
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  smartstore: "스마트스토어",
  coupang: "쿠팡",
  toss: "토스쇼핑",
  etc: "기타",
};

export interface CalcState {
  mode: Mode;
  keyword: string;
  product_category: ProductCategory;
  // 선택 입력 — 비우면 엔진이 키워드 기반으로 자동 생성
  brand: string;
  product_name: string;
  key_features: string;
  target_persona: string;
  freshRun: boolean; // true면 keyword에 타임스탬프 붙여 캐시 회피
  sourcingCostUsd: number; // Mode A
  targetPriceKrw: number; // Mode B
  fxRate: number;
  overseasShippingUsd: number;
  domesticShippingKrw: number;
  packagingKrw: number;
  returnRatePct: number;
  returnLiabilityPct: number;
  platform: Platform;
  platformFeeManualPct: number;
  pgFeePct: number;
  marketingBudgetPct: number;
  targetMarginPct: number;
}

export const initialState: CalcState = {
  mode: "sourcing",
  keyword: "",
  product_category: "general",
  brand: "",
  product_name: "",
  key_features: "",
  target_persona: "",
  freshRun: false,
  sourcingCostUsd: 0,
  targetPriceKrw: 25000,
  fxRate: 1460,
  overseasShippingUsd: 0.26,
  domesticShippingKrw: 3000,
  packagingKrw: 1000,
  returnRatePct: 7.5,
  returnLiabilityPct: 50,
  platform: "toss",
  platformFeeManualPct: 0,
  pgFeePct: 3,
  marketingBudgetPct: 15,
  targetMarginPct: 30,
};

// ── n8n 백엔드 (env로 덮어쓰기 가능, 없으면 하드코딩 fallback) ──
const N8N_URL =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_N8N_URL ?? "https://gleaming-uneaten-handstand.ngrok-free.dev";

export type Verdict = "GO" | "WAIT" | "NO";

export interface Negotiation {
  maxAcceptableUsd?: number;
  targetOfferUsd?: number;
  openingOfferUsd?: number;
}

export interface EngineResult {
  verdict: Verdict; // scout go_no_go 기준
  blocked: boolean; // Scout 게이트가 WAIT/NO로 파이프라인을 막았는지
  message?: string; // BLOCKED 사유 등
  source?: string; // fresh | cache
  runId?: string;
  keyword?: string;
  scout: {
    priceInsight?: string;
    painHigh: string[];
    painMed: string[];
    competitors: string[];
    sourcingKeywords: string[];
    scores: { market?: number; trend?: number; competition?: number; final?: number };
    goReason?: string;
    launchTiming?: string;
    priceRange?: string;
  };
  pricing: {
    mode?: string;
    targetPrice?: number;
    maxSourcingKrw?: number;
    maxSourcingUsd?: number;
    allowedCogsKrw?: number;
    fixedCostsKrw?: number;
    negotiation?: Negotiation;
    bepRoas?: number;
    targetRoas?: number;
    marginPct?: string;
    unitProfitKrw?: number;
    fxRateUsed?: number; // n8n CALC가 실시간 적용한 환율 (KRW/USD)
    feasibility?: string;
    kpi: { target?: number; warning?: number; max?: number };
  };
  copy: {
    headline?: string;
    subHeadline?: string;
    hook?: string;
    body?: string;
    cta?: string;
    seoMeta?: string;
    instagram?: string;
    searchAdTitle?: string;
    searchAdDescription?: string;
    keywordTags: string[];
  };
  gtm: {
    launchMode?: string;
    gtmScore?: number;
    primaryPainPoint?: string;
    primaryTrigger?: string;
    heroCopy?: string;
    heroScore?: number;
    heroSource?: string;
    channel?: string;
    channelScore?: number;
    secondaryChannel?: string;
    positioning?: string;
    designDirection?: string;
    nextAction?: string;
    risks: string[];
    validationStatus?: string;
  };
  designBriefMarkdown?: string;
  designBriefTitle?: string;
  raw: unknown;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// 응답 래핑 해제: 배열 / {value:[]} (PowerShell) / {data:[]} / 단일객체 모두 처리
function unwrap(d: any): any {
  if (Array.isArray(d)) return d[0] ?? {};
  if (d && Array.isArray(d.value)) return d.value[0] ?? {};
  if (d && Array.isArray(d.data)) return d.data[0] ?? {};
  return d ?? {};
}

// 괄호 depth 인식 콤마 split — "...(흘러내림, 답답함)(높음), ..." 안전 분리
function splitKo(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  const out: string[] = [];
  let buf = "";
  let depth = 0;
  for (const ch of String(v)) {
    if (ch === "(" || ch === "（") depth++;
    else if (ch === ")" || ch === "）") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === "\n") && depth === 0) {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
    } else buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function num(v: any): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "string" ? parseFloat(v.replace(/[^0-9.\-]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseEngineResponse(raw: any): EngineResult {
  const r = unwrap(raw);
  // GO 경로는 scout_summary, BLOCKED(WAIT/NO) 경로는 scout_result 로 옴 — 둘 다 처리
  const scout = r.scout_summary ?? r.scout_result ?? {};
  const pricing = r.pricing_output ?? {};
  const copy = r.copy_output ?? {};
  const gtm = r.gtm_planner_output ?? {};
  const design = r.design_brief_output ?? {};
  const kpi = gtm.kpi_guardrails ?? {};
  const neg = pricing.negotiation ?? {};

  // 판정: 최상위 go_no_go → scout.go_no_go → pricing.feasibility 순
  const verdict = String(r.go_no_go ?? scout.go_no_go ?? pricing.feasibility ?? "GO").toUpperCase();
  const v: Verdict = verdict === "NO" ? "NO" : verdict === "WAIT" ? "WAIT" : "GO";

  // BLOCKED: status가 BLOCKED거나 pricing_output 자체가 없으면 파이프라인 차단된 것
  const blocked =
    String(r.status ?? "").toUpperCase() === "BLOCKED" || !r.pricing_output;

  return {
    verdict: v,
    blocked,
    message: r.message ?? r.reason ?? scout.go_reason,
    source: r.source,
    runId: r.run_id,
    keyword: r.keyword ?? scout.keyword,
    scout: {
      priceInsight: scout.naver_price_insight,
      painHigh: splitKo(scout.high_confidence_pain_points ?? scout.naver_pain_points),
      painMed: splitKo(scout.medium_confidence_pain_points),
      competitors: splitKo(scout.youtube_competitor_mentions).slice(0, 12),
      sourcingKeywords: splitKo(scout.recommended_sourcing_keywords),
      scores: {
        market: num(scout.market_score),
        trend: num(scout.trend_score),
        competition: num(scout.competition_score),
        final: num(scout.final_score),
      },
      goReason: scout.go_reason,
      launchTiming: scout.launch_timing,
      priceRange: scout.recommended_price_range,
    },
    pricing: {
      mode: pricing.mode,
      targetPrice: num(pricing.target_price ?? pricing.recommended_price),
      maxSourcingKrw: num(pricing.max_sourcing_krw),
      maxSourcingUsd: num(pricing.max_sourcing_usd),
      allowedCogsKrw: num(pricing.allowed_cogs_krw),
      fixedCostsKrw: num(pricing.fixed_costs_krw),
      negotiation: {
        maxAcceptableUsd: num(neg.max_acceptable_usd),
        targetOfferUsd: num(neg.target_offer_usd),
        openingOfferUsd: num(neg.opening_offer_usd),
      },
      bepRoas: num(pricing.bep_roas),
      targetRoas: num(pricing.target_roas),
      marginPct: pricing.actual_margin_pct,
      unitProfitKrw: num(pricing.unit_profit_krw),
      fxRateUsed: num(pricing.fx_rate_used),
      feasibility: pricing.feasibility,
      kpi: {
        target: num(pricing.target_ad_krw ?? kpi.target_ad_krw),
        warning: num(pricing.warning_ad_krw ?? kpi.warning_ad_krw),
        max: num(pricing.max_ad_krw ?? kpi.max_ad_krw),
      },
    },
    copy: {
      headline: copy.headline,
      subHeadline: copy.sub_headline,
      hook: copy.interest_hook,
      body: copy.desire_body,
      cta: copy.cta,
      seoMeta: copy.seo_meta,
      instagram: copy.instagram_caption,
      searchAdTitle: copy.search_ad_title,
      searchAdDescription: copy.search_ad_description,
      keywordTags: splitKo(copy.keyword_tags),
    },
    gtm: {
      launchMode: gtm.launch_mode,
      gtmScore: num(gtm.gtm_score),
      primaryPainPoint: gtm.primary_pain_point,
      primaryTrigger: gtm.primary_purchase_trigger,
      heroCopy: gtm.selected_copy_asset?.text,
      heroScore: num(gtm.selected_copy_asset?.copy_score),
      heroSource: gtm.selected_copy_asset?.source_field,
      channel: gtm.selected_channel?.channel_role,
      channelScore: num(gtm.selected_channel?.channel_score),
      secondaryChannel: gtm.secondary_channel?.channel_role,
      positioning: gtm.selected_positioning,
      designDirection: gtm.design_brief_direction,
      nextAction: gtm.next_action,
      risks: Array.isArray(gtm.risk_notes) ? gtm.risk_notes : splitKo(gtm.risk_notes),
      validationStatus: gtm.validation_status,
    },
    designBriefMarkdown: design.doc_content,
    designBriefTitle: design.doc_title,
    raw,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchEngine(s: CalcState): Promise<EngineResult> {
  const platformFeePct =
    s.platform === "etc" ? s.platformFeeManualPct : PLATFORM_FEES[s.platform];

  // 캐시 회피: freshRun이면 키워드에 타임스탬프 추가 (운영가이드 6-2 방식)
  const ts = new Date();
  const stamp =
    String(ts.getMonth() + 1).padStart(2, "0") +
    String(ts.getDate()).padStart(2, "0") +
    String(ts.getHours()).padStart(2, "0") +
    String(ts.getMinutes()).padStart(2, "0") +
    String(ts.getSeconds()).padStart(2, "0");
  const keyword = s.freshRun ? `${s.keyword.trim()} ${stamp}` : s.keyword.trim();

  const body = {
    mode: s.mode,
    keyword,
    product_category: s.product_category,
    // 선택 입력 — 비워도 키는 항상 존재(빈 문자열). 엔진이 빈 값이면 키워드 기반 자동 생성
    brand: s.brand.trim(),
    product_name: s.product_name.trim(),
    key_features: s.key_features.trim(),
    target_persona: s.target_persona.trim(),
    launch_channel: s.platform === "toss" ? "Toss Shopping" : PLATFORM_LABELS[s.platform],
    target_price: s.mode === "sourcing" ? s.targetPriceKrw : undefined,
    sourcing_usd: s.mode === "pricing" ? s.sourcingCostUsd : 0,
    vat_rate: 0.1,
    packaging_krw: s.packagingKrw,
    domestic_ship_krw: s.domesticShippingKrw,
    intl_ship_usd: s.overseasShippingUsd,
    platform_fee: platformFeePct / 100,
    pg_fee: s.pgFeePct / 100,
    return_rate: s.returnRatePct / 100,
    return_burden: s.returnLiabilityPct / 100,
    ad_ratio: s.marketingBudgetPct / 100,
    target_margin: s.targetMarginPct / 100,
    colors: [],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 480_000); // 8분 — fresh 키워드 파이프라인(LLM auto-fix 포함 최대 7분) 여유
  try {
    const res = await fetch(`${N8N_URL}/webhook/motionx-gtm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return parseEngineResponse(data);
  } finally {
    clearTimeout(timer);
  }
}
