'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  User
} from 'lucide-react';
import { toast } from 'sonner';

type ReportType = 'internal' | 'full' | 'csrd' | 'compliance' | 'certificate';

const REPORT_ENDPOINTS: Record<ReportType, string> = {
  internal:    '/api/reports/generate',
  full:        '/api/reports/generate',
  csrd:        '/api/reports/csrd',
  compliance:  '/api/reports/compliance',
  certificate: '/api/reports/certificate',
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

const VALID_TYPES: ReportType[] = ['full', 'csrd', 'compliance', 'certificate'];

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
  const [previewData, setPreviewData] = useState<EmissionData[] | null>(null);
  const [scope3Preview, setScope3Preview] = useState<any | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedEmission, setSelectedEmission] = useState<EmissionData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const reportTypes = [
    {
      id: 'full' as ReportType,
      name: 'Пълен отчет Обхват 1+2+3',
      description: 'Консолидиран PDF отчет с Обхват 1, 2 и 3 — подходящ за банки, клиенти, одитори',
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      available: true,
      badge: 'ПРЕПОРЪЧАН',
    },
    {
      id: 'csrd' as ReportType,
      name: 'CSRD Отчет — ESRS E1',
      description: 'Официален отчет съгласно EU CSRD директивата и ESRS E1 стандарта — Обхват 1, 2 и 3 с пълна одитна следа и верификационен запис',
      icon: ShieldCheck,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      available: true,
      badge: 'ESRS E1',
    },
    {
      id: 'compliance' as ReportType,
      name: 'Отчет за съответствие',
      description: 'Регулаторна оценка — ЗООС, CSRD, EU ETS, SBTi. Включва индекс на съответствие и приоритетен план за действие.',
      icon: CheckCircle,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      available: true,
      badge: 'НОВО',
    },
    {
      id: 'certificate' as ReportType,
      name: 'Сертификат за устойчивост',
      description: 'Премиум едностраничен сертификат за споделяне с клиенти, банки и партньори. С емблема и официален дизайн.',
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      available: true,
      badge: 'НОВО',
    },
  ];

  const handleGenerateReport = async () => {
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

    try {
      const endpoint = REPORT_ENDPOINTS[reportType] || '/api/reports/generate';
      const reportingYear = new Date(endDate).getFullYear();

      // Internal generate endpoint needs reportType in payload; dedicated endpoints don't
      const needsReportType = endpoint === '/api/reports/generate';
      const payload = needsReportType
        ? { reportType, startDate, endDate, reportingYear }
        : { reportingYear, startDate, endDate };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Грешка при генериране на отчета');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Otchet-${reportType}-${startDate}-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Отчетът е генериран успешно!');
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Възникна грешка при генериране на отчета');
    } finally {
      setIsGenerating(false);
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
    }
  }, [startDate, endDate]);

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
              <CardContent className="space-y-3">
                {reportTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => type.available && setReportType(type.id)}
                    disabled={!type.available}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      reportType === type.id
                        ? 'border-green-500 bg-green-50'
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
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {(type as any).badge && (
                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-medium">
                              {(type as any).badge}
                            </span>
                          )}
                          {!type.available && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                              Скоро
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Date Range Selection */}
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
          </div>

          {/* Right Column - Summary & Generate */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="border-earth-200 bg-gradient-to-br from-earth-50 to-white">
              <CardHeader>
                <CardTitle className="text-earth-400">Обобщение</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Вид отчет</p>
                  <p className="font-semibold text-gray-900">
                    {reportTypes.find(t => t.id === reportType)?.name}
                  </p>
                </div>

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

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating || !reportTypes.find(t => t.id === reportType)?.available}
                  className="w-full bg-earth-300 hover:bg-earth-400 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Генериране...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Генерирай отчет
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm text-blue-900">Информация</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-2">
                <p>• Отчетът ще включва всички емисии за избрания период</p>
                <p>• PDF файлът се изтегля директно</p>
                <p>• Отчетите са съобразени с CSRD изисквания</p>
                <p>• Можете да генерирате неограничен брой отчети</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Report Preview Section */}
        {startDate && endDate && (
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
                            })} {selectedEmission.currency || 'BGN'}
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

