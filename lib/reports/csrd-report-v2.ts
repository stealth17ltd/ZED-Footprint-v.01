import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

interface CSRDReportData {
  company: any;
  emissionsData: any[];
  targets: any[];
  reportingYear: number;
  reportingPeriod: { start: string; end: string };
  totalEmissions: {
    scope1: number;
    scope2: number;
    total: number;
  };
  categoryBreakdown: { [key: string]: number };
  comparisonData?: {
    previousYear: number;
    change: number;
    changePercent: number;
  };
}

const COLORS = {
  primary: rgb(0.17, 0.33, 0.09),
  secondary: rgb(0.3, 0.5, 0.2),
  text: rgb(0.2, 0.2, 0.2),
  lightGray: rgb(0.95, 0.95, 0.95),
  mediumGray: rgb(0.7, 0.7, 0.7),
  darkGray: rgb(0.4, 0.4, 0.4),
  tableHeader: rgb(0.9, 0.95, 0.9),
  success: rgb(0.2, 0.6, 0.2),
  warning: rgb(0.8, 0.4, 0.2),
};

export async function generateCSRDReport(data: CSRDReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load font
  const fontResponse = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf');
  const fontBytes = await fontResponse.arrayBuffer();
  const font = await pdfDoc.embedFont(fontBytes);

  // Load ESG logo
  let logoImage;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'esg-logo.png');
    const logoBytes = fs.readFileSync(logoPath);
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (error) {
    console.log('Logo not found, continuing without it');
  }

  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const MARGIN = 40;
  const FOOTER_HEIGHT = 30; // Space for footer
  const BOTTOM_MARGIN = 80; // Extra space before footer (40 margin + 30 footer + 10 buffer)
  const LINE_HEIGHT = 16;
  
  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let y = A4_HEIGHT - MARGIN;
  let pageNumber = 1;

  const addNewPage = () => {
    pageNumber++;
    page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    y = A4_HEIGHT - MARGIN;
  };

  const checkSpace = (needed: number) => {
    if (y - needed < MARGIN + BOTTOM_MARGIN) {
      addNewPage();
      return true;
    }
    return false;
  };

  const text = (content: string, x: number, size: number, color = COLORS.text) => {
    page.drawText(content, { x, y, size, font, color });
    y -= LINE_HEIGHT;
  };

  const spacer = (amount: number) => {
    y -= amount;
  };

  const line = (x1: number, x2: number, thickness = 0.5, color = COLORS.mediumGray) => {
    page.drawLine({
      start: { x: x1, y: y },
      end: { x: x2, y: y },
      thickness,
      color,
    });
    y -= LINE_HEIGHT;
  };

  const rect = (x: number, w: number, h: number, color: any) => {
    page.drawRectangle({
      x,
      y: y - h,
      width: w,
      height: h,
      color,
    });
  };

  // === COVER PAGE ===
  // Logo at top
  if (logoImage) {
    const logoScale = 0.3;
    const logoDims = logoImage.scale(logoScale);
    page.drawImage(logoImage, {
      x: MARGIN,
      y: y - logoDims.height,
      width: logoDims.width,
      height: logoDims.height,
    });
    y -= logoDims.height + 30;
  } else {
    y -= 20;
  }

  // Title
  rect(0, A4_WIDTH, 60, COLORS.primary);
  page.drawText('ОТЧЕТ ЗА КОРПОРАТИВНА УСТОЙЧИВОСТ', {
    x: MARGIN,
    y: y - 40,
    size: 22,
    font,
    color: rgb(1, 1, 1),
  });
  y -= 80;

  // Subtitle
  text('Директива CSRD (Corporate Sustainability Reporting Directive)', MARGIN, 11, COLORS.darkGray);
  spacer(20);

  // Company box
  rect(MARGIN, A4_WIDTH - 2 * MARGIN, 120, COLORS.lightGray);
  y -= 15;
  text(data.company.company_name, MARGIN + 15, 16, COLORS.primary);
  spacer(5);
  text(`ЕИК: ${data.company.registration_number}`, MARGIN + 15, 11, COLORS.darkGray);
  text(`Сектор: ${data.company.industry_sector}`, MARGIN + 15, 11, COLORS.darkGray);
  text(`Служители: ${data.company.employee_count || 'Н/П'}`, MARGIN + 15, 11, COLORS.darkGray);
  spacer(30);

  // Reporting period
  rect(MARGIN, A4_WIDTH - 2 * MARGIN, 70, rgb(0.98, 0.98, 0.98));
  y -= 15;
  text(`Отчетна година: ${data.reportingYear}`, MARGIN + 15, 12, COLORS.primary);
  spacer(5);
  text(`Период: ${data.reportingPeriod.start} до ${data.reportingPeriod.end}`, MARGIN + 15, 10, COLORS.darkGray);
  spacer(30);

  const genDate = new Date().toLocaleDateString('bg-BG');
  text(`Генериран на: ${genDate}`, MARGIN, 9, COLORS.mediumGray);

  // === PAGE 2: SUMMARY ===
  addNewPage();
  
  text('1. ОБОБЩЕНИЕ', MARGIN, 16, COLORS.primary);
  line(MARGIN, A4_WIDTH - MARGIN, 1, COLORS.primary);
  spacer(10);

  // Metrics boxes
  const boxY = y;
  const boxW = (A4_WIDTH - 2 * MARGIN - 40) / 3;
  
  [
    { label: 'Общо', value: data.totalEmissions.total },
    { label: 'Обхват 1', value: data.totalEmissions.scope1 },
    { label: 'Обхват 2', value: data.totalEmissions.scope2 },
  ].forEach((metric, i) => {
    const x = MARGIN + i * (boxW + 20);
    page.drawRectangle({ x, y: boxY - 60, width: boxW, height: 60, color: COLORS.lightGray });
    page.drawText(metric.label, { x: x + 10, y: boxY - 20, size: 10, font, color: COLORS.darkGray });
    page.drawText(`${metric.value.toFixed(2)} tCO2e`, { x: x + 10, y: boxY - 45, size: 13, font, color: COLORS.text });
  });
  
  y -= 80;

  text(`Общите емисии на ${data.company.company_name} за ${data.reportingYear} г. са ${data.totalEmissions.total.toFixed(2)} tCO2e.`, MARGIN, 10);
  spacer(5);
  text(`Обхват 1 (директни): ${((data.totalEmissions.scope1/data.totalEmissions.total)*100).toFixed(1)}%`, MARGIN, 10);
  text(`Обхват 2 (индиректни): ${((data.totalEmissions.scope2/data.totalEmissions.total)*100).toFixed(1)}%`, MARGIN, 10);
  spacer(20);

  if (data.comparisonData) {
    const change = data.comparisonData.change < 0 ? 'намаление' : 'увеличение';
    const changeColor = data.comparisonData.change < 0 ? COLORS.success : COLORS.warning;
    text(`Спрямо предходната година: ${Math.abs(data.comparisonData.changePercent).toFixed(1)}% ${change}`, MARGIN, 11, changeColor);
    spacer(20);
  }

  // === COMPANY INFO ===
  checkSpace(150);
  text('2. ИНФОРМАЦИЯ ЗА ОРГАНИЗАЦИЯТА', MARGIN, 16, COLORS.primary);
  line(MARGIN, A4_WIDTH - MARGIN, 1, COLORS.primary);
  spacer(10);

  [
    ['Наименование', data.company.company_name],
    ['ЕИК/Булстат', data.company.registration_number],
    ['Сектор', data.company.industry_sector],
    ['Служители', data.company.employee_count?.toString() || 'Н/П'],
    ['Локации', data.company.location_count?.toString() || '1'],
  ].forEach(([label, value]) => {
    checkSpace(20);
    page.drawText(`${label}:`, { x: MARGIN, y, size: 10, font, color: COLORS.darkGray });
    page.drawText(value, { x: MARGIN + 150, y, size: 10, font, color: COLORS.text });
    y -= LINE_HEIGHT;
  });
  spacer(20);

  // === BOUNDARIES ===
  checkSpace(100);
  text('3. ГРАНИЦИ И ОБХВАТ НА ОТЧИТАНЕТО', MARGIN, 16, COLORS.primary);
  line(MARGIN, A4_WIDTH - MARGIN, 1, COLORS.primary);
  spacer(10);

  text(`Отчетът обхваща всички дейности и обекти, контролирани от ${data.company.company_name}`, MARGIN, 10);
  text('на територията на България. Включени са:', MARGIN, 10);
  spacer(5);
  text('• Обхват 1: Директни емисии от превозни средства, горива и хладилни агенти', MARGIN + 10, 9);
  text('• Обхват 2: Индиректни емисии от закупена електроенергия и топлоенергия', MARGIN + 10, 9);
  spacer(20);

  // === EMISSIONS TABLE ===
  checkSpace(200);
  text('4. ЕМИСИИ НА ПАРНИКОВИ ГАЗОВЕ', MARGIN, 16, COLORS.primary);
  line(MARGIN, A4_WIDTH - MARGIN, 1, COLORS.primary);
  spacer(15);

  // Simple, clean table
  const tableData = [
    ['Обхват', 'Описание', 'tCO2e'],
    ['Обхват 1', 'Директни емисии', data.totalEmissions.scope1.toFixed(2)],
    ['Обхват 2', 'Индиректни емисии от енергия', data.totalEmissions.scope2.toFixed(2)],
    ['ОБЩО', '', data.totalEmissions.total.toFixed(2)],
  ];

  const colX = [MARGIN, MARGIN + 100, MARGIN + 340];
  
  tableData.forEach((row, i) => {
    checkSpace(25);
    const bgColor = i === 0 ? COLORS.tableHeader : i === 3 ? COLORS.lightGray : rgb(1, 1, 1);
    const txtColor = i === 0 || i === 3 ? COLORS.text : COLORS.darkGray;
    const size = i === 0 || i === 3 ? 10 : 9;
    
    page.drawRectangle({ x: MARGIN, y: y - 18, width: A4_WIDTH - 2 * MARGIN, height: 20, color: bgColor });
    
    row.forEach((cell, j) => {
      page.drawText(cell, { x: colX[j] + 5, y: y - 13, size, font, color: txtColor });
    });
    
    y -= 20;
  });
  spacer(20);

  // === CATEGORIES ===
  checkSpace(200);
  text('5. РАЗПРЕДЕЛЕНИЕ ПО КАТЕГОРИИ', MARGIN, 14, COLORS.primary);
  line(MARGIN, A4_WIDTH - MARGIN, 1, COLORS.primary);
  spacer(10);

  const categoryLabels: Record<string, string> = {
    vehicles_diesel: 'Превозни средства - Дизел',
    vehicles_petrol: 'Превозни средства - Бензин',
    electricity: 'Електроенергия',
    natural_gas: 'Природен газ',
    district_heating: 'Топлоенергия',
  };

  Object.entries(data.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .forEach(([cat, val]) => {
      checkSpace(20);
      const label = categoryLabels[cat] || cat;
      const percent = ((val / data.totalEmissions.total) * 100).toFixed(1);
      page.drawText(`${label}:`, { x: MARGIN, y, size: 9, font, color: COLORS.text });
      page.drawText(`${val.toFixed(2)} tCO2e (${percent}%)`, { x: MARGIN + 280, y, size: 9, font, color: COLORS.darkGray });
      y -= LINE_HEIGHT;
    });
  spacer(20);

  // === METHODOLOGY ===
  checkSpace(200);
  text('6. МЕТОДОЛОГИЯ НА ИЗЧИСЛЕНИЯТА', MARGIN, 14, COLORS.primary);
  line(MARGIN, A4_WIDTH - MARGIN, 1, COLORS.primary);
  spacer(10);

  text('6.1. Стандарти и протоколи', MARGIN, 11, COLORS.secondary);
  spacer(5);
  text('Изчисленията на емисиите следват международния Протокол за парникови газове', MARGIN, 9);
  text('(GHG Protocol), разработен от World Resources Institute и World Business Council', MARGIN, 9);
  text('for Sustainable Development. Отчетът е изготвен в съответствие с изискванията на:', MARGIN, 9);
  spacer(5);
  text('• ISO 14064-1:2018 - Спецификация за измерване на емисии на парникови газове', MARGIN + 10, 9);
  text('• Директива 2003/87/ЕО на ЕС относно схемата за търговия с емисии', MARGIN + 10, 9);
  text('• CSRD (Директива за корпоративно отчитане на устойчивостта)', MARGIN + 10, 9);
  spacer(10);

  text('6.2. Емисионни фактори', MARGIN, 11, COLORS.secondary);
  spacer(5);
  text('Използваните емисионни фактори са актуализирани за 2023 г. и произхождат от:', MARGIN, 9);
  spacer(5);
  text('• DEFRA 2023 - UK Government GHG Conversion Factors', MARGIN + 10, 9);
  text('• Българска агенция по енергетика - национални фактори за електроенергия', MARGIN + 10, 9);
  text('• IPCC Fifth Assessment Report - глобални потенциали за затопляне (GWP)', MARGIN + 10, 9);
  spacer(10);

  text('6.3. Събиране и валидация на данни', MARGIN, 11, COLORS.secondary);
  spacer(5);
  text('Данните за дейностите са събрани от първични източници:', MARGIN, 9);
  spacer(5);
  text('• Фактури от доставчици на енергия и горива', MARGIN + 10, 9);
  text('• Километраж и разход на гориво от превозни средства', MARGIN + 10, 9);
  text('• Записи от измервателни уреди и счетоводни системи', MARGIN + 10, 9);
  text('• Документация за употреба на хладилни агенти', MARGIN + 10, 9);
  spacer(5);
  text('Всички данни са проверени за точност, пълнота и последователност. Значителни', MARGIN, 9);
  text('отклонения са документирани и обяснени с придружаващи бележки.', MARGIN, 9);
  spacer(20);

  // === TARGETS ===
  checkSpace(200);
  text('7. ЦЕЛИ И СТРАТЕГИЯ ЗА НАМАЛЯВАНЕ НА ЕМИСИИТЕ', MARGIN, 14, COLORS.primary);
  line(MARGIN, A4_WIDTH - MARGIN, 1, COLORS.primary);
  spacer(10);

  text('7.1. Ангажимент за климатични действия', MARGIN, 11, COLORS.secondary);
  spacer(5);
  text(`${data.company.company_name} е ангажирана с намаляването на въглеродния си отпечатък`, MARGIN, 9);
  text('в съответствие с Парижкото споразумение и Европейския зелен пакт. Компанията', MARGIN, 9);
  text('признава важността на корпоративната отговорност за климатичните промени и се', MARGIN, 9);
  text('стреми към устойчиво бъдеще.', MARGIN, 9);
  spacer(10);

  if (data.targets && data.targets.length > 0) {
    text('7.2. Количествени цели за намаляване', MARGIN, 11, COLORS.secondary);
    spacer(5);

    data.targets.slice(0, 3).forEach((target: any, index: number) => {
      checkSpace(60);
      text(`Цел ${index + 1}: ${target.name}`, MARGIN, 10, COLORS.text);
      const targetText = target.target_type === 'percentage' 
        ? `Намаление с ${target.target_value}% до ${target.target_year} г. (базова година: ${target.baseline_year})`
        : `Постигане на ${target.target_value} tCO2e до ${target.target_year} г.`;
      text(targetText, MARGIN + 10, 9, COLORS.darkGray);
      
      if (target.description) {
        spacer(5);
        text(`Описание: ${target.description}`, MARGIN + 10, 8, COLORS.darkGray);
      }
      spacer(10);
    });
  } else {
    text('7.2. Планирани мерки за намаляване', MARGIN, 11, COLORS.secondary);
    spacer(5);
    text('Компанията планира да постави количествени цели за намаляване на емисиите', MARGIN, 9);
    text('в съответствие със SBTi (Science Based Targets initiative) насоки.', MARGIN, 9);
    spacer(10);
  }

  text('7.3. Стратегически подход', MARGIN, 11, COLORS.secondary);
  spacer(5);
  text('Стратегията за намаляване на емисиите включва:', MARGIN, 9);
  spacer(5);
  text('• Енергийна ефективност: Оптимизация на консумацията на електроенергия', MARGIN + 10, 9);
  text('• Възобновяема енергия: Преход към зелени енергийни източници', MARGIN + 10, 9);
  text('• Устойчив транспорт: Модернизация на автопарка с по-ефективни превозни средства', MARGIN + 10, 9);
  text('• Обучение на персонала: Повишаване на осведомеността за климатичните действия', MARGIN + 10, 9);
  text('• Постоянен мониторинг: Редовно измерване и отчитане на напредъка', MARGIN + 10, 9);
  spacer(15);

  // === GOVERNANCE ===
  checkSpace(200);
  text('8. УПРАВЛЕНИЕ И ОТГОВОРНОСТИ', MARGIN, 14, COLORS.primary);
  line(MARGIN, A4_WIDTH - MARGIN, 1, COLORS.primary);
  spacer(10);

  text('8.1. Организационна структура', MARGIN, 11, COLORS.secondary);
  spacer(5);
  text('Управлението на климатичните въпроси е интегрирано в корпоративното управление', MARGIN, 9);
  text(`на ${data.company.company_name}. Отговорностите са разпределени, както следва:`, MARGIN, 9);
  spacer(5);
  text('• Изпълнително ръководство: Определя стратегията и одобрява целите', MARGIN + 10, 9);
  text('• Отговорник по устойчивост: Координира дейностите и следи изпълнението', MARGIN + 10, 9);
  text('• Отдели: Отговарят за събиране на данни и изпълнение на мерките', MARGIN + 10, 9);
  text('• Всички служители: Участват в постигането на целите за намаляване', MARGIN + 10, 9);
  spacer(10);

  checkSpace(120); // Ensure enough space for subsection
  text('8.2. Процеси за вземане на решения', MARGIN, 11, COLORS.secondary);
  spacer(5);
  text('Климатичните въпроси се разглеждат на редовни срещи на ръководството.', MARGIN, 9);
  text('Решенията се вземат въз основа на:', MARGIN, 9);
  spacer(5);
  text('• Данни за емисиите и анализ на тенденциите', MARGIN + 10, 9);
  text('• Оценка на рисковете и възможностите, свързани с климата', MARGIN + 10, 9);
  text('• Финансови съображения и възвръщаемост на инвестициите', MARGIN + 10, 9);
  text('• Регулаторни изисквания и най-добри практики в индустрията', MARGIN + 10, 9);
  spacer(10);

  checkSpace(120); // Ensure enough space for subsection
  text('8.3. Интеграция в бизнес процесите', MARGIN, 11, COLORS.secondary);
  spacer(5);
  text('Климатичните съображения са включени в:', MARGIN, 9);
  spacer(5);
  text('• Стратегическо планиране: Дългосрочни цели и инвестиционни решения', MARGIN + 10, 9);
  text('• Операционно управление: Ежедневни процеси и процедури', MARGIN + 10, 9);
  text('• Управление на риска: Оценка и смекчаване на климатични рискове', MARGIN + 10, 9);
  text('• Комуникация със заинтересовани страни: Прозрачно отчитане', MARGIN + 10, 9);
  spacer(10);

  if (data.company.eu_green_deal_commitment) {
    checkSpace(100); // Ensure enough space for subsection
    text('8.4. Ангажимент с регулаторни рамки', MARGIN, 11, COLORS.secondary);
    spacer(5);
    text('Компанията е официално ангажирана с целите на Европейския зелен пакт и', MARGIN, 9, COLORS.success);
    text('се стреми да постигне климатична неутралност до 2050 г.', MARGIN, 9, COLORS.success);
    spacer(10);
  }
  spacer(15);

  // === VERIFICATION ===
  checkSpace(180);
  text('9. ВЕРИФИКАЦИЯ И ОСИГУРЯВАНЕ НА КАЧЕСТВОТО', MARGIN, 14, COLORS.primary);
  line(MARGIN, A4_WIDTH - MARGIN, 1, COLORS.primary);
  spacer(10);

  checkSpace(120); // Ensure enough space for subsection
  text('9.1. Вътрешен контрол', MARGIN, 11, COLORS.secondary);
  spacer(5);
  text('Компанията е внедрила система за вътрешен контрол за осигуряване на качеството', MARGIN, 9);
  text('на данните за емисиите:', MARGIN, 9);
  spacer(5);
  text('• Процедури за събиране на данни: Документирани процеси и отговорности', MARGIN + 10, 9);
  text('• Валидация на данните: Проверки за пълнота, точност и последователност', MARGIN + 10, 9);
  text('• Архивиране: Съхранение на първични документи и изчисления', MARGIN + 10, 9);
  text('• Одит на качеството: Вътрешни прегледи на процесите и резултатите', MARGIN + 10, 9);
  spacer(10);

  checkSpace(120); // Ensure enough space for subsection
  text('9.2. Несигурност и ограничения', MARGIN, 11, COLORS.secondary);
  spacer(5);
  text('Оценката на емисиите е предмет на определена несигурност, произтичаща от:', MARGIN, 9);
  spacer(5);
  text('• Вариабилност в емисионните фактори спрямо реалните условия', MARGIN + 10, 9);
  text('• Точност на измервателните уреди и методи за събиране на данни', MARGIN + 10, 9);
  text('• Екстраполация на данни при липсващи стойности', MARGIN + 10, 9);
  spacer(5);
  text('Общата несигурност се оценява в диапазона ±5-10%, което е в съответствие', MARGIN, 9);
  text('с индустриалните стандарти за отчитане на парникови газове.', MARGIN, 9);
  spacer(10);

  checkSpace(120); // Ensure enough space for subsection
  text('9.3. Външна верификация', MARGIN, 11, COLORS.secondary);
  spacer(5);
  
  if (data.company.external_verification) {
    text('Този отчет е бил предмет на независима външна верификация от акредитиран', MARGIN, 9, COLORS.success);
    text(`орган: ${data.company.verification_body || 'Н/П'}`, MARGIN, 9, COLORS.success);
    spacer(5);
    if (data.company.verification_date) {
      const verDate = new Date(data.company.verification_date).toLocaleDateString('bg-BG');
      text(`Дата на верификация: ${verDate}`, MARGIN, 9, COLORS.success);
      spacer(5);
    }
    text('Верификацията потвърждава, че:', MARGIN, 9);
    spacer(5);
    text('• Данните са събрани в съответствие с GHG Protocol', MARGIN + 10, 9);
    text('• Изчисленията са коректни и използват подходящи емисионни фактори', MARGIN + 10, 9);
    text('• Отчетът е пълен, точен и отговаря на изискванията на CSRD', MARGIN + 10, 9);
  } else {
    text('Този отчет не е подложен на външна верификация от трета страна.', MARGIN, 9, COLORS.darkGray);
    spacer(5);
    text('Въпреки това, всички данни и изчисления са прегледани вътрешно и са събрани', MARGIN, 9);
    text('съгласно признати стандарти и най-добри практики. Компанията планира да', MARGIN, 9);
    text('търси външна верификация в бъдещи отчетни периоди за повишаване на', MARGIN, 9);
    text('доверието и прозрачността.', MARGIN, 9);
  }
  spacer(10);

  checkSpace(100); // Ensure enough space for subsection
  text('9.4. Подобрения и следващи стъпки', MARGIN, 11, COLORS.secondary);
  spacer(5);
  text('За следващите отчетни периоди компанията планира:', MARGIN, 9);
  spacer(5);
  text('• Разширяване на обхвата за включване на Обхват 3 (веригата на доставки)', MARGIN + 10, 9);
  text('• Подобряване на системите за събиране на данни и автоматизация', MARGIN + 10, 9);
  text('• Търсене на външна верификация за повишена достоверност', MARGIN + 10, 9);
  text('• Сравнение с индустриални бенчмаркове и най-добри практики', MARGIN + 10, 9);
  spacer(15);

  // Add footers to all pages now that we know the total count
  const totalPages = pdfDoc.getPageCount();
  const footerY = FOOTER_HEIGHT; // Position footer at proper height from bottom
  
  pdfDoc.getPages().forEach((p, index) => {
    const currentPage = index + 1;
    const footerText = `${data.company.company_name} | CSRD Отчет ${data.reportingYear}`;
    const pageText = `Страница ${currentPage} от ${totalPages}`;
    
    // Left side - company name and report info
    p.drawText(footerText, {
      x: MARGIN,
      y: footerY,
      size: 8,
      font,
      color: COLORS.mediumGray,
    });
    
    // Right side - page number
    const pageTextWidth = font.widthOfTextAtSize(pageText, 8);
    p.drawText(pageText, {
      x: A4_WIDTH - MARGIN - pageTextWidth,
      y: footerY,
      size: 8,
      font,
      color: COLORS.mediumGray,
    });
  });
  
  return await pdfDoc.save();
}

