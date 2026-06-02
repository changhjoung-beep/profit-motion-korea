import { jsPDF } from "jspdf";
import { NANUM_GOTHIC_BASE64 } from "./nanumFont";
import type { EngineResult } from "./types";

// ──────────────────────────────────────────────────────────────
// 공통 유틸 — 전부 jsPDF 텍스트 기반 (html2canvas 미사용 → oklch 무관, 한글·복사 OK)
// ──────────────────────────────────────────────────────────────
const krw = (n?: number) =>
  n == null ? "—" : new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(Math.round(n));

const todayStr = () => new Date().toISOString().slice(0, 10);
const safeName = (s?: string) => (s ?? "motionx").replace(/[^\w가-힣]+/g, "_").slice(0, 30);

type RGB = [number, number, number];
const COLOR = {
  blue: [0, 170, 220] as RGB,
  lime: [120, 175, 0] as RGB,
  orange: [255, 107, 0] as RGB,
  red: [200, 60, 50] as RGB,
  ink: [30, 30, 38] as RGB,
  gray: [120, 120, 130] as RGB,
  line: [222, 222, 228] as RGB,
  softbg: [245, 248, 250] as RGB,
};

const M = 48; // 좌우 여백

// 공통 문서 셋업: A4 + 한글 폰트 + 커서/페이지 헬퍼 반환
function newDoc() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.addFileToVFS("NanumGothic.ttf", NANUM_GOTHIC_BASE64);
  doc.addFont("NanumGothic.ttf", "Nanum", "normal");
  doc.setFont("Nanum");
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  return { doc, W, H };
}

// 헤더(브랜드 + 타이틀 + 부제) 그리고 시작 y 반환
function header(doc: jsPDF, W: number, title: string, sub: string): number {
  let y = 56;
  doc.setFontSize(9).setTextColor(...COLOR.blue);
  doc.text("MX COMMERCE · GTM ENGINE", M, y);
  doc.setFontSize(22).setTextColor(...COLOR.ink);
  y += 26;
  doc.text(title, M, y);
  doc.setFontSize(10).setTextColor(...COLOR.gray);
  y += 18;
  doc.text(sub, M, y);
  return y + 14;
}

function footer(doc: jsPDF, H: number, label: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8).setTextColor(...COLOR.gray);
    const tail = pageCount > 1 ? ` · ${i}/${pageCount}` : "";
    doc.text(label + tail, M, H - 30);
  }
}

function verdictColor(v: string): RGB {
  return v === "GO" ? COLOR.lime : v === "WAIT" ? COLOR.orange : COLOR.red;
}

// 라벨+값 한 줄 (좌측 라벨, 우측 값)
function row(doc: jsPDF, W: number, y: number, label: string, value: string): number {
  doc.setFontSize(10).setTextColor(...COLOR.gray);
  doc.text(label, M, y);
  doc.setTextColor(...COLOR.ink);
  doc.text(value, W - M, y, { align: "right" });
  return y + 18;
}

function sectionTitle(doc: jsPDF, y: number, t: string): number {
  doc.setFontSize(11).setTextColor(...COLOR.blue);
  doc.text(t, M, y);
  return y + 20;
}

