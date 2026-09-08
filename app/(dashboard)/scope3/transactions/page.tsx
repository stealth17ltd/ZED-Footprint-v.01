'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { 
  Receipt, 
  Plus, 
  Loader2, 
  Calendar, 
  Building2, 
  Eye, 
  FileText, 
  DollarSign,
  Tag,
  Lock,
  Unlock,
  Trash2,
  PlusCircle,
  AlertTriangle,
  Calculator,
  Leaf
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { bg } from '@/lib/i18n/bg';
import Link from 'next/link';
import type { Transaction } from '@/types';

interface TransactionWithDetails extends Transaction {
  import_batch?: {
    filename: string;
    imported_at: string;
  };
  classification?: {
    scope3_category: number;
    method_tier: string;
    is_locked: boolean;
  };
}

// Scope 3 category names
const SCOPE3_CATEGORIES: Record<number, string> = {
  1: 'Кат. 1: Закупени стоки и услуги',
  4: 'Кат. 4: Транспорт нагоре по веригата',
  5: 'Кат. 5: Генерирани отпадъци',
  6: 'Кат. 6: Бизнес пътувания',
  7: 'Кат. 7: Пътуване на служители',
};

export default function TransactionsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batch_id');
  
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBatchDialogOpen, setDeleteBatchDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  
  // Calculation state
  const [calculationSummary, setCalculationSummary] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  // Manual entry form state
  const [txnDate, setTxnDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchCalculationSummary();
  }, [batchId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = '/api/scope3/transactions';
      if (batchId) {
        url += `?batch_id=${batchId}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Грешка при зареждане');
      }

      const result = await response.json();
      setTransactions(result.data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error(error.message || 'Грешка при зареждане на данните');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalculationSummary = async () => {
    try {
      const response = await fetch('/api/scope3/calculate');
      if (response.ok) {
        const data = await response.json();
        setCalculationSummary(data);
      }
    } catch (error) {
      console.error('Error fetching calculation summary:', error);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const response = await fetch('/api/scope3/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recalculate: false }),
      });

      if (!response.ok) {
        throw new Error('Грешка при изчисление');
      }

      const result = await response.json();
      
      if (result.calculated > 0) {
        toast.success(
          `${bg.scope3.calculationComplete}! ${result.calculated} транзакции изчислени. ` +
          `Общо: ${result.total_co2e_tons} ${bg.scope3.co2eTons}`
        );
      } else {
        toast.info(`Всички транзакции вече са изчислени. ${result.skipped} пропуснати.`);
      }
      
      // Refresh summary
      fetchCalculationSummary();
    } catch (error: any) {
      console.error('Error calculating:', error);
      toast.error(error.message || bg.scope3.calculationFailed);
    } finally {
      setCalculating(false);
    }
  };

  const openManualEntry = () => {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setTxnDate(today);
    setSupplier('');
    setDescription('');
    setAmount('');
    setCurrency('EUR');
    setExpenseCategory('');
    setInvoiceNumber('');
    setManualEntryOpen(true);
  };

  const handleManualSubmit = async () => {
    if (!txnDate || !supplier || !amount) {
      toast.error('Моля, попълнете задължителните полета');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/scope3/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txn_date: txnDate,
          supplier,
          description: description || undefined,
          amount: parseFloat(amount),
          currency,
          expense_category_raw: expenseCategory || undefined,
          invoice_number: invoiceNumber || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create transaction');
      }

      toast.success('Транзакцията е добавена успешно');
      setManualEntryOpen(false);
      fetchTransactions();
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      toast.error(error.message || 'Грешка при създаване на транзакция');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/scope3/transactions?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast.success('Транзакцията е изтрита');
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Грешка при изтриване');
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchId) return;

    try {
      const response = await fetch(`/api/scope3/transactions?batch_id=${batchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast.success('Всички транзакции от импорта са изтрити');
      setDeleteBatchDialogOpen(false);
      router.push('/scope3/transactions');
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error('Грешка при изтриване');
    }
  };

  const toggleTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const selectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedTransactions).map(id =>
          fetch(`/api/scope3/transactions?id=${id}`, { method: 'DELETE' })
        )
      );

      toast.success(`${selectedTransactions.size} транзакции изтрити`);
      setSelectedTransactions(new Set());
      fetchTransactions();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Грешка при изтриване');
    }
  };

  // Calculate totals
  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount_base_currency || 0), 0);
  const classifiedCount = transactions.filter(t => t.classification).length;
  const unclassifiedCount = transactions.length - classifiedCount;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format number safely
  const formatAmount = (amount: number | undefined | null): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('bg-BG', { maximumFractionDigits: 2 });
  };

  if (loading) {
    return <PageSkeleton statCards={4} />;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-earth-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Финансови транзакции
              </h1>
              <p className="text-sm text-gray-500">
                {batchId ? 'Транзакции от последния импорт' : 'Всички импортирани транзакции'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {batchId && (
              <Button
                variant="destructive"
                onClick={() => setDeleteBatchDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Изтрий импорт
              </Button>
            )}
            {selectedTransactions.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Изтрий ({selectedTransactions.size})
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleCalculate}
              disabled={calculating}
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
            >
              {calculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {bg.scope3.calculating}
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  {bg.scope3.calculateEmissions}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={openManualEntry}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Ръчно въвеждане
            </Button>
            <Button
              onClick={() => router.push('/scope3/import')}
              className="bg-earth-400 hover:bg-earth-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Импортирай CSV
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Общо транзакции
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-earth-400">
                {transactions.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">записа</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Обща сума
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-earth-400">
                {formatAmount(totalAmount)}
              </div>
              <p className="text-xs text-gray-500 mt-1">EUR</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-600" />
                Класифицирани
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {classifiedCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {transactions.length > 0 ? Math.round((classifiedCount / transactions.length) * 100) : 0}% от общо
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Tag className="h-4 w-4 text-orange-600" />
                Некласифицирани
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {unclassifiedCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">изчакват класификация</p>
            </CardContent>
          </Card>
        </div>

        {/* Calculation Summary */}
        {calculationSummary && calculationSummary.total_calculations > 0 && (
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-xl text-green-900">
                      {bg.scope3.calculatedEmissions}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCalculate}
                      disabled={calculating}
                      className="text-green-700 hover:text-green-900"
                    >
                      {calculating ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          {bg.scope3.calculating}
                        </>
                      ) : (
                        <>
                          <Calculator className="mr-2 h-3 w-3" />
                          {bg.scope3.recalculate}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-green-700 mb-1">Общо емисии</p>
                      <p className="text-3xl font-bold text-green-900">
                        {calculationSummary.total_co2e_tons}
                      </p>
                      <p className="text-sm text-green-600">{bg.scope3.co2eTons}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-green-700 mb-1">Изчисления</p>
                      <p className="text-3xl font-bold text-green-900">
                        {calculationSummary.unique_calculated_transactions ?? calculationSummary.total_calculations}
                      </p>
                      <p className="text-sm text-green-600">
                        транзакции
                        {(calculationSummary.total_calculations ?? 0) >
                          (calculationSummary.unique_calculated_transactions ?? 0) && (
                          <span className="text-green-600/80">
                            {' '}({calculationSummary.total_calculations} записа)
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-green-700 mb-1">Покритие</p>
                      <p className="text-3xl font-bold text-green-900">
                        {classifiedCount > 0
                          ? Math.min(
                              100,
                              Math.round(
                                ((calculationSummary.unique_calculated_transactions ??
                                  calculationSummary.total_calculations) /
                                  classifiedCount) *
                                  100,
                              ),
                            )
                          : 0}%
                      </p>
                      <p className="text-sm text-green-600">от класифицирани</p>
                    </div>
                  </div>

                  {calculationSummary.by_category && calculationSummary.by_category.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-sm font-medium text-green-900 mb-2">{bg.scope3.byCategory}</p>
                      <div className="flex flex-wrap gap-2">
                        {calculationSummary.by_category.map((cat: any) => (
                          <div key={cat.category} className="bg-white rounded-lg px-3 py-2 border border-green-200">
                            <p className="text-xs text-gray-600">{SCOPE3_CATEGORIES[cat.category] || `Кат. ${cat.category}`}</p>
                            <p className="text-lg font-bold text-green-900">
                              {(cat.co2e_kg / 1000).toFixed(2)} т
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unclassified Alert */}
        {unclassifiedCount > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-1">
                    Имате {unclassifiedCount} некласифицирани транзакции
                  </h3>
                  <p className="text-sm text-orange-700 mb-3">
                    Класифицирайте транзакциите, за да изчислите вашите емисии от Обхват 3
                  </p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/scope3/classify')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Отиди на класификация
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Транзакции</CardTitle>
                <CardDescription>
                  {transactions.length === 0 
                    ? 'Няма импортирани транзакции'
                    : `Показване на ${transactions.length} транзакции`
                  }
                </CardDescription>
              </div>
              {transactions.length > 0 && (
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedTransactions.size === transactions.length ? 'Размаркирай всички' : 'Маркирай всички'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Няма транзакции
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Импортирайте CSV файл или добавете транзакция ръчно
                </p>
                <div className="mt-6 flex gap-3 justify-center">
                  <Button onClick={openManualEntry} variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ръчно въвеждане
                  </Button>
                  <Button onClick={() => router.push('/scope3/import')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Импортирай CSV
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Доставчик</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead className="text-right">Сума</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-center">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTransactions.has(txn.id)}
                          onCheckedChange={() => toggleTransaction(txn.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{formatDate(txn.txn_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <span className="text-sm font-medium">{txn.supplier}</span>
                            {!txn.import_batch_id && (
                              <Badge variant="outline" className="ml-2 text-xs">Ръчно</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-600 max-w-xs truncate block">
                          {txn.description || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <span className="text-sm font-bold text-gray-900">
                            {formatAmount(txn.amount_base_currency)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">{txn.base_currency}</span>
                        </div>
                        {txn.currency_original !== txn.base_currency && (
                          <div className="text-xs text-gray-400">
                            {formatAmount(txn.amount_original)} {txn.currency_original}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {txn.classification ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600">
                              {SCOPE3_CATEGORIES[txn.classification.scope3_category]}
                            </Badge>
                            {txn.classification.is_locked ? (
                              <Lock className="h-3 w-3 text-green-600" />
                            ) : (
                              <Unlock className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Некласифицирана
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(txn);
                              setDetailsOpen(true);
                            }}
                            title="Виж детайли"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {txn.classification && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/scope3/classify?edit=${txn.id}`)}
                              title="Промени класификация"
                            >
                              <Tag className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTransactionToDelete(txn.id);
                              setDeleteDialogOpen(true);
                            }}
                            title="Изтрий"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Manual Entry Dialog */}
        <Dialog open={manualEntryOpen} onOpenChange={setManualEntryOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ръчно въвеждане на транзакция</DialogTitle>
              <DialogDescription>
                Добавете транзакция ръчно (използвайте само ако нямате CSV данни)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Дата *</Label>
                  <Input
                    type="date"
                    value={txnDate}
                    onChange={(e) => setTxnDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Доставчик *</Label>
                  <Input
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="напр. Lukoil"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опционално описание на транзакцията"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Сума *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Валута *</Label>
                  <Input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    placeholder="EUR"
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Категория разход</Label>
                  <Input
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    placeholder="Опционално"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Номер фактура</Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Опционално"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setManualEntryOpen(false)}>
                Откажи
              </Button>
              <Button onClick={handleManualSubmit} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Добави транзакция
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transaction Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Детайли на транзакция</DialogTitle>
            </DialogHeader>

            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Дата</p>
                    <p className="font-medium">{formatDate(selectedTransaction.txn_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Доставчик</p>
                    <p className="font-medium">{selectedTransaction.supplier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Сума</p>
                    <p className="font-medium">
                      {formatAmount(selectedTransaction.amount_original)} {selectedTransaction.currency_original}
                      {selectedTransaction.currency_original !== selectedTransaction.base_currency && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({formatAmount(selectedTransaction.amount_base_currency)} {selectedTransaction.base_currency})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Класификация</p>
                    {selectedTransaction.classification ? (
                      <Badge className="bg-green-600">
                        {SCOPE3_CATEGORIES[selectedTransaction.classification.scope3_category]}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Некласифицирана</Badge>
                    )}
                  </div>
                </div>

                {selectedTransaction.description && (
                  <div>
                    <p className="text-sm text-gray-500">Описание</p>
                    <p className="font-medium">{selectedTransaction.description}</p>
                  </div>
                )}

                {selectedTransaction.import_batch && (
                  <div>
                    <p className="text-sm text-gray-500">Източник</p>
                    <p className="font-medium">
                      Импорт: {selectedTransaction.import_batch.filename}
                      <span className="text-sm text-gray-500 ml-2">
                        ({formatDate(selectedTransaction.import_batch.imported_at)})
                      </span>
                    </p>
                  </div>
                )}

                {!selectedTransaction.import_batch_id && (
                  <div>
                    <p className="text-sm text-gray-500">Източник</p>
                    <p className="font-medium flex items-center gap-2">
                      <Badge variant="outline">Ръчно въведена</Badge>
                    </p>
                  </div>
                )}

                {selectedTransaction.expense_category_raw && (
                  <div>
                    <p className="text-sm text-gray-500">Категория разход</p>
                    <p className="font-medium">{selectedTransaction.expense_category_raw}</p>
                  </div>
                )}

                {selectedTransaction.invoice_number && (
                  <div>
                    <p className="text-sm text-gray-500">Номер фактура</p>
                    <p className="font-medium">{selectedTransaction.invoice_number}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setDetailsOpen(false)}>Затвори</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Изтриване на транзакция</DialogTitle>
              <DialogDescription>
                Сигурни ли сте, че искате да изтриете тази транзакция? Това действие не може да бъде отменено.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Откажи
              </Button>
              <Button
                variant="destructive"
                onClick={() => transactionToDelete && handleDelete(transactionToDelete)}
              >
                Изтрий
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Batch Confirmation Dialog */}
        <Dialog open={deleteBatchDialogOpen} onOpenChange={setDeleteBatchDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Изтриване на целия импорт</DialogTitle>
              <DialogDescription>
                Сигурни ли сте, че искате да изтриете всички {transactions.length} транзакции от този импорт?
                Това действие не може да бъде отменено.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteBatchDialogOpen(false)}>
                Откажи
              </Button>
              <Button variant="destructive" onClick={handleDeleteBatch}>
                Изтрий всички ({transactions.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
