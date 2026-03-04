'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Save, Loader2, ArrowLeft } from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'client',
    company_id: 'none',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const result = await response.json();
        setCompanies(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      toast.error('Моля, попълнете всички задължителни полета');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Паролата трябва да е поне 6 символа');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        company_id: formData.company_id === 'none' ? null : formData.company_id,
      };

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Грешка при създаване');
      }

      toast.success('Потребителят е създаден успешно');
      router.push('/admin/users');
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Грешка при създаване на потребителя');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
            <Users className="h-6 w-6 text-earth-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Създаване на нов потребител
            </h1>
            <p className="text-sm text-gray-500">
              Въведете информацията за новия потребител
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle>Лична информация</CardTitle>
              <CardDescription>
                Име и данни за вход на потребителя
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    Име <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Иван"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Фамилия <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Иванов"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Имейл адрес <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ivan@example.com"
                />
                <p className="text-xs text-gray-500">
                  Ще се използва за вход в системата
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Парола <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Минимум 6 символа"
                />
                <p className="text-xs text-gray-500">
                  Поне 6 символа. Потребителят може да я смени след влизане.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Role and Company */}
          <Card>
            <CardHeader>
              <CardTitle>Права и компания</CardTitle>
              <CardDescription>
                Роля и свързване към компания
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">
                  Роля <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Потребител (Клиент)</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {formData.role === 'admin' 
                    ? 'Администраторите имат пълен достъп до системата'
                    : 'Потребителите имат достъп само до данните на тяхната компания'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_id">Компания</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                  disabled={loadingCompanies}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете компания (незадължително)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без компания</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Свържете потребителя с компания. Може да се остави празно и да се зададе по-късно.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-sm text-blue-900 space-y-2">
                <p className="font-medium">📌 Важно:</p>
                <ul className="list-disc list-inside ml-2 space-y-1 text-blue-800">
                  <li>Потребителите без компания няма да могат да въвеждат емисии</li>
                  <li>Администраторите могат да създават компании и потребители</li>
                  <li>Може да промените компанията на потребител по всяко време</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/users')}
              disabled={saving}
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
                  Създаване...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Създай потребител
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
