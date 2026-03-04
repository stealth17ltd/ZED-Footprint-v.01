'use client';

import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Play,
  Eye,
  Loader2,
  Info,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface Rule {
  id: string;
  company_id: string | null;
  rule_name: string;
  priority: number;
  is_active: boolean;
  condition_type: 'contains' | 'equals' | 'regex';
  condition_field: 'supplier' | 'description' | 'expense_category_raw';
  condition_value: string;
  output_scope3_category: number;
  output_subcategory: string | null;
  default_method: 'spend' | 'activity';
  applications_count?: number;
  created_at: string;
}

const SCOPE3_CATEGORIES = [
  { id: 1, name: 'Кат. 1: Закупени стоки и услуги', icon: '🛒' },
  { id: 6, name: 'Кат. 6: Бизнес пътувания', icon: '✈️' },
  { id: 7, name: 'Кат. 7: Пътуване на служители', icon: '🚗' },
  { id: 4, name: 'Кат. 4: Транспорт', icon: '🚚' },
  { id: 5, name: 'Кат. 5: Отпадъци', icon: '♻️' },
];

const CONDITION_TYPES = [
  { value: 'contains', label: 'Съдържа', description: 'Съдържа текст (най-често)' },
  { value: 'equals', label: 'Равно на', description: 'Точно съвпадение' },
  { value: 'regex', label: 'Регулярен израз', description: 'Напреднало' },
];

