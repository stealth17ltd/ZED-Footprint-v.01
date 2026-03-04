'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Loader2, Calculator, ListChecks, Upload, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { ZedLogo } from '@/components/ui/zed-logo';
import { MonthPicker } from '@/components/ui/month-picker';
import Link from 'next/link';

// Emission categories based on PRD
const SCOPE_1_CATEGORIES = [
  { value: 'vehicles_diesel', label: 'Превозни средства - Дизел', unit: 'литри' },
  { value: 'vehicles_petrol', label: 'Превозни средства - Бензин', unit: 'литри' },
  { value: 'vehicles_lpg', label: 'Превозни средства - ГПГ', unit: 'литри' },
  { value: 'natural_gas', label: 'Природен газ', unit: 'м³' },
  { value: 'heating_oil', label: 'Нафта за отопление', unit: 'литри' },
  { value: 'coal', label: 'Въглища', unit: 'кг' },
  { value: 'refrigerant_r134a', label: 'Хладилен агент R-134a', unit: 'кг' },
  { value: 'refrigerant_r404a', label: 'Хладилен агент R-404A', unit: 'кг' },
];

const SCOPE_2_CATEGORIES = [
  { value: 'electricity', label: 'Електроенергия', unit: 'kWh' },
  { value: 'district_heating', label: 'Топлоенергия (централно)', unit: 'kWh' },
  { value: 'district_cooling', label: 'Хладилна енергия (централна)', unit: 'kWh' },
];

