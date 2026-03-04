'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Users, Save, Loader2, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';

interface Company {
  id: string;
  company_name: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company_id: string | null;
  is_active: boolean;
  created_at: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: 'client',
    company_id: '',
    is_active: true,
  });

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchCompanies();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('Потребителят не е намерен');
      }

      const result = await response.json();
      const userData = result.data;
      setUser(userData);
      setFormData({
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        company_id: userData.company_id || 'none',
        is_active: userData.is_active,
      });
    } catch (error: any) {
      console.error('Error fetching user:', error);
      toast.error(error.message || 'Грешка при зареждане на потребителя');
      router.push('/admin/users');
    } finally {
      setLoading(false);
    }
  };

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
    
    if (!formData.first_name || !formData.last_name) {
      toast.error('Моля, попълнете всички задължителни полета');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        company_id: formData.company_id === 'none' ? null : formData.company_id,
      };

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Грешка при запазване');
      }

      toast.success('Промените са запазени успешно');
      router.push('/admin/users');
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Грешка при запазване на промените');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword) {
      toast.error('Моля, въведете нова парола');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Паролата трябва да е поне 8 символа');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Паролите не съвпадат');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Грешка при промяна на паролата');
      }

      toast.success('Паролата е променена успешно');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Грешка при промяна на паролата');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-earth-300" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
              Редактиране на потребител
            </h1>
            <p className="text-sm text-gray-500">
              {user.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle>Лична информация</CardTitle>
              <CardDescription>
                Име и данни на потребителя
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Имейл адрес</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Имейлът не може да бъде променен
                </p>
              </div>

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
                  />
                </div>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_id">Компания</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                  disabled={loadingCompanies}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете компания..." />
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
                  Свържете потребителя с компания за достъп до данни
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Статус</Label>
                <Select
                  value={formData.is_active ? 'true' : 'false'}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Активен</SelectItem>
                    <SelectItem value="false">Неактивен</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Неактивните потребители не могат да влизат в системата
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-earth-400" />
                Промяна на парола
              </CardTitle>
              <CardDescription>
                Задайте нова парола за потребителя
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new_password">Нова парола</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 8 символа"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Потвърдете паролата</Label>
                <Input
                  id="confirm_password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Въведете паролата отново"
                />
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-500">Паролите не съвпадат</p>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={handlePasswordChange}
                disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full border-earth-300 text-earth-400 hover:bg-earth-50"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Промяна...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Промени паролата
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500">
                Потребителят ще трябва да използва новата парола при следващо влизане
              </p>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Системна информация</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>
                  <span className="font-medium">Създаден:</span>{' '}
                  {new Date(user.created_at).toLocaleString('bg-BG')}
                </p>
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
                  Запазване...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Запази промените
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
