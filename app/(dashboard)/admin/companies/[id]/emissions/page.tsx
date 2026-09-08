'use client';

'use client';

import { DEFAULT_CURRENCY } from '@/lib/constants/currency';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Building2, 
  Loader2, 
  Target, 
  Factory, 
  Zap, 
  FileText,
  Calendar,
  Download,
  Eye,
  MapPin,
  Truck,
  ShieldCheck,
  BarChart3,
  DollarSign,
  User
} from 'lucide-react';
import { toast } from 'sonner';

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

interface Company {
  id: string;
  company_name: string;
  industry_sector: string;
  registration_number: string;
}

interface Emission {
  id: string;
  scope: number;
  category: string;
  activity_value: number;
  unit: string;
  calculated_co2e: number;
  reporting_period: string;
  notes: string;
  created_at: string;
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

export default function CompanyEmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [selectedEmission, setSelectedEmission] = useState<Emission | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleViewDetails = (emission: Emission) => {
    setSelectedEmission(emission);
    setDetailDialogOpen(true);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      // Fetch company
      const companyRes = await fetch(`/api/companies/${companyId}`);
      if (!companyRes.ok) throw new Error('Компанията не е намерена');
      const companyData = await companyRes.json();
      setCompany(companyData.data);

      // Fetch emissions for this company
      const emissionsRes = await fetch(`/api/admin/companies/${companyId}/emissions`);
      if (emissionsRes.ok) {
        const emissionsData = await emissionsRes.json();
        setEmissions(emissionsData.data || []);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Грешка при зареждане');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalEmissions = emissions.reduce((sum, e) => sum + (e.calculated_co2e || 0), 0);
  const scope1Total = emissions.filter(e => e.scope === 1).reduce((sum, e) => sum + (e.calculated_co2e || 0), 0);
  const scope2Total = emissions.filter(e => e.scope === 2).reduce((sum, e) => sum + (e.calculated_co2e || 0), 0);

  // Group by category
  const categoryTotals = emissions.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + (e.calculated_co2e || 0);
    return acc;
  }, {});