// ══════════════════════════════════════════════════════════════
// 1) PRICING GUIDE
// ══════════════════════════════════════════════════════════════
export function downloadPricingGuide(r: EngineResult) {
  const { doc, W, H } = newDoc();
  let y = header(doc, W, "가격 검증 가이드", `${r.keyword ?? ""}  ·  생성일 ${todayStr()}`);

  // 판정 배지 + 목표가
  y += 8;
  doc.setFillColor(...verdictColor(r.verdict));
  doc.roundedRect(M, y, 120, 30, 4, 4, "F");
  doc.setTextColor(255, 255, 255).setFontSize(13);
  doc.text(`판정: ${r.verdict}`, M + 14, y + 20);
  doc.setTextColor(...COLOR.ink).setFontSize(20);
  doc.text(`목표가 ₩${krw(r.pricing.targetPrice)}`, M + 150, y + 21);
  y += 50;
  doc.setDrawColor(...COLOR.line).line(M, y, W - M, y);
  y += 24;

  // 핵심 지표 4분할
  const metrics: [string, string][] = [
    ["BEP ROAS (손익분기)", r.pricing.bepRoas != null ? r.pricing.bepRoas.toFixed(2) : "—"],
    ["Target ROAS", r.pricing.targetRoas != null ? r.pricing.targetRoas.toFixed(2) : "—"],
    ["단위 순이익", `₩${krw(r.pricing.unitProfitKrw)}`],
    ["실현 마진", r.pricing.marginPct ?? "—"],
  ];
  const colW = (W - M * 2) / 2;
  metrics.forEach((m, i) => {
    const cx = M + (i % 2) * colW;
    const cy = y + Math.floor(i / 2) * 50;
    doc.setFontSize(9).setTextColor(...COLOR.gray).text(m[0], cx, cy);
    doc.setFontSize(16).setTextColor(...COLOR.ink).text(m[1], cx, cy + 22);
  });
  y += 110;

  doc.setDrawColor(...COLOR.line).line(M, y, W - M, y);
  y += 22;
  y = sectionTitle(doc, y, "소싱 · 원가 구조");
  y = row(doc, W, y, "최대 허용 소싱가 (KRW)", `₩${krw(r.pricing.maxSourcingKrw)}`);
  y = row(doc, W, y, "최대 허용 소싱가 (USD)", r.pricing.maxSourcingUsd != null ? `$${r.pricing.maxSourcingUsd.toFixed(2)}` : "—");
  y = row(doc, W, y, "허용 총원가 (allowed COGS)", `₩${krw(r.pricing.allowedCogsKrw)}`);
  y = row(doc, W, y, "고정비 합계", `₩${krw(r.pricing.fixedCostsKrw)}`);

  if (r.pricing.negotiation?.openingOfferUsd != null) {
    y += 12;
    y = sectionTitle(doc, y, "공급사 협상 3단계 (USD)");
    const neg = r.pricing.negotiation;
    y = row(doc, W, y, "오프닝 제안", `$${neg.openingOfferUsd?.toFixed(2) ?? "—"}`);
    y = row(doc, W, y, "목표가", `$${neg.targetOfferUsd?.toFixed(2) ?? "—"}`);
    y = row(doc, W, y, "최대 수용가", `$${neg.maxAcceptableUsd?.toFixed(2) ?? "—"}`);
  }

  y += 12;
  y = sectionTitle(doc, y, "광고비 가드레일 (단위당)");
  const kpis: [string, string, RGB][] = [
    ["목표 (target)", `₩${krw(r.pricing.kpi.target)}`, COLOR.lime],
    ["경고 (warning)", `₩${krw(r.pricing.kpi.warning)}`, COLOR.orange],
    ["상한 (max)", `₩${krw(r.pricing.kpi.max)}`, COLOR.red],
  ];
  doc.setFontSize(10);
  kpis.forEach(([k, v, c]) => {
    doc.setFillColor(...c).circle(M + 4, y - 4, 3, "F");
    doc.setTextColor(...COLOR.gray).text(k, M + 14, y);
    doc.setTextColor(...COLOR.ink).text(v, W - M, y, { align: "right" });
    y += 18;
  });

  footer(doc, H, "MX Commerce 가격 검증 가이드 · Scout → Pricing → Copy → GTM → Design");
  doc.save(`MotionX_가격가이드_${safeName(r.keyword)}_${todayStr()}.pdf`);
}

// ══════════════════════════════════════════════════════════════
// 2) AD COPY PACK
// ══════════════════════════════════════════════════════════════
export function downloadAdCopyPack(r: EngineResult) {
  const { doc, W, H } = newDoc();
  let y = header(doc, W, "광고 카피 팩 (AIDA)", `${r.keyword ?? ""}  ·  ${todayStr()}`);

  const ensure = (need: number) => {
    if (y + need > H - 48) {
      doc.addPage();
      y = 56;
    }
  };

  if (r.gtm.heroCopy) {
    y += 10;
    const hero = doc.splitTextToSize(r.gtm.heroCopy, W - M * 2 - 24);
    const boxH = 26 + hero.length * 16;
    doc.setFillColor(...COLOR.softbg).roundedRect(M, y, W - M * 2, boxH, 4, 4, "F");
    doc.setFontSize(9).setTextColor(...COLOR.gray);
    doc.text("★ GTM Planner 선택 히어로 카피", M + 12, y + 16);
    doc.setFontSize(13).setTextColor(...COLOR.ink);
    doc.text(hero, M + 12, y + 34);
    y += boxH + 16;
  }

  const blocks: [string, string | undefined][] = [
    ["헤드라인 (Attention)", r.copy.headline],
    ["서브 헤드라인", r.copy.subHeadline],
    ["훅 (Interest)", r.copy.hook],
    ["본문 (Desire)", r.copy.body],
    ["CTA (Action)", r.copy.cta],
    ["SEO 메타", r.copy.seoMeta],
    ["인스타그램 캡션", r.copy.instagram],
    ["검색광고 제목", r.copy.searchAdTitle],
    ["검색광고 설명", r.copy.searchAdDescription],
  ];

  doc.setDrawColor(...COLOR.line);
  blocks.forEach(([label, text]) => {
    if (!text) return;
    const lines = doc.splitTextToSize(text, W - M * 2);
    ensure(16 + lines.length * 14 + 22);
    doc.setFontSize(9).setTextColor(...COLOR.blue).text(label, M, y);
    y += 16;
    doc.setFontSize(11).setTextColor(...COLOR.ink).text(lines, M, y);
    y += lines.length * 14 + 10;
    doc.line(M, y, W - M, y);
    y += 12;
  });

  if (r.copy.keywordTags.length) {
    ensure(46);
    doc.setFontSize(9).setTextColor(...COLOR.blue).text("키워드 태그", M, y);
    y += 16;
    const tags = r.copy.keywordTags.map((t) => `#${t.replace(/^#/, "")}`).join("  ");
    doc.setFontSize(10).setTextColor(...COLOR.gray).text(doc.splitTextToSize(tags, W - M * 2), M, y);
  }

  footer(doc, H, "MX Commerce 광고 카피 팩");
  doc.save(`MotionX_광고카피팩_${safeName(r.keyword)}_${todayStr()}.pdf`);
}

