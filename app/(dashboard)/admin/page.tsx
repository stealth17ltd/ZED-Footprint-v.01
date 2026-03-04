import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, BarChart3, Eye } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Verify admin role
  const { data: userData } = await supabase
    .from('users')
    .select('role, first_name')
    .eq('id', session.user.id)
    .single();

  if (userData?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Use service client for admin to bypass RLS
  const serviceClient = createServiceClient();
  
  // Fetch app-wide statistics
  const [
    { count: companiesCount },
    { count: usersCount },
    { count: emissionsCount },
    { data: emissionsData },
    { data: companiesWithEmissions },
  ] = await Promise.all([
    serviceClient.from('companies').select('*', { count: 'exact', head: true }),
    serviceClient.from('users').select('*', { count: 'exact', head: true }),
    serviceClient.from('emission_data').select('*', { count: 'exact', head: true }),
    serviceClient.from('emission_data').select('calculated_co2e, scope, company_id'),
    serviceClient.from('companies').select(`
      id, 
      company_name, 
      industry_sector,
      created_at
    `).order('company_name'),
  ]);

  // Calculate total emissions
  const totalEmissions = emissionsData?.reduce((sum, item) => sum + (item.calculated_co2e || 0), 0) || 0;

  // Calculate emissions per company
  const emissionsByCompany: Record<string, { total: number; scope1: number; scope2: number; count: number }> = {};
  emissionsData?.forEach(e => {
    if (!e.company_id) return;
    if (!emissionsByCompany[e.company_id]) {
      emissionsByCompany[e.company_id] = { total: 0, scope1: 0, scope2: 0, count: 0 };
    }
    emissionsByCompany[e.company_id].total += e.calculated_co2e || 0;
    emissionsByCompany[e.company_id].count += 1;
    if (e.scope === 1) {
      emissionsByCompany[e.company_id].scope1 += e.calculated_co2e || 0;
    } else {
      emissionsByCompany[e.company_id].scope2 += e.calculated_co2e || 0;
    }
  });

  // Enrich companies with emission data
  const companiesData = companiesWithEmissions?.map(company => ({
    ...company,
    emissions: emissionsByCompany[company.id] || { total: 0, scope1: 0, scope2: 0, count: 0 },
  })).sort((a, b) => b.emissions.total - a.emissions.total) || [];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Административно табло
          </h1>
          <p className="text-gray-600">
            Добре дошли, {userData?.first_name}! Преглед на системните данни.
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-earth-200 bg-gradient-to-br from-earth-50 to-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Общо компании
                </CardTitle>
                <Building2 className="h-5 w-5 text-earth-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-earth-400">{companiesCount || 0}</div>
              <p className="text-xs text-gray-500 mt-1">регистрирани в системата</p>
              <Link 
                href="/admin/companies" 
                className="text-xs text-earth-400 hover:text-earth-500 font-medium mt-2 inline-block"
              >
                Управление →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Общо потребители
                </CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{usersCount || 0}</div>
              <p className="text-xs text-gray-500 mt-1">активни акаунти</p>
              <Link 
                href="/admin/users" 
                className="text-xs text-blue-500 hover:text-blue-600 font-medium mt-2 inline-block"
              >
                Управление →
              </Link>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Общо записи
                </CardTitle>
                <FileText className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{emissionsCount || 0}</div>
              <p className="text-xs text-gray-500 mt-1">емисионни записа</p>
            </CardContent>
          </Card>
        </div>

        {/* Companies with Emissions Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-earth-400" />
              Емисии по компании
            </CardTitle>
            <CardDescription>
              Преглед на емисиите на всички компании в системата
            </CardDescription>
          </CardHeader>
          <CardContent>
            {companiesData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Компания</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Сектор</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Записи</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Обхват 1</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Обхват 2</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Общо tCO₂e</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companiesData.map((company) => (
                      <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{company.company_name}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {company.industry_sector || '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-sm">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {company.emissions.count}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm">
                          <span className="text-earth-400 font-medium">
                            {company.emissions.scope1.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-sm">
                          <span className="text-blue-500 font-medium">
                            {company.emissions.scope2.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-bold ${company.emissions.total > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {company.emissions.total.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            href={`/admin/companies/${company.id}/emissions`}
                            className="inline-flex items-center gap-1 text-sm text-earth-400 hover:text-earth-500 font-medium"
                          >
                            <Eye className="h-4 w-4" />
                            Виж данни
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Няма регистрирани компании</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Бързи действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/companies/create"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-earth-50 hover:border-earth-300 transition-colors"
              >
                <Building2 className="h-8 w-8 text-earth-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Нова компания</span>
              </Link>
              <Link
                href="/admin/users/create"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <Users className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-sm font-medium text-gray-700">Нов потребител</span>
              </Link>
              <Link
                href="/admin/companies"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <BarChart3 className="h-8 w-8 text-purple-500 mb-2" />
                <span className="text-sm font-medium text-gray-700">Всички компании</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors"
              >
                <FileText className="h-8 w-8 text-amber-500 mb-2" />
                <span className="text-sm font-medium text-gray-700">Всички потребители</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
