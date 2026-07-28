/**
 * ZED Premium CSRD / ESRS E1 Report
 * ─────────────────────────────────────────────────────────────────────────
 * Built with @react-pdf/renderer — React component–based PDF generation.
 * Produces a professional, print-ready PDF compliant with ESRS E1 (EU 2023/2772)
 * and the GHG Protocol Corporate Standard.
 *
 * Sections:
 *   0. Cover Page
 *   1. Table of Contents
 *   2. Executive Summary (KPIs + scope bars + YoY)
 *   3. GHG Emissions — Scope 1  (E1-6 §44)
 *   4. GHG Emissions — Scope 2  (E1-6 §45)
 *   5. GHG Emissions — Scope 3  (E1-6 §51, if data present)
 *   6. Reduction Targets         (E1-4)
 *   7. Reduction Strategies      (E1-2)
 *   8. Monthly Data Completeness
 *   9. Methodology & Verification
 *  10. Back Page
 */

import React from 'react';
import path from 'path';
import {
  Document, Page, Text, View, Font, StyleSheet, renderToBuffer,
} from '@react-pdf/renderer';

// ── Local full-Unicode fonts (Cyrillic-capable) ────────────────────────────
// Stored in /public/fonts/ — full Roboto TTF files with Latin + Cyrillic glyphs.
// Using local paths avoids CDN subset issues (Google Fonts serves Latin-only subsets).
const FONT_DIR = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(FONT_DIR, 'Roboto-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(FONT_DIR, 'Roboto-Medium.ttf'),  fontWeight: 'medium' },
    { src: path.join(FONT_DIR, 'Roboto-Bold.ttf'),    fontWeight: 'bold' },
  ],
});

// Disable hyphenation — keeps Cyrillic words intact
Font.registerHyphenationCallback(w => [w]);

// ── Modern brand palette ───────────────────────────────────────────────────
// Cover/section backgrounds: deep charcoal-slate (not flat navy)
// Primary green: fresh #10B981 emerald (modern sustainability tone)
// Accent blue: #3B82F6 (modern vibrant blue)
const ZED = {
  // Cover & section bands — deep charcoal-slate (sophisticated, modern)
  navy:       '#111827',   // gray-900 — almost black, premium
  navyMid:    '#1F2937',   // gray-800 — section bands
  navyLight:  '#EFF6FF',   // very light blue tint for callouts

  // Primary brand green (fresh emerald)
  green:      '#059669',   // emerald-600
  greenMid:   '#10B981',   // emerald-500
  greenLight: '#ECFDF5',   // emerald-50

  // Scope 2 — vibrant blue
  blue:       '#2563EB',   // blue-600
  blueLight:  '#EFF6FF',   // blue-50

  // Scope 3 — warm amber-orange
  orange:     '#D97706',   // amber-600
  orangeLight:'#FFFBEB',   // amber-50

  // Warnings
  amber:      '#B45309',   // amber-700
  amberLight: '#FEF3C7',   // amber-100

  // Danger
  red:        '#DC2626',   // red-600

  // Neutrals
  gray50:     '#F9FAFB',
  gray100:    '#F3F4F6',
  gray200:    '#E5E7EB',
  gray400:    '#9CA3AF',
  gray600:    '#6B7280',
  gray800:    '#1F2937',
  black:      '#111827',
  white:      '#FFFFFF',

  // Cover accent — electric green stripe
  accent:     '#10B981',   // emerald-500

  // Cover subtitle tint
  teal:       '#0D9488',   // teal-600
};

// ── Scope colours ─────────────────────────────────────────────────────────
const SCOPE_COLOR = {
  1: { solid: ZED.green,  light: ZED.greenLight,  label: 'Обхват 1' },
  2: { solid: ZED.blue,   light: ZED.blueLight,   label: 'Обхват 2' },
  3: { solid: ZED.orange, light: ZED.orangeLight, label: 'Обхват 3' },
};

// ── Labels ─────────────────────────────────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
  vehicles_diesel:    'Превозни средства — Дизел',
  vehicles_petrol:    'Превозни средства — Бензин',
  vehicles_lpg:       'Превозни средства — ГПГ',
  natural_gas:        'Природен газ',
  heating_oil:        'Нафта за отопление',
  coal:               'Въглища',
  refrigerant_r134a:  'Хладилен агент R-134a',
  refrigerant_r404a:  'Хладилен агент R-404A',
  electricity:        'Електроенергия',
  district_heating:   'Топлоенергия',
  district_cooling:   'Хладилна енергия',
};

const S3_LABELS: Record<number, string> = {
  1: 'Кат. 1 — Закупени стоки и услуги',
  4: 'Кат. 4 — Транспорт нагоре по веригата',
  5: 'Кат. 5 — Отпадъци от операциите',
  6: 'Кат. 6 — Бизнес пътувания',
  7: 'Кат. 7 — Пътуване на служители',
};

const BG_MONTHS = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни',
                   'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];