export default function DataEntryPage() {
  const router = useRouter();
  const [activeScope, setActiveScope] = useState<'1' | '2'>('1');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    scope: 1,
    category: '',
    activity_value: '',
    unit: '',
    reporting_period: new Date().toISOString().slice(0, 7), // YYYY-MM format
    notes: '',
    // Enhanced fields
    location: '',
    equipment_id: '',
    supplier: '',
    invoice_number: '',
    measurement_method: 'measured', // measured, calculated, estimated
    data_quality: 'high', // high, medium, low
    cost: '',
    currency: 'BGN',
    responsible_person: '',
  });

  const currentCategories = activeScope === '1' ? SCOPE_1_CATEGORIES : SCOPE_2_CATEGORIES;
  const selectedCategory = currentCategories.find(cat => cat.value === formData.category);

  const handleCategoryChange = (value: string) => {
    const category = currentCategories.find(cat => cat.value === value);
    setFormData({
      ...formData,
      category: value,
      unit: category?.unit || '',
    });
  };

  const handleScopeChange = (scope: '1' | '2') => {
    setActiveScope(scope);
    setFormData({
      ...formData,
      scope: parseInt(scope),
      category: '',
      unit: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) {
      toast.error('Моля, изберете категория');
      return;
    }

    if (!formData.activity_value || parseFloat(formData.activity_value) <= 0) {
      toast.error('Моля, въведете валидна стойност');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/emissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          activity_value: parseFloat(formData.activity_value),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Грешка при запазване');
      }

      const result = await response.json();
      toast.success(`Данните са запазени успешно! CO2e: ${result.data.calculated_co2e.toFixed(2)} тона`);
      
      // Reset form
      setFormData({
        scope: parseInt(activeScope),
        category: '',
        activity_value: '',
        unit: '',
        reporting_period: new Date().toISOString().slice(0, 7),
        notes: '',
        // Reset enhanced fields
        location: '',
        equipment_id: '',
        supplier: '',
        invoice_number: '',
        measurement_method: 'measured',
        data_quality: 'high',
        cost: '',
        currency: 'BGN',
        responsible_person: '',
      });
    } catch (error: any) {
      console.error('Error saving emission data:', error);
      toast.error(error.message || 'Грешка при запазване на данните');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
              <PlusCircle className="h-6 w-6 text-earth-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Въвеждане на емисии
              </h1>
              <p className="text-sm text-gray-500">
                Добавете данни за Обхват 1 и Обхват 2 емисии
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/data-entry/import">
              <Button variant="outline" className="border-earth-300 text-earth-400 hover:bg-earth-50">
                <Upload className="mr-2 h-4 w-4" />
                Импорт
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => router.push('/data-entry/list')}
            >
              <ListChecks className="mr-2 h-4 w-4" />
              Преглед
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Calculator className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">Автоматично изчисление на CO₂e</p>
                  <InfoTooltip 
                    content="CO₂e = Количество × Емисионен фактор × GWP. Емисионните фактори се базират на официални български и европейски стандарти и се актуализират ежегодно."
                    side="right"
                  />
                </div>
                <p className="text-blue-800">
                  Системата автоматично ще изчисли въглеродните емисии на базата на 
                  въведените данни и официалните български/европейски емисионни фактори.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Данни за емисии</CardTitle>
            <CardDescription>
              Изберете обхват и категория, след което въведете количествените данни
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Scope Tabs */}
              <Tabs value={activeScope} onValueChange={(v) => handleScopeChange(v as '1' | '2')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="1">
                    Обхват 1 - Директни емисии
                  </TabsTrigger>
                  <TabsTrigger value="2">
                    Обхват 2 - Индиректни емисии
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="1" className="space-y-4 mt-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <strong>Обхват 1</strong> включва директни емисии от източници, 
                    притежавани или контролирани от компанията: превозни средства, 
                    горене на място, хладилни агенти.
                  </div>
                </TabsContent>

                <TabsContent value="2" className="space-y-4 mt-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <strong>Обхват 2</strong> включва индиректни емисии от закупена 
                    електроенергия, топло или хладилна енергия.
                  </div>
                </TabsContent>
              </Tabs>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Категория <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете категория..." />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Activity Value and Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activity_value">
                    Количество <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="activity_value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.activity_value}
                    onChange={(e) => setFormData({ ...formData, activity_value: e.target.value })}
                    placeholder="Въведете количество"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Единица</Label>
                  <Input
                    id="unit"
                    value={selectedCategory?.unit || formData.unit}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              {/* Reporting Period */}
              <div className="space-y-2">
                <Label htmlFor="reporting_period">
                  Отчетен период <span className="text-red-500">*</span>
                </Label>
                <MonthPicker
                  value={formData.reporting_period}
                  onChange={(value) => setFormData({ ...formData, reporting_period: value })}
                  placeholder="Изберете период"
                />
                <p className="text-xs text-gray-500">
                  Изберете месец и година за отчетния период
                </p>
              </div>

              {/* Detailed Information Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 text-earth-400">Детайлна информация</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">
                      Локация/Обект
                      <InfoTooltip content="Конкретна локация или обект, където е извършена дейността" />
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="напр. Склад София, Офис Варна..."
                    />
                  </div>

                  {/* Equipment ID */}
                  <div className="space-y-2">
                    <Label htmlFor="equipment_id">
                      Оборудване/Превозно средство
                      <InfoTooltip content="Идентификационен номер на оборудване или превозно средство" />
                    </Label>
                    <Input
                      id="equipment_id"
                      value={formData.equipment_id}
                      onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                      placeholder="напр. СА 1234 АВ, Бойлер-01..."
                    />
                  </div>

                  {/* Supplier */}
                  <div className="space-y-2">
                    <Label htmlFor="supplier">
                      Доставчик
                      <InfoTooltip content="Компания доставчик на енергия или гориво" />
                    </Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="напр. ЧЕЗ, Булгаргаз, Лукойл..."
                    />
                  </div>

                  {/* Invoice Number */}
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">
                      Номер на фактура/документ
                      <InfoTooltip content="Референтен номер на фактура или друг документ за одит" />
                    </Label>
                    <Input
                      id="invoice_number"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                      placeholder="напр. INV-2025-001..."
                    />
                  </div>

                  {/* Measurement Method */}
                  <div className="space-y-2">
                    <Label htmlFor="measurement_method">
                      Метод на измерване
                      <InfoTooltip content="Как са получени данните - директно измерване, изчисление или оценка" />
                    </Label>
                    <Select
                      value={formData.measurement_method}
                      onValueChange={(value) => setFormData({ ...formData, measurement_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="measured">Измерено (от уреди/фактури)</SelectItem>
                        <SelectItem value="calculated">Изчислено (по формула)</SelectItem>
                        <SelectItem value="estimated">Оценено (приблизително)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Data Quality */}
                  <div className="space-y-2">
                    <Label htmlFor="data_quality">
                      Качество на данните
                      <InfoTooltip content="Оценка на точността и надеждността на данните" />
                    </Label>
                    <Select
                      value={formData.data_quality}
                      onValueChange={(value) => setFormData({ ...formData, data_quality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Високо (първични данни, измерени)</SelectItem>
                        <SelectItem value="medium">Средно (вторични данни)</SelectItem>
                        <SelectItem value="low">Ниско (оценки, екстраполации)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cost */}
                  <div className="space-y-2">
                    <Label htmlFor="cost">
                      Разходи
                      <InfoTooltip content="Финансови разходи свързани с емисията (опционално)" />
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        placeholder="Сума..."
                        className="flex-1"
                      />
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BGN">BGN</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Responsible Person */}
                  <div className="space-y-2">
                    <Label htmlFor="responsible_person">
                      Отговорно лице
                      <InfoTooltip content="Лице отговорно за източника на емисия" />
                    </Label>
                    <Input
                      id="responsible_person"
                      value={formData.responsible_person}
                      onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                      placeholder="напр. Иван Петров, Мария Иванова..."
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Допълнителни забележки</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Допълнителна информация, обяснения или коментари..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Отказ
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-earth-300 hover:bg-earth-400"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Запазване...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Запази данни
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-base">💡 Полезна информация</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>• <strong>Превозни средства:</strong> Въведете общото количество изгоряно гориво за периода</p>
            <p>• <strong>Електроенергия:</strong> Проверете фактурата си за kWh консумация</p>
            <p>• <strong>Хладилни агенти:</strong> Добавяйте само при пълнене или теч на системи</p>
            <p>• <strong>Месечен период:</strong> Препоръчваме месечно отчитане за по-добро проследяване</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