  // Group by month
  const monthlyData = emissions.reduce((acc: Record<string, { scope1: number; scope2: number }>, e) => {
    const month = e.reporting_period.slice(0, 7);
    if (!acc[month]) acc[month] = { scope1: 0, scope2: 0 };
    if (e.scope === 1) acc[month].scope1 += e.calculated_co2e || 0;
    else acc[month].scope2 += e.calculated_co2e || 0;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-earth-300" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-earth-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {company.company_name}
            </h1>
            <p className="text-sm text-gray-500">
              {company.industry_sector} • {company.registration_number}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-earth-200 bg-gradient-to-br from-earth-50 to-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Общо емисии
                </CardTitle>
                <Target className="h-5 w-5 text-earth-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-earth-400">{totalEmissions.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">tCO₂e</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Обхват 1
                </CardTitle>
                <Factory className="h-5 w-5 text-earth-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-earth-300">{scope1Total.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">tCO₂e директни</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Обхват 2
                </CardTitle>
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{scope2Total.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">tCO₂e индиректни</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Записи
                </CardTitle>
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{emissions.length}</div>
              <p className="text-xs text-gray-500 mt-1">общо записа</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Breakdown */}
        {Object.keys(monthlyData).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-earth-400" />
                Месечно разпределение
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Период</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-600">Обхват 1</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-600">Обхват 2</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-600">Общо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(monthlyData)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .map(([month, data]) => (
                        <tr key={month} className="border-b border-gray-100">
                          <td className="py-2 px-4 font-medium">
                            {new Date(month + '-01').toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' })}
                          </td>
                          <td className="py-2 px-4 text-right text-earth-400">{data.scope1.toFixed(2)}</td>
                          <td className="py-2 px-4 text-right text-blue-500">{data.scope2.toFixed(2)}</td>
                          <td className="py-2 px-4 text-right font-bold">{(data.scope1 + data.scope2).toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown */}
        {Object.keys(categoryTotals).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Разпределение по категории</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(categoryTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, total]) => (
                    <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">
                        {CATEGORY_LABELS[category] || category}
                      </span>
                      <span className="font-bold text-earth-400">{total.toFixed(2)} tCO₂e</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Emissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Всички записи</CardTitle>
            <CardDescription>
              Детайлен преглед на всички емисионни записи
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Период</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Категория</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Обхват</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Количество</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">tCO₂e</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Бележки</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emissions.map((emission) => (
                      <tr key={emission.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {new Date(emission.reporting_period).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium">
                            {CATEGORY_LABELS[emission.category] || emission.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded ${
                            emission.scope === 1 
                              ? 'bg-earth-100 text-earth-400' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            Обхват {emission.scope}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm">
                          {emission.activity_value} {emission.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-earth-400">
                          {emission.calculated_co2e.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                          {emission.notes || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(emission)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4 text-earth-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Тази компания няма въведени емисионни данни</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emission Details Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-earth-400" />
                Детайли за емисия
              </DialogTitle>
              <DialogDescription>
                Пълна информация за емисионния запис
              </DialogDescription>
            </DialogHeader>
            
            {selectedEmission && (
              <div className="space-y-6 mt-4">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Основна информация
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Период</p>
                      <p className="font-medium">
                        {new Date(selectedEmission.reporting_period).toLocaleDateString('bg-BG', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Обхват</p>
                      <Badge variant={selectedEmission.scope === 1 ? 'default' : 'secondary'}>
                        Обхват {selectedEmission.scope}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Категория</p>
                      <p className="font-medium">{CATEGORY_LABELS[selectedEmission.category] || selectedEmission.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Количество</p>
                      <p className="font-medium">{selectedEmission.activity_value} {selectedEmission.unit}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 mb-1">Изчислени емисии</p>
                      <p className="text-2xl font-bold text-earth-400">
                        {selectedEmission.calculated_co2e.toFixed(2)} tCO₂e
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Information - Only show if any field has data */}
                {(selectedEmission.location || selectedEmission.equipment_id || selectedEmission.supplier || selectedEmission.invoice_number) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Детайлна информация
                    </h3>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                      {selectedEmission.location && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Локация
                          </p>
                          <p className="font-medium">{selectedEmission.location}</p>
                        </div>
                      )}
                      {selectedEmission.equipment_id && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            Оборудване/Превозно средство
                          </p>
                          <p className="font-medium">{selectedEmission.equipment_id}</p>
                        </div>
                      )}
                      {selectedEmission.supplier && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Доставчик
                          </p>
                          <p className="font-medium">{selectedEmission.supplier}</p>
                        </div>
                      )}
                      {selectedEmission.invoice_number && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Номер на фактура
                          </p>
                          <p className="font-medium">{selectedEmission.invoice_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Data Quality - Only show if any field has data */}
                {(selectedEmission.measurement_method || selectedEmission.data_quality) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Качество на данните
                    </h3>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                      {selectedEmission.measurement_method && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Метод на измерване</p>
                          <Badge variant="outline" className="capitalize">
                            {selectedEmission.measurement_method === 'measured' ? 'Измерено' : 
                             selectedEmission.measurement_method === 'calculated' ? 'Изчислено' : 
                             'Оценено'}
                          </Badge>
                        </div>
                      )}
                      {selectedEmission.data_quality && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Качество</p>
                          <Badge 
                            variant={
                              selectedEmission.data_quality === 'high' ? 'default' : 
                              selectedEmission.data_quality === 'medium' ? 'secondary' : 
                              'destructive'
                            }
                            className="capitalize"
                          >
                            {selectedEmission.data_quality === 'high' ? 'Високо' : 
                             selectedEmission.data_quality === 'medium' ? 'Средно' : 
                             'Ниско'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial - Only show if any field has data */}
                {(selectedEmission.cost !== null || selectedEmission.responsible_person) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Финансова информация
                    </h3>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50 rounded-lg">
                      {selectedEmission.cost != null && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Разходи</p>
                          <p className="font-medium">
                            {selectedEmission.cost.toFixed(2)} {selectedEmission.currency || DEFAULT_CURRENCY}
                          </p>
                        </div>
                      )}
                      {selectedEmission.responsible_person && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Отговорно лице
                          </p>
                          <p className="font-medium">{selectedEmission.responsible_person}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedEmission.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Бележки</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{selectedEmission.notes}</p>
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Създадено на: {new Date(selectedEmission.created_at).toLocaleString('bg-BG')}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