// ── StyleSheet ─────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // ── Page ──
  page: {
    fontFamily: 'Roboto',
    fontSize: 9,
    color: ZED.black,
    backgroundColor: ZED.white,
    paddingTop: 0,
    paddingBottom: 0,
  },
  pageInner: {
    marginHorizontal: 44,
    marginTop: 52,
    marginBottom: 52,
    flex: 1,
  },

  // ── Cover ──
  coverPage: {
    backgroundColor: ZED.navy,   // deep charcoal-slate
    flex: 1,
    padding: 0,
  },
  // Diagonal accent strip effect via a thick left bar + top bar combo
  coverAccentBar: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 8, backgroundColor: ZED.accent,  // bright emerald
  },
  coverTopStrip: {
    position: 'absolute', left: 0, top: 0, right: 0,
    height: 4, backgroundColor: ZED.accent,
  },
  coverContent: {
    flex: 1, justifyContent: 'space-between',
    paddingLeft: 58, paddingRight: 52,
    paddingTop: 70, paddingBottom: 44,
  },
  coverTopBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)',   // translucent emerald
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    alignSelf: 'flex-start', marginBottom: 44,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
  },
  coverTopBadgeText: {
    color: ZED.accent, fontWeight: 'medium', fontSize: 8, letterSpacing: 0.8,
  },
  coverZed: {
    fontSize: 64, fontWeight: 'bold', color: ZED.white, letterSpacing: -2,
    lineHeight: 1,
  },
  coverZedDot: {
    fontSize: 64, fontWeight: 'bold', color: ZED.accent, letterSpacing: -2,
  },
  coverSubtitle: {
    fontSize: 12, color: 'rgba(255,255,255,0.40)', fontWeight: 'normal',
    marginTop: 6, letterSpacing: 2,
  },
  coverCompanyName: {
    fontSize: 26, fontWeight: 'bold', color: ZED.white,
    marginTop: 48, lineHeight: 1.25,
  },
  coverReportTitle: {
    fontSize: 13, color: ZED.accent, fontWeight: 'medium',
    marginTop: 8, letterSpacing: 0.2,
  },
  coverDivider: {
    width: 48, height: 2, backgroundColor: ZED.accent,
    marginTop: 22, marginBottom: 20,
  },
  coverMeta: {
    color: 'rgba(255,255,255,0.45)', fontSize: 8.5,
    lineHeight: 2.0,
  },
  coverMetaBold: {
    color: 'rgba(255,255,255,0.80)', fontWeight: 'medium',
  },
  coverFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.10)',
    paddingTop: 14,
  },
  coverFooterLeft: { color: 'rgba(255,255,255,0.35)', fontSize: 7.5, lineHeight: 1.8 },
  coverFooterRight: {
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)',
  },
  coverFooterRightText: { color: ZED.accent, fontSize: 9, fontWeight: 'bold' },
  coverFooterRightSub: { color: 'rgba(255,255,255,0.35)', fontSize: 7, marginTop: 2 },

  // ── Page header / footer ──
  pageHeader: {
    marginHorizontal: 44, marginTop: 20, marginBottom: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: ZED.accent + '33',
  },
  pageHeaderLeft: { fontSize: 7.5, color: ZED.green, fontWeight: 'bold', letterSpacing: 0.8 },
  pageHeaderRight: { fontSize: 7.5, color: ZED.gray400 },
  pageFooter: {
    position: 'absolute', bottom: 18, left: 44, right: 44,
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 0.5, borderTopColor: ZED.gray200, paddingTop: 6,
  },
  pageFooterText: { fontSize: 7, color: ZED.gray400 },

  // ── Section title band ──
  sectionBand: {
    backgroundColor: ZED.navy,      // deep charcoal
    paddingHorizontal: 12, paddingVertical: 9,
    marginBottom: 14, borderRadius: 4,
    flexDirection: 'row', alignItems: 'center',
  },
  sectionBandAccent: {
    width: 3, borderRadius: 2,
    backgroundColor: ZED.accent,   // bright emerald stripe
    marginRight: 10,
    alignSelf: 'stretch',
  },
  sectionBandText: { color: ZED.white, fontWeight: 'bold', fontSize: 10, letterSpacing: 0.5 },

  // ── Sub-section header ──
  subHead: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 12, marginBottom: 6,
    borderLeftWidth: 2, borderLeftColor: ZED.accent,
    paddingLeft: 8,
  },
  subHeadEsrs: {
    fontSize: 7, fontWeight: 'bold', color: ZED.green,
    backgroundColor: ZED.greenLight, borderRadius: 3,
    paddingHorizontal: 5, paddingVertical: 2, marginRight: 8,
  },
  subHeadTitle: { fontSize: 9.5, fontWeight: 'bold', color: ZED.black, flex: 1 },

  // ── KPI cards row ──
  kpiRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  kpiCard: {
    flex: 1, borderRadius: 6, padding: 10,
    borderWidth: 1,
  },
  kpiLabel: { fontSize: 7.5, fontWeight: 'medium', color: ZED.gray600, marginBottom: 4 },
  kpiValue: { fontSize: 18, fontWeight: 'bold', lineHeight: 1.1 },
  kpiUnit: { fontSize: 7, color: ZED.gray400, marginTop: 2 },
  kpiChange: { fontSize: 7.5, fontWeight: 'medium', marginTop: 4 },

  // ── Bar chart ──
  barRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 3,
  },
  barLabel: { width: 160, fontSize: 8, color: ZED.gray800, paddingRight: 8 },
  barTrack: { flex: 1, height: 10, backgroundColor: ZED.gray100, borderRadius: 3 },
  barFill: { height: 10, borderRadius: 3 },
  barValue: { width: 60, fontSize: 8, fontWeight: 'medium', textAlign: 'right' },

  // ── Table ──
  tableHeader: {
    flexDirection: 'row', backgroundColor: ZED.navy,  // charcoal header
    paddingHorizontal: 8, paddingVertical: 7,
    borderRadius: 2,
  },
  tableHeaderCell: { fontSize: 7.5, color: ZED.white, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 5 },
  tableRowAlt: { backgroundColor: ZED.gray50 },
  tableCell: { fontSize: 8, color: ZED.gray800 },
  tableCellBold: { fontSize: 8, fontWeight: 'bold', color: ZED.black },
  tableFooter: {
    flexDirection: 'row', backgroundColor: ZED.greenLight,
    paddingHorizontal: 8, paddingVertical: 5,
    borderTopWidth: 1, borderTopColor: ZED.green + '44',
  },

  // ── Prose ──
  para: { fontSize: 8.5, lineHeight: 1.6, color: ZED.gray800, marginBottom: 6 },
  bullet: { flexDirection: 'row', marginBottom: 3, paddingLeft: 10 },
  bulletDot: { width: 10, fontSize: 8.5, color: ZED.navyMid },
  bulletText: { flex: 1, fontSize: 8.5, lineHeight: 1.55, color: ZED.gray800 },

  // ── Info callout ──
  callout: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: ZED.greenLight,
    borderRadius: 5, padding: 10, marginVertical: 6,
    borderLeftWidth: 3, borderLeftColor: ZED.accent,
  },
  calloutText: { flex: 1, fontSize: 8, lineHeight: 1.6, color: ZED.black },

  // ── Monthly heat grid ──
  monthCell: {
    width: 36, height: 26, borderRadius: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  monthLabel: { fontSize: 6.5, fontWeight: 'bold', color: ZED.gray600 },
  monthDot: { fontSize: 7, marginTop: 1 },

  // ── Target card ──
  targetCard: {
    borderWidth: 1, borderColor: ZED.gray200, borderRadius: 6,
    padding: 10, marginBottom: 8,
  },
  targetName: { fontSize: 9, fontWeight: 'bold', color: ZED.navy, marginBottom: 2 },
  targetMeta: { fontSize: 7.5, color: ZED.gray600, lineHeight: 1.6 },
  progressTrack: { height: 8, backgroundColor: ZED.gray200, borderRadius: 4, marginTop: 6 },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: ZED.greenMid },

  // ── Strategy card ──
  strategyRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 6, paddingBottom: 6,
    borderBottomWidth: 0.5, borderBottomColor: ZED.gray200,
  },
  strategyBadge: {
    width: 28, height: 28, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0,
  },
  strategyTitle: { fontSize: 8.5, fontWeight: 'bold', color: ZED.navy, flex: 1 },
  strategyMeta: { fontSize: 7.5, color: ZED.gray600, marginTop: 2 },

  // ── Declaration box ──
  declBox: {
    borderWidth: 1, borderColor: ZED.accent + '55',
    backgroundColor: ZED.greenLight,
    borderRadius: 6, padding: 14, marginTop: 16,
  },
  declTitle: { fontSize: 9, fontWeight: 'bold', color: ZED.green, marginBottom: 6 },
  declText: { fontSize: 8, lineHeight: 1.6, color: ZED.gray800 },
  declSig: {
    flexDirection: 'row', marginTop: 18, gap: 20,
  },
  sigBlock: {
    flex: 1, borderTopWidth: 0.75, borderTopColor: ZED.gray400,
    paddingTop: 6,
  },
  sigLabel: { fontSize: 7.5, color: ZED.gray600 },

  // ── Back page ──
  backPage: { flex: 1, backgroundColor: ZED.navy },  // same charcoal
  backContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 60,
  },
  backZed: { fontSize: 48, fontWeight: 'bold', color: ZED.white, letterSpacing: -2 },
  backTagline: { fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 4, letterSpacing: 2 },
  backDivider: { width: 48, height: 2, backgroundColor: ZED.accent, marginVertical: 28 },
  backDisclaimer: {
    fontSize: 7.5, color: 'rgba(255,255,255,0.30)',
    textAlign: 'center', lineHeight: 1.8, maxWidth: 380,
  },
  backMeta: { color: 'rgba(255,255,255,0.18)', fontSize: 7, marginTop: 20 },
});

