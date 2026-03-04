'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { bg } from '@/lib/i18n/bg';
import { Building2, Save, Loader2 } from 'lucide-react';

export default function CreateCompanyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    registration_number: '',
    industry_sector: '',
    employee_count: '',
    primary_contact_email: '',
    billing_address: '',
    sustainability_goals: '',
    eu_green_deal_commitment: false,
    baseline_year: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : undefined,
        baseline_year: formData.baseline_year ? parseInt(formData.baseline_year) : undefined,
      };

      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Грешка при създаване');
      }

      const { data } = await response.json();
      toast.success('Компанията е създадена успешно');
      router.push('/admin/companies');
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast.error(error.message || 'Грешка при създаване на компанията');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-earth-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Създаване на нова компания
            </h1>
            <p className="text-sm text-gray-500">
              Въведете информацията за новата компания
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Основна информация</CardTitle>
              <CardDescription>
                Основни данни за регистрацията и дейността
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">
                    {bg.company.companyName} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company_name"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="ООД Пример ЕООД"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_number">
                    {bg.company.registrationNumber} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="registration_number"
                    required
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry_sector">
                    {bg.company.industrySector} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="industry_sector"
                    required
                    value={formData.industry_sector}
                    onChange={(e) => setFormData({ ...formData, industry_sector: e.target.value })}
                    placeholder="Производство, ИТ, Услуги..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_count">{bg.company.employeeCount}</Label>
                  <Input
                    id="employee_count"
                    type="number"
                    min="1"
                    value={formData.employee_count}
                    onChange={(e) => setFormData({ ...formData, employee_count: e.target.value })}
                    placeholder="Незадължително"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Контактна информация</CardTitle>
              <CardDescription>
                Данни за връзка и адрес за кореспонденция
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary_contact_email">
                  {bg.company.contactEmail} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="primary_contact_email"
                  type="email"
                  required
                  value={formData.primary_contact_email}
                  onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                  placeholder="contact@company.bg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing_address">{bg.company.billingAddress}</Label>
                <Textarea
                  id="billing_address"
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  placeholder="гр. София, ул. Примерна 1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sustainability Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Цели за устойчивост</CardTitle>
              <CardDescription>
                Ангажименти и цели свързани с околната среда
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sustainability_goals">{bg.company.sustainabilityGoals}</Label>
                <Textarea
                  id="sustainability_goals"
                  value={formData.sustainability_goals}
                  onChange={(e) => setFormData({ ...formData, sustainability_goals: e.target.value })}
                  placeholder="Опишете целите на компанията за устойчивост..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseline_year">{bg.company.baselineYear}</Label>
                  <Input
                    id="baseline_year"
                    type="number"
                    min="2000"
                    max="2030"
                    value={formData.baseline_year}
                    onChange={(e) => setFormData({ ...formData, baseline_year: e.target.value })}
                    placeholder="напр. 2020"
                  />
                  <p className="text-xs text-gray-500">
                    Референтна година за сравнение на прогреса
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eu_green_deal">{bg.company.euGreenDeal}</Label>
                  <div className="flex items-center h-10">
                    <input
                      id="eu_green_deal"
                      type="checkbox"
                      checked={formData.eu_green_deal_commitment}
                      onChange={(e) => setFormData({ ...formData, eu_green_deal_commitment: e.target.checked })}
                      className="h-4 w-4 text-earth-300 focus:ring-earth-300 border-gray-300 rounded"
                    />
                    <label htmlFor="eu_green_deal" className="ml-2 text-sm text-gray-700">
                      Ангажимент към ЕС Зелена сделка
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              {bg.general.cancel}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-earth-300 hover:bg-earth-400"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {bg.general.loading}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Създай компания
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
