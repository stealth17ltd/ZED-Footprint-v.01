'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Building2, Save, Loader2, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Company {
  id: string;
  company_name: string;
  registration_number: string;
  industry_sector: string;
  employee_count: number | null;
  location_count: number;
  primary_contact_email: string;
  billing_address: string | null;
  sustainability_goals: string | null;
  eu_green_deal_commitment: boolean;
  baseline_year: number | null;
  created_at: string;
  updated_at: string;
}

export default function CompanyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Компанията не е намерена');
          router.push('/admin/companies');
          return;
        }
        throw new Error('Грешка при зареждане');
      }

      const result = await response.json();
      setCompany(result.data);
    } catch (error: any) {
      console.error('Error fetching company:', error);
      toast.error(error.message || 'Грешка при зареждане на компанията');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!company) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/companies/${companyId}`, {
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

      toast.success('Промените са запазени успешно');
      setIsEditing(false);
      fetchCompany();
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error(error.message || 'Грешка при запазване на промените');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Грешка при изтриване');
      }

      toast.success('Компанията е деактивирана успешно');
      router.push('/admin/companies');
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast.error(error.message || 'Грешка при деактивиране на компанията');
      setDeleting(false);
      setShowDeleteDialog(false);
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
            <CardTitle className="text-amber-900">Компанията не е намерена</CardTitle>
            <CardDescription className="text-amber-800">
              Търсената компания не съществува или е била изтрита.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/admin/companies')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад към списъка
            </Button>
          </CardContent>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/companies')}
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
                Детайли и управление на компанията
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
                  Отказ
                </Button>
                <Button
                  onClick={handleSave}
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
                      Запази
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Деактивирай
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-earth-300 hover:bg-earth-400"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Редактирай
                </Button>
              </>
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
                <Label htmlFor="company_name">Име на компанията</Label>
                <Input
                  id="company_name"
                  value={company.company_name}
                  onChange={(e) => setCompany({ ...company, company_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_number">ЕИК/БУЛСТАТ</Label>
                <Input
                  id="registration_number"
                  value={company.registration_number}
                  onChange={(e) => setCompany({ ...company, registration_number: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry_sector">Сектор/Индустрия</Label>
                <Input
                  id="industry_sector"
                  value={company.industry_sector}
                  onChange={(e) => setCompany({ ...company, industry_sector: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_count">Брой служители</Label>
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
              <Label htmlFor="primary_contact_email">Контактен имейл</Label>
              <Input
                id="primary_contact_email"
                type="email"
                value={company.primary_contact_email}
                onChange={(e) => setCompany({ ...company, primary_contact_email: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing_address">Адрес за кореспонденция</Label>
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
              <Label htmlFor="sustainability_goals">Цели за устойчивост</Label>
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
                <Label htmlFor="baseline_year">Базова година</Label>
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
                <Label htmlFor="eu_green_deal">ЕС Зелена сделка</Label>
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

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Системна информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Създадена:</span>
                <span className="ml-2 font-medium">
                  {new Date(company.created_at).toLocaleString('bg-BG')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Последна промяна:</span>
                <span className="ml-2 font-medium">
                  {new Date(company.updated_at).toLocaleString('bg-BG')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Локации:</span>
                <span className="ml-2 font-medium">
                  {company.location_count}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Деактивиране на компания</DialogTitle>
            <DialogDescription>
              Сигурни ли сте, че искате да деактивирате <strong>{company.company_name}</strong>?
              <br />
              <br />
              Компанията ще бъде маркирана като неактивна и няма да се показва в списъците,
              но данните ще бъдат запазени в системата.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Отказ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Деактивиране...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Деактивирай
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

