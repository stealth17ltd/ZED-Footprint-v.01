import { Metadata } from 'next';
import CSVImportWizard from '@/components/scope3/CSVImportWizard';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { bg } from '@/lib/i18n/bg';

export const metadata: Metadata = {
  title: 'Импорт на транзакции - Обхват 3',
  description: 'Импортирайте финансови транзакции за изчисляване на Обхват 3 емисии',
};

export default function Scope3ImportPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
            <Upload className="h-6 w-6 text-earth-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {bg.scope3.importTitle}
            </h1>
            <p className="text-sm text-gray-500">
              Качете CSV файл с финансови транзакции за изчисляване на Обхват 3 емисии
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-earth-50 border-earth-200">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-earth-200 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-earth-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-earth-900 mb-2">Какво се изисква?</CardTitle>
                <CardDescription className="text-earth-800 space-y-3">
                  <p className="font-medium">CSV файлът трябва да съдържа следните задължителни колони:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div className="flex items-start gap-2 bg-white rounded-lg p-3">
                      <span className="text-earth-600 font-bold">•</span>
                      <div>
                        <span className="font-semibold text-earth-900">Дата на транзакция</span>
                        <p className="text-xs text-gray-600">Дата на фактурата/разхода</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-white rounded-lg p-3">
                      <span className="text-earth-600 font-bold">•</span>
                      <div>
                        <span className="font-semibold text-earth-900">Доставчик</span>
                        <p className="text-xs text-gray-600">Име на доставчик/контрагент</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-white rounded-lg p-3">
                      <span className="text-earth-600 font-bold">•</span>
                      <div>
                        <span className="font-semibold text-earth-900">Сума</span>
                        <p className="text-xs text-gray-600">Стойност в числов формат</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-white rounded-lg p-3">
                      <span className="text-earth-600 font-bold">•</span>
                      <div>
                        <span className="font-semibold text-earth-900">Валута</span>
                        <p className="text-xs text-gray-600">EUR, USD, GBP и др.</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm mt-3 bg-white rounded-lg p-3">
                    💡 <strong>Съвет:</strong> Допълнителни полета като описание, категория, номер на фактура помагат за по-точна класификация.
                  </p>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Wizard */}
        <CSVImportWizard />

        {/* Help Section */}
        <Card className="border-gray-200">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg">Често задавани въпроси</CardTitle>
          </CardHeader>
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-earth-100 flex items-center justify-center flex-shrink-0 mt-1">
                <FileText className="h-4 w-4 text-earth-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Откъде да взема CSV файл?</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Можете да експортирате транзакции от вашата счетоводна система (БИКА, Microinvest, SAP и др.) 
                  или банкова система. Повечето системи поддържат CSV експорт в менюто "Отчети" или "Експорт".
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-earth-100 flex items-center justify-center flex-shrink-0 mt-1">
                <FileText className="h-4 w-4 text-earth-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Какъв формат трябва да има CSV-то?</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Стандартен CSV с колони разделени със запетая. Първият ред трябва да съдържа имената на колоните.
                  Кодирането трябва да е UTF-8 за коректно показване на български текст.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                <AlertCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Безопасни ли са моите данни?</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Да. Всички данни са криптирани и достъпни само за вашата компания. 
                  Row Level Security (RLS) гарантира, че никой друг потребител не може да види вашите транзакции.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Upload className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Какво става след импорт?</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  След импорт трябва да класифицирате транзакциите по категории на Обхват 3. 
                  Системата ще предложи автоматична класификация въз основа на име на доставчик и правила.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
