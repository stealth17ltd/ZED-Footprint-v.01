'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Tag, 
  Loader2, 
  Calendar, 
  Building2, 
  DollarSign,
  CheckCircle,
  Lock,
  Unlock,
  TrendingUp,
  ListChecks,
  Users,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { bg } from '@/lib/i18n/bg';

interface Transaction {
  id: string;
  txn_date: string;
  supplier: string;
  description: string | null;
  amount_base_currency: number;
  base_currency: string;
  expense_category_raw: string | null;
  classification?: {
    scope3_category: number;
    method_tier: string;
    is_locked: boolean;
  } | null;
}

interface SupplierGroup {
  supplier: string;
  total_spend: number;
  transaction_count: number;
  classified_count: number;
  transactions: Transaction[];
}

// Scope 3 category definitions
const SCOPE3_CATEGORIES = [
  { id: 1, name: 'Кат. 1: Закупени стоки и услуги', icon: '🛒', color: 'purple' },
  { id: 6, name: 'Кат. 6: Бизнес пътувания', icon: '✈️', color: 'blue' },
  { id: 7, name: 'Кат. 7: Пътуване на служители', icon: '🚗', color: 'green' },
  { id: 4, name: 'Кат. 4: Транспорт нагоре по веригата', icon: '🚚', color: 'orange' },
  { id: 5, name: 'Кат. 5: Генерирани отпадъци', icon: '♻️', color: 'emerald' },
];

const METHOD_TIERS = [
  { value: 'C', label: 'Ниво C: Базирано на разходи', description: 'По подразбиране' },
  { value: 'B', label: 'Ниво B: Базирано на дейност', description: 'Ако знаете количество' },
  { value: 'A', label: 'Ниво A: От доставчик', description: 'Най-точно' },
  { value: 'D', label: 'Ниво D: Приблизително', description: 'Временна оценка' },
];

