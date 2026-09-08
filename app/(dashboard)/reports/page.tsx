'use client';

import { DEFAULT_CURRENCY } from '@/lib/constants/currency';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  Eye, 
  BarChart3, 
  Target, 
  Factory, 
  Zap,
  MapPin,
  Truck,
  Building2,
  ShieldCheck,
  DollarSign,
  User,
  ClipboardList,
  FileSpreadsheet,
  Braces,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type ReportType = 'internal' | 'full' | 'csrd' | 'compliance' | 'certificate' | 'vsme';

const REPORT_ENDPOINTS: Record<ReportType, string> = {
  internal:    '/api/reports/generate',
  full:        '/api/reports/generate',
  csrd:        '/api/reports/csrd',
  compliance:  '/api/reports/compliance',
  certificate: '/api/reports/certificate',
  vsme:        '/api/reports/vsme',
};

// Category labels
const CATEGORY_LABELS: Record<string, string> = {
  'vehicles_diesel': 'Превозни средства - Дизел',
  'vehicles_petrol': 'Превозни средства - Бензин',
  'vehicles_lpg': 'Превозни средства - ГПГ',
  'natural_gas': 'Природен газ',
  'heating_oil': 'Нафта за отопление',
  'coal': 'Въглища',
  'refrigerant_r134a': 'Хладилен агент R-134a',
  'refrigerant_r404a': 'Хладилен агент R-404A',
  'electricity': 'Електроенергия',
  'district_heating': 'Топлоенергия',
  'district_cooling': 'Хладилна енергия',
};

interface EmissionData {
  id: string;
  reporting_period: string;
  scope: number;
  category: string;
  activity_value: number;
  unit: string;
  calculated_co2e: number;
  notes?: string;
  created_at?: string;
  // Enhanced fields
  location?: string | null;
  equipment_id?: string | null;
  supplier?: string | null;
  invoice_number?: string | null;
  measurement_method?: string | null;
  data_quality?: string | null;
  cost?: number | null;
  currency?: string | null;
  responsible_person?: string | null;
}

const VALID_TYPES: ReportType[] = ['full', 'csrd', 'compliance', 'certificate', 'vsme'];

