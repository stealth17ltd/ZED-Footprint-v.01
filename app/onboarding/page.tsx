'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight, ChevronLeft, X, CheckCircle2, ArrowRight,
  Zap, Target, Building2, Download, Lightbulb, TrendingDown,
  ShieldCheck, BarChart3, Sparkles, ListChecks, Factory,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ZedLogo } from '@/components/ui/zed-logo';
import { EuEtsGuidancePanel } from '@/components/guidance/EuEtsGuidancePanel';
import { GuidanceHint, LabelWithGuidance } from '@/components/guidance/GuidanceHint';

// ─────────────────────────────────────────────────────────────────────────────
// Step configuration — add new steps here to extend the wizard
// ─────────────────────────────────────────────────────────────────────────────
export interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  optional: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Добре дошли в ZED!',
    subtitle: 'Нека настроим вашия въглероден отпечатък за минути',
    emoji: '🌱',
    optional: false,
  },
  {
    id: 'company',
    title: 'Вашата компания',
    subtitle: 'Потвърдете основните данни за точни изчисления',
    emoji: '🏢',
    optional: false,
  },
  {
    id: 'compliance',
    title: 'Регулаторен скрининг',
    subtitle: 'Оборот, CSRD обхват и EU ETS въпросник',
    emoji: '🛡️',
    optional: true,
  },
  {
    id: 'scope12',
    title: 'Обхват 1 & 2 — Директни емисии',
    subtitle: 'Горива, ток, топлоенергия',
    emoji: '⚡',
    optional: true,
  },
  {
    id: 'scope3',
    title: 'Обхват 3 — Верига на доставките',
    subtitle: 'Транзакции от счетоводния ви софтуер',
    emoji: '🔗',
    optional: true,
  },
  {
    id: 'targets',
    title: 'Поставете цел за намаление',
    subtitle: 'Съвместимо с SBTi и CSRD изисквания',
    emoji: '🎯',
    optional: true,
  },
  {
    id: 'strategies',
    title: 'Стратегии и планиране',
    subtitle: '12 готови шаблона — изберете и персонализирайте',
    emoji: '💡',
    optional: true,
  },
  {
    id: 'done',
    title: 'Готови сте!',
    subtitle: 'Вашата платформа е напълно настроена',
    emoji: '🎉',
    optional: false,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Industry sectors
// ─────────────────────────────────────────────────────────────────────────────
const SECTORS = [
  'Производство', 'Търговия на дребно', 'Търговия на едро', 'Строителство',
  'Транспорт и логистика', 'ИТ и технологии', 'Финанси и застраховане',
  'Здравеопазване', 'Образование', 'Хотелиерство и ресторантьорство',
  'Земеделие', 'Енергетика', 'Консултантски услуги', 'Друго',
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────
interface CompanyData {
  company_name: string;
  industry_sector: string;
  employee_count: number | null;
  baseline_year: number | null;
  annual_turnover_eur: number | null;
  ets_has_installation: boolean | null;
  ets_thermal_input_mw: number | null;
  ets_activity_annex_i: boolean | null;
}

interface StepProps {
  firstName: string;
  company: CompanyData;
  setCompany: React.Dispatch<React.SetStateAction<CompanyData>>;
  isGuideMode: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step content components
// ─────────────────────────────────────────────────────────────────────────────

function StepWelcome({ firstName, company, isGuideMode }: StepProps) {
  return (
    <div className="text-center space-y-6 max-w-lg mx-auto">
      <div className="text-7xl animate-bounce-slow">🌱</div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Добре дошли{firstName ? `, ${firstName}` : ''}!
        </h2>
        <p className="text-lg text-gray-500 mt-2">
          {isGuideMode
            ? `Наръчникът ще ви помогне да изградите пълна картина на въглеродния отпечатък на ${company.company_name}.`
            : `Нека настроим въглеродния отпечатък на ${company.company_name} за по-малко от 10 минути.`
          }
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
        {[
          { icon: '🏢', label: 'Профил', desc: '2 мин' },
          { icon: '🛡️', label: 'Скрининг', desc: '2 мин' },
          { icon: '⚡', label: 'Данни 1&2', desc: '3 мин' },
          { icon: '🎯', label: 'Цели', desc: '2 мин' },
          { icon: '💡', label: 'Стратегии', desc: '3 мин' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl p-4 border border-earth-100 shadow-sm text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="font-medium text-gray-700 text-xs">{item.label}</p>
            <p className="text-gray-400 text-xs mt-0.5">~{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Platform highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        {[
          {
            icon: <BarChart3 className="h-5 w-5 text-earth-400" />,
            bg: 'bg-earth-50 border-earth-200',
            title: 'Обхват 1, 2 & 3',
            desc: 'Пълен въглероден отпечатък — директни, енергийни и верига на доставките.',
          },
          {
            icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
            bg: 'bg-amber-50 border-amber-200',
            title: '12 готови стратегии',
            desc: 'Избирате шаблони, редактирате параметрите и следите изпълнението.',
          },
          {
            icon: <ShieldCheck className="h-5 w-5 text-blue-500" />,
            bg: 'bg-blue-50 border-blue-200',
            title: 'CSRD & GDPR',
            desc: 'Версиониран rule engine, EU ETS скрининг, ESRS E1 отчети и GDPR контрол.',
          },
        ].map(item => (
          <div key={item.title} className={`rounded-xl border p-4 ${item.bg}`}>
            <div className="flex items-center gap-2 mb-1.5">
              {item.icon}
              <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-earth-50 border border-earth-200 rounded-xl p-4 text-sm text-earth-700 text-left">
        <p className="font-semibold mb-1">🌍 Защо Carbon Footprint сега?</p>
        <p>Клиенти, банки и възложители все по-често изискват ESG данни. Готовият Carbon Footprint профил ви помага да сте подготвени за новите изисквания и ви дава реално конкурентно предимство.</p>
      </div>
    </div>
  );
}

function StepCompany({ company, setCompany }: StepProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="text-5xl mb-3">🏢</div>
        <p className="text-gray-500 text-sm">
          Тези данни определят точността на изчисленията и регулаторното съответствие.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
        <div>
          <Label className="text-sm font-medium text-gray-700">Компания</Label>
          <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg border text-sm text-gray-500">
            {company.company_name}
          </div>
          <p className="text-xs text-gray-400 mt-1">Промяна на името — от Настройки</p>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Индустриален сектор *</Label>
          <Select
            value={company.industry_sector}
            onValueChange={v => setCompany(c => ({ ...c, industry_sector: v }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Изберете сектор..." />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1">Влияе на емисионните фактори по подразбиране</p>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Брой служители</Label>
          <Input
            type="number"
            className="mt-1"
            placeholder="напр. 45"
            value={company.employee_count ?? ''}
            onChange={e => setCompany(c => ({ ...c, employee_count: e.target.value ? parseInt(e.target.value) : null }))}
          />
          <p className="text-xs text-gray-400 mt-1">Използва се за изчисляване на интензивност (тCO2e/служител)</p>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Базова година</Label>
          <Select
            value={company.baseline_year ? String(company.baseline_year) : ''}
            onValueChange={v => setCompany(c => ({ ...c, baseline_year: parseInt(v) }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Изберете година..." />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1">Спрямо тази година се измерват целите за намаление</p>
        </div>
      </div>
    </div>
  );
}

function StepCompliance({ company, setCompany }: StepProps) {
  return (
    <div className="space-y-5 max-w-md mx-auto">
      <div className="text-center">
        <div className="text-5xl mb-3">🛡️</div>
        <p className="text-sm text-gray-500">
          Тези данни определят <strong>CSRD обхвата</strong> и <strong>EU ETS скрининга</strong>.
          Можете да ги промените по всяко време от Настройки.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-emerald-200 p-6 space-y-5 shadow-sm">
        <div>
          <LabelWithGuidance
            label="Годишен оборот (EUR)"
            guidanceKey="csrdTurnover"
          />
          <Input
            type="number"
            min="0"
            className="mt-1"
            placeholder="напр. 2500000"
            value={company.annual_turnover_eur ?? ''}
            onChange={e => setCompany(c => ({
              ...c,
              annual_turnover_eur: e.target.value ? parseFloat(e.target.value) : null,
            }))}
          />
          <p className="text-xs text-gray-400 mt-1">
            CSRD задължителен обхват: &gt;1000 служители <em>и</em> &gt;€450M (вер. 2026-02-EU)
          </p>
        </div>

        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-gray-700">EU ETS скрининг</p>
            <GuidanceHint guidanceKey="euEts" />
          </div>

          <EuEtsGuidancePanel />

          <div>
            <LabelWithGuidance
              label="Оперира ли инсталация по EU ETS?"
              guidanceKey="installation"
            />
            <Select
              value={
                company.ets_has_installation === true ? 'yes'
                  : company.ets_has_installation === false ? 'no'
                    : 'unknown'
              }
              onValueChange={v => setCompany(c => ({
                ...c,
                ets_has_installation: v === 'yes' ? true : v === 'no' ? false : null,
              }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Изберете..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Не знам / не е попълнено</SelectItem>
                <SelectItem value="yes">Да — има инсталация</SelectItem>
                <SelectItem value="no">Не — няма инсталация</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <LabelWithGuidance
              label="Топлинен вход на горене (MW)"
              guidanceKey="thermalInputMw"
            />
            <Input
              type="number"
              min="0"
              step="0.1"
              className="mt-1"
              placeholder="напр. 15.5"
              value={company.ets_thermal_input_mw ?? ''}
              onChange={e => setCompany(c => ({
                ...c,
                ets_thermal_input_mw: e.target.value ? parseFloat(e.target.value) : null,
              }))}
            />
            <p className="text-xs text-gray-400 mt-1">Праг ≥20 MW → препоръчва се експертен преглед</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="onb_ets_annex"
              type="checkbox"
              checked={company.ets_activity_annex_i === true}
              onChange={e => setCompany(c => ({
                ...c,
                ets_activity_annex_i: e.target.checked ? true : false,
              }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="onb_ets_annex" className="text-sm text-gray-700">
              Дейност по Annex I на EU ETS
            </label>
            <GuidanceHint guidanceKey="annexI" />
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
        <p className="font-semibold mb-1">📊 Жив преглед</p>
        <p>След запазване вижте резултата в <strong>Регулаторен скрининг</strong> — rule engine оценява всяко изискване отделно.</p>
      </div>

      <div className="flex justify-center">
        <Link href="/settings/compliance" target="_blank">
          <Button variant="outline" className="gap-2 text-sm">
            <ShieldCheck className="h-4 w-4" />
            Отвори скрининг (нов таб)
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StepScope12(_props: StepProps) {
  const scope1Items = [
    { icon: '⛽', label: 'Гориво за автомобили', source: 'Фактури от бензиностанции' },
    { icon: '🔥', label: 'Природен газ / горене', source: 'Месечни сметки за газ' },
    { icon: '❄️', label: 'Хладилни агенти', source: 'Сервизни карти на климатиците' },
    { icon: '🏭', label: 'Производствени горива', source: 'Доставни фактури' },
  ];
  const scope2Items = [
    { icon: '💡', label: 'Електроенергия', source: 'Месечни сметки от ЧЕЗ/ЕВН/Енерго' },
    { icon: '🌡️', label: 'Топлоенергия (парно)', source: 'Сметки от Топлофикация' },
    { icon: '❄️', label: 'Студена енергия', source: 'Фактури за охлаждане' },
  ];

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <div className="text-center">
        <div className="text-5xl mb-3">⚡</div>
        <p className="text-sm text-gray-500">
          Обхват 1 и 2 данните идват директно от фактурите ви. Добавете ги веднъж месечно — отнема под 5 минути.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800">Обхват 1 — Директни</p>
              <p className="text-xs text-green-600">Изгорени горива и газове</p>
            </div>
          </div>
          <ul className="space-y-3">
            {scope1Items.map(item => (
              <li key={item.label} className="flex gap-3 items-start">
                <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.source}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-800">Обхват 2 — Енергия</p>
              <p className="text-xs text-blue-600">Закупена енергия</p>
            </div>
          </div>
          <ul className="space-y-3">
            {scope2Items.map(item => (
              <li key={item.label} className="flex gap-3 items-start">
                <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.source}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">📋 Как да добавяте данни</p>
        <p>Отидете на <strong>Данни → Въвеждане на данни</strong> и добавете запис за всеки месец. Препоръчваме да го правите в края на всеки месец, когато имате всички фактури.</p>
      </div>

      <div className="flex justify-center">
        <Link href="/data-entry" target="_blank">
          <Button variant="outline" className="gap-2 text-sm">
            <ArrowRight className="h-4 w-4" />
            Отвори Въвеждане на данни (нов таб)
          </Button>
        </Link>
      </div>
    </div>
  );
}

function StepScope3(_props: StepProps) {
  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <div className="text-center">
        <div className="text-5xl mb-3">🔗</div>
        <p className="text-sm text-gray-500">
          Обхват 3 е веригата на доставките — обикновено <strong>70–90%</strong> от въглеродния отпечатък на компанията.
          Изчислява се автоматично от финансовите ви транзакции.
        </p>
      </div>

      {/* What % is scope 3 - visual */}
      <div className="bg-white rounded-xl border border-orange-200 p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">Типично разпределение за МСП</p>
        <div className="space-y-2 text-sm">
          {[
            { scope: 'Обхват 1', pct: 10, color: 'bg-green-400' },
            { scope: 'Обхват 2', pct: 15, color: 'bg-blue-400' },
            { scope: 'Обхват 3', pct: 75, color: 'bg-orange-400' },
          ].map(s => (
            <div key={s.scope} className="flex items-center gap-3">
              <span className="w-24 text-xs text-gray-500 shrink-0">{s.scope}</span>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-8">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* How to get the data */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-gray-700">📥 Как да получите данните — 3 стъпки</p>
        <ol className="space-y-4">
          {[
            {
              n: '1',
              title: 'Изтеглете CSV от счетоводния ви софтуер',
              desc: 'QuickBooks, Xero, SAP, или просто банков извлечение. Нужни са: дата, доставчик, описание, сума.',
              badge: '~2 мин',
            },
            {
              n: '2',
              title: 'Импортирайте файла в ZED',
              desc: 'Нашият wizard ще ви помогне да свържете колоните. Системата автоматично класифицира транзакциите.',
              badge: '~3 мин',
            },
            {
              n: '3',
              title: 'Прегледайте и коригирайте',
              desc: 'Провизорно проверете класификациите. След първия месец, 80%+ се класифицират автоматично.',
              badge: '~5 мин',
            },
          ].map(step => (
            <li key={step.n} className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 text-sm font-bold flex items-center justify-center shrink-0">
                {step.n}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-700">{step.title}</p>
                  <Badge variant="outline" className="text-xs text-gray-400">{step.badge}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Import options */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-gray-700">🚀 Изберете начин за импорт</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📄</span>
              <p className="text-sm font-semibold text-blue-800">Импорт от PDF фактури</p>
              <Badge className="text-xs bg-blue-200 text-blue-800 border-blue-300 hover:bg-blue-200">НОВО</Badge>
            </div>
            <p className="text-xs text-blue-700">Плъзнете PDF фактурите си — системата автоматично прочита датата, доставчика и сумата.</p>
            <Link href="/invoice-import" target="_blank">
              <Button size="sm" className="w-full gap-2 text-xs bg-blue-500 hover:bg-blue-600">
                <ArrowRight className="h-3.5 w-3.5" />
                Импорт от фактури
              </Button>
            </Link>
          </div>
          <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <p className="text-sm font-semibold text-orange-800">Импорт от CSV</p>
            </div>
            <p className="text-xs text-orange-700">Изнесете CSV от счетоводния си софтуер (QuickBooks, Xero, SAP) и го заредете тук.</p>
            <div className="flex gap-2">
              <Link href="/api/emissions/template" target="_blank" className="flex-1">
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs border-orange-300">
                  <Download className="h-3.5 w-3.5" />
                  Шаблон
                </Button>
              </Link>
              <Link href="/scope3/import" target="_blank" className="flex-1">
                <Button size="sm" className="w-full gap-2 text-xs bg-orange-500 hover:bg-orange-600">
                  <ArrowRight className="h-3.5 w-3.5" />
                  CSV импорт
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-center text-gray-400">
        Можете да импортирате и по-късно — от менюто <strong>Данни → Импорт от фактури</strong> или <strong>CSV</strong>
      </p>
    </div>
  );
}

function StepTargets(_props: StepProps) {
  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <div className="text-center">
        <div className="text-5xl mb-3">🎯</div>
        <p className="text-sm text-gray-500">
          Поставете измерима цел за намаление на въглеродния отпечатък. CSRD и SBTi изискват цели, базирани на науката.
        </p>
      </div>

      {/* SBTi explanation */}
      <div className="bg-white rounded-xl border border-purple-200 p-5 shadow-sm space-y-3">
        <p className="text-sm font-semibold text-purple-800">🔬 Science-Based Targets (SBTi)</p>
        <div className="grid grid-cols-2 gap-3 text-center text-sm">
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-purple-700">4.2%</p>
            <p className="text-xs text-purple-600 mt-0.5">намаление/год. за 1.5°C</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-blue-700">2.5%</p>
            <p className="text-xs text-blue-600 mt-0.5">намаление/год. за 2°C</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Препоръчваме цел от <strong>поне 4.2% намаление годишно</strong> спрямо базовата година.
          Ще получите SBTi значка в отчетите.
        </p>
      </div>

      {/* Key categories */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">Кои цели имат най-голям ефект?</p>
        <ul className="space-y-2 text-sm text-gray-600">
          {[
            { icon: '🔗', text: 'Обхват 3 — намаляване на разходите при доставчици с висок отпечатък' },
            { icon: '💡', text: 'Обхват 2 — преминаване към зелена енергия (100% renewable)' },
            { icon: '✈️', text: 'Командировки — политика за замяна с видеоконференции' },
            { icon: '⛽', text: 'Обхват 1 — електрифициране на автомобилния парк' },
          ].map(item => (
            <li key={item.text} className="flex gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Template workflow callout */}
      <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <p className="text-sm font-semibold text-purple-800">Избери от готови шаблони</p>
        </div>
        <p className="text-xs text-gray-500">
          В раздел Цели натиснете <strong>"Избери от шаблони"</strong> — ще видите 9 предварително
          конфигурирани цели (Net Zero, SBTi 1.5°C, EU Fit for 55 и др.). Изберете, редактирайте
          базовата стойност и целевата година, след което ги активирайте с един клик.
        </p>
      </div>

      <div className="flex justify-center">
        <Link href="/targets" target="_blank">
          <Button className="gap-2 text-sm bg-purple-600 hover:bg-purple-700">
            <Target className="h-4 w-4" />
            Постави цел сега (нов таб)
          </Button>
        </Link>
      </div>

      <p className="text-xs text-center text-gray-400">
        Можете да поставите и редактирате цели по всяко време от <strong>Цели</strong> в менюто
      </p>
    </div>
  );
}

function StepStrategies(_props: StepProps) {
  const CATEGORIES = [
    { emoji: '💡', label: 'Ен. ефективност', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { emoji: '☀️', label: 'ВЕИ', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { emoji: '🚗', label: 'Автопарк', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { emoji: '🔗', label: 'Верига', color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { emoji: '♻️', label: 'Отпадъци', color: 'bg-gray-100 border-gray-200 text-gray-600' },
    { emoji: '💧', label: 'Вода', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
    { emoji: '👥', label: 'Поведение', color: 'bg-violet-50 border-violet-200 text-violet-700' },
    { emoji: '⚙️', label: 'Друго', color: 'bg-slate-50 border-slate-200 text-slate-600' },
  ];

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <div className="text-center">
        <div className="text-5xl mb-3">💡</div>
        <p className="text-sm text-gray-500">
          Стратегиите превръщат целите в конкретни действия. Изберете от <strong>12 готови шаблона</strong>,
          персонализирайте параметрите и следете напредъка по инициативи.
        </p>
      </div>

      {/* 3-step workflow */}
      <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Как работи — 3 стъпки
        </p>
        <ol className="space-y-4">
          {[
            {
              n: '1', color: 'bg-amber-100 text-amber-700',
              title: 'Разгледайте каталога',
              desc: 'Натиснете "Избери от каталога" — виждате 12 шаблона, филтрирани по категория, обхват и приоритет.',
            },
            {
              n: '2', color: 'bg-earth-100 text-earth-700',
              title: 'Прегледайте и персонализирайте',
              desc: 'Изберете 1 или повече шаблона. На стъпка "Преглед" можете да редактирате заглавие, очаквано намаление, разходи и отговорник.',
            },
            {
              n: '3', color: 'bg-green-100 text-green-700',
              title: 'Следете по инициативи',
              desc: 'Всяка стратегия идва с предварително дефинирани инициативи (задачи). Маркирайте ги като завършени и виждайте прогреса в реално време.',
            },
          ].map(step => (
            <li key={step.n} className="flex gap-4">
              <div className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${step.color}`}>
                {step.n}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Category chips */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">8 категории шаблони</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <span key={cat.label} className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${cat.color}`}>
              {cat.emoji} {cat.label}
            </span>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        {[
          { value: '12', label: 'готови шаблона', color: 'text-amber-600' },
          { value: '60+', label: 'инициативи', color: 'text-emerald-600' },
          { value: '100%', label: 'редактируеми', color: 'text-blue-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Link href="/strategies" target="_blank">
          <Button className="gap-2 text-sm bg-amber-500 hover:bg-amber-600">
            <Lightbulb className="h-4 w-4" />
            Избери стратегии (нов таб)
          </Button>
        </Link>
      </div>

      <p className="text-xs text-center text-gray-400">
        Стратегиите можете да добавяте и управлявате по всяко време от <strong>Стратегии</strong> в менюто
      </p>
    </div>
  );
}

function StepDone({ company, isGuideMode }: StepProps) {
  const quickLinks = [
    { href: '/data-entry',    icon: '📊', label: 'Въведи данни S1&2', color: 'border-green-200 bg-green-50' },
    { href: '/invoice-import',icon: '📄', label: 'Фактури → S3',      color: 'border-blue-200 bg-blue-50' },
    { href: '/settings/compliance', icon: '🛡️', label: 'Скрининг',   color: 'border-emerald-200 bg-emerald-50' },
    { href: '/targets',       icon: '🎯', label: 'Постави цел',        color: 'border-purple-200 bg-purple-50' },
    { href: '/strategies',    icon: '💡', label: 'Стратегии',          color: 'border-amber-200 bg-amber-50' },
    { href: '/reports',       icon: '📋', label: 'Генерирай отчет',    color: 'border-indigo-200 bg-indigo-50' },
  ];

  return (
    <div className="text-center space-y-6 max-w-lg mx-auto">
      <div className="text-7xl">🎉</div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isGuideMode ? 'Наръчникът е завършен!' : `${company.company_name} е настроена!`}
        </h2>
        <p className="text-gray-500 mt-2 text-sm">
          {isGuideMode
            ? 'Вече знаете как работи платформата. Можете да се върнете тук по всяко време от менюто.'
            : 'Вашият въглероден профил е готов. Започнете с добавяне на данни за първото тримесечие.'
          }
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href}>
            <div className={`rounded-xl border p-3 text-center hover:shadow-md transition-shadow cursor-pointer ${link.color}`}>
              <div className="text-xl mb-1">{link.icon}</div>
              <p className="text-xs font-semibold text-gray-700 leading-tight">{link.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Suggested first week */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2.5">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-earth-400" />
          Препоръчителен ред за следващата седмица
        </p>
        <ol className="space-y-1.5">
          {[
            { n: '1', text: 'Въведете данни за последните 3 месеца (Обхват 1&2) — ~10 мин' },
            { n: '2', text: 'Импортирайте CSV или фактури за Обхват 3 транзакции' },
            { n: '3', text: 'Проверете Регулаторен скрининг след попълване на профила' },
            { n: '4', text: 'Изберете 1–2 цели и 2–3 стратегии от каталога' },
            { n: '5', text: 'Генерирайте CSRD или регулаторен отчет — готов за клиенти и банки' },
          ].map(step => (
            <li key={step.n} className="flex gap-2 text-xs text-gray-600">
              <span className="w-5 h-5 rounded-full bg-earth-100 text-earth-600 flex items-center justify-center font-bold text-xs shrink-0">
                {step.n}
              </span>
              {step.text}
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-earth-50 border border-earth-200 rounded-xl p-4 text-sm text-earth-700 text-left">
        <p className="font-semibold mb-1">
          <TrendingDown className="inline h-4 w-4 mr-1" />
          Вашата цел
        </p>
        <p>Пълен въглероден профил + регулаторен скрининг + CSRD отчет + активни стратегии = готови за ESG изисквания от клиенти, банки и регулатори.</p>
      </div>
    </div>
  );
}

// Map step IDs to components — add new steps here when extending
const STEP_COMPONENTS: Record<string, React.ComponentType<StepProps>> = {
  welcome:    StepWelcome,
  company:    StepCompany,
  compliance: StepCompliance,
  scope12:    StepScope12,
  scope3:     StepScope3,
  targets:    StepTargets,
  strategies: StepStrategies,
  done:       StepDone,
};

// ─────────────────────────────────────────────────────────────────────────────
// Main wizard component
// ─────────────────────────────────────────────────────────────────────────────
function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuideMode = searchParams.get('guide') === 'true';

  const [currentStep, setCurrentStep] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [company, setCompany] = useState<CompanyData>({
    company_name: '',
    industry_sector: '',
    employee_count: null,
    baseline_year: null,
    annual_turnover_eur: null,
    ets_has_installation: null,
    ets_thermal_input_mw: null,
    ets_activity_annex_i: null,
  });

  useEffect(() => {
    fetch('/api/companies/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setFirstName(data.user.first_name ?? '');
          if (data.user.onboarding_completed && !isGuideMode) {
            router.replace('/dashboard');
            router.refresh();
            return;
          }
        }
        if (data?.company) {
          setCompany({
            company_name: data.company.company_name ?? '',
            industry_sector: data.company.industry_sector ?? '',
            employee_count: data.company.employee_count ?? null,
            baseline_year: data.company.baseline_year ?? null,
            annual_turnover_eur: data.company.annual_turnover_eur ?? null,
            ets_has_installation: data.company.ets_has_installation ?? null,
            ets_thermal_input_mw: data.company.ets_thermal_input_mw ?? null,
            ets_activity_annex_i: data.company.ets_activity_annex_i ?? null,
          });
        }
      })
      .catch(() => {});
  }, [isGuideMode, router]);

  const total = ONBOARDING_STEPS.length;
  const step  = ONBOARDING_STEPS[currentStep];
  const isLast = currentStep === total - 1;
  const StepContent = STEP_COMPONENTS[step.id];

  const handleNext = useCallback(() => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep(s => s + 1);
    }
  }, [isLast]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry_sector: company.industry_sector || undefined,
          employee_count:  company.employee_count  || undefined,
          baseline_year:   company.baseline_year   || undefined,
          annual_turnover_eur: company.annual_turnover_eur ?? undefined,
          ets_has_installation: company.ets_has_installation ?? undefined,
          ets_thermal_input_mw: company.ets_thermal_input_mw ?? undefined,
          ets_activity_annex_i: company.ets_activity_annex_i ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to complete onboarding');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Onboarding complete error:', err);
      toast.error('Възникна грешка при завършване. Моля, опитайте отново.');
    } finally {
      setCompleting(false);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const stepProps: StepProps = { firstName, company, setCompany, isGuideMode };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <ZedLogo size="lg" />
        <div className="flex items-center gap-3">
          {step.optional && (
            <Button variant="ghost" size="sm" className="text-gray-400 text-xs" onClick={handleSkip}>
              Пропусни тази стъпка
            </Button>
          )}
          {isGuideMode && (
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 text-gray-400">
              <X className="h-4 w-4" /> Затвори
            </Button>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-4 bg-white border-b border-gray-100">
        {ONBOARDING_STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => i < currentStep && setCurrentStep(i)}
              className={`transition-all duration-300 rounded-full flex items-center justify-center
                ${i === currentStep
                  ? 'w-8 h-8 bg-earth-300 text-white shadow-md text-xs font-bold'
                  : i < currentStep
                  ? 'w-6 h-6 bg-green-400 text-white text-xs'
                  : 'w-6 h-6 bg-gray-200 text-gray-400 text-xs'
                }`}
            >
              {i < currentStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </button>
            {i < total - 1 && (
              <div className={`h-0.5 w-6 rounded ${i < currentStep ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step header */}
      <div className="text-center py-6 px-4">
        <div className="inline-flex items-center gap-2 mb-1">
          {step.optional && (
            <Badge variant="outline" className="text-xs text-gray-400">Незадължително</Badge>
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{step.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{step.subtitle}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {StepContent && <StepContent {...stepProps} />}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="gap-1 text-gray-500"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Button>

          <span className="text-xs text-gray-400">
            {currentStep + 1} / {total}
          </span>

          <Button
            onClick={handleNext}
            disabled={completing}
            className="gap-2 bg-earth-300 hover:bg-earth-400 min-w-32"
          >
            {completing ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLast ? (
              <>Към таблото <ArrowRight className="h-4 w-4" /></>
            ) : (
              <>Напред <ChevronRight className="h-4 w-4" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Зареждане...
      </div>
    }>
      <OnboardingPageContent />
    </Suspense>
  );
}