export default function ClassifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editTransactionId = searchParams.get('edit');
  
  const [activeTab, setActiveTab] = useState(editTransactionId ? 'classified' : 'unclassified');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<SupplierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [classifyDialogOpen, setClassifyDialogOpen] = useState(false);
  const [bulkClassifyOpen, setBulkClassifyOpen] = useState(false);
  
  // Classification form state
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedMethodTier, setSelectedMethodTier] = useState<string>('C');
  const [classifyNotes, setClassifyNotes] = useState('');
  const [createRule, setCreateRule] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [lockClassification, setLockClassification] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handle edit parameter - auto-open dialog for specific transaction
  useEffect(() => {
    if (editTransactionId && transactions.length > 0) {
      const txn = transactions.find(t => t.id === editTransactionId);
      if (txn) {
        openClassifyDialog(txn);
        // Clear the query parameter after opening
        router.replace('/scope3/classify');
      }
    }
  }, [editTransactionId, transactions]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'top-suppliers') {
        const response = await fetch('/api/scope3/classify?view=top-suppliers');
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setTopSuppliers(result.data || []);
      } else {
        const response = await fetch(`/api/scope3/classify?view=${activeTab}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setTransactions(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Грешка при зареждане на данните');
    } finally {
      setLoading(false);
    }
  };

  // Toggle transaction selection
  const toggleTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  // Select all visible transactions
  const selectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  // Open single classification dialog
  const openClassifyDialog = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    
    // Pre-populate form if transaction is already classified
    if (transaction.classification) {
      setSelectedCategory(transaction.classification.scope3_category);
      setSelectedMethodTier(transaction.classification.method_tier);
      setLockClassification(transaction.classification.is_locked);
      setClassifyNotes('');
      setCreateRule(false);
      setRuleName('');
    } else {
      setSelectedCategory(null);
      setSelectedMethodTier('C');
      setClassifyNotes('');
      setCreateRule(false);
      setRuleName('');
      setLockClassification(false);
    }
    
    setClassifyDialogOpen(true);
  };

  // Classify single transaction
  const handleClassify = async () => {
    if (!selectedCategory || !currentTransaction) {
      toast.error('Моля, изберете категория');
      return;
    }

    try {
      const response = await fetch('/api/scope3/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: currentTransaction.id,
          scope3_category: selectedCategory,
          method_tier: selectedMethodTier,
          notes: classifyNotes || undefined,
          is_locked: lockClassification,
          create_rule: createRule,
          rule_name: createRule ? (ruleName || `Правило за ${currentTransaction.supplier}`) : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to classify');

      toast.success(currentTransaction.classification 
        ? 'Класификацията е актуализирана успешно' 
        : 'Транзакцията е класифицирана успешно'
      );
      setClassifyDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error classifying:', error);
      toast.error('Грешка при класификация');
    }
  };

  // Bulk classify selected transactions
  const handleBulkClassify = async () => {
    if (selectedTransactions.size === 0) {
      toast.error('Моля, изберете транзакции');
      return;
    }
    
    if (!selectedCategory) {
      toast.error('Моля, изберете категория');
      return;
    }

    try {
      const response = await fetch('/api/scope3/classify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_ids: Array.from(selectedTransactions),
          scope3_category: selectedCategory,
          method_tier: selectedMethodTier,
          is_locked: lockClassification,
        }),
      });

      if (!response.ok) throw new Error('Failed to bulk classify');

      const result = await response.json();
      toast.success(`${result.classified_count} транзакции класифицирани успешно`);
      setBulkClassifyOpen(false);
      setSelectedTransactions(new Set());
      fetchData();
    } catch (error) {
      console.error('Error bulk classifying:', error);
      toast.error('Грешка при масова класификация');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Calculate statistics
  const unclassifiedCount = activeTab === 'unclassified' ? transactions.length : 0;
  const classifiedCount = activeTab === 'classified' ? transactions.length : 0;

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
              <Tag className="h-6 w-6 text-earth-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Класификация на транзакции
              </h1>
              <p className="text-sm text-gray-500">
                Свържете транзакциите с категории на Обхват 3
              </p>
            </div>
          </div>
          {selectedTransactions.size > 0 && (
            <Button
              onClick={() => setBulkClassifyOpen(true)}
              className="bg-earth-400 hover:bg-earth-500"
            >
              Класифицирай ({selectedTransactions.size})
            </Button>
          )}
        </div>

        {/* Info Card */}
        {activeTab === 'unclassified' && transactions.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">
                    Класифицирайте транзакциите
                  </h3>
                  <p className="text-sm text-orange-700">
                    Имате {transactions.length} некласифицирани транзакции. Присвоете им категории на Обхват 3, 
                    за да изчислите вашите емисии от стойностната верига.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="unclassified" className="flex items-center gap-2">
              <Unlock className="h-4 w-4" />
              Некласифицирани
            </TabsTrigger>
            <TabsTrigger value="classified" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Класифицирани
            </TabsTrigger>
            <TabsTrigger value="top-suppliers" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Топ доставчици
            </TabsTrigger>
          </TabsList>

          {/* Unclassified Tab */}
          <TabsContent value="unclassified" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Некласифицирани транзакции</CardTitle>
                    <CardDescription>
                      {transactions.length} транзакции изчакват класификация
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
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      Всички транзакции са класифицирани!
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Страхотна работа! Можете да прегледате класифицираните транзакции.
                    </p>
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
                        <TableHead className="text-center">Действие</TableHead>
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
                              <span className="text-sm font-medium">{txn.supplier}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600 max-w-xs truncate block">
                              {txn.description || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-bold text-gray-900">
                              {txn.amount_base_currency.toLocaleString('bg-BG', { maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">{txn.base_currency}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openClassifyDialog(txn)}
                              className="text-earth-400 hover:text-earth-500 hover:bg-earth-50"
                            >
                              <Tag className="h-4 w-4 mr-1" />
                              Класифицирай
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classified Tab */}
          <TabsContent value="classified" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Класифицирани транзакции</CardTitle>
                <CardDescription>
                  {transactions.length} транзакции вече са класифицирани
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      Няма класифицирани транзакции
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Започнете да класифицирате транзакции в раздел "Некласифицирани"
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Доставчик</TableHead>
                        <TableHead>Описание</TableHead>
                        <TableHead className="text-right">Сума</TableHead>
                        <TableHead>Категория</TableHead>
                        <TableHead>Метод</TableHead>
                        <TableHead className="text-center">Статус</TableHead>
                        <TableHead className="text-center">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell>
                            <span className="text-sm">{formatDate(txn.txn_date)}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">{txn.supplier}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600 max-w-xs truncate block">
                              {txn.description || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-bold">
                              {txn.amount_base_currency.toLocaleString('bg-BG', { maximumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            {txn.classification && (
                              <Badge className="bg-green-600">
                                {SCOPE3_CATEGORIES.find(c => c.id === txn.classification?.scope3_category)?.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              Ниво {txn.classification?.method_tier}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {txn.classification?.is_locked ? (
                              <Lock className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <Unlock className="h-4 w-4 text-gray-400 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openClassifyDialog(txn)}
                              title="Редактирай класификация"
                            >
                              <Tag className="h-4 w-4 text-blue-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Suppliers Tab */}
          <TabsContent value="top-suppliers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Топ доставчици по разходи</CardTitle>
                <CardDescription>
                  Класифицирайте топ доставчиците, за да покриете 80% от разходите
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topSuppliers.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      Няма данни за доставчици
                    </h3>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Доставчик</TableHead>
                        <TableHead className="text-right">Общо разходи</TableHead>
                        <TableHead className="text-center">Транзакции</TableHead>
                        <TableHead className="text-center">Класифицирани</TableHead>
                        <TableHead className="text-center">Прогрес</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topSuppliers.map((supplier) => {
                        const progress = (supplier.classified_count / supplier.transaction_count) * 100;
                        return (
                          <TableRow key={supplier.supplier}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium">{supplier.supplier}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm font-bold text-earth-400">
                                {supplier.total_spend.toLocaleString('bg-BG', { maximumFractionDigits: 0 })} EUR
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm">{supplier.transaction_count}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={progress === 100 ? 'default' : 'secondary'}>
                                {supplier.classified_count} / {supplier.transaction_count}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-600 transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600">{progress.toFixed(0)}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Single Classification Dialog */}
        <Dialog open={classifyDialogOpen} onOpenChange={setClassifyDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {currentTransaction?.classification ? 'Редактирай класификация' : 'Класифицирай транзакция'}
              </DialogTitle>
              <DialogDescription>
                {currentTransaction?.classification 
                  ? 'Променете категорията на Обхват 3 за тази транзакция'
                  : 'Присвоете категория на Обхват 3 за тази транзакция'
                }
              </DialogDescription>
            </DialogHeader>

            {currentTransaction && (
              <div className="space-y-6">
                {/* Transaction info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Доставчик</p>
                      <p className="font-medium">{currentTransaction.supplier}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Сума</p>
                      <p className="font-medium">
                        {currentTransaction.amount_base_currency.toLocaleString('bg-BG')} EUR
                      </p>
                    </div>
                    {currentTransaction.description && (
                      <div className="col-span-2">
                        <p className="text-gray-500">Описание</p>
                        <p className="font-medium">{currentTransaction.description}</p>
                      </div>
                    )}
                    {currentTransaction.classification && (
                      <div className="col-span-2">
                        <p className="text-gray-500">Текуща класификация</p>
                        <Badge className="bg-green-600">
                          {SCOPE3_CATEGORIES.find(c => c.id === currentTransaction.classification?.scope3_category)?.name}
                        </Badge>
                        <Badge variant="outline" className="ml-2">
                          Ниво {currentTransaction.classification.method_tier}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>Категория Обхват 3 *</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {SCOPE3_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedCategory === cat.id
                            ? `border-${cat.color}-500 bg-${cat.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cat.icon}</span>
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Method Tier */}
                <div className="space-y-2">
                  <Label>Ниво на метод</Label>
                  <Select value={selectedMethodTier} onValueChange={setSelectedMethodTier}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METHOD_TIERS.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value}>
                          <div>
                            <div>{tier.label}</div>
                            <div className="text-xs text-gray-500">{tier.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Бележки (незадължително)</Label>
                  <Textarea
                    value={classifyNotes}
                    onChange={(e) => setClassifyNotes(e.target.value)}
                    placeholder="Добавете бележки..."
                    rows={3}
                  />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create-rule"
                      checked={createRule}
                      onCheckedChange={(checked) => setCreateRule(checked as boolean)}
                    />
                    <Label htmlFor="create-rule" className="text-sm cursor-pointer">
                      Създай правило за бъдещи транзакции от този доставчик
                    </Label>
                  </div>

                  {createRule && (
                    <div className="ml-6 space-y-2">
                      <Label>Име на правило</Label>
                      <Input
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        placeholder={`Правило за ${currentTransaction.supplier}`}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lock-classification"
                      checked={lockClassification}
                      onCheckedChange={(checked) => setLockClassification(checked as boolean)}
                    />
                    <Label htmlFor="lock-classification" className="text-sm cursor-pointer">
                      Заключи класификацията (предотврати автоматични промени)
                    </Label>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setClassifyDialogOpen(false)}>
                Откажи
              </Button>
              <Button onClick={handleClassify} disabled={!selectedCategory}>
                {currentTransaction?.classification ? 'Актуализирай' : 'Класифицирай'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Classification Dialog */}
        <Dialog open={bulkClassifyOpen} onOpenChange={setBulkClassifyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Масова класификация</DialogTitle>
              <DialogDescription>
                Класифицирайте {selectedTransactions.size} избрани транзакции
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Категория Обхват 3 *</Label>
                <div className="grid grid-cols-1 gap-2">
                  {SCOPE3_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedCategory === cat.id
                          ? 'border-earth-500 bg-earth-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ниво на метод</Label>
                <Select value={selectedMethodTier} onValueChange={setSelectedMethodTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_TIERS.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkClassifyOpen(false)}>
                Откажи
              </Button>
              <Button onClick={handleBulkClassify} disabled={!selectedCategory}>
                Класифицирай всички
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
