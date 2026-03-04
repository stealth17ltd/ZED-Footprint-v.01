'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { bg as bgLocale } from 'date-fns/locale';
import { FileText, CheckCircle, XCircle, Clock, Loader2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { bg } from '@/lib/i18n/bg';
import Link from 'next/link';
import type { ImportBatch } from '@/types';

export default function ImportHistoryPage() {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/scope3/import');
      if (!response.ok) throw new Error('Failed to fetch batches');
      
      const data = await response.json();
      setBatches(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching batches');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> {bg.scope3.statusCompleted}</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> {bg.scope3.statusProcessing}</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" /> {bg.scope3.statusFailed}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><Clock className="w-3 h-3 mr-1" /> {bg.scope3.statusPending}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-earth-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-6">
          <p className="text-red-900">Грешка: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-earth-400" />
            <h1 className="text-3xl font-bold">{bg.scope3.history}</h1>
          </div>
          <p className="text-muted-foreground">
            История на всички импортирани транзакции
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/scope3/transactions">
              Виж всички транзакции
            </Link>
          </Button>
          <Button asChild>
            <Link href="/scope3/import">
              Нов импорт
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      {batches.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{batches.length}</div>
              <p className="text-sm text-muted-foreground">Общо импорти</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {batches.filter(b => b.status === 'completed').length}
              </div>
              <p className="text-sm text-muted-foreground">Успешни</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {batches.reduce((sum, b) => sum + b.successful_count, 0).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Транзакции</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {batches.reduce((sum, b) => sum + b.failed_count, 0).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Грешки</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Импорти</CardTitle>
          <CardDescription>
            Списък на всички CSV импорти и техният статус
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Няма импортирани файлове</p>
              <p className="text-sm text-muted-foreground mb-4">
                Започнете като качите вашия първи CSV файл с транзакции
              </p>
              <Button asChild>
                <Link href="/scope3/import">
                  Импортирай транзакции
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Файл</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Импортирано от</TableHead>
                  <TableHead>Редове</TableHead>
                  <TableHead>Успешни</TableHead>
                  <TableHead>Грешки</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-center">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.filename}</TableCell>
                    <TableCell>
                      {format(new Date(batch.imported_at), 'PPp', { locale: bgLocale })}
                    </TableCell>
                    <TableCell>
                      {(batch as any).imported_by_user 
                        ? `${(batch as any).imported_by_user.first_name} ${(batch as any).imported_by_user.last_name}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{batch.row_count}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{batch.successful_count}</span>
                    </TableCell>
                    <TableCell>
                      {batch.failed_count > 0 ? (
                        <span className="text-red-600 font-medium">{batch.failed_count}</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(batch.status)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-earth-400 hover:text-earth-500 hover:bg-earth-50"
                      >
                        <Link href={`/scope3/transactions?batch_id=${batch.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
