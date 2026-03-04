'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/emissions/template');
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ZED-Emisii-Shablon.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Шаблонът е изтеглен успешно');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Грешка при изтегляне на шаблона');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setErrors([]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Моля, изберете файл');
      return;
    }

    setIsUploading(true);
    setImportResult(null);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/emissions/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
          toast.error(`Намерени са ${data.errors.length} грешки във файла`);
        } else {
          throw new Error(data.error || 'Import failed');
        }
        return;
      }

      setImportResult(data);
      toast.success(data.message);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      console.error('Error importing:', error);
      toast.error(error.message || 'Възникна грешка при импортиране');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-earth-400 mb-2">
            Импорт на данни от Excel/CSV
          </h1>
          <p className="text-gray-600">
            Импортирайте множество записи едновременно чрез Excel или CSV файл
          </p>
        </div>

        {/* Step 1: Download Template */}
        <Card className="border-earth-200 bg-gradient-to-br from-earth-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-earth-300 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <CardTitle>Изтеглете шаблона</CardTitle>
                <CardDescription>
                  Започнете с нашия предварително форматиран Excel шаблон
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleDownloadTemplate}
              className="bg-earth-300 hover:bg-earth-400 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Изтегли Excel шаблон
            </Button>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">Шаблонът съдържа:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Лист "Инструкции" с подробни указания на български</li>
                <li>• Лист "Данни" с примерни записи за всяка категория</li>
                <li>• Правилни формати на колоните и валидации</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Fill Template */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-earth-300 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <CardTitle>Попълнете данните</CardTitle>
                <CardDescription>
                  Добавете вашите данни за емисии в листа "Данни"
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Задължителни колони:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Месец (ГГГГ-ММ)</li>
                  <li>• Обхват (1 или 2)</li>
                  <li>• Категория</li>
                  <li>• Количество</li>
                  <li>• Единица</li>
                </ul>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Важно:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Изтрийте примерните редове</li>
                  <li>• Не променяйте имената на колоните</li>
                  <li>• Максимален размер: 5MB</li>
                  <li>• Форматстепени: .xlsx, .xls, .csv</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Upload File */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-earth-300 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <CardTitle>Качете файла</CardTitle>
                <CardDescription>
                  Изберете попълнения Excel или CSV файл
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-earth-300 transition-colors">
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file-input"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <FileSpreadsheet className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Кликнете за избор на файл
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    или го плъзнете тук (Excel или CSV, макс 5MB)
                  </p>
                </div>
              </label>
            </div>

            {file && (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">{file.name}</p>
                    <p className="text-xs text-green-700">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={isUploading}
                  className="bg-earth-300 hover:bg-earth-400 text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Импортиране...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Импортирай
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Result */}
        {importResult && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Успешен импорт!
                  </h3>
                  <div className="space-y-1 text-sm text-green-800">
                    <p>• Импортирани записи: <strong>{importResult.imported}</strong></p>
                    <p>• Общо емисии: <strong>{importResult.totalCO2e} tCO2e</strong></p>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Link href="/data-entry/list">
                      <Button variant="outline" size="sm">
                        Виж импортираните данни
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="outline" size="sm">
                        Виж таблото
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Validation Errors */}
        {errors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <CardTitle className="text-red-900">
                    Намерени са грешки във файла
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    Моля, коригирайте следните грешки и опитайте отново
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-red-100 sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3 text-red-900 font-semibold">Ред</th>
                      <th className="text-left py-2 px-3 text-red-900 font-semibold">Поле</th>
                      <th className="text-left py-2 px-3 text-red-900 font-semibold">Грешка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map((error, index) => (
                      <tr key={index} className="border-b border-red-200">
                        <td className="py-2 px-3 text-red-900">{error.row}</td>
                        <td className="py-2 px-3 text-red-900">{error.field}</td>
                        <td className="py-2 px-3 text-red-800">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Съвети за успешен импорт:</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• Уверете се, че датите са в формат ГГГГ-ММ (например: 2025-01)</li>
                  <li>• Проверете дали категориите съответстват точно на шаблона</li>
                  <li>• Количествата трябва да са положителни числа</li>
                  <li>• Не оставяйте празни задължителни полета</li>
                  <li>• За десетични числа използвайте точка или запетая</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


