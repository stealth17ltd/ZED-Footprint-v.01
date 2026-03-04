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
import { Users, Plus, Search, Loader2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company_id: string | null;
  company?: {
    company_name: string;
  };
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Грешка при зареждане');
      }

      const result = await response.json();
      setUsers(result.data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Грешка при зареждане на потребителите');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.company?.company_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsers = users.filter(u => u.is_active).length;
  const usersWithCompany = users.filter(u => u.company_id).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;

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
              <Users className="h-6 w-6 text-earth-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Управление на потребители
              </h1>
              <p className="text-sm text-gray-500">
                Създаване и управление на потребителски акаунти
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/admin/users/create')}
            className="bg-earth-300 hover:bg-earth-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            Нов потребител
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Общо потребители
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-earth-400">
                {users.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Активни
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {activeUsers}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                С компания
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {usersWithCompany}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Администратори
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {adminUsers}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Списък потребители</CardTitle>
                <CardDescription>
                  Всички регистрирани потребители в системата
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
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Няма намерени потребители
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm
                    ? 'Опитайте с друга търсачка'
                    : 'Започнете като създадете първия потребител'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => router.push('/admin/users/create')}
                    className="mt-4 bg-earth-300 hover:bg-earth-400"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Създай потребител
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Име</TableHead>
                      <TableHead>Имейл</TableHead>
                      <TableHead>Роля</TableHead>
                      <TableHead>Компания</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Създаден</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {user.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                            className={user.role === 'admin' ? 'bg-blue-500' : 'bg-gray-500'}
                          >
                            {user.role === 'admin' ? 'Администратор' : 'Потребител'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.company?.company_name ? (
                            <span className="text-sm text-gray-900">
                              {user.company.company_name}
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              Без компания
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.is_active ? 'default' : 'secondary'}
                            className={user.is_active ? 'bg-green-500' : 'bg-gray-400'}
                          >
                            {user.is_active ? 'Активен' : 'Неактивен'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString('bg-BG')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="text-earth-400 hover:text-earth-500"
                          >
                            <Edit className="h-4 w-4" />
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