// ══════════════════════════════════════════════════════════════
// 3) SCOUT SUMMARY (jsPDF 텍스트)
// ══════════════════════════════════════════════════════════════
export function downloadScoutSummary(r: EngineResult) {
  const { doc, W, H } = newDoc();
  let y = header(doc, W, "Scout 시장 리포트", `${r.keyword ?? ""}  ·  ${todayStr()}`);

  const ensure = (need: number) => {
    if (y + need > H - 48) {
      doc.addPage();
      y = 56;
    }
  };

  // 판정 + 점수
  y += 8;
  doc.setFillColor(...verdictColor(r.verdict));
  doc.roundedRect(M, y, 150, 28, 4, 4, "F");
  doc.setTextColor(255, 255, 255).setFontSize(12);
  doc.text(`SCOUT 판정: ${r.verdict}`, M + 12, y + 19);
  y += 40;
  if (r.scout.goReason) {
    doc.setFontSize(10).setTextColor(...COLOR.gray);
    doc.text(doc.splitTextToSize(r.scout.goReason, W - M * 2), M, y);
    y += 18;
  }

  // 점수 4분할
  y += 6;
  const scores: [string, number | undefined][] = [
    ["시장성", r.scout.scores.market],
    ["트렌드", r.scout.scores.trend],
    ["경쟁도", r.scout.scores.competition],
    ["종합", r.scout.scores.final],
  ];
  const cw = (W - M * 2) / 4;
  scores.forEach((s, i) => {
    const cx = M + i * cw;
    doc.setDrawColor(...COLOR.line).roundedRect(cx, y, cw - 8, 44, 3, 3, "S");
    doc.setFontSize(8).setTextColor(...COLOR.gray).text(s[0], cx + 8, y + 16);
    doc.setFontSize(18).setTextColor(...COLOR.ink).text(s[1] != null ? String(s[1]) : "—", cx + 8, y + 36);
  });
  y += 60;

  // 페인포인트 (높음)
  if (r.scout.painHigh.length) {
    ensure(30 + r.scout.painHigh.length * 16);
    y = sectionTitle(doc, y, "핵심 페인포인트 (높음)");
    doc.setFontSize(10).setTextColor(...COLOR.ink);
    r.scout.painHigh.forEach((p) => {
      const lines = doc.splitTextToSize(`• ${p}`, W - M * 2);
      doc.text(lines, M, y);
      y += lines.length * 14 + 2;
    });
    y += 8;
  }

  // 페인포인트 (중간)
  if (r.scout.painMed.length) {
    ensure(30 + r.scout.painMed.length * 16);
    y = sectionTitle(doc, y, "페인포인트 (중간)");
    doc.setFontSize(10).setTextColor(...COLOR.gray);
    r.scout.painMed.forEach((p) => {
      const lines = doc.splitTextToSize(`• ${p}`, W - M * 2);
      doc.text(lines, M, y);
      y += lines.length * 14 + 2;
    });
    y += 8;
  }

  // 시장 컨텍스트
  ensure(120);
  doc.setDrawColor(...COLOR.line).line(M, y, W - M, y);
  y += 18;
  y = sectionTitle(doc, y, "시장 컨텍스트");
  const ctx: [string, string | undefined][] = [
    ["가격 인사이트", r.scout.priceInsight],
    ["추천 가격대", r.scout.priceRange],
    ["런칭 타이밍", r.scout.launchTiming],
    ["경쟁사", r.scout.competitors.join(" · ")],
    ["추천 소싱 키워드", r.scout.sourcingKeywords.join(" · ")],
  ];
  ctx.forEach(([k, v]) => {
    if (!v) return;
    const lines = doc.splitTextToSize(v, W - M * 2);
    ensure(16 + lines.length * 14 + 6);
    doc.setFontSize(9).setTextColor(...COLOR.blue).text(k, M, y);
    y += 14;
    doc.setFontSize(10).setTextColor(...COLOR.ink).text(lines, M, y);
    y += lines.length * 14 + 8;
  });

  footer(doc, H, "MX Commerce Scout 시장 리포트 · Scout Agent");
  doc.save(`MotionX_Scout리포트_${safeName(r.keyword)}_${todayStr()}.pdf`);
}

