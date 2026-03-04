'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  ListChecks, 
  Plus, 
  Loader2, 
  Calendar, 
  TrendingUp, 
  Eye, 
  MapPin, 
  Truck, 
  Building2, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  DollarSign, 
  User 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmissionData {
  id: string;
  reporting_period: string;
  scope: number;
  category: string;
  activity_value: number;
  unit: string;
  calculated_co2e: number;
  notes: string | null;
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

export default function EmissionsListPage() {
  const router = useRouter();
  const [emissions, setEmissions] = useState<EmissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [selectedEmission, setSelectedEmission] = useState<EmissionData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchEmissions();
  }, [scopeFilter]);

  const fetchEmissions = async () => {
    try {
      let url = '/api/emissions';
      if (scopeFilter !== 'all') {
        url += `?scope=${scopeFilter}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Грешка при зареждане');
      }

      const result = await response.json();
      setEmissions(result.data || []);
    } catch (error: any) {
      console.error('Error fetching emissions:', error);
      toast.error(error.message || 'Грешка при зареждане на данните');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalEmissions = emissions.reduce((sum, item) => sum + item.calculated_co2e, 0);
  const scope1Total = emissions
    .filter(item => item.scope === 1)
    .reduce((sum, item) => sum + item.calculated_co2e, 0);
  const scope2Total = emissions
    .filter(item => item.scope === 2)
    .reduce((sum, item) => sum + item.calculated_co2e, 0);

  // Format date
  const formatPeriod = (period: string) => {
    const date = new Date(period);
    return date.toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-earth-300" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
              <ListChecks className="h-6 w-6 text-earth-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Въглеродни емисии
              </h1>
              <p className="text-sm text-gray-500">
                Преглед на всички въведени данни за емисии
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/data-entry')}
            className="bg-earth-300 hover:bg-earth-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            Добави емисия
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Общо емисии
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-earth-400">
                {totalEmissions.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">tCO2e</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Обхват 1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {scope1Total.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">tCO2e (Директни)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Обхват 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {scope2Total.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">tCO2e (Индиректни)</p>
            </CardContent>
          </Card>
        </div>

        {/* Emissions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Списък с емисии</CardTitle>
                <CardDescription>
                  Всички въведени данни, сортирани по период
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={scopeFilter} onValueChange={setScopeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Филтър..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всички обхвати</SelectItem>
                    <SelectItem value="1">Обхват 1</SelectItem>
                    <SelectItem value="2">Обхват 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {emissions.length === 0 ? (
              <div className="text-center py-12">
                <ListChecks className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Няма въведени емисии
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Започнете като добавите първата емисия
                </p>
                <Button
                  onClick={() => router.push('/data-entry')}
                  className="mt-4 bg-earth-300 hover:bg-earth-400"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добави емисия
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Период</TableHead>
                      <TableHead>Обхват</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead className="text-right">Количество</TableHead>
                      <TableHead className="text-right">CO2e (tCO2e)</TableHead>
                      <TableHead>Забележки</TableHead>
                      <TableHead className="text-center">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emissions.map((emission) => (
                      <TableRow key={emission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {formatPeriod(emission.reporting_period)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={emission.scope === 1 ? 'default' : 'secondary'}
                            className={emission.scope === 1 ? 'bg-earth-300' : 'bg-blue-500'}
                          >
                            Обхват {emission.scope}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-900">
                            {CATEGORY_LABELS[emission.category] || emission.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-medium">
                            {emission.activity_value.toLocaleString('bg-BG')} {emission.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold text-earth-400">
                            {emission.calculated_co2e.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {emission.notes ? (
                            <span className="text-xs text-gray-600 max-w-xs truncate block">
                              {emission.notes}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEmission(emission);
                              setDetailsOpen(true);
                            }}
                            className="text-earth-400 hover:text-earth-500 hover:bg-earth-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        {emissions.length > 0 && (
          <Card className="border-earth-200 bg-earth-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-earth-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-earth-900 mb-2">
                    Обобщение
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-earth-700">Общо записи</p>
                      <p className="text-lg font-bold text-earth-900">{emissions.length}</p>
                    </div>
                    <div>
                      <p className="text-earth-700">Общо емисии</p>
                      <p className="text-lg font-bold text-earth-900">{totalEmissions.toFixed(2)} tCO2e</p>
                    </div>
                    <div>
                      <p className="text-earth-700">Средно на запис</p>
                      <p className="text-lg font-bold text-earth-900">
                        {(totalEmissions / emissions.length).toFixed(2)} tCO2e
                      </p>
                    </div>
                    <div>
                      <p className="text-earth-700">Последен период</p>
                      <p className="text-lg font-bold text-earth-900">
                        {formatPeriod(emissions[0].reporting_period)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                          {formatPeriod(selectedEmission.reporting_period)}
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
                  <div className="text-xs text-gray-400 pt-2 border-t">
                    <p>Създадена на: {new Date(selectedEmission.created_at).toLocaleString('bg-BG')}</p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


