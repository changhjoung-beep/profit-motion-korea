export type Mode = "pricing" | "sourcing";

export type Platform = "smartstore" | "coupang" | "toss" | "etc";

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
  // Step 1
  keyword: string;
  sourcingCostUsd: number; // only Mode A
  fxRate: number;
  // Step 2
  overseasShippingUsd: number;
  domesticShippingKrw: number;
  packagingKrw: number;
  returnRatePct: number;
  returnLiabilityPct: number;
  // Step 3
  platform: Platform;
  platformFeeManualPct: number;
  pgFeePct: number;
  marketingBudgetPct: number;
  targetMarginPct: number;
}

export const initialState: CalcState = {
  mode: "pricing",
  keyword: "",
  sourcingCostUsd: 0,
  fxRate: 1380,
  overseasShippingUsd: 0,
  domesticShippingKrw: 3000,
  packagingKrw: 500,
  returnRatePct: 5,
  returnLiabilityPct: 50,
  platform: "smartstore",
  platformFeeManualPct: 0,
  pgFeePct: 3.2,
  marketingBudgetPct: 15,
  targetMarginPct: 25,
};

export interface CalcResult {
  recommendedPrice: number;
  bepRoas: number;
  marketPosition: "LOW" | "MID" | "PREMIUM";
  verdict: "GO" | "WAIT" | "NO";
  breakdown: {
    sourcing: number;
    logistics: number;
    platformFee: number;
    marketing: number;
    margin: number;
  };
}

export function computeResult(s: CalcState): CalcResult {
  const platformFeePct = s.platform === "etc" ? s.platformFeeManualPct : PLATFORM_FEES[s.platform];

  // Cost basis (KRW)
  const sourcingKrw = s.mode === "pricing" ? s.sourcingCostUsd * s.fxRate : 8000; // mock for sourcing mode
  const overseasKrw = s.overseasShippingUsd * s.fxRate;
  const logisticsKrw = overseasKrw + s.domesticShippingKrw + s.packagingKrw;
  const returnCostKrw = (sourcingKrw + logisticsKrw) * (s.returnRatePct / 100) * (s.returnLiabilityPct / 100);
  const baseCost = sourcingKrw + logisticsKrw + returnCostKrw;

  // Price so that: price * (1 - feePct/100 - pg/100 - mkt/100 - margin/100) = baseCost
  const variablePct = (platformFeePct + s.pgFeePct + s.marketingBudgetPct + s.targetMarginPct) / 100;
  const denom = Math.max(0.05, 1 - variablePct);
  const rawPrice = baseCost / denom;
  const recommendedPrice = Math.ceil(rawPrice / 100) * 100;

  const marketingKrw = recommendedPrice * (s.marketingBudgetPct / 100);
  const platformFeeKrw = recommendedPrice * (platformFeePct + s.pgFeePct) / 100;
  const marginKrw = recommendedPrice - sourcingKrw - logisticsKrw - platformFeeKrw - marketingKrw;

  // BEP ROAS = price / marketing-spend-needed-to-break-even on margin
  const grossPerOrder = recommendedPrice - sourcingKrw - logisticsKrw - platformFeeKrw;
  const bepRoas = grossPerOrder > 0 ? recommendedPrice / grossPerOrder : 99;

  // mock market position based on price band
  let marketPosition: CalcResult["marketPosition"] = "MID";
  if (recommendedPrice < 15000) marketPosition = "LOW";
  else if (recommendedPrice > 40000) marketPosition = "PREMIUM";

  // verdict
  const marginPctActual = (marginKrw / recommendedPrice) * 100;
  let verdict: CalcResult["verdict"] = "GO";
  if (marginPctActual < 10) verdict = "NO";
  else if (marginPctActual < 20 || bepRoas > 3.5) verdict = "WAIT";

  return {
    recommendedPrice,
    bepRoas: Math.round(bepRoas * 100) / 100,
    marketPosition,
    verdict,
    breakdown: {
      sourcing: Math.max(0, sourcingKrw),
      logistics: Math.max(0, logisticsKrw),
      platformFee: Math.max(0, platformFeeKrw),
      marketing: Math.max(0, marketingKrw),
      margin: Math.max(0, marginKrw),
    },
  };
}