// ══════════════════════════════════════════════════════════════════════════
// Data types
// ══════════════════════════════════════════════════════════════════════════

export interface PremiumReportData {
  company: {
    company_name: string;
    registration_number?: string;
    industry_sector?: string;
    employee_count?: number;
    address?: string;
  };
  reportingYear: number;
  scope12Emissions: {
    reporting_period: string;
    scope: number;
    category: string;
    activity_value: number;
    unit: string;
    calculated_co2e: number;
    measurement_method?: string;
    data_quality?: string;
    location?: string;
    factor_source_name?: string;
    factor_source_year?: number;
  }[];
  scope3Calculations: {
    scope_category: number;
    co2e_kg: number;
    method_tier: string;
    calculation_trace?: {
      supplier?: string;
      description?: string;
      amount?: number;
      currency?: string;
      factor_value?: number;
      factor_unit?: string;
      factor_source?: string;
    };
  }[];
  targets?: {
    name: string;
    target_type: string;
    target_value: number;
    target_year: number;
    baseline_year: number;
    description?: string;
    scope?: number;
  }[];
  strategies?: {
    title: string;
    category: string;
    status: string;
    estimated_reduction_co2e?: number;
    actual_reduction_co2e?: number;
    responsible_person?: string;
  }[];
  comparisonData?: {
    previousYear: number;
    change: number;
    changePercent: number;
  };
  generatedBy?: string;
}

// ══════════════════════════════════════════════════════════════════════════
// Shared sub-components
// ══════════════════════════════════════════════════════════════════════════

function PageHeader({ company, year, section }: {
  company: string; year: number; section: string;
}) {
  return (
    <View style={S.pageHeader} fixed>
      <Text style={S.pageHeaderLeft}>{company.toUpperCase()} · {year}</Text>
      <Text style={S.pageHeaderRight}>{section}</Text>
    </View>
  );
}

function PageFooter({ year }: { year: number }) {
  return (
    <View style={S.pageFooter} fixed>
      <Text style={S.pageFooterText}>
        CSRD — ESRS E1 Climate Change Disclosure · Отчетна година {year} · ZED Footprint Platform
      </Text>
      <Text style={S.pageFooterText} render={({ pageNumber, totalPages }) =>
        `${pageNumber} / ${totalPages}`
      } />
    </View>
  );
}

function SectionBand({ label }: { label: string }) {
  return (
    <View style={S.sectionBand}>
      <View style={S.sectionBandAccent} />
      <Text style={S.sectionBandText}>{label}</Text>
    </View>
  );
}

function SubHead({ esrs, title }: { esrs: string; title: string }) {
  return (
    <View style={S.subHead}>
      <Text style={S.subHeadEsrs}>{esrs}</Text>
      <Text style={S.subHeadTitle}>{title}</Text>
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <Text style={S.para}>{children}</Text>;
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={S.bullet}>
      <Text style={S.bulletDot}>•</Text>
      <Text style={S.bulletText}>{children}</Text>
    </View>
  );
}

function KpiCard({ label, value, unit, color, bg, change, changePositive }: {
  label: string; value: string; unit: string;
  color: string; bg: string;
  change?: string; changePositive?: boolean;
}) {
  return (
    <View style={[S.kpiCard, { backgroundColor: bg, borderColor: color + '55' }]}>
      <Text style={S.kpiLabel}>{label}</Text>
      <Text style={[S.kpiValue, { color }]}>{value}</Text>
      <Text style={S.kpiUnit}>{unit}</Text>
      {change && (
        <Text style={[S.kpiChange, { color: changePositive ? ZED.green : ZED.red }]}>
          {change}
        </Text>
      )}
    </View>
  );
}

function HBar({ label, value, max, color, pct }: {
  label: string; value: string; max: number; color: string; pct: number;
}) {
  const barW = Math.max(0, Math.min(100, pct));
  return (
    <View style={S.barRow}>
      <Text style={S.barLabel} numberOfLines={1}>{label}</Text>
      <View style={S.barTrack}>
        <View style={[S.barFill, { width: `${barW}%`, backgroundColor: color }]} />
      </View>
      <Text style={S.barValue}>{value}</Text>
    </View>
  );
}

