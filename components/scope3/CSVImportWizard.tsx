'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { bg } from '@/lib/i18n/bg';

interface CSVColumn {
  name: string;
  sample: any;
}

interface ColumnMapping {
  txn_date?: string;
  supplier?: string;
  description?: string;
  amount?: string;
  currency?: string;
  expense_category?: string;
  account_code?: string;
  invoice_number?: string;
  vat_amount?: string;
  cost_center?: string;
  department?: string;
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export default function CSVImportWizard() {
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<any[]>([]);
  const [columns, setColumns] = useState<CSVColumn[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Моля, изберете CSV файл');
      return;
    }

    setFile(selectedFile);

    // Parse CSV
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(selectedFile);
  };

  // Simple CSV parser
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      toast.error('CSV файлът трябва да съдържа поне заглавен ред и един ред с данни');
      return;
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    // Parse rows
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    // Extract columns with samples
    const cols: CSVColumn[] = headers.map(header => ({
      name: header,
      sample: rows[0]?.[header] || '',
    }));

    setColumns(cols);
    setCSVData(rows);
    setStep('mapping');
    toast.success(`Зареден файл с ${rows.length} реда`);
  };

  // Auto-detect column mappings
  const autoDetectMapping = () => {
    const detected: ColumnMapping = {};

    columns.forEach(col => {
      const lower = col.name.toLowerCase();
      
      if (lower.includes('дата') || lower.includes('date')) {
        detected.txn_date = col.name;
      } else if (lower.includes('доставчик') || lower.includes('supplier') || lower.includes('vendor')) {
        detected.supplier = col.name;
      } else if (lower.includes('описание') || lower.includes('description')) {
        detected.description = col.name;
      } else if (lower.includes('сума') || lower.includes('amount') || lower.includes('total')) {
        detected.amount = col.name;
      } else if (lower.includes('валута') || lower.includes('currency')) {
        detected.currency = col.name;
      } else if (lower.includes('категория') || lower.includes('category')) {
        detected.expense_category = col.name;
      } else if (lower.includes('сметка') || lower.includes('account')) {
        detected.account_code = col.name;
      } else if (lower.includes('фактура') || lower.includes('invoice')) {
        detected.invoice_number = col.name;
      } else if (lower.includes('ддс') || lower.includes('vat')) {
        detected.vat_amount = col.name;
      }
    });

    setMapping(detected);
    toast.success('Автоматично откриване завършено');
  };

  // Handle mapping change
  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  // Validate and preview
  const handlePreview = () => {
    // Check required fields
    if (!mapping.txn_date || !mapping.supplier || !mapping.amount || !mapping.currency) {
      toast.error('Моля, попълнете всички задължителни полета');
      return;
    }

    // Transform data
    const errors: any[] = [];
    const transformed = csvData.map((row, index) => {
      const txnDate = mapping.txn_date ? row[mapping.txn_date] : '';
      const supplier = mapping.supplier ? row[mapping.supplier] : '';
      const amountStr = mapping.amount ? row[mapping.amount] : '';
      const currency = mapping.currency ? row[mapping.currency] : '';

      // Validate
      const rowErrors: string[] = [];
      if (!txnDate) rowErrors.push('Липсва дата');
      if (!supplier) rowErrors.push('Липсва доставчик');
      if (!amountStr) rowErrors.push('Липсва сума');
      if (!currency) rowErrors.push('Липсва валута');

      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) rowErrors.push('Невалидна сума');

      if (rowErrors.length > 0) {
        errors.push({ row: index + 1, errors: rowErrors });
        return null;
      }

      return {
        txn_date: txnDate,
        supplier,
        description: mapping.description ? row[mapping.description] : '',
        amount,
        currency,
        expense_category: mapping.expense_category ? row[mapping.expense_category] : '',
        account_code: mapping.account_code ? row[mapping.account_code] : '',
        invoice_number: mapping.invoice_number ? row[mapping.invoice_number] : '',
        vat_amount: mapping.vat_amount ? parseFloat(row[mapping.vat_amount]) : undefined,
        cost_center: mapping.cost_center ? row[mapping.cost_center] : '',
        department: mapping.department ? row[mapping.department] : '',
      };
    }).filter(Boolean);

    setPreviewData(transformed as any[]);
    setValidationErrors(errors);
    setStep('preview');
  };

  // Execute import
  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('Няма валидни данни за импорт');
      return;
    }

    setStep('importing');

    try {
      const response = await fetch('/api/scope3/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file?.name || 'transactions.csv',
          transactions: previewData,
          file_hash: null, // Could add file hash for deduplication
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Грешка при импорт');
      }

      setImportResult(result);
      setStep('complete');
      toast.success(`Успешно импортирани ${result.successful} транзакции`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Грешка при импорт');
      setStep('preview');
    }
  };

  // Reset wizard
  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setCSVData([]);
    setColumns([]);
    setMapping({});
    setPreviewData([]);
    setValidationErrors([]);
    setImportResult(null);
  };

  // Render based on step
  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        <StepIndicator active={step === 'upload'} completed={['mapping', 'preview', 'importing', 'complete'].includes(step)} label="1. Качване" />
        <div className="h-px w-12 bg-border" />
        <StepIndicator active={step === 'mapping'} completed={['preview', 'importing', 'complete'].includes(step)} label="2. Свързване" />
        <div className="h-px w-12 bg-border" />
        <StepIndicator active={step === 'preview'} completed={['importing', 'complete'].includes(step)} label="3. Преглед" />
        <div className="h-px w-12 bg-border" />
        <StepIndicator active={step === 'importing' || step === 'complete'} completed={step === 'complete'} label="4. Импорт" />
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>{bg.scope3.uploadCSV}</CardTitle>
            <CardDescription>{bg.scope3.uploadDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? 'border-earth-400 bg-earth-50' : 'border-border'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="mb-2 text-sm font-medium">{bg.scope3.dropZone}</p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" className="mt-2" asChild>
                  <span>Избери файл</span>
                </Button>
              </label>
              {file && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{file.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mapping */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>{bg.scope3.mappingTitle}</CardTitle>
            <CardDescription>{bg.scope3.mappingDescription}</CardDescription>
            <Button variant="outline" size="sm" onClick={autoDetectMapping} className="w-fit">
              Автоматично откриване
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Required Fields */}
            <div>
              <h3 className="font-semibold mb-3">{bg.scope3.requiredFields}</h3>
              <div className="grid grid-cols-2 gap-4">
                <MappingField
                  label={bg.scope3.columns.txnDate + ' *'}
                  value={mapping.txn_date}
                  onChange={(v) => handleMappingChange('txn_date', v)}
                  columns={columns}
                />
                <MappingField
                  label={bg.scope3.columns.supplier + ' *'}
                  value={mapping.supplier}
                  onChange={(v) => handleMappingChange('supplier', v)}
                  columns={columns}
                />
                <MappingField
                  label={bg.scope3.columns.amount + ' *'}
                  value={mapping.amount}
                  onChange={(v) => handleMappingChange('amount', v)}
                  columns={columns}
                />
                <MappingField
                  label={bg.scope3.columns.currency + ' *'}
                  value={mapping.currency}
                  onChange={(v) => handleMappingChange('currency', v)}
                  columns={columns}
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div>
              <h3 className="font-semibold mb-3">{bg.scope3.optionalFields}</h3>
              <div className="grid grid-cols-2 gap-4">
                <MappingField
                  label={bg.scope3.columns.description}
                  value={mapping.description}
                  onChange={(v) => handleMappingChange('description', v)}
                  columns={columns}
                />
                <MappingField
                  label={bg.scope3.columns.expenseCategory}
                  value={mapping.expense_category}
                  onChange={(v) => handleMappingChange('expense_category', v)}
                  columns={columns}
                />
                <MappingField
                  label={bg.scope3.columns.invoiceNumber}
                  value={mapping.invoice_number}
                  onChange={(v) => handleMappingChange('invoice_number', v)}
                  columns={columns}
                />
                <MappingField
                  label={bg.scope3.columns.accountCode}
                  value={mapping.account_code}
                  onChange={(v) => handleMappingChange('account_code', v)}
                  columns={columns}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                {bg.general.cancel}
              </Button>
              <Button onClick={handlePreview}>{bg.general.next}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>{bg.scope3.preview}</CardTitle>
            <CardDescription>{bg.scope3.previewDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>{bg.scope3.validRows}: {previewData.length}</span>
              </div>
              {validationErrors.length > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span>{bg.scope3.invalidRows}: {validationErrors.length}</span>
                </div>
              )}
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Доставчик</TableHead>
                    <TableHead>Сума</TableHead>
                    <TableHead>Валута</TableHead>
                    <TableHead>Описание</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.txn_date}</TableCell>
                      <TableCell>{row.supplier}</TableCell>
                      <TableCell>{row.amount}</TableCell>
                      <TableCell>{row.currency}</TableCell>
                      <TableCell className="max-w-xs truncate">{row.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {previewData.length > 10 && (
              <p className="text-sm text-muted-foreground">
                Показани са първите 10 реда. Всички {previewData.length} реда ще бъдат импортирани.
              </p>
            )}

            {/* Errors */}
            {validationErrors.length > 0 && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Грешки във валидацията:</h4>
                <div className="space-y-1 text-sm text-red-800">
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <div key={index}>
                      Ред {error.row}: {error.errors.join(', ')}
                    </div>
                  ))}
                  {validationErrors.length > 5 && (
                    <div>... и още {validationErrors.length - 5} грешки</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                {bg.general.back}
              </Button>
              <Button onClick={handleImport} disabled={previewData.length === 0}>
                {bg.scope3.startImport}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Importing */}
      {step === 'importing' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-earth-400" />
            <p className="text-lg font-medium">Импортиране на транзакции...</p>
            <p className="text-sm text-muted-foreground mt-2">Моля, изчакайте</p>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Complete */}
      {step === 'complete' && importResult && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
            <h2 className="text-2xl font-bold">{bg.scope3.importSuccess}</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-3xl font-bold text-green-700">{importResult.successful}</p>
                <p className="text-sm text-green-600">Успешни</p>
              </div>
              {importResult.failed > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-red-700">{importResult.failed}</p>
                  <p className="text-sm text-red-600">Неуспешни</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => window.location.href = `/scope3/transactions?batch_id=${importResult.batch_id}`}
                className="bg-earth-400 hover:bg-earth-500"
              >
                Виж транзакциите
              </Button>
              <Button onClick={handleReset} variant="outline">
                Импортирай още
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for step indicator
function StepIndicator({ active, completed, label }: { active: boolean; completed: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          completed
            ? 'bg-green-600 text-white'
            : active
            ? 'bg-earth-400 text-white'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        {completed ? <CheckCircle className="w-5 h-5" /> : label.charAt(0)}
      </div>
      <span className={`text-xs ${active || completed ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );
}

// Helper component for mapping field
function MappingField({
  label,
  value,
  onChange,
  columns,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  columns: CSVColumn[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select 
        value={value || '__none__'} 
        onValueChange={(v) => onChange(v === '__none__' ? '' : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Избери колона" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">-- Без --</SelectItem>
          {columns.map((col) => (
            <SelectItem key={col.name} value={col.name}>
              {col.name} <span className="text-xs text-muted-foreground">(напр. {col.sample})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
