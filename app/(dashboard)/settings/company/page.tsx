'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Company } from '@/types';
import { bg } from '@/lib/i18n/bg';
import { Building2, Save, Loader2 } from 'lucide-react';

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('company_id, role')
        .eq('id', user.id)
        .single();

      if (userData?.company_id) {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userData.company_id)
          .single();

        if (error) throw error;
        setCompany(data);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Грешка при зареждане на данните');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!company) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: company.company_name,
          registration_number: company.registration_number,
          industry_sector: company.industry_sector,
          employee_count: company.employee_count,
          primary_contact_email: company.primary_contact_email,
          billing_address: company.billing_address,
          sustainability_goals: company.sustainability_goals,
          eu_green_deal_commitment: company.eu_green_deal_commitment,
          baseline_year: company.baseline_year,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Грешка при запазване');
      }

      toast.success('Данните са запазени успешно');
      setIsEditing(false);
      fetchCompany();
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error(error.message || 'Грешка при запазване на данните');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-earth-300" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">Няма намерена компания</CardTitle>
            <CardDescription className="text-amber-800">
              Вашият профил не е свързан с компания. Моля, свържете се с администратор.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-earth-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {bg.company.title}
              </h1>
              <p className="text-sm text-gray-500">
                Управление на информацията за компанията
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    fetchCompany();
                  }}
                  disabled={saving}
                >
                  {bg.general.cancel}
                </Button>
                <Button
                  onClick={handleSave}
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
                      {bg.general.save}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-earth-300 hover:bg-earth-400"
              >
                {bg.general.edit}
              </Button>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Основна информация</CardTitle>
            <CardDescription>
              Основни данни за регистрацията и дейността на компанията
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">{bg.company.companyName}</Label>
                <Input
                  id="company_name"
                  value={company.company_name}
                  onChange={(e) => setCompany({ ...company, company_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_number">{bg.company.registrationNumber}</Label>
                <Input
                  id="registration_number"
                  value={company.registration_number}
                  onChange={(e) => setCompany({ ...company, registration_number: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry_sector">{bg.company.industrySector}</Label>
                <Input
                  id="industry_sector"
                  value={company.industry_sector}
                  onChange={(e) => setCompany({ ...company, industry_sector: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_count">{bg.company.employeeCount}</Label>
                <Input
                  id="employee_count"
                  type="number"
                  value={company.employee_count || ''}
                  onChange={(e) => setCompany({ ...company, employee_count: parseInt(e.target.value) || null })}
                  disabled={!isEditing}
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
              <Label htmlFor="primary_contact_email">{bg.company.contactEmail}</Label>
              <Input
                id="primary_contact_email"
                type="email"
                value={company.primary_contact_email}
                onChange={(e) => setCompany({ ...company, primary_contact_email: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing_address">{bg.company.billingAddress}</Label>
              <Textarea
                id="billing_address"
                value={company.billing_address || ''}
                onChange={(e) => setCompany({ ...company, billing_address: e.target.value })}
                disabled={!isEditing}
                placeholder="Незадължително"
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
                value={company.sustainability_goals || ''}
                onChange={(e) => setCompany({ ...company, sustainability_goals: e.target.value })}
                disabled={!isEditing}
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
                  value={company.baseline_year || ''}
                  onChange={(e) => setCompany({ ...company, baseline_year: parseInt(e.target.value) || null })}
                  disabled={!isEditing}
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
                    checked={company.eu_green_deal_commitment}
                    onChange={(e) => setCompany({ ...company, eu_green_deal_commitment: e.target.checked })}
                    disabled={!isEditing}
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
      </div>
    </div>
  );
}