function TableRow12({ row, isAlt, total }: {
  row: PremiumReportData['scope12Emissions'][0];
  isAlt: boolean;
  total: number;
}) {
  const pct = total > 0 ? (row.calculated_co2e / total) * 100 : 0;
  const sc = SCOPE_COLOR[row.scope as 1 | 2] ?? SCOPE_COLOR[1];
  return (
    <View style={[S.tableRow, isAlt ? S.tableRowAlt : {}]}>
      <Text style={[S.tableCell, { flex: 2.2 }]} numberOfLines={1}>
        {CAT_LABELS[row.category] ?? row.category}
      </Text>
      <Text style={[S.tableCell, { flex: 1.1, textAlign: 'right' }]}>
        {row.activity_value.toLocaleString('bg-BG', { maximumFractionDigits: 2 })}
      </Text>
      <Text style={[S.tableCell, { flex: 0.7, textAlign: 'center', color: ZED.gray400 }]}>
        {row.unit}
      </Text>
      {/* mini bar */}
      <View style={{ flex: 1.4, paddingHorizontal: 4, justifyContent: 'center' }}>
        <View style={{ height: 7, backgroundColor: ZED.gray100, borderRadius: 2 }}>
          <View style={{
            height: 7, borderRadius: 2,
            width: `${Math.max(2, pct)}%`,
            backgroundColor: sc.solid,
          }} />
        </View>
      </View>
      <Text style={[S.tableCellBold, { flex: 1, textAlign: 'right' }]}>
        {row.calculated_co2e.toFixed(4)}
      </Text>
      <Text style={[S.tableCell, { flex: 1, textAlign: 'center', color: ZED.gray400 }]}>
        {row.factor_source_name ?? '—'}
      </Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Pages
// ══════════════════════════════════════════════════════════════════════════

// ── Cover ──────────────────────────────────────────────────────────────────
function CoverPage({ data, today }: { data: PremiumReportData; today: string }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.coverPage}>
        {/* Left accent bar */}
        <View style={S.coverAccentBar} />
        {/* Top accent strip */}
        <View style={S.coverTopStrip} />

        <View style={S.coverContent}>
          {/* Top */}
          <View>
            {/* Standards badge */}
            <View style={S.coverTopBadge}>
              <Text style={S.coverTopBadgeText}>
                CSRD  ·  ESRS E1  ·  GHG Protocol  ·  ISO 14064-1
              </Text>
            </View>

            {/* Brand */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text style={S.coverZed}>ZED</Text>
              <Text style={[S.coverZed, { color: ZED.accent, marginLeft: 2 }]}>.</Text>
            </View>
            <Text style={S.coverSubtitle}>CARBON FOOTPRINT PLATFORM</Text>

            <View style={S.coverDivider} />

            {/* Company */}
            <Text style={S.coverCompanyName}>{data.company.company_name}</Text>
            <Text style={S.coverReportTitle}>
              {'CSRD / ESRS E1  —  Отчет за климата  ·  ' + data.reportingYear + ' г.'}
            </Text>

            {/* Meta grid */}
            <View style={{ marginTop: 24, gap: 4 }}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={[S.coverMeta, { width: 140 }]}>Период на отчитане:</Text>
                <Text style={[S.coverMeta, S.coverMetaBold]}>
                  {'01.01.' + data.reportingYear + ' — 31.12.' + data.reportingYear}
                </Text>
              </View>
              {data.company.registration_number ? (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[S.coverMeta, { width: 140 }]}>ЕИК / Рег. номер:</Text>
                  <Text style={[S.coverMeta, S.coverMetaBold]}>
                    {data.company.registration_number}
                  </Text>
                </View>
              ) : null}
              {data.company.industry_sector ? (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[S.coverMeta, { width: 140 }]}>Отрасъл:</Text>
                  <Text style={[S.coverMeta, S.coverMetaBold]}>
                    {data.company.industry_sector}
                  </Text>
                </View>
              ) : null}
              {data.company.employee_count ? (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[S.coverMeta, { width: 140 }]}>Брой служители:</Text>
                  <Text style={[S.coverMeta, S.coverMetaBold]}>
                    {String(data.company.employee_count)}
                  </Text>
                </View>
              ) : null}
              {data.company.address ? (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[S.coverMeta, { width: 140 }]}>Адрес:</Text>
                  <Text style={[S.coverMeta, S.coverMetaBold, { flex: 1 }]}>
                    {data.company.address}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Footer */}
          <View style={S.coverFooter}>
            <Text style={S.coverFooterLeft}>
              {'Изготвен от: ' + (data.generatedBy ?? 'ZED Platform') + '\n'}
              {'Дата: ' + today + '\n'}
              {'Регламент (ЕС) 2023/2772 — ESRS E1'}
            </Text>
            <View style={S.coverFooterRight}>
              <Text style={S.coverFooterRightText}>ESRS E1</Text>
              <Text style={S.coverFooterRightSub}>Climate Change</Text>
            </View>
          </View>
        </View>
      </View>
    </Page>
  );
}

// ── Executive Summary ──────────────────────────────────────────────────────
function ExecutiveSummaryPage({ data, scope1, scope2, scope3Tons, grandTotal }: {
  data: PremiumReportData;
  scope1: number; scope2: number; scope3Tons: number; grandTotal: number;
}) {
  const cd = data.comparisonData;
  const yoyText = cd
    ? `${cd.change <= 0 ? '↓' : '↑'} ${Math.abs(cd.changePercent).toFixed(1)}% спрямо ${data.reportingYear - 1} г.`
    : undefined;
  const yoyPositive = (cd?.change ?? 1) <= 0;

  const scopes = [
    { label: 'Обхват 1 — Директни', val: scope1, color: ZED.green },
    { label: 'Обхват 2 — Закупена енергия', val: scope2, color: ZED.blue },
    { label: 'Обхват 3 — Верига на стойността', val: scope3Tons, color: ZED.orange },
  ];

  return (
    <Page size="A4" style={S.page}>
      <PageHeader company={data.company.company_name} year={data.reportingYear}
        section="ИЗПЪЛНИТЕЛНО РЕЗЮМЕ" />
      <View style={S.pageInner}>
        <SectionBand label="1. ИЗПЪЛНИТЕЛНО РЕЗЮМЕ" />

        {/* KPI row */}
        <View style={S.kpiRow}>
          <KpiCard label="Обхват 1 — Директни" value={scope1.toFixed(2)}
            unit="tCO₂e" color={ZED.green} bg={ZED.greenLight} />
          <KpiCard label="Обхват 2 — Закупена енергия" value={scope2.toFixed(2)}
            unit="tCO₂e" color={ZED.blue} bg={ZED.blueLight} />
          <KpiCard label="Обхват 3 — Верига" value={scope3Tons > 0 ? scope3Tons.toFixed(2) : 'Н/Д'}
            unit="tCO₂e" color={ZED.orange} bg={ZED.orangeLight} />
          <KpiCard label="ОБЩО БРУТНИ ЕМИСИИ" value={grandTotal.toFixed(2)}
            unit="tCO₂e" color={ZED.navy} bg={ZED.navyLight}
            change={yoyText} changePositive={yoyPositive} />
        </View>

        {/* Scope proportion bars */}
        <SubHead esrs="E1-6" title="Разпределение по обхват (% от общото)" />
        {scopes.map(s => (
          <HBar key={s.label} label={s.label} value={`${s.val.toFixed(2)} t`}
            max={grandTotal} color={s.color}
            pct={grandTotal > 0 ? (s.val / grandTotal) * 100 : 0} />
        ))}

        {/* YoY comparison */}
        {cd && (
          <>
            <SubHead esrs="E1-6 §48" title="Сравнение с предходна година" />
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
              <View style={{ flex: 1, backgroundColor: ZED.gray100, borderRadius: 5, padding: 10 }}>
                <Text style={{ fontSize: 7.5, color: ZED.gray600, marginBottom: 3 }}>
                  {data.reportingYear - 1} г.
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: ZED.gray800 }}>
                  {cd.previousYear.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 7, color: ZED.gray400 }}>tCO₂e</Text>
              </View>
              <View style={{
                flex: 1,
                backgroundColor: cd.change <= 0 ? ZED.greenLight : ZED.orangeLight,
                borderRadius: 5, padding: 10,
                borderWidth: 1,
                borderColor: cd.change <= 0 ? ZED.green : ZED.orange,
              }}>
                <Text style={{ fontSize: 7.5, fontWeight: 'medium',
                  color: cd.change <= 0 ? ZED.green : ZED.orange, marginBottom: 3 }}>
                  Промяна
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold',
                  color: cd.change <= 0 ? ZED.green : ZED.orange }}>
                  {cd.change <= 0 ? '' : '+'}{cd.changePercent.toFixed(1)}%
                </Text>
                <Text style={{ fontSize: 7, color: ZED.gray400 }}>
                  {cd.change <= 0 ? 'намаление' : 'увеличение'}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: ZED.navyLight, borderRadius: 5, padding: 10 }}>
                <Text style={{ fontSize: 7.5, color: ZED.navyMid, marginBottom: 3 }}>
                  {data.reportingYear} г.
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: ZED.navy }}>
                  {grandTotal.toFixed(2)}
                </Text>
                <Text style={{ fontSize: 7, color: ZED.gray400 }}>tCO₂e</Text>
              </View>
            </View>
          </>
        )}

        {/* Key statements */}
        <SubHead esrs="E1-GOV" title="Ключови изявления" />
        <Para>
          {`${data.company.company_name} е ангажирана с измерването и управлението на своя въглероден отпечатък в съответствие с GHG Protocol Corporate Standard и ESRS E1 от Регламент (ЕС) 2023/2772. Настоящото разкриване обхваща Обхват 1, 2 и 3 за отчетната ${data.reportingYear} г.`}
        </Para>
        <Para>
          Използвана методология за консолидация: Оперативен контрол (100% от дейностите,
          контролирани от организацията). GWP стойности по IPCC AR6. Емисионни фактори:
          DEFRA 2024, Българска Агенция по Енергетика, EXIOBASE v3.
        </Para>
      </View>
      <PageFooter year={data.reportingYear} />
    </Page>
  );
}