const CONDITION_FIELDS = [
  { value: 'supplier', label: 'Доставчик' },
  { value: 'description', label: 'Описание' },
  { value: 'expense_category_raw', label: 'Категория разход' },
];

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingRules, setApplyingRules] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);

  // Form state
  const [ruleName, setRuleName] = useState('');
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [conditionType, setConditionType] = useState<string>('contains');
  const [conditionField, setConditionField] = useState<string>('supplier');
  const [conditionValue, setConditionValue] = useState('');
  const [outputCategory, setOutputCategory] = useState<number | null>(null);

  // Test state
  const [testMatches, setTestMatches] = useState<any[]>([]);
  const [testMatchesCount, setTestMatchesCount] = useState(0);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scope3/rules?include_global=true');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setRules(result.data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Грешка при зареждане на правилата');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    setRuleName('');
    setPriority(0);
    setIsActive(true);
    setConditionType('contains');
    setConditionField('supplier');
    setConditionValue('');
    setOutputCategory(null);
    setDialogOpen(true);
  };

  const openEditDialog = (rule: Rule) => {
    setEditingRule(rule);
    setRuleName(rule.rule_name);
    setPriority(rule.priority);
    setIsActive(rule.is_active);
    setConditionType(rule.condition_type);
    setConditionField(rule.condition_field);
    setConditionValue(rule.condition_value);
    setOutputCategory(rule.output_scope3_category);
    setDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!ruleName || !conditionValue || !outputCategory) {
      toast.error('Моля, попълнете всички задължителни полета');
      return;
    }

    try {
      const payload = {
        rule_name: ruleName,
        priority,
        is_active: isActive,
        condition_type: conditionType,
        condition_field: conditionField,
        condition_value: conditionValue,
        output_scope3_category: outputCategory,
        default_method: 'spend',
      };

      let response;
      if (editingRule) {
        response = await fetch('/api/scope3/rules', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule_id: editingRule.id, ...payload }),
        });
      } else {
        response = await fetch('/api/scope3/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error('Failed to save');

      toast.success(editingRule ? 'Правилото е актуализирано' : 'Правилото е създадено');
      setDialogOpen(false);
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Грешка при запазване на правилото');
    }
  };

  const handleDeleteRule = async () => {
    if (!ruleToDelete) return;

    try {
      const response = await fetch(`/api/scope3/rules?rule_id=${ruleToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Правилото е изтрито');
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Грешка при изтриване на правилото');
    }
  };

  const handleTestRule = async () => {
    if (!conditionValue) {
      toast.error('Моля, въведете условие');
      return;
    }

    setTestLoading(true);
    try {
      const params = new URLSearchParams({
        condition_type: conditionType,
        condition_field: conditionField,
        condition_value: conditionValue,
      });

      const response = await fetch(`/api/scope3/rules/apply?${params}`);
      if (!response.ok) throw new Error('Failed to test');

      const result = await response.json();
      setTestMatches(result.matches || []);
      setTestMatchesCount(result.matches_count || 0);
      setTestDialogOpen(true);
    } catch (error) {
      console.error('Error testing rule:', error);
      toast.error('Грешка при тестване на правилото');
    } finally {
      setTestLoading(false);
    }
  };

  const handleApplyAllRules = async () => {
    setApplyingRules(true);
    try {
      const response = await fetch('/api/scope3/rules/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview_only: false }),
      });

      if (!response.ok) throw new Error('Failed to apply');

      const result = await response.json();
      toast.success(`${result.classified_count} транзакции класифицирани успешно`);
      fetchRules();
    } catch (error) {
      console.error('Error applying rules:', error);
      toast.error('Грешка при прилагане на правилата');
    } finally {
      setApplyingRules(false);
    }
  };

  const toggleRuleActive = async (rule: Rule) => {
    try {
      const response = await fetch('/api/scope3/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_id: rule.id, is_active: !rule.is_active }),
      });

      if (!response.ok) throw new Error('Failed to toggle');

      toast.success(rule.is_active ? 'Правилото е деактивирано' : 'Правилото е активирано');
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Грешка при промяна на статуса');
    }
  };

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
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Правила за класификация
              </h1>
              <p className="text-sm text-gray-500">
                Автоматизирайте класификацията с интелигентни правила
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleApplyAllRules}
              disabled={applyingRules || rules.length === 0}
              variant="outline"
            >
              {applyingRules ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Приложи всички
            </Button>
            <Button onClick={openCreateDialog} className="bg-earth-400 hover:bg-earth-500">
              <Plus className="h-4 w-4 mr-2" />
              Създай правило
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Как работят правилата?
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Правилата се прилагат автоматично при импорт на нови транзакции</li>
                  <li>• Първото съвпадащо правило се използва (по приоритет)</li>
                  <li>• <strong>Глобалните правила</strong> са предефинирани от системата (само четене)</li>
                  <li>• Можете да създавате <strong>свои правила</strong> за вашата компания</li>
                  <li>• Заключените класификации НЕ се презаписват от правила</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle>Правила за класификация</CardTitle>
            <CardDescription>
              {rules.length === 0 
                ? 'Нямате създадени правила'
                : `${rules.filter(r => r.company_id === null).length} глобални правила от системата · ${rules.filter(r => r.company_id !== null).length} вашите правила · ${rules.filter(r => r.is_active).length} активни`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Създайте първото си правило
                </h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  Правилата автоматизират класификацията на транзакции. Например: 
                  "Ако доставчикът съдържа 'Lukoil', класифицирай като Категория 7"
                </p>
                <Button onClick={openCreateDialog} className="mt-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Създай правило
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Приоритет</TableHead>
                    <TableHead>Име</TableHead>
                    <TableHead>Условие</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead className="text-center">Приложения</TableHead>
                    <TableHead className="text-center">Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Badge variant={rule.priority > 5 ? 'default' : 'secondary'}>
                          {rule.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rule.rule_name}</span>
                          {rule.company_id === null && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Глобално
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-gray-500">
                            {CONDITION_FIELDS.find(f => f.value === rule.condition_field)?.label}
                          </span>
                          {' '}
                          <span className="text-gray-400">
                            {CONDITION_TYPES.find(t => t.value === rule.condition_type)?.label}
                          </span>
                          {' '}
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            "{rule.condition_value}"
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">
                          {SCOPE3_CATEGORIES.find(c => c.id === rule.output_scope3_category)?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {rule.applications_count ? (
                          <Badge variant="outline">{rule.applications_count}</Badge>
                        ) : (
                          <span className="text-xs text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {rule.company_id === null ? (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Система
                          </Badge>
                        ) : (
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleRuleActive(rule)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {rule.company_id === null ? (
                          <span className="text-xs text-gray-400">Глобално правило</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(rule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRuleToDelete(rule);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Редактирай правило' : 'Създай ново правило'}
              </DialogTitle>
              <DialogDescription>
                Дефинирайте условие и категория за автоматична класификация
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Rule Name */}
              <div className="space-y-2">
                <Label>Име на правило *</Label>
                <Input
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="напр. Lukoil → Категория 7"
                />
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Приоритет (по-високи числа = по-висок приоритет)</Label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500">
                  При съвпадение на няколко правила, прилага се това с по-висок приоритет
                </p>
              </div>

              {/* Condition */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Условие</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Поле</Label>
                    <Select value={conditionField} onValueChange={setConditionField}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Тип</Label>
                    <Select value={conditionType} onValueChange={setConditionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Стойност *</Label>
                    <Input
                      value={conditionValue}
                      onChange={(e) => setConditionValue(e.target.value)}
                      placeholder="напр. Lukoil"
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestRule}
                  disabled={testLoading || !conditionValue}
                  className="mt-3"
                >
                  {testLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Тествай условието
                </Button>
              </div>

              {/* Output */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Резултат</h4>
                <div className="space-y-2">
                  <Label>Категория Обхват 3 *</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {SCOPE3_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setOutputCategory(cat.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          outputCategory === cat.id
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
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
                <Label htmlFor="active" className="cursor-pointer">
                  Активирай правилото веднага
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Откажи
              </Button>
              <Button onClick={handleSaveRule} disabled={!ruleName || !conditionValue || !outputCategory}>
                {editingRule ? 'Актуализирай' : 'Създай правило'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Test Results Dialog */}
        <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Резултати от теста</DialogTitle>
              <DialogDescription>
                Преглед на съвпадащи транзакции
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {testMatchesCount > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Намерени {testMatchesCount} съвпадения
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Доставчик</TableHead>
                          <TableHead>Описание</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testMatches.map((match, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{match.supplier}</TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {match.description || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {testMatchesCount > 10 && (
                    <p className="text-xs text-gray-500">
                      Показани първите 10 от {testMatchesCount} съвпадения
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-gray-600">
                    Няма съвпадащи транзакции
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setTestDialogOpen(false)}>
                Затвори
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Изтриване на правило</DialogTitle>
              <DialogDescription>
                Сигурни ли сте, че искате да изтриете "{ruleToDelete?.rule_name}"?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Откажи
              </Button>
              <Button variant="destructive" onClick={handleDeleteRule}>
                Изтрий
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
