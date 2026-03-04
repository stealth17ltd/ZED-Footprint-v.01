import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, HelpCircle, PlusCircle, FileText, Upload, BarChart,
  ExternalLink, Target, GitCompareArrows, Leaf, Tag, Zap,
  Receipt, Shield, Award, FileCheck, TrendingDown, Database,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

// ── Quick-action card ──────────────────────────────────────────────────────
function QuickLink({
  href, icon: Icon, label, sub, color,
}: {
  href: string; icon: any; label: string; sub?: string; color: string;
}) {
  return (
    <Link href={href}>
      <Card className={`hover:shadow-md transition-all cursor-pointer border-2 hover:border-opacity-80 ${color} h-full`}>
        <CardContent className="pt-5 pb-4 text-center">
          <Icon className="h-8 w-8 mx-auto mb-2 opacity-80" />
          <p className="font-semibold text-sm">{label}</p>
          {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

// ── Section heading ────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 ${color}`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-earth-100 flex items-center justify-center">
            <HelpCircle className="h-6 w-6 text-earth-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-earth-400">Помощ и ресурси</h1>
            <p className="text-gray-500">Пълно ръководство за всички функции на ZED Bulgaria</p>
          </div>
        </div>

        {/* ── Quick links ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Бърз достъп</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <QuickLink href="/dashboard"         icon={BarChart}         label="Табло"         color="border-earth-200 text-earth-600"  />
            <QuickLink href="/data-entry"        icon={PlusCircle}       label="Данни 1&2"     color="border-green-200 text-green-700"  />
            <QuickLink href="/scope3/import"     icon={Upload}           label="Импорт S3"     color="border-blue-200 text-blue-700"    />
            <QuickLink href="/scope3/classify"   icon={Tag}              label="Класиф."       color="border-blue-200 text-blue-700"    />
            <QuickLink href="/reports"           icon={FileText}         label="Отчети"        color="border-purple-200 text-purple-700" />
            <QuickLink href="/targets"           icon={Target}           label="Цели"          color="border-amber-200 text-amber-700"  />
            <QuickLink href="/comparison"        icon={GitCompareArrows} label="Сравнение"     color="border-pink-200 text-pink-700"    />
            <QuickLink href="/scope3/dashboard"  icon={Leaf}             label="Табло S3"      color="border-teal-200 text-teal-700"    />
          </div>
        </div>

        {/* ── FAQ ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-earth-400" />
              Ръководство по функции
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full space-y-1">

              {/* ═══ BASICS ═══ */}
              <AccordionItem value="basics-1">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Какво е въглероден отпечатък и tCO2e?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <p>
                    Въглеродният отпечатък е общото количество парникови газове, изразени в
                    <strong> тонове CO2 еквивалент (tCO2e)</strong>. Различните газове (CH₄, N₂O, HFC)
                    се умножават по техния GWP, за да могат да се сравняват с CO2.
                  </p>
                  <p>Пример: 1 кг хладилен агент R-134a = 1 430 кг CO2e (GWP = 1430).</p>
                  <p>
                    <strong>Формула:</strong>{' '}
                    <code className="bg-gray-100 px-1 rounded text-xs">
                      tCO2e = Количество × Емисионен фактор × GWP
                    </code>
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="basics-2">
                <AccordionTrigger className="text-left">
                  <span className="font-semibold">Обхват 1 — Директни емисии</span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <p>Емисии от източници, <strong>притежавани или контролирани</strong> от вашата организация:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Превозни средства:</strong> дизел, бензин, ГПГ за служебни автомобили</li>
                    <li><strong>Гориво на място:</strong> природен газ за отопление, генератори</li>
                    <li><strong>Хладилни агенти:</strong> течове от климатизация (R-134a, R-404A)</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-1">
                    Данни: фактури от бензиностанции, fleet management системи, сервизни книжки.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="basics-3">
                <AccordionTrigger className="text-left">
                  <span className="font-semibold">Обхват 2 — Закупена енергия</span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <p>Индиректни емисии от <strong>закупена електрическа или топлинна енергия</strong>:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Електроенергия:</strong> от EVN, ЧЕЗ или друг доставчик (kWh)</li>
                    <li><strong>Топлоенергия:</strong> Топлофикация (GJ или MWh)</li>
                    <li><strong>Хладилна енергия:</strong> централно охлаждане</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-1">
                    Данни: месечни фактури за ток и топлинна енергия.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="basics-4">
                <AccordionTrigger className="text-left">
                  <span className="font-semibold">Обхват 3 — Верига на стойността (финансови транзакции)</span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <Badge className="mb-2 bg-blue-100 text-blue-700">Нова функция</Badge>
                  <p>
                    Обхват 3 обхваща всички <strong>индиректни емисии по веригата на стойността</strong> —
                    стоки, услуги, транспорт, командировки, отпадъци и др.
                    За МСП системата изчислява Обхват 3 <em>директно от финансовите транзакции</em> (фактури/разходи).
                  </p>
                  <p><strong>5-те основни категории в ZED:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Категория 1 — Закупени стоки и услуги</li>
                    <li>Категория 4 — Транспорт нагоре по веригата</li>
                    <li>Категория 5 — Отпадъци при производство</li>
                    <li>Категория 6 — Командировки</li>
                    <li>Категория 7 — Пътувания на служители</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-1">
                    Методология: Spend-based (ниво C) по GHG Protocol.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* ═══ SCOPE 3 WORKFLOW ═══ */}
              <AccordionItem value="s3-import">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="font-semibold">Как да импортирам Обхват 3 транзакции (CSV)?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <Badge className="mb-2 bg-blue-100 text-blue-700">Нова функция</Badge>
                  <p>Навигирайте до <strong>Данни → Импорт транзакции</strong>.</p>
                  <p><strong>CSV файлът трябва да съдържа (минимум):</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><code>transaction_date</code> — дата на транзакцията</li>
                    <li><code>supplier_name</code> — доставчик/контрагент</li>
                    <li><code>amount</code> — сума</li>
                    <li><code>currency</code> — валута (EUR, BGN, USD …)</li>
                    <li><code>description</code> — описание (помага за авто-класификация)</li>
                  </ul>
                  <p className="text-sm">
                    <strong>Стъпки:</strong> Качете CSV → Свържете колоните → Преглед → Импортирайте.
                    Системата автоматично класифицира транзакциите по категории.
                  </p>
                  <Link href="/scope3/import" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1">
                    Отиди на импорт <ChevronRight className="h-3 w-3" />
                  </Link>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="s3-classify">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="font-semibold">Авто-класификация и правила</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <Badge className="mb-2 bg-blue-100 text-blue-700">Нова функция</Badge>
                  <p>
                    Системата автоматично класифицира всяка транзакция при импорт.
                    Правилата проверяват <em>описание на транзакцията, доставчик, тип разход</em> и
                    и присвояват Обхват 3 категория и емисионен фактор.
                  </p>
                  <p><strong>Как да преглеждате и коригирате:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><strong>Данни → Класификация:</strong> виждате некласифицираните транзакции, можете да присвоите категория на всяка от тях</li>
                    <li>Отметнете "Приложи за бъдещи" за да създадете правило</li>
                    <li><strong>Данни → Правила:</strong> управлявайте всички правила за вашата компания</li>
                  </ul>
                  <p className="text-sm text-gray-500">
                    Глобалните правила (системни) са само за четене; вашите фирмени правила могат да се редактират.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="s3-calc">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="font-semibold">Изчисляване и табло на Обхват 3</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <Badge className="mb-2 bg-blue-100 text-blue-700">Нова функция</Badge>
                  <p>
                    След класификация отидете на <strong>Данни → Виж транзакции</strong> и натиснете
                    <em> "Изчисли емисии"</em>. Системата прилага spend-based емисионни фактори (EEIO)
                    и записва резултатите.
                  </p>
                  <p>
                    <strong>Табло Обхват 3</strong> показва: общо CO2e, разпределение по категория,
                    месечен тренд и процент класифицирани транзакции.
                  </p>
                  <Link href="/scope3/dashboard" className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline mt-1">
                    Отиди на Табло Обхват 3 <ChevronRight className="h-3 w-3" />
                  </Link>
                </AccordionContent>
              </AccordionItem>

              {/* ═══ DATA ENTRY ═══ */}
              <AccordionItem value="entry-1">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-earth-400 shrink-0" />
                    <span className="font-semibold">Как да въведа Обхват 1 и 2 данни?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <p>Навигирайте до <strong>Данни → Въвеждане на данни</strong>.</p>
                  <ol className="list-decimal list-inside space-y-1 ml-4 text-sm">
                    <li>Изберете обхват (1 или 2) и категория (превозни средства, електричество…)</li>
                    <li>Въведете количеството от фактурата</li>
                    <li>Изберете период (месец/година)</li>
                    <li>Системата изчислява CO2e автоматично</li>
                    <li>Запазете записа</li>
                  </ol>
                  <p className="text-xs text-gray-500 mt-2">
                    Съвет: въвеждайте данни месечно за точна графика и сравнения.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* ═══ REPORTS ═══ */}
              <AccordionItem value="reports-1">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600 shrink-0" />
                    <span className="font-semibold">Какви отчети мога да генерирам?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-3">
                  <div className="grid gap-3">
                    <div className="flex gap-3 p-3 bg-earth-50 rounded-lg">
                      <BarChart className="h-5 w-5 text-earth-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Пълен отчет (Обхват 1+2+3)</p>
                        <p className="text-xs text-gray-600">Консолидиран PDF с емисии по всички обхвати, препоръки за намаляване и траектория. Подходящ за банки, клиенти, одитори.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">CSRD / ESRS E1</p>
                        <p className="text-xs text-gray-600">Официален отчет по ESRS E1 стандарт за климата. Включва управление, стратегия, GHG данни, цели и методология. За регулаторно подаване.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-purple-50 rounded-lg">
                      <FileCheck className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Регулаторен отчет</p>
                        <p className="text-xs text-gray-600">Преглед на съответствие с 8 регулации (ЗООС, EU ETS, CSRD, EU Taxonomy, GHG Protocol, SBTi, ISO 14064). Включва оценка и план за действие.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-amber-50 rounded-lg">
                      <Award className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Сертификат за устойчивост</p>
                        <p className="text-xs text-gray-600">Представителен сертификат с ключови показатели за споделяне с клиенти и партньори. С уникален номер и официален дизайн.</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-purple-600 hover:underline">
                    Генерирай отчет <ChevronRight className="h-3 w-3" />
                  </Link>
                </AccordionContent>
              </AccordionItem>

              {/* ═══ TARGETS ═══ */}
              <AccordionItem value="targets-1">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-semibold">Цели и прогнози — как работят?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <Badge className="mb-2 bg-amber-100 text-amber-700">Нова функция</Badge>
                  <p>
                    В раздел <strong>Цели</strong> можете да зададете количествени цели за намаляване
                    на емисиите (абсолютни или процентни) за Обхват 1, 2 и 3.
                  </p>
                  <p><strong>Функции:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><strong>Прогнозна графика</strong> — показва необходимия путь, реалните данни и тренд прогнозата</li>
                    <li><strong>SBTi badge</strong> — автоматично при цел ≥ 4.2% намаление/год</li>
                    <li><strong>Синхронизирай</strong> — обновява текущите стойности от последните данни</li>
                    <li><strong>Предупреждения</strong> — известие при изоставане от графика</li>
                  </ul>
                  <p className="text-sm text-gray-500">
                    Science Based Targets Initiative (SBTi) препоръчва ≥ 4.2%/год за Обхват 1+2 (1.5°C пътека).
                  </p>
                  <Link href="/targets" className="inline-flex items-center gap-1 text-sm text-amber-600 hover:underline mt-1">
                    Управлявай цели <ChevronRight className="h-3 w-3" />
                  </Link>
                </AccordionContent>
              </AccordionItem>

              {/* ═══ COMPARISON ═══ */}
              <AccordionItem value="comparison-1">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-2">
                    <GitCompareArrows className="h-4 w-4 text-pink-500 shrink-0" />
                    <span className="font-semibold">Как да сравня две години?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <Badge className="mb-2 bg-pink-100 text-pink-700">Нова функция</Badge>
                  <p>
                    Страница <strong>Сравнение</strong> позволява сравнение на два отчетни периода (години).
                  </p>
                  <p><strong>Показва:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Общ делта на емисиите с % промяна по обхват</li>
                    <li>Наредена стека диаграма Обхват 1/2/3 за двете години</li>
                    <li>Месечна наслагваща линейна графика</li>
                    <li>Промяна по Обхват 3 категории (зелено = подобрение)</li>
                    <li>Автоматична оценка спрямо SBTi 4.2%/год критерий</li>
                  </ul>
                  <Link href="/comparison" className="inline-flex items-center gap-1 text-sm text-pink-600 hover:underline mt-1">
                    Отиди на Сравнение <ChevronRight className="h-3 w-3" />
                  </Link>
                </AccordionContent>
              </AccordionItem>

              {/* ═══ STANDARDS ═══ */}
              <AccordionItem value="std-csrd">
                <AccordionTrigger className="text-left">
                  <span className="font-semibold">Какво е CSRD и ESRS E1?</span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <p>
                    <strong>CSRD</strong> (Corporate Sustainability Reporting Directive) е европейска директива,
                    задължаваща компаниите да отчитат въздействието си върху климата.
                    Прилага се поетапно от 2024 г.
                  </p>
                  <p>
                    <strong>ESRS E1</strong> е стандартът за климатично отчитане в рамките на CSRD —
                    изисква отчитане на Обхват 1, 2 и 3 емисии, цели за намаляване и управленски процеси.
                  </p>
                  <p className="text-sm text-gray-500">
                    ZED генерира CSRD-съвместим PDF отчет по ESRS E1, готов за регулаторно подаване.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="std-sbti">
                <AccordionTrigger className="text-left">
                  <span className="font-semibold">Какво е SBTi и как системата го поддържа?</span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <p>
                    <strong>SBTi</strong> (Science Based Targets initiative) е рамка за определяне на
                    цели за намаляване на емисии, съвместими с ограничаването на глобалното затопляне до 1.5°C.
                  </p>
                  <p><strong>Критерии за SBTi съвместимост:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Обхват 1+2: ≥ 4.2% намаление годишно</li>
                    <li>Обхват 3: ≥ 2.5% намаление годишно (ако е значим)</li>
                  </ul>
                  <p className="text-sm text-gray-600">
                    В раздел Цели, целите с <strong>SBTi badge</strong> отговарят на тези критерии.
                    Страница Сравнение показва дали постигнатото намаление надхвърля SBTi прага.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="std-ghg">
                <AccordionTrigger className="text-left">
                  <span className="font-semibold">Методология — GHG Protocol и емисионни фактори</span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 space-y-2">
                  <p>ZED използва <strong>GHG Protocol Corporate Standard</strong> като базова методология.</p>
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                    tCO2e = Количество × Емисионен фактор × GWP
                  </div>
                  <p><strong>Примерни фактори:</strong></p>
                  <ul className="list-disc list-inside space-y-0.5 ml-4 text-sm">
                    <li>Дизел: 2.68 kg CO2e/л</li>
                    <li>Бензин: 2.31 kg CO2e/л</li>
                    <li>Природен газ: 2.02 kg CO2e/m³</li>
                    <li>Електричество (БГ): 0.505 kg CO2e/kWh</li>
                  </ul>
                  <p className="text-sm text-gray-500">
                    За Обхват 3 се използват EEIO spend-based фактори (kg CO2e / EUR разход).
                  </p>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </CardContent>
        </Card>

        {/* ── External resources ── */}
        <Card className="border-earth-200 bg-earth-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-earth-400">
              <ExternalLink className="h-5 w-5" />
              Полезни ресурси
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-semibold text-earth-500 mb-2">Българско законодателство</p>
                <ul className="space-y-2">
                  <ExLink href="https://lex.bg/laws/ldoc/2135458102" label="Закон за опазване на околната среда" />
                  <ExLink href="https://www.moew.government.bg/" label="Министерство на околната среда" />
                </ul>
              </div>
              <div>
                <p className="font-semibold text-earth-500 mb-2">Европейски регулации</p>
                <ul className="space-y-2">
                  <ExLink href="https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en" label="CSRD Directive" />
                  <ExLink href="https://finance.ec.europa.eu/sustainable-finance/tools-and-standards/eu-taxonomy-sustainable-activities_en" label="EU Taxonomy" />
                  <ExLink href="https://commission.europa.eu/strategy-and-policy/priorities-2019-2024/european-green-deal_en" label="European Green Deal" />
                </ul>
              </div>
              <div>
                <p className="font-semibold text-earth-500 mb-2">Международни стандарти</p>
                <ul className="space-y-2">
                  <ExLink href="https://ghgprotocol.org/" label="GHG Protocol" />
                  <ExLink href="https://sciencebasedtargets.org/" label="Science Based Targets (SBTi)" />
                  <ExLink href="https://www.iso.org/standard/66453.html" label="ISO 14064" />
                  <ExLink href="https://www.cdp.net/" label="CDP — Carbon Disclosure Project" />
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Contact ── */}
        <Card>
          <CardContent className="py-6 text-center">
            <HelpCircle className="h-10 w-10 text-earth-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Нуждаете се от помощ?</h3>
            <p className="text-gray-500 text-sm mb-4">Нашият екип е тук за всякакви въпроси</p>
            <a
              href="mailto:support@zedbulgaria.com"
              className="inline-flex items-center gap-2 bg-earth-300 hover:bg-earth-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Свържете се с нас
            </a>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function ExLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-earth-400 hover:text-earth-500 hover:underline flex items-center gap-1"
      >
        {label} <ExternalLink className="h-3 w-3 shrink-0" />
      </a>
    </li>
  );
}