// ── Scope 1 & 2 ────────────────────────────────────────────────────────────
function Scope12Page({ data, scope1, scope2 }: {
  data: PremiumReportData; scope1: number; scope2: number;
}) {
  const s1rows = data.scope12Emissions.filter(e => e.scope === 1);
  const s2rows = data.scope12Emissions.filter(e => e.scope === 2);

  const ColHeader = ({ label, flex, align = 'left' }: {
    label: string; flex: number; align?: string;
  }) => (
    <Text style={[S.tableHeaderCell, { flex, textAlign: align as 'left' | 'right' | 'center' }]}>
      {label}
    </Text>
  );

  const TableHead = () => (
    <View style={S.tableHeader}>
      <ColHeader label="Категория" flex={2.2} />
      <ColHeader label="Количество" flex={1.1} align="right" />
      <ColHeader label="Единица" flex={0.7} align="center" />
      <ColHeader label="Дял" flex={1.4} align="center" />
      <ColHeader label="tCO₂e" flex={1} align="right" />
      <ColHeader label="Фактор" flex={1} align="center" />
    </View>
  );

  return (
    <Page size="A4" style={S.page}>
      <PageHeader company={data.company.company_name} year={data.reportingYear}
        section="ОБХВАТ 1 & 2 — ДИРЕКТНИ И ЗАКУПЕНА ЕНЕРГИЯ" />
      <View style={S.pageInner}>
        <SectionBand label="2. ОБХВАТ 1 — ДИРЕКТНИ ЕМИСИИ (E1-6 §44)" />
        <SubHead esrs="E1-6 §44" title="Разбивка по категория" />
        <Para>
          Обхват 1 включва директни емисии от горивни и технологични процеси под оперативния
          контрол на организацията. Включва CO₂, CH4, N₂O, HFCs (изразени в CO₂e, GWP100, AR6).
        </Para>
        <View style={S.kpiRow}>
          <KpiCard label="Общо Обхват 1" value={scope1.toFixed(3)} unit="tCO₂e"
            color={ZED.green} bg={ZED.greenLight} />
          <KpiCard label="Брой записи" value={String(s1rows.length)} unit="дейности"
            color={ZED.gray600} bg={ZED.gray100} />
        </View>

        {s1rows.length > 0 ? (
          <View>
            <TableHead />
            {s1rows.map((row, i) => (
              <TableRow12 key={row.reporting_period + row.category + i}
                row={row} isAlt={i % 2 !== 0} total={scope1} />
            ))}
            <View style={S.tableFooter}>
              <Text style={[S.tableCellBold, { flex: 2.2 }]}>ОБЩО Обхват 1</Text>
              <Text style={{ flex: 1.1 }} />
              <Text style={{ flex: 0.7 }} />
              <Text style={{ flex: 1.4 }} />
              <Text style={[S.tableCellBold, { flex: 1, textAlign: 'right', color: ZED.green }]}>
                {scope1.toFixed(4)}
              </Text>
              <Text style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <View style={[S.callout, { borderLeftColor: ZED.amber, backgroundColor: ZED.amberLight }]}>
            <Text style={[S.calloutText, { color: ZED.amber }]}>
              Няма данни за Обхват 1 за {data.reportingYear} г. Добавете записи за гориво,
              хладилни агенти и природен газ.
            </Text>
          </View>
        )}

        <View style={{ marginTop: 16 }}>
          <SectionBand label="3. ОБХВАТ 2 — ЗАКУПЕНА ЕНЕРГИЯ (E1-6 §45)" />
        </View>
        <SubHead esrs="E1-6 §45" title="Метод на местоположение (Location-based)" />
        <Para>
          Обхват 2 обхваща емисиите от производството на закупена електроенергия, топлоенергия
          и охлаждане. Представени по метод на местоположение — средна стойност на мрежата.
          При наличие на договорни инструменти (GoO/RECs) ще бъдат включени и пазарно-базирани данни.
        </Para>
        <View style={S.kpiRow}>
          <KpiCard label="Общо Обхват 2" value={scope2.toFixed(3)} unit="tCO₂e (location-based)"
            color={ZED.blue} bg={ZED.blueLight} />
          <KpiCard label="Брой записи" value={String(s2rows.length)} unit="дейности"
            color={ZED.gray600} bg={ZED.gray100} />
        </View>
        {s2rows.length > 0 ? (
          <View>
            <TableHead />
            {s2rows.map((row, i) => (
              <TableRow12 key={row.reporting_period + row.category + i}
                row={row} isAlt={i % 2 !== 0} total={scope2} />
            ))}
            <View style={S.tableFooter}>
              <Text style={[S.tableCellBold, { flex: 2.2 }]}>ОБЩО Обхват 2</Text>
              <Text style={{ flex: 1.1 }} />
              <Text style={{ flex: 0.7 }} />
              <Text style={{ flex: 1.4 }} />
              <Text style={[S.tableCellBold, { flex: 1, textAlign: 'right', color: ZED.blue }]}>
                {scope2.toFixed(4)}
              </Text>
              <Text style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <View style={[S.callout, { borderLeftColor: ZED.amber, backgroundColor: ZED.amberLight }]}>
            <Text style={[S.calloutText, { color: ZED.amber }]}>
              Няма данни за Обхват 2 за {data.reportingYear} г.
            </Text>
          </View>
        )}
      </View>
      <PageFooter year={data.reportingYear} />
    </Page>
  );
}

