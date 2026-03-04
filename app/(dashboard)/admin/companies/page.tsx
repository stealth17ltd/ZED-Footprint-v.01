'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Building2, Plus, Search, Loader2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Company {
  id: string;
  company_name: string;
  registration_number: string;
  industry_sector: string;
  employee_count: number | null;
  primary_contact_email: string;
  created_at: string;
}

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      
      if (!response.ok) {
        throw new Error('Грешка при зареждане');
      }

      const result = await response.json();
      setCompanies(result.data || []);
      setTotalCount(result.pagination?.total || 0);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast.error(error.message || 'Грешка при зареждане на компаниите');
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.registration_number.includes(searchTerm) ||
    company.industry_sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Building2 className="h-6 w-6 text-earth-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Управление на компании
              </h1>
              <p className="text-sm text-gray-500">
                Преглед и управление на всички компании в системата
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/admin/companies/create')}
            className="bg-earth-300 hover:bg-earth-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            Нова компания
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Общо компании
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-earth-400">
                {totalCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Показани
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {filteredCompanies.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Индустрии
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {new Set(companies.map(c => c.industry_sector)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Списък компании</CardTitle>
                <CardDescription>
                  Всички регистрирани компании в системата
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Търсене..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Няма намерени компании
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm
                    ? 'Опитайте с друга търсачка'
                    : 'Започнете като създадете първата компания'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => router.push('/admin/companies/create')}
                    className="mt-4 bg-earth-300 hover:bg-earth-400"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Създай компания
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Компания</TableHead>
                      <TableHead>ЕИК/БУЛСТАТ</TableHead>
                      <TableHead>Сектор</TableHead>
                      <TableHead>Служители</TableHead>
                      <TableHead>Имейл</TableHead>
                      <TableHead>Създадена</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {company.company_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {company.registration_number}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {company.industry_sector}
                          </span>
                        </TableCell>
                        <TableCell>
                          {company.employee_count ? (
                            <span className="text-sm text-gray-900">
                              {company.employee_count}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <a
                            href={`mailto:${company.primary_contact_email}`}
                            className="text-sm text-earth-400 hover:text-earth-500 hover:underline"
                          >
                            {company.primary_contact_email}
                          </a>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {new Date(company.created_at).toLocaleDateString('bg-BG')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/companies/${company.id}`)}
                            className="text-earth-400 hover:text-earth-500"
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
      </div>
    </div>
  );
}