// ══════════════════════════════════════════════════════════════
// 4) DESIGN BRIEF (마크다운 → jsPDF, 멀티페이지)
// ══════════════════════════════════════════════════════════════
export function downloadDesignBrief(r: EngineResult) {
  const { doc, W, H } = newDoc();
  let y = header(doc, W, r.designBriefTitle ?? "상세페이지 디자인 브리프", `${r.keyword ?? ""}  ·  ${todayStr()}`);
  y += 6;

  const md = r.designBriefMarkdown ?? "디자인 브리프 데이터가 없습니다.";
  const contentW = W - M * 2;
  const ensure = (need: number) => {
    if (y + need > H - 48) {
      doc.addPage();
      y = 56;
    }
  };

  const lines = md.split("\n");
  for (const raw of lines) {
    const t = raw.trim();
    if (!t) {
      y += 6;
      continue;
    }
    if (t === "---") {
      ensure(14);
      doc.setDrawColor(...COLOR.line).line(M, y, W - M, y);
      y += 12;
      continue;
    }
    if (t.startsWith("### ")) {
      ensure(22);
      doc.setFontSize(12).setTextColor(...COLOR.blue);
      const wrapped = doc.splitTextToSize(t.slice(4), contentW);
      doc.text(wrapped, M, y);
      y += wrapped.length * 16 + 4;
      continue;
    }
    if (t.startsWith("## ")) {
      ensure(24);
      doc.setFontSize(14).setTextColor(...COLOR.lime);
      const wrapped = doc.splitTextToSize(t.slice(3), contentW);
      doc.text(wrapped, M, y);
      y += wrapped.length * 18 + 5;
      continue;
    }
    if (t.startsWith("# ")) {
      ensure(28);
      doc.setFontSize(17).setTextColor(...COLOR.ink);
      const wrapped = doc.splitTextToSize(t.slice(2), contentW);
      doc.text(wrapped, M, y);
      y += wrapped.length * 21 + 6;
      continue;
    }
    // 표 행 → 모노 느낌으로 그대로 (셀 단순 출력)
    if (t.startsWith("|")) {
      const cells = t.split("|").map((c) => c.trim()).filter((c) => c.length > 0);
      if (cells.every((c) => /^[-:\s]+$/.test(c))) continue; // 구분선 행 스킵
      const text = cells.join("    ");
      const wrapped = doc.splitTextToSize(text, contentW);
      ensure(wrapped.length * 13 + 4);
      doc.setFontSize(9).setTextColor(...COLOR.ink);
      doc.text(wrapped, M, y);
      y += wrapped.length * 13 + 3;
      continue;
    }
    // 리스트
    if (/^[-*]\s/.test(t)) {
      const wrapped = doc.splitTextToSize(`• ${t.replace(/^[-*]\s/, "")}`, contentW - 6);
      ensure(wrapped.length * 14 + 2);
      doc.setFontSize(10).setTextColor(...COLOR.ink);
      doc.text(wrapped, M + 6, y);
      y += wrapped.length * 14 + 2;
      continue;
    }
    // 일반 문단 (**굵게** 마커는 제거만)
    const clean = t.replace(/\*\*/g, "");
    const wrapped = doc.splitTextToSize(clean, contentW);
    ensure(wrapped.length * 14 + 2);
    doc.setFontSize(10).setTextColor(...COLOR.ink);
    doc.text(wrapped, M, y);
    y += wrapped.length * 14 + 3;
  }

  footer(doc, H, "MX Commerce 디자인 브리프 · Design Brief Agent");
  doc.save(`MotionX_디자인브리프_${safeName(r.keyword)}_${todayStr()}.pdf`);
}