// ── Scope 3 ────────────────────────────────────────────────────────────────
function Scope3Page({ data, scope3Tons }: { data: PremiumReportData; scope3Tons: number }) {
  const byCategory: Record<number, number> = {};
  data.scope3Calculations.forEach(c => {
    byCategory[c.scope_category] = (byCategory[c.scope_category] ?? 0) + c.co2e_kg;
  });
  const top10 = [...data.scope3Calculations].sort((a, b) => b.co2e_kg - a.co2e_kg).slice(0, 10);

  return (
    <Page size="A4" style={S.page}>
      <PageHeader company={data.company.company_name} year={data.reportingYear}
        section="ОБХВАТ 3 — ВЕРИГА НА СТОЙНОСТТА" />
      <View style={S.pageInner}>
        <SectionBand label="4. ОБХВАТ 3 — ВЕРИГА НА СТОЙНОСТТА (E1-6 §51)" />

        <View style={S.kpiRow}>
          <KpiCard label="Общо Обхват 3" value={scope3Tons.toFixed(3)} unit="tCO₂e"
            color={ZED.orange} bg={ZED.orangeLight} />
          <KpiCard label="Покрити категории" value={String(Object.keys(byCategory).length)}
            unit="от 5 планирани" color={ZED.gray600} bg={ZED.gray100} />
          <KpiCard label="Метод" value="Ниво C" unit="EEIO · Spend-based"
            color={ZED.navyMid} bg={ZED.navyLight} />
        </View>

        {/* Category breakdown bars */}
        <SubHead esrs="E1-6 §52" title="Разбивка по категория" />
        {Object.entries(byCategory).map(([cat, kgTotal]) => (
          <HBar key={cat} label={S3_LABELS[parseInt(cat)] ?? `Категория ${cat}`}
            value={`${(kgTotal / 1000).toFixed(3)} t`}
            max={scope3Tons * 1000} color={ZED.orange}
            pct={scope3Tons > 0 ? (kgTotal / (scope3Tons * 1000)) * 100 : 0} />
        ))}

        {/* Method note */}
        <View style={[S.callout, { marginTop: 8 }]}>
          <Text style={S.calloutText}>
            Използван метод: Разходно-базиран (Ниво C) — финансови транзакции, умножени по
            EXIOBASE v3 / DEFRA 2024 отраслови фактори. Несигурност: ±15–30%.
            За подобряване на точността препоръчваме физически данни за Топ 5 доставчика.
          </Text>
        </View>

        {/* Top 10 audit table */}
        {top10.length > 0 && (
          <>
            <SubHead esrs="E1-6 §51(g)" title={`Одитен след — топ ${top10.length} изчисления`} />
            <View style={S.tableHeader}>
              <Text style={[S.tableHeaderCell, { flex: 1.5 }]}>Доставчик</Text>
              <Text style={[S.tableHeaderCell, { flex: 1.5 }]}>Описание</Text>
              <Text style={[S.tableHeaderCell, { flex: 0.8, textAlign: 'right' }]}>EUR</Text>
              <Text style={[S.tableHeaderCell, { flex: 1.3 }]}>Категория</Text>
              <Text style={[S.tableHeaderCell, { flex: 0.9, textAlign: 'right' }]}>kg CO₂e</Text>
              <Text style={[S.tableHeaderCell, { flex: 0.7, textAlign: 'center' }]}>Ниво</Text>
            </View>
            {top10.map((c, i) => {
              const tr = c.calculation_trace ?? {};
              return (
                <View key={i} style={[S.tableRow, i % 2 !== 0 ? S.tableRowAlt : {}]}>
                  <Text style={[S.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                    {tr.supplier ?? '—'}
                  </Text>
                  <Text style={[S.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                    {tr.description ?? '—'}
                  </Text>
                  <Text style={[S.tableCell, { flex: 0.8, textAlign: 'right' }]}>
                    {tr.amount != null ? tr.amount.toFixed(0) : '—'}
                  </Text>
                  <Text style={[S.tableCell, { flex: 1.3 }]} numberOfLines={1}>
                    {S3_LABELS[c.scope_category]?.replace('Кат. ', 'К.') ?? `К.${c.scope_category}`}
                  </Text>
                  <Text style={[S.tableCellBold, { flex: 0.9, textAlign: 'right', color: ZED.orange }]}>
                    {(c.co2e_kg ?? 0).toFixed(3)}
                  </Text>
                  <Text style={[S.tableCell, { flex: 0.7, textAlign: 'center', color: ZED.gray400 }]}>
                    {c.method_tier}
                  </Text>
                </View>
              );
            })}
            {data.scope3Calculations.length > 10 && (
              <View style={[S.tableRow, { backgroundColor: ZED.gray50 }]}>
                <Text style={[S.tableCell, { color: ZED.gray400 }]}>
                  + още {data.scope3Calculations.length - 10} изчисления
                </Text>
              </View>
            )}
          </>
        )}
      </View>
      <PageFooter year={data.reportingYear} />
    </Page>
  );
}

// ── Monthly completeness heat map ──────────────────────────────────────────
function MonthlyPage({ data }: { data: PremiumReportData }) {
  const monthlyStatus = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const pad = String(m).padStart(2, '0');
    const monthRows = data.scope12Emissions.filter(e =>
      e.reporting_period.slice(5, 7) === pad
    );
    return {
      m,
      label: BG_MONTHS[i],
      s1: monthRows.some(r => r.scope === 1),
      s2: monthRows.some(r => r.scope === 2),
      count: monthRows.length,
    };
  });

  const s1months = monthlyStatus.filter(m => m.s1).length;
  const s2months = monthlyStatus.filter(m => m.s2).length;
  const now = new Date();
  const activableMonths = now.getFullYear() === data.reportingYear ? now.getMonth() + 1 : 12;
  const s1pct = Math.round((s1months / activableMonths) * 100);
  const s2pct = Math.round((s2months / activableMonths) * 100);

  const cellColor = (has: boolean, isPast: boolean) => {
    if (!isPast) return ZED.gray100;
    return has ? ZED.greenLight : ZED.orangeLight;
  };
  const cellText = (has: boolean, isPast: boolean) => {
    if (!isPast) return '—';
    return has ? '✓' : '✗';
  };
  const cellTextColor = (has: boolean, isPast: boolean) => {
    if (!isPast) return ZED.gray400;
    return has ? ZED.green : ZED.red;
  };

  return (
    <Page size="A4" style={S.page}>
      <PageHeader company={data.company.company_name} year={data.reportingYear}
        section="МЕСЕЧНА ПЪЛНОТА НА ДАННИТЕ" />
      <View style={S.pageInner}>
        <SectionBand label="5. МЕСЕЧНА ПЪЛНОТА НА ДАННИТЕ (ESRS 2 §34)" />

        <View style={S.kpiRow}>
          <KpiCard label="Обхват 1 пълнота" value={`${s1pct}%`}
            unit={`${s1months} от ${activableMonths} месеца`}
            color={s1pct >= 80 ? ZED.green : ZED.amber} bg={s1pct >= 80 ? ZED.greenLight : ZED.amberLight} />
          <KpiCard label="Обхват 2 пълнота" value={`${s2pct}%`}
            unit={`${s2months} от ${activableMonths} месеца`}
            color={s2pct >= 80 ? ZED.green : ZED.amber} bg={s2pct >= 80 ? ZED.greenLight : ZED.amberLight} />
        </View>

        {/* Heat grid */}
        <SubHead esrs="ESRS 2" title={`Покритие по месец — ${data.reportingYear} г.`} />

        {/* Header row */}
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
          <View style={{ width: 46 }} />
          {monthlyStatus.map(ms => (
            <View key={ms.m} style={[S.monthCell, { backgroundColor: 'transparent' }]}>
              <Text style={S.monthLabel}>{ms.label}</Text>
            </View>
          ))}
        </View>

        {/* S1 row */}
        {[
          { label: 'Обхват 1', key: 's1' as const, color: ZED.green },
          { label: 'Обхват 2', key: 's2' as const, color: ZED.blue },
        ].map(row => (
          <View key={row.key} style={{ flexDirection: 'row', gap: 4, marginBottom: 4, alignItems: 'center' }}>
            <View style={{ width: 46 }}>
              <Text style={{ fontSize: 7.5, color: row.color, fontWeight: 'bold' }}>
                {row.label}
              </Text>
            </View>
            {monthlyStatus.map(ms => {
              const isPast = ms.m <= activableMonths;
              const has = ms[row.key];
              return (
                <View key={ms.m} style={[S.monthCell, { backgroundColor: cellColor(has, isPast) }]}>
                  <Text style={[S.monthDot, { color: cellTextColor(has, isPast) }]}>
                    {cellText(has, isPast)}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        {/* Legend */}
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, alignItems: 'center' }}>
          {[
            { color: ZED.greenLight, textColor: ZED.green, label: 'Данните присъстват' },
            { color: ZED.orangeLight, textColor: ZED.red, label: 'Данните липсват' },
            { color: ZED.gray100, textColor: ZED.gray400, label: 'Бъдещ период' },
          ].map(lg => (
            <View key={lg.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 12, backgroundColor: lg.color, borderRadius: 2 }} />
              <Text style={{ fontSize: 7, color: ZED.gray600 }}>{lg.label}</Text>
            </View>
          ))}
        </View>

        {/* Guidance */}
        <View style={[S.callout, { marginTop: 12 }]}>
          <Text style={S.calloutText}>
            За CSRD-съвместим отчет са необходими данни за всичките 12 месеца. Липсващите месеци
            трябва да бъдат попълнени преди финализиране на отчета. Препоръчваме месечно
            въвеждане на данни (последен работен ден на всеки месец).
          </Text>
        </View>
      </View>
      <PageFooter year={data.reportingYear} />
    </Page>
  );
}

// ── Targets & Strategies ───────────────────────────────────────────────────
function TargetsPage({ data }: { data: PremiumReportData }) {
  const targets  = data.targets  ?? [];
  const strats   = data.strategies ?? [];
  const activeS  = strats.filter(s => s.status === 'active');

  return (
    <Page size="A4" style={S.page}>
      <PageHeader company={data.company.company_name} year={data.reportingYear}
        section="ЦЕЛИ И СТРАТЕГИИ" />
      <View style={S.pageInner}>
        <SectionBand label="6. ЦЕЛИ ЗА НАМАЛЯВАНЕ НА ЕМИСИИТЕ — E1-4" />

        <Para>
          {`${data.company.company_name} е ангажирана с намаляването на въглеродния си отпечатък в съответствие с Парижкото споразумение (1.5°C пътека) и Европейския зелен пакт.`}
        </Para>

        {targets.length > 0 ? (
          targets.slice(0, 6).map((t, i) => {
            const yearsLeft = t.target_year - data.reportingYear;
            const progressPct = Math.max(0, Math.min(100,
              ((data.reportingYear - t.baseline_year) /
               (t.target_year - t.baseline_year)) * 100
            ));
            return (
              <View key={i} style={S.targetCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={[S.targetName, { flex: 1 }]}>{t.name}</Text>
                  <View style={{
                    backgroundColor: ZED.navyLight, borderRadius: 3,
                    paddingHorizontal: 6, paddingVertical: 2,
                  }}>
                    <Text style={{ fontSize: 7, color: ZED.navy, fontWeight: 'bold' }}>
                      -{t.target_value}{t.target_type === 'percentage' ? '%' : ' t'} · {t.target_year} г.
                    </Text>
                  </View>
                </View>
                <Text style={S.targetMeta}>
                  {`Базова година: ${t.baseline_year}  ·  Целева година: ${t.target_year}  ·  Остават: ${Math.max(0, yearsLeft)} г.`}
                  {t.scope ? `  ·  Обхват: ${t.scope}` : ''}
                </Text>
                {t.description && (
                  <Text style={[S.targetMeta, { marginTop: 3 }]}>{t.description}</Text>
                )}
                <View style={S.progressTrack}>
                  <View style={[S.progressFill, { width: `${progressPct}%` }]} />
                </View>
                <Text style={[S.targetMeta, { marginTop: 2, textAlign: 'right' }]}>
                  {progressPct.toFixed(0)}% от периода изминат
                </Text>
              </View>
            );
          })
        ) : (
          <View style={[S.callout, { borderLeftColor: ZED.amber, backgroundColor: ZED.amberLight }]}>
            <Text style={[S.calloutText, { color: ZED.amber }]}>
              Количествени цели за намаляване са в процес на разработване. Препоръчва се
              базова цел от -30% до {data.reportingYear + 5} г. за съответствие с 1.5°C пътека.
            </Text>
          </View>
        )}

        {/* Strategies */}
        <View style={{ marginTop: 12 }}>
          <SectionBand label="7. СТРАТЕГИИ ЗА НАМАЛЯВАНЕ — E1-2" />
        </View>

        {activeS.length > 0 ? (
          <>
            <View style={S.kpiRow}>
              <KpiCard label="Активни стратегии" value={String(activeS.length)}
                unit="в изпълнение" color={ZED.green} bg={ZED.greenLight} />
              <KpiCard
                label="Планирано намаление"
                value={activeS.reduce((s, r) => s + (r.estimated_reduction_co2e ?? 0), 0).toFixed(1)}
                unit="tCO₂e/год (очаквано)" color={ZED.navyMid} bg={ZED.navyLight} />
            </View>
            {activeS.slice(0, 8).map((s, i) => (
              <View key={i} style={S.strategyRow}>
                <View style={[S.strategyBadge, {
                  backgroundColor: i % 2 === 0 ? ZED.greenLight : ZED.navyLight,
                }]}>
                  <Text style={{ fontSize: 8, fontWeight: 'bold',
                    color: i % 2 === 0 ? ZED.green : ZED.navy }}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.strategyTitle} numberOfLines={1}>{s.title}</Text>
                  <Text style={S.strategyMeta}>
                    {s.category}
                    {s.estimated_reduction_co2e
                      ? `  ·  Очакване: ${s.estimated_reduction_co2e} tCO₂e/год`
                      : ''}
                    {s.responsible_person ? `  ·  ${s.responsible_person}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <Bullet>Стратегиите за намаляване са в процес на разработване.</Bullet>
        )}
      </View>
      <PageFooter year={data.reportingYear} />
    </Page>
  );
}

// ── Methodology & Declaration ──────────────────────────────────────────────
function MethodologyPage({ data, today }: { data: PremiumReportData; today: string }) {
  const methRows: [string, string][] = [
    ['Обхват 1 & 2', 'Измерени/отчетени количества × емисионен фактор (kg CO₂e/ед.). DEFRA 2024, БАЕ.'],
    ['Обхват 3 Кат. 1', 'EXIOBASE v3 (2023) EEIO фактори — EUR разходи × фактор = kg CO₂e (Ниво C).'],
    ['Обхват 3 Кат. 4/5', 'DEFRA 2024 — тонокилометри / разходи × транспортни и отпадъчни фактори.'],
    ['Обхват 3 Кат. 6/7', 'DEFRA 2024 — пътнически км / разходи × транспортни фактори.'],
    ['GWP стойности',     'IPCC AR6 (100 год.) — CO₂=1, CH₄=27.9, N₂O=273, R-134a=1430, R-404A=3922.'],
    ['Консолидация',      'Оперативен контрол — 100% от дейностите под контрол на организацията.'],
    ['Електроенергия',    'Метод на местоположение — Българска Агенция по Енергетика 2024: 0.478 kg/kWh.'],
  ];

  return (
    <Page size="A4" style={S.page}>
      <PageHeader company={data.company.company_name} year={data.reportingYear}
        section="МЕТОДОЛОГИЯ И ВЕРИФИКАЦИЯ" />
      <View style={S.pageInner}>
        <SectionBand label="8. МЕТОДОЛОГИЯ, ВЕРИФИКАЦИЯ И ОГРАНИЧЕНИЯ" />

        <SubHead esrs="E1-6 §51" title="Приложени стандарти и методология" />
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { flex: 1.2 }]}>Компонент</Text>
          <Text style={[S.tableHeaderCell, { flex: 2.8 }]}>Методология / Стандарт / Фактор</Text>
        </View>
        {methRows.map(([comp, meth], i) => (
          <View key={i} style={[S.tableRow, i % 2 !== 0 ? S.tableRowAlt : {}]}>
            <Text style={[S.tableCellBold, { flex: 1.2, color: ZED.navyMid }]}>{comp}</Text>
            <Text style={[S.tableCell, { flex: 2.8 }]}>{meth}</Text>
          </View>
        ))}

        <SubHead esrs="E1-6 §52" title="Несигурност и ограничения" />
        <Bullet>Обхват 1 & 2: несигурност ±5–10% (първични данни от фактури и уреди).</Bullet>
        <Bullet>Обхват 3 Ниво C: несигурност ±15–30% (средни отраслови фактори).</Bullet>
        <Bullet>Валутни конверсии и сезонни вариации могат да доведат до отклонения.</Bullet>
        <Bullet>Мерки: Събиране на физически данни за Топ 10 доставчика; преход към Ниво B.</Bullet>

        <SubHead esrs="ESRS 2 §120" title="Вътрешен контрол и верификация" />
        <Bullet>Данните се въвеждат от отговорно лице и се преглеждат от ръководството (4-очно правило).</Bullet>
        <Bullet>Архивиране на първичните документи (фактури, измервания) минимум 5 години.</Bullet>
        <Bullet>Пълна одитна следа — всеки CO₂e запис е проследим до конкретен емисионен фактор.</Bullet>
        <Para>
          Статус на верификация: Настоящият отчет не е подложен на независима трета-страна
          верификация. Планира се ограничена (limited assurance) верификация по ISAE 3410 за
          следващия отчетен период.
        </Para>

        {/* Declaration box */}
        <View style={S.declBox}>
          <Text style={S.declTitle}>Декларация за съответствие с ESRS E1</Text>
          <Text style={S.declText}>
            {`Настоящото разкриване е изготвено в съответствие с изискванията на ESRS E1 (Регламент (ЕС) 2023/2772) и GHG Protocol Corporate Standard. Данните са верни и точни към датата на изготвяне.\n\nОтчетна година: ${data.reportingYear} г.  ·  Изготвил: ${data.generatedBy ?? 'ZED Platform'}  ·  Дата: ${today}`}
          </Text>
          <View style={S.declSig}>
            <View style={S.sigBlock}>
              <Text style={S.sigLabel}>Подпис и печат — Изпълнителен директор</Text>
            </View>
            <View style={{ width: 60 }} />
            <View style={S.sigBlock}>
              <Text style={S.sigLabel}>Отговорник по устойчивост — Дата</Text>
            </View>
          </View>
        </View>
      </View>
      <PageFooter year={data.reportingYear} />
    </Page>
  );
}

// ── Back Page ──────────────────────────────────────────────────────────────
function BackPage({ data, today }: { data: PremiumReportData; today: string }) {
  return (
    <Page size="A4" style={S.page}>
      <View style={S.backPage}>
        <View style={S.coverAccentBar} />
        <View style={S.coverTopStrip} />
        <View style={S.backContent}>
          {/* ZED with accent dot */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Text style={S.backZed}>ZED</Text>
            <Text style={[S.backZed, { color: ZED.accent }]}>.</Text>
          </View>
          <Text style={S.backTagline}>CARBON FOOTPRINT PLATFORM</Text>
          <View style={S.backDivider} />
          <Text style={S.backDisclaimer}>
            {`Настоящият отчет е изготвен автоматично от ZED Footprint Platform въз основа на въведени данни. Изчисленията следват GHG Protocol Corporate Standard и ESRS E1 (Регламент (ЕС) 2023/2772).\n\nПри използване на данните в публични комуникации препоръчваме потвърждение от независим верификатор (ISAE 3410 / ISO 14064-3).\n\nZED не носи отговорност за неточности, произтичащи от грешни входни данни.`}
          </Text>
          <Text style={S.backMeta}>
            {`${data.company.company_name}  ·  ${data.reportingYear} г.  ·  Генериран: ${today}`}
          </Text>
        </View>
      </View>
    </Page>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Root Document
// ══════════════════════════════════════════════════════════════════════════

function ZedReport({ data, today }: { data: PremiumReportData; today: string }) {
  const scope1     = data.scope12Emissions.filter(e => e.scope === 1)
    .reduce((s, e) => s + e.calculated_co2e, 0);
  const scope2     = data.scope12Emissions.filter(e => e.scope === 2)
    .reduce((s, e) => s + e.calculated_co2e, 0);
  const scope3Tons = data.scope3Calculations.reduce((s, e) => s + e.co2e_kg, 0) / 1000;
  const grandTotal = scope1 + scope2 + scope3Tons;

  const hasScope3  = data.scope3Calculations.length > 0;

  return (
    <Document
      title={`CSRD ESRS E1 — ${data.company.company_name} — ${data.reportingYear}`}
      author={data.generatedBy ?? 'ZED Platform'}
      subject="CSRD Climate Change Disclosure — ESRS E1"
      keywords="CSRD, ESRS E1, GHG Protocol, carbon footprint, sustainability"
      creator="ZED Footprint Platform"
    >
      <CoverPage data={data} today={today} />
      <ExecutiveSummaryPage data={data} scope1={scope1} scope2={scope2}
        scope3Tons={scope3Tons} grandTotal={grandTotal} />
      <Scope12Page data={data} scope1={scope1} scope2={scope2} />
      {hasScope3 && <Scope3Page data={data} scope3Tons={scope3Tons} />}
      <MonthlyPage data={data} />
      <TargetsPage data={data} />
      <MethodologyPage data={data} today={today} />
      <BackPage data={data} today={today} />
    </Document>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Export function — called from API routes
// ══════════════════════════════════════════════════════════════════════════

export async function generatePremiumCSRDReport(data: PremiumReportData): Promise<Buffer> {
  const today = new Date().toLocaleDateString('bg-BG', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const element = React.createElement(ZedReport, { data, today });
  const pdfBytes = await renderToBuffer(element);
  return Buffer.from(pdfBytes);
}