function ReportsPageInner() {
  const searchParams = useSearchParams();
  const typeFromUrl  = searchParams.get('type') as ReportType | null;
  const [reportType, setReportType] = useState<ReportType>(
    typeFromUrl && VALID_TYPES.includes(typeFromUrl) ? typeFromUrl : 'full'
  );

  // Re-sync if user navigates via the nav dropdown
  useEffect(() => {
    if (typeFromUrl && VALID_TYPES.includes(typeFromUrl)) {
      setReportType(typeFromUrl);
    }
  }, [typeFromUrl]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState('');
  const [previewData, setPreviewData] = useState<EmissionData[] | null>(null);
  const [scope3Preview, setScope3Preview] = useState<any | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedEmission, setSelectedEmission] = useState<EmissionData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [vsmeYear, setVsmeYear] = useState(new Date().getFullYear());
  const [vsmeReadiness, setVsmeReadiness] = useState<{
    readinessScore: number;
    complete: number;
    partial: number;
    missing: number;
    applicableTotal: number;
  } | null>(null);
  const [isVsmeExporting, setIsVsmeExporting] = useState(false);
  const [isLoadingVsme, setIsLoadingVsme] = useState(false);

  const primaryReportTypes = [
    {
      id: 'full' as ReportType,
      name: 'Пълен отчет на устойчивостта',
      description: 'Консолидиран PDF с емисии Обхват 1, 2 и 3, препоръки и методология — за банки, клиенти и одитори',
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      available: true,
      badge: 'ПРЕПОРЪЧАН',
    },
    {
      id: 'csrd' as ReportType,
      name: 'EU CSRD отчет — климат и емисии',
      description: 'Официален формат по европейската директива за корпоративна устойчивост. Емисии Обхват 1–3, цели, стратегии и методология по стандарт ESRS E1.',
      icon: ShieldCheck,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      available: true,
      badge: 'EU CSRD',
    },
    {
      id: 'vsme' as ReportType,
      name: 'VSME отчет (EFRAG)',
      description: 'Доброволен EU стандарт за МСП — емисии, цели, стратегии, БЗР и управление. Подходящ извън задължителния CSRD обхват.',
      icon: ClipboardList,
      color: 'text-violet-700',
      bgColor: 'bg-violet-50',
      available: true,
      badge: 'VSME',
    },
  ];

  const optionalReportTypes = [
    {
      id: 'certificate' as ReportType,
      name: 'Удостоверение за устойчивост',
      description: 'Едностранно удостоверение за самоотчет — за споделяне с партньори.',
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      available: true,
    },
    {
      id: 'compliance' as ReportType,
      name: 'Отчет за съответствие',
      description: 'Регулаторен скрининг — ЗООС, CSRD, EU ETS, GHG Protocol.',
      icon: CheckCircle,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      available: true,
    },
  ];

  const reportTypes = [...primaryReportTypes, ...optionalReportTypes];

  const handleGenerateReport = async () => {
    if (reportType === 'vsme') return;
    // Validation
    if (!startDate || !endDate) {
      toast.error('Моля, изберете начална и крайна дата');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast.error('Началната дата трябва да е преди крайната дата');
      return;
    }

    setIsGenerating(true);
    setGeneratingStep('Събиране на данни...');

    try {
      const endpoint = REPORT_ENDPOINTS[reportType] || '/api/reports/generate';
      const reportingYear = new Date(endDate).getFullYear();

      const needsReportType = endpoint === '/api/reports/generate';
      const payload = needsReportType
        ? { reportType, startDate, endDate, reportingYear }
        : { reportingYear, startDate, endDate };

      // Simulate progress steps for premium reports (font loading from CDN)
      const stepTimer = setInterval(() => {
        setGeneratingStep(prev => {
          if (prev === 'Събиране на данни...') return 'Зареждане на шрифтове...';
          if (prev === 'Зареждане на шрифтове...') return 'Изграждане на PDF страниците...';
          if (prev === 'Изграждане на PDF страниците...') return 'Финализиране на документа...';
          return prev;
        });
      }, 2500);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearInterval(stepTimer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Грешка при генериране на отчета');
      }

      // Extract filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="?([^";\n]+)"?/);
      const filename = match?.[1] ?? `ZED-Report-${reportType}-${startDate}-${endDate}.pdf`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Отчетът е генериран и изтеглен успешно!');
    } catch (error: unknown) {
      console.error('Error generating report:', error);
      toast.error(error instanceof Error ? error.message : 'Възникна грешка при генериране на отчета');
    } finally {
      setIsGenerating(false);
      setGeneratingStep('');
    }
  };

  // Set default dates (current month)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Load preview data whenever dates change
  useEffect(() => {
    if (startDate && endDate) {
      loadPreviewData();
      setVsmeYear(new Date(endDate).getFullYear());
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (!vsmeYear || reportType !== 'vsme') return;
    loadVsmeReadiness(vsmeYear);
  }, [vsmeYear, reportType]);

  const loadVsmeReadiness = async (year: number) => {
    setIsLoadingVsme(true);
    try {
      const res = await fetch(`/api/vsme/readiness?year=${year}`);
      if (!res.ok) {
        setVsmeReadiness(null);
        return;
      }
      const json = await res.json();
      const data = json.data;
      const summary = data?.summary ?? data;
      if (summary && typeof summary.readinessScore === 'number') {
        setVsmeReadiness({
          readinessScore: summary.readinessScore,
          complete: summary.complete ?? 0,
          partial: summary.partial ?? 0,
          missing: summary.missing ?? 0,
          applicableTotal: summary.applicableTotal ?? 0,
        });
      } else if (data?.readinessScore != null) {
        setVsmeReadiness({
          readinessScore: data.readinessScore,
          complete: data.complete ?? 0,
          partial: data.partial ?? 0,
          missing: data.missing ?? 0,
          applicableTotal: data.applicableTotal ?? 0,
        });
      } else {
        setVsmeReadiness(null);
      }
    } catch {
      setVsmeReadiness(null);
    } finally {
      setIsLoadingVsme(false);
    }
  };

  const downloadVsmeExport = async (format: 'pdf' | 'json' | 'excel') => {
    setIsVsmeExporting(true);
    try {
      let url: string;
      let defaultName: string;

      if (format === 'pdf') {
        const response = await fetch('/api/reports/vsme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportingYear: vsmeYear }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Грешка при генериране на VSME PDF');
        }
        const disposition = response.headers.get('Content-Disposition') ?? '';
        const match = disposition.match(/filename="?([^";\n]+)"?/);
        const filename = match?.[1] ?? `VSME-${vsmeYear}.pdf`;
        const blob = await response.blob();
        triggerDownload(blob, filename);
        toast.success('VSME PDF отчетът е изтеглен успешно!');
        return;
      }

      const endpoints: Record<Exclude<typeof format, 'pdf'>, string> = {
        json: `/api/vsme/export?year=${vsmeYear}`,
        excel: `/api/vsme/export/excel?year=${vsmeYear}`,
      };
      url = endpoints[format];
      defaultName = format === 'excel'
        ? `VSME-${vsmeYear}.xlsx`
        : `VSME-${vsmeYear}.json`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Грешка при експорт на VSME данни');
      }

      const disposition = response.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="?([^";\n]+)"?/);
      const filename = match?.[1] ?? defaultName;
      const blob = await response.blob();
      triggerDownload(blob, filename);

      const labels = { json: 'JSON', excel: 'Excel' };
      toast.success(`VSME ${labels[format]} експортът е изтеглен успешно!`);
    } catch (error: unknown) {
      console.error('VSME export error:', error);
      toast.error(error instanceof Error ? error.message : 'Възникна грешка при VSME експорт');
    } finally {
      setIsVsmeExporting(false);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const loadPreviewData = async () => {
    setIsLoadingPreview(true);
    try {
      // Scope 1 & 2
      const res12 = await fetch(`/api/emissions?start=${startDate}&end=${endDate}`);
      if (res12.ok) {
        const { data } = await res12.json();
        setPreviewData(data || []);
      } else {
        setPreviewData([]);
      }

      // Scope 3 via dashboard API
      const year = new Date(endDate).getFullYear();
      const res3 = await fetch(`/api/scope3/dashboard?year=${year}`);
      if (res3.ok) {
        const data3 = await res3.json();
        setScope3Preview(data3);
      } else {
        setScope3Preview(null);
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewData([]);
      setScope3Preview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Calculate totals for preview
  const calculateTotals = () => {
    if (!previewData) return { total: 0, scope1: 0, scope2: 0, count: 0 };
    
    const total = previewData.reduce((sum, e) => sum + e.calculated_co2e, 0);
    const scope1 = previewData.filter(e => e.scope === 1).reduce((sum, e) => sum + e.calculated_co2e, 0);
    const scope2 = previewData.filter(e => e.scope === 2).reduce((sum, e) => sum + e.calculated_co2e, 0);
    
    return { total, scope1, scope2, count: previewData.length };
  };

  // Calculate category breakdown
  const calculateCategoryBreakdown = () => {
    if (!previewData) return [];
    
    const categoryTotals: Record<string, number> = {};
    previewData.forEach(e => {
      const category = CATEGORY_LABELS[e.category] || e.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + e.calculated_co2e;
    });
    
    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(categoryTotals)
      .map(([category, value]) => ({
        category,
        value,
        percentage: total > 0 ? (value / total * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const totals = calculateTotals();
  const categoryBreakdown = calculateCategoryBreakdown();

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-earth-400 mb-2">
            Генериране на отчети
          </h1>
          <p className="text-gray-600">
            Създайте професионални PDF отчети за вашия въглероден отпечатък
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Report Type Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Type Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Изберете вид отчет</CardTitle>
                <CardDescription>
                  Кликнете на картата, за да изберете типа отчет
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {primaryReportTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => type.available && setReportType(type.id)}
                    disabled={!type.available}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      reportType === type.id
                        ? type.id === 'vsme'
                          ? 'border-violet-500 bg-violet-50'
                          : type.id === 'csrd'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${
                      !type.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${type.bgColor}`}>
                        <type.icon className={`h-6 w-6 ${type.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{type.name}</h3>
                          {reportType === type.id && (
                            <CheckCircle className={`h-5 w-5 ${
                              type.id === 'vsme' ? 'text-violet-600'
                                : type.id === 'csrd' ? 'text-blue-600'
                                  : 'text-green-600'
                            }`} />
                          )}
                          {(type as { badge?: string }).badge && (
                            <span className={`text-xs text-white px-2 py-0.5 rounded font-medium ${
                              type.id === 'vsme' ? 'bg-violet-600'
                                : type.id === 'csrd' ? 'bg-blue-600'
                                  : 'bg-green-600'
                            }`}>
                              {(type as { badge?: string }).badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}

                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Допълнителни документи</p>
                  <div className="flex flex-wrap gap-2">
                    {optionalReportTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => type.available && setReportType(type.id)}
                        disabled={!type.available}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          reportType === type.id
                            ? 'border-earth-400 bg-earth-50 text-earth-600'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        } ${!type.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <type.icon className={`h-3.5 w-3.5 ${type.color}`} />
                        {type.name}
                        {reportType === type.id && <CheckCircle className="h-3 w-3 text-earth-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {reportType === 'vsme' && (
              <Card className="border-violet-200 bg-gradient-to-br from-violet-50/60 to-white">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-violet-900">VSME — какво е и защо ви трябва</CardTitle>
                      <CardDescription className="mt-2 text-gray-700 leading-relaxed max-w-2xl">
                        <strong>VSME</strong> (Voluntary Sustainability Reporting Standard for SMEs) е доброволен
                        стандарт на <strong>EFRAG</strong> за малки и средни предприятия. Той дава структуриран
                        ESG отчет — емисии (Обхват 1–3), цели, стратегии, локации, здраве и безопасност и
                        анти-корупция — без пълната сложност на CSRD/ESRS за големи компании.
                      </CardDescription>
                    </div>
                    <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded font-medium shrink-0">VSME</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div className="rounded-lg border border-violet-100 bg-white p-3">
                      <p className="font-medium text-violet-900 mb-1">За кого е</p>
                      <p className="text-xs text-gray-600">МСП извън задължителния CSRD обхват, които искат ESG прозрачност пред банки, клиенти и партньори.</p>
                    </div>
                    <div className="rounded-lg border border-violet-100 bg-white p-3">
                      <p className="font-medium text-violet-900 mb-1">Какво включва</p>
                      <p className="text-xs text-gray-600">Профил на компанията, емисии, цели, стратегии, локации, БЗР и политика срещу корупция.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end gap-4 pt-2 border-t border-violet-100">
                    <div className="space-y-2 sm:w-40">
                      <Label htmlFor="vsme-year-main">Отчетна година</Label>
                      <Select value={String(vsmeYear)} onValueChange={(v) => setVsmeYear(parseInt(v))}>
                        <SelectTrigger id="vsme-year-main">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2026, 2025, 2024, 2023].map((y) => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      {isLoadingVsme ? (
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Зареждане на готовност...
                        </p>
                      ) : vsmeReadiness && vsmeReadiness.applicableTotal > 0 ? (
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                          <div>
                            <span className="text-gray-600">Готовност: </span>
                            <span className="font-bold text-violet-900">{vsmeReadiness.readinessScore}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Готови: </span>
                            <span className="font-semibold text-green-700">{vsmeReadiness.complete}/{vsmeReadiness.applicableTotal}</span>
                          </div>
                          {vsmeReadiness.partial > 0 && (
                            <div>
                              <span className="text-gray-600">Частични: </span>
                              <span className="font-semibold text-amber-700">{vsmeReadiness.partial}</span>
                            </div>
                          )}
                          {vsmeReadiness.missing > 0 && (
                            <div>
                              <span className="text-gray-600">Липсващи: </span>
                              <span className="font-semibold text-red-600">{vsmeReadiness.missing}</span>
                            </div>
                          )}
                        </div>
                      ) : vsmeReadiness ? (
                        <p className="text-sm text-amber-700">Няма оценени VSME теми за {vsmeYear} г. — проверете данните.</p>
                      ) : (
                        <p className="text-sm text-gray-500">Неуспешно зареждане на готовността.</p>
                      )}
                      <Link href="/vsme" className="text-xs text-violet-700 underline mt-1 inline-block">
                        Детайлен преглед и попълване →
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      onClick={() => downloadVsmeExport('pdf')}
                      disabled={isVsmeExporting}
                      className="bg-violet-700 hover:bg-violet-800 text-white"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      PDF отчет
                    </Button>
                    <Button variant="outline" onClick={() => downloadVsmeExport('excel')} disabled={isVsmeExporting}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                    <Button variant="outline" onClick={() => downloadVsmeExport('json')} disabled={isVsmeExporting}>
                      <Braces className="mr-2 h-4 w-4" />
                      JSON
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Date Range Selection — hidden for VSME (uses calendar year) */}
            {reportType !== 'vsme' && (
            <Card>
              <CardHeader>
                <CardTitle>Изберете период</CardTitle>
                <CardDescription>
                  Отчетът ще включва данни за избрания времеви период
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Начална дата</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Крайна дата</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Quick date range buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                      setStartDate(firstDay.toISOString().split('T')[0]);
                      setEndDate(lastDay.toISOString().split('T')[0]);
                    }}
                  >
                    Текущ месец
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const firstDay = new Date(now.getFullYear(), 0, 1);
                      const lastDay = new Date(now.getFullYear(), 11, 31);
                      setStartDate(firstDay.toISOString().split('T')[0]);
                      setEndDate(lastDay.toISOString().split('T')[0]);
                    }}
                  >
                    Текуща година
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const lastYear = now.getFullYear() - 1;
                      const firstDay = new Date(lastYear, 0, 1);
                      const lastDay = new Date(lastYear, 11, 31);
                      setStartDate(firstDay.toISOString().split('T')[0]);
                      setEndDate(lastDay.toISOString().split('T')[0]);
                    }}
                  >
                    Минала година
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                      setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
                      setEndDate(lastDay.toISOString().split('T')[0]);
                    }}
                  >
                    Последните 3 месеца
                  </Button>
                </div>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Right Column - Summary & Generate / VSME */}
          <div className="space-y-6">
            <Card className={reportType === 'vsme'
              ? 'border-violet-200 bg-gradient-to-br from-violet-50/80 to-white'
              : 'border-earth-200 bg-gradient-to-br from-earth-50 to-white'}>
              <CardHeader>
                <CardTitle className={reportType === 'vsme' ? 'text-violet-900' : 'text-earth-400'}>
                  {reportType === 'vsme' ? 'VSME експорт' : 'Обобщение'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Вид отчет</p>
                  <p className="font-semibold text-gray-900">
                    {reportTypes.find(t => t.id === reportType)?.name}
                  </p>
                </div>

                {reportType === 'vsme' ? (
                  <>
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-1">Отчетна година</p>
                      <p className="font-semibold text-gray-900">{vsmeYear}</p>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-1">Формат</p>
                      <p className="font-semibold text-gray-900">PDF · Excel · JSON</p>
                    </div>
                    <p className="text-xs text-violet-700 pt-2">
                      Използвайте панела вляво за година, готовност и експорт.
                    </p>
                  </>
                ) : (
                  <>
                {startDate && endDate && (
                  <>
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-1">Период</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(startDate).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600">до</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(endDate).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-1">Формат</p>
                      <p className="font-semibold text-gray-900">PDF документ</p>
                    </div>
                  </>
                )}

                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating || !reportTypes.find(t => t.id === reportType)?.available}
                  className="w-full bg-earth-300 hover:bg-earth-400 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <span className="flex flex-col items-center gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Генериране на PDF...
                      </span>
                      {generatingStep && (
                        <span className="text-xs opacity-75 font-normal">{generatingStep}</span>
                      )}
                    </span>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Генерирай отчет
                    </>
                  )}
                </Button>
                  </>
                )}

              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className={reportType === 'vsme' ? 'border-violet-200 bg-violet-50' : 'border-blue-200 bg-blue-50'}>
              <CardHeader>
                <CardTitle className={`text-sm ${reportType === 'vsme' ? 'text-violet-900' : 'text-blue-900'}`}>
                  Информация
                </CardTitle>
              </CardHeader>
              <CardContent className={`text-sm space-y-2 ${reportType === 'vsme' ? 'text-violet-900' : 'text-blue-800'}`}>
                {reportType === 'vsme' ? (
                  <>
                    <p>• <strong>VSME</strong> — доброволен EFRAG стандарт за устойчивост на МСП (2024–2025)</p>
                    <p>• По-лек от CSRD — подходящ за компании под праговете за задължителна ESRS отчетност</p>
                    <p>• Покрива емисии, цели, стратегии, локации, БЗР и анти-корупция</p>
                    <p>• PDF отчетът включва контролен списък, емисии и препоръчани действия</p>
                    <p>• Не е официален одит — прегледайте готовността преди споделяне</p>
                  </>
                ) : reportType === 'certificate' ? (
                  <>
                    <p>• Едностранно удостоверение за самоотчет</p>
                    <p>• Не е независимо верифицирано или официален CSRD документ</p>
                    <p>• Подходящо за презентации и начални разговори с партньори</p>
                    <p>• PDF файлът се изтегля директно</p>
                  </>
                ) : reportType === 'full' ? (
                  <>
                    <p>• Пълен отчет на устойчивостта с Обхват 1, 2 и 3</p>
                    <p>• Включва препоръки за намаляване на емисиите</p>
                    <p>• Подходящ за банки, клиенти и вътрешен одит</p>
                    <p>• Изберете период, който покрива цялата отчетна година</p>
                  </>
                ) : reportType === 'csrd' ? (
                  <>
                    <p>• EU CSRD — официален формат за корпоративна устойчивост</p>
                    <p>• ESRS E1: климат, емисии Обхват 1–3, цели и стратегии</p>
                    <p>• За компании в или близо до CSRD обхват</p>
                    <p>• PDF файлът се изтегля директно</p>
                  </>
                ) : (
                  <>
                    <p>• Регулаторен скрининг: ЗООС, CSRD, EU ETS</p>
                    <p>• Жив преглед в Настройки → Регулаторен скрининг</p>
                    <p>• PDF файлът се изтегля директно</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Report Preview Section */}
        {reportType !== 'vsme' && startDate && endDate && (
          <div className="space-y-6">
            {/* Preview Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-earth-400" />
                <h2 className="text-xl font-semibold text-earth-400">Преглед на данни</h2>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(startDate).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })} —{' '}
                {new Date(endDate).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {isLoadingPreview ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-earth-300 border-t-transparent" />
                    <p className="text-gray-600">Зареждане на данни...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* ── Grand Total Banner ── */}
                {(() => {
                  const scope3Tons = scope3Preview?.summary?.total_co2e_tons || 0;
                  const grandTotal = totals.total + scope3Tons;
                  return grandTotal > 0 ? (
                    <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                      <CardContent className="pt-5 pb-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Общо Обхват 1+2+3</p>
                            <p className="text-3xl font-bold text-green-900">{grandTotal.toFixed(3)}</p>
                            <p className="text-sm text-green-600">tCO₂e</p>
                          </div>
                          <div className="border-l border-green-200 pl-4">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-500">Обхват 1</p>
                            <p className="text-2xl font-bold text-earth-400">{totals.scope1.toFixed(3)}</p>
                            <p className="text-xs text-gray-500">{grandTotal > 0 ? ((totals.scope1 / grandTotal) * 100).toFixed(0) : 0}% от общото</p>
                          </div>
                          <div className="border-l border-green-200 pl-4">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-blue-600">Обхват 2</p>
                            <p className="text-2xl font-bold text-blue-600">{totals.scope2.toFixed(3)}</p>
                            <p className="text-xs text-gray-500">{grandTotal > 0 ? ((totals.scope2 / grandTotal) * 100).toFixed(0) : 0}% от общото</p>
                          </div>
                          <div className="border-l border-green-200 pl-4">
                            <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-orange-600">Обхват 3</p>
                            <p className="text-2xl font-bold text-orange-600">{scope3Tons.toFixed(3)}</p>
                            <p className="text-xs text-gray-500">{grandTotal > 0 ? ((scope3Tons / grandTotal) * 100).toFixed(0) : 0}% от общото</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

                {/* ── Scope 1 & 2 Section ── */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Factory className="h-5 w-5 text-earth-400" />
                      <div>
                        <CardTitle className="text-base">Обхват 1 & 2 — Директни и енергийни емисии</CardTitle>
                        <CardDescription>
                          {previewData && previewData.length > 0
                            ? `${previewData.length} записа · ${totals.total.toFixed(3)} tCO₂e`
                            : 'Няма данни за периода'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {previewData && previewData.length > 0 ? (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Период</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Обхват</th>
                                <th className="text-left py-2 px-3 font-medium text-gray-600">Категория</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-600">Количество</th>
                                <th className="text-right py-2 px-3 font-medium text-gray-600">tCO₂e</th>
                                <th className="text-center py-2 px-3 font-medium text-gray-600"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.slice(0, 10).map((emission) => (
                                <tr key={emission.id} className="border-b hover:bg-gray-50">
                                  <td className="py-2 px-3 text-gray-700">
                                    {new Date(emission.reporting_period).toLocaleDateString('bg-BG', { year: 'numeric', month: 'short' })}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      emission.scope === 1 ? 'bg-earth-100 text-earth-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      Обхват {emission.scope}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-gray-900">
                                    {CATEGORY_LABELS[emission.category] || emission.category}
                                  </td>
                                  <td className="py-2 px-3 text-gray-700 text-right">
                                    {emission.activity_value} {emission.unit}
                                  </td>
                                  <td className="py-2 px-3 font-bold text-earth-400 text-right">
                                    {emission.calculated_co2e.toFixed(4)}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                                      onClick={() => { setSelectedEmission(emission); setDetailsOpen(true); }}>
                                      <Eye className="h-3.5 w-3.5 text-gray-400" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {previewData.length > 10 && (
                          <p className="text-xs text-gray-400 mt-3 text-center">
                            ... и още {previewData.length - 10} записа (всички ще бъдат включени в PDF-а)
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 py-4 text-center">
                        Няма данни за Обхват 1 & 2 за избрания период.{' '}
                        <a href="/data-entry" className="text-earth-400 underline">Добави данни</a>
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* ── Scope 3 Section ── */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-orange-500" />
                      <div>
                        <CardTitle className="text-base">Обхват 3 — Верига на стойността</CardTitle>
                        <CardDescription>
                          {scope3Preview?.summary?.total_calculations > 0
                            ? `${scope3Preview.summary.total_calculations} изчисления · ${scope3Preview.summary.total_co2e_tons} tCO₂e`
                            : 'Няма изчислени данни за периода'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {scope3Preview && scope3Preview.summary?.total_co2e_tons > 0 ? (
                      <>
                        {/* By category */}
                        <div className="space-y-2 mb-4">
                          {scope3Preview.by_category?.map((cat: any) => (
                            <div key={cat.category} className="flex items-center gap-3">
                              <div className="w-36 text-xs text-gray-600 truncate">{cat.label}</div>
                              <div className="flex-1 bg-gray-100 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-orange-400 transition-all"
                                  style={{ width: `${cat.percentage}%` }}
                                />
                              </div>
                              <div className="text-xs font-semibold text-gray-900 w-20 text-right">
                                {cat.co2e_tons.toFixed(3)} т
                              </div>
                              <Badge variant="secondary" className="text-xs w-12 justify-center">
                                {cat.percentage}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {/* Top suppliers */}
                        {scope3Preview.top_suppliers?.length > 0 && (
                          <div className="border-t pt-3">
                            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Топ доставчици по емисии</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-1 px-2 text-xs font-medium text-gray-500">Доставчик</th>
                                    <th className="text-right py-1 px-2 text-xs font-medium text-gray-500">Разходи EUR</th>
                                    <th className="text-right py-1 px-2 text-xs font-medium text-gray-500">CO₂e (тона)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {scope3Preview.top_suppliers.slice(0, 8).map((s: any) => (
                                    <tr key={s.supplier} className="border-b hover:bg-gray-50">
                                      <td className="py-1.5 px-2 text-gray-800 font-medium">{s.supplier}</td>
                                      <td className="py-1.5 px-2 text-gray-600 text-right">{s.spend.toLocaleString('bg-BG', { maximumFractionDigits: 0 })}</td>
                                      <td className="py-1.5 px-2 font-bold text-orange-600 text-right">
                                        {s.co2e_tons > 0 ? s.co2e_tons.toFixed(3) : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 py-4 text-center">
                        Няма изчислени Обхват 3 емисии.{' '}
                        <a href="/scope3/transactions" className="text-orange-500 underline">Изчисли сега</a>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Emission Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedEmission && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-earth-400">
                    <Eye className="h-5 w-5" />
                    Детайли за емисия
                  </DialogTitle>
                  <DialogDescription>
                    Пълна информация за въведената емисия
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-3">Основна информация</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Отчетен период</p>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-earth-400" />
                          {new Date(selectedEmission.reporting_period).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Обхват</p>
                        <Badge 
                          variant={selectedEmission.scope === 1 ? 'default' : 'secondary'}
                          className={selectedEmission.scope === 1 ? 'bg-earth-300' : 'bg-blue-500'}
                        >
                          Обхват {selectedEmission.scope}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Категория</p>
                      <p className="text-sm font-medium">
                        {CATEGORY_LABELS[selectedEmission.category] || selectedEmission.category}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Количество</p>
                        <p className="text-sm font-medium">
                          {selectedEmission.activity_value.toLocaleString('bg-BG')} {selectedEmission.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Емисии CO2e</p>
                        <p className="text-lg font-bold text-earth-400">
                          {selectedEmission.calculated_co2e.toFixed(2)} tCO2e
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Details - Only show if data exists */}
                  {(selectedEmission.location || 
                    selectedEmission.equipment_id || 
                    selectedEmission.supplier || 
                    selectedEmission.invoice_number ||
                    selectedEmission.responsible_person) && (
                    <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-gray-900 mb-3">Детайлна информация</h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {selectedEmission.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Локация/Обект</p>
                              <p className="text-sm font-medium">{selectedEmission.location}</p>
                            </div>
                          </div>
                        )}

                        {selectedEmission.equipment_id && (
                          <div className="flex items-start gap-2">
                            <Truck className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Оборудване/Превозно средство</p>
                              <p className="text-sm font-medium">{selectedEmission.equipment_id}</p>
                            </div>
                          </div>
                        )}

                        {selectedEmission.supplier && (
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Доставчик</p>
                              <p className="text-sm font-medium">{selectedEmission.supplier}</p>
                            </div>
                          </div>
                        )}

                        {selectedEmission.invoice_number && (
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Номер на фактура</p>
                              <p className="text-sm font-medium">{selectedEmission.invoice_number}</p>
                            </div>
                          </div>
                        )}

                        {selectedEmission.responsible_person && (
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Отговорно лице</p>
                              <p className="text-sm font-medium">{selectedEmission.responsible_person}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Data Quality */}
                  {(selectedEmission.measurement_method || selectedEmission.data_quality) && (
                    <div className="bg-green-50 rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-gray-900 mb-3">Качество на данните</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {selectedEmission.measurement_method && (
                          <div className="flex items-start gap-2">
                            <BarChart3 className="h-4 w-4 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Метод на измерване</p>
                              <p className="text-sm font-medium">
                                {selectedEmission.measurement_method === 'measured' && 'Измерено (от уреди/фактури)'}
                                {selectedEmission.measurement_method === 'calculated' && 'Изчислено (по формула)'}
                                {selectedEmission.measurement_method === 'estimated' && 'Оценено (приблизително)'}
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedEmission.data_quality && (
                          <div className="flex items-start gap-2">
                            <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">Качество</p>
                              <Badge 
                                className={
                                  selectedEmission.data_quality === 'high' ? 'bg-green-600' :
                                  selectedEmission.data_quality === 'medium' ? 'bg-yellow-600' :
                                  'bg-orange-600'
                                }
                              >
                                {selectedEmission.data_quality === 'high' && 'Високо'}
                                {selectedEmission.data_quality === 'medium' && 'Средно'}
                                {selectedEmission.data_quality === 'low' && 'Ниско'}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cost Information */}
                  {selectedEmission.cost && (
                    <div className="bg-amber-50 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Финансови разходи</p>
                          <p className="text-lg font-bold text-amber-800">
                            {selectedEmission.cost.toLocaleString('bg-BG', { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2 
                            })} {selectedEmission.currency || DEFAULT_CURRENCY}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedEmission.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Забележки</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedEmission.notes}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  {selectedEmission.created_at && (
                    <div className="text-xs text-gray-400 pt-2 border-t">
                      <p>Създадена на: {new Date(selectedEmission.created_at).toLocaleString('bg-BG')}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-earth-400" /></div>}>
      <ReportsPageInner />
    </Suspense>
  );
}

