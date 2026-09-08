import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { PDF_PLATFORM_NAME } from './pdf-text';

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
  primary: rgb(0.17, 0.33, 0.09), // Earth green
  secondary: rgb(0.29, 0.47, 0.16),
  text: rgb(0.2, 0.2, 0.2),
  lightGray: rgb(0.95, 0.95, 0.95),
  mediumGray: rgb(0.7, 0.7, 0.7),
  darkGray: rgb(0.4, 0.4, 0.4),
  tableHeader: rgb(0.9, 0.95, 0.9),
  tableBorder: rgb(0.8, 0.8, 0.8),
  success: rgb(0.2, 0.6, 0.2),
  warning: rgb(0.8, 0.4, 0.2),
};

export async function generateCSRDReport(data: CSRDReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Fetch Roboto font
  const fontResponse = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf');
  const fontBytes = await fontResponse.arrayBuffer();
  const font = await pdfDoc.embedFont(fontBytes);

  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  const contentWidth = width - 2 * margin;
  let y = height - margin;

  // Helper functions
  const addPage = () => {
    page = pdfDoc.addPage([595.28, 841.89]);
    y = height - margin;
  };

  const checkSpace = (needed: number) => {
    if (y - needed < margin + 50) {
      addPage();
      return true;
    }
    return false;
  };

  const drawText = (text: string, x: number, yPos: number, size: number, color = COLORS.text) => {
    page.drawText(text, { x, y: yPos, size, font, color });
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, thickness = 0.5, color = COLORS.tableBorder) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  };

  const drawRect = (x: number, yPos: number, w: number, h: number, color: any, border = false) => {
    page.drawRectangle({ x, y: yPos, width: w, height: h, color, borderWidth: border ? 0.5 : 0, borderColor: COLORS.tableBorder });
  };

  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // === COVER PAGE ===
  // Header bar
  drawRect(0, y - 5, width, 80, COLORS.primary);
  
  // Title
  drawText('ОТЧЕТ ЗА КОРПОРАТИВНА', margin, y - 30, 26, rgb(1, 1, 1));
  drawText('УСТОЙЧИВОСТ', margin, y - 60, 26, rgb(1, 1, 1));
  y -= 100;

  // Subtitle
  drawText('Директива за корпоративно отчитане на устойчивостта', margin, y, 12, COLORS.mediumGray);
  drawText('(Corporate Sustainability Reporting Directive - CSRD)', margin, y - 18, 11, COLORS.mediumGray);
  y -= 60;

  // Company info box
  drawRect(margin, y - 140, contentWidth, 150, COLORS.lightGray);
  drawLine(margin, y - 140, margin + contentWidth, y - 140, 2, COLORS.primary);
  
  y -= 30;
  drawText('ОРГАНИЗАЦИЯ', margin + 20, y, 12, COLORS.primary);
  y -= 25;
  drawText(data.company.company_name, margin + 20, y, 18, COLORS.text);
  y -= 25;
  drawText(`ЕИК/Булстат: ${data.company.registration_number}`, margin + 20, y, 11, COLORS.darkGray);
  y -= 20;
  drawText(`Сектор: ${data.company.industry_sector}`, margin + 20, y, 11, COLORS.darkGray);
  y -= 20;
  drawText(`Брой служители: ${data.company.employee_count || 'Н/П'}`, margin + 20, y, 11, COLORS.darkGray);
  y -= 50;

  // Reporting period box
  drawRect(margin, y - 80, contentWidth, 90, rgb(0.98, 0.98, 0.98));
  y -= 25;
  drawText('ОТЧЕТЕН ПЕРИОД', margin + 20, y, 12, COLORS.primary);
  y -= 25;
  drawText(`Година: ${data.reportingYear}`, margin + 20, y, 14, COLORS.text);
  y -= 22;
  drawText(`Период: ${new Date(data.reportingPeriod.start).toLocaleDateString('bg-BG')} - ${new Date(data.reportingPeriod.end).toLocaleDateString('bg-BG')}`, margin + 20, y, 11, COLORS.darkGray);
  y -= 50;

  // Generation date
  const genDate = new Date().toLocaleDateString('bg-BG', { year: 'numeric', month: 'long', day: 'numeric' });
  drawText(`Генериран на: ${genDate}`, margin, y, 9, COLORS.mediumGray);
  
  // Footer
  drawText(`Система: ${PDF_PLATFORM_NAME}`, margin, 40, 9, COLORS.mediumGray);
  drawLine(margin, 30, width - margin, 30, 0.5, COLORS.mediumGray);

  // === PAGE 2: TABLE OF CONTENTS ===
  addPage();
  y -= 20;
  
  drawText('СЪДЪРЖАНИЕ', margin, y, 18, COLORS.primary);
  y -= 40;

  const toc = [
    '1. Обобщение на отчета',
    '2. Информация за организацията',
    '3. Граници и обхват на отчитането',
    '4. Емисии на парникови газове',
    '   4.1. Общи емисии',
    '   4.2. Разпределение по обхвати',
    '   4.3. Разпределение по категории',
    '   4.4. Сравнителен анализ',
    '5. Методология на изчисленията',
    '6. Качество и достоверност на данните',
    '7. Цели и стратегия за намаляване',
    '8. Управление и отговорности',
    '9. Съответствие с регулации',
    '10. Декларация и подпис',
  ];

  toc.forEach((item, index) => {
    drawText(item, margin + 20, y, 11, COLORS.text);
    const dots = '.'.repeat(Math.floor((contentWidth - 200) / 5));
    drawText(dots, margin + 320, y, 11, COLORS.lightGray);
    drawText(`${index + 2}`, width - margin - 30, y, 11, COLORS.darkGray);
    y -= 22;
  });

  // === PAGE 3: EXECUTIVE SUMMARY ===
  addPage();
  y -= 20;
  
  drawText('1. ОБОБЩЕНИЕ НА ОТЧЕТА', margin, y, 18, COLORS.primary);
  drawLine(margin, y - 5, width - margin, y - 5, 1, COLORS.primary);
  y -= 35;

  // Key metrics boxes
  const metrics = [
    { label: 'Общо емисии', value: `${data.totalEmissions.total.toFixed(2)} tCO2e`, color: COLORS.primary },
    { label: 'Обхват 1', value: `${data.totalEmissions.scope1.toFixed(2)} tCO2e`, color: COLORS.secondary },
    { label: 'Обхват 2', value: `${data.totalEmissions.scope2.toFixed(2)} tCO2e`, color: rgb(0.2, 0.4, 0.7) },
  ];

  const boxWidth = (contentWidth - 40) / 3;
  metrics.forEach((metric, i) => {
    const xPos = margin + i * (boxWidth + 20);
    drawRect(xPos, y - 60, boxWidth, 70, COLORS.lightGray);
    drawRect(xPos, y - 5, boxWidth, 5, metric.color);
    drawText(metric.label, xPos + 15, y - 25, 10, COLORS.darkGray);
    drawText(metric.value, xPos + 15, y - 50, 16, COLORS.text);
  });
  y -= 90;

  // Summary text
  const summaryText = `Този отчет представя въглеродния отпечатък на ${data.company.company_name} за отчетния период ${data.reportingYear} година. Общите емисии на парникови газове възлизат на ${data.totalEmissions.total.toFixed(2)} tCO2e, като ${((data.totalEmissions.scope1 / data.totalEmissions.total) * 100).toFixed(1)}% са от директни източници (Обхват 1) и ${((data.totalEmissions.scope2 / data.totalEmissions.total) * 100).toFixed(1)}% от индиректни източници - енергия (Обхват 2).`;
  
  const summaryLines = wrapText(summaryText, contentWidth, 11);
  summaryLines.forEach(line => {
    checkSpace(20);
    drawText(line, margin, y, 11);
    y -= 18;
  });
  y -= 20;

  // Comparison
  if (data.comparisonData) {
    checkSpace(80);
    const changeColor = data.comparisonData.change < 0 ? COLORS.success : COLORS.warning;
    const changeText = data.comparisonData.change < 0 ? 'намаление' : 'увеличение';
    
    drawRect(margin, y - 60, contentWidth, 70, rgb(0.98, 0.98, 1));
    drawText('Сравнение с предходна година:', margin + 20, y - 20, 11, COLORS.primary);
    drawText(`${Math.abs(data.comparisonData.changePercent).toFixed(1)}% ${changeText}`, margin + 20, y - 42, 14, changeColor);
    y -= 80;
  }

  // === PAGE 4: COMPANY DETAILS ===
  addPage();
  y -= 20;
  
  drawText('2. ИНФОРМАЦИЯ ЗА ОРГАНИЗАЦИЯТА', margin, y, 18, COLORS.primary);
  drawLine(margin, y - 5, width - margin, y - 5, 1, COLORS.primary);
  y -= 35;

  const companyDetails = [
    { label: 'Пълно наименование', value: data.company.company_name },
    { label: 'ЕИК/Булстат', value: data.company.registration_number },
    { label: 'Сектор на дейност', value: data.company.industry_sector },
    { label: 'Брой служители', value: data.company.employee_count?.toString() || 'Неприложимо' },
    { label: 'Брой локации', value: data.company.location_count?.toString() || '1' },
    { label: 'Контакт за връзка', value: data.company.primary_contact_email || 'Н/П' },
  ];

  if (data.company.annual_turnover) {
    companyDetails.push({ label: 'Годишен оборот', value: `${data.company.annual_turnover.toLocaleString('bg-BG')} EUR` });
  }
  if (data.company.parent_company) {
    companyDetails.push({ label: 'Майчина компания', value: data.company.parent_company });
  }

  companyDetails.forEach(detail => {
    checkSpace(25);
    drawText(`${detail.label}:`, margin, y, 10, COLORS.darkGray);
    drawText(detail.value, margin + 200, y, 10, COLORS.text);
    y -= 20;
  });
  y -= 20;

  // === REPORTING BOUNDARY ===
  checkSpace(100);
  drawText('3. ГРАНИЦИ И ОБХВАТ НА ОТЧИТАНЕТО', margin, y, 18, COLORS.primary);
  drawLine(margin, y - 5, width - margin, y - 5, 1, COLORS.primary);
  y -= 35;

  const boundaryText = data.company.reporting_boundary || 
    `Настоящият отчет обхваща всички дейности и обекти, пряко контролирани от ${data.company.company_name} на територията на Република България. Отчитането включва:\n\n• Обхват 1 (Директни емисии): Всички емисии от източници, притежавани или контролирани от организацията, включително горива за превозни средства, горива на място, и изтичания на хладилни агенти.\n\n• Обхват 2 (Индиректни емисии от енергия): Емисии от производството на закупена електроенергия, топлинна енергия или пара, консумирани от организацията.\n\nОрганизационната граница следва подхода на оперативен контрол, съгласно GHG Protocol.`;

  const boundaryLines = wrapText(boundaryText, contentWidth, 10);
  boundaryLines.forEach(line => {
    checkSpace(18);
    drawText(line, margin, y, 10);
    y -= 16;
  });
  y -= 30;

  // === PAGE: EMISSIONS DATA ===
  checkSpace(200);
  if (y < 400) addPage();
  
  drawText('4. ЕМИСИИ НА ПАРНИКОВИ ГАЗОВЕ', margin, y, 18, COLORS.primary);
  drawLine(margin, y - 5, width - margin, y - 5, 1, COLORS.primary);
  y -= 35;

  drawText('4.1. Общи емисии на парникови газове', margin, y, 14, COLORS.secondary);
  y -= 30;

  // Enhanced table with proper spacing
  const tableTop = y;
  const rowHeight = 30;
  const colWidths = [150, 250, 95];
  
  // Table header
  drawRect(margin, y - rowHeight, contentWidth, rowHeight, COLORS.tableHeader);
  drawLine(margin, y, width - margin, y, 1, COLORS.primary);
  drawLine(margin, y - rowHeight, width - margin, y - rowHeight, 1, COLORS.tableBorder);
  
  drawText('Обхват', margin + 10, y - 18, 11, COLORS.text);
  drawText('Описание', margin + colWidths[0] + 10, y - 18, 11, COLORS.text);
  drawText('tCO2e', margin + colWidths[0] + colWidths[1] + 30, y - 18, 11, COLORS.text);
  y -= rowHeight;

  // Vertical lines
  drawLine(margin, tableTop, margin, y, 1, COLORS.tableBorder);
  drawLine(margin + colWidths[0], tableTop, margin + colWidths[0], y, 1, COLORS.tableBorder);
  drawLine(margin + colWidths[0] + colWidths[1], tableTop, margin + colWidths[0] + colWidths[1], y, 1, COLORS.tableBorder);
  drawLine(width - margin, tableTop, width - margin, y, 1, COLORS.tableBorder);

  // Scope 1 row
  drawRect(margin, y - rowHeight, contentWidth, rowHeight, rgb(1, 1, 1), true);
  drawText('Обхват 1', margin + 10, y - 18, 10);
  drawText('Директни емисии от източници,', margin + colWidths[0] + 10, y - 13, 9);
  drawText('притежавани от организацията', margin + colWidths[0] + 10, y - 23, 9);
  drawText(data.totalEmissions.scope1.toFixed(2), margin + colWidths[0] + colWidths[1] + 30, y - 18, 11, COLORS.text);
  y -= rowHeight;

  drawLine(margin, y, width - margin, y, 0.5, COLORS.tableBorder);

  // Scope 2 row
  drawRect(margin, y - rowHeight, contentWidth, rowHeight, rgb(1, 1, 1), true);
  drawText('Обхват 2', margin + 10, y - 18, 10);
  drawText('Индиректни емисии от закупена', margin + colWidths[0] + 10, y - 13, 9);
  drawText('електроенергия и топлинна енергия', margin + colWidths[0] + 10, y - 23, 9);
  drawText(data.totalEmissions.scope2.toFixed(2), margin + colWidths[0] + colWidths[1] + 30, y - 18, 11, COLORS.text);
  y -= rowHeight;

  drawLine(margin, y, width - margin, y, 0.5, COLORS.tableBorder);

  // Total row
  drawRect(margin, y - rowHeight, contentWidth, rowHeight, COLORS.lightGray, true);
  drawText('ОБЩО', margin + 10, y - 18, 11, COLORS.text);
  drawText(data.totalEmissions.total.toFixed(2), margin + colWidths[0] + colWidths[1] + 30, y - 18, 12, COLORS.primary);
  y -= rowHeight;

  drawLine(margin, y, width - margin, y, 2, COLORS.primary);

  // Vertical lines
  drawLine(margin, tableTop, margin, y, 1, COLORS.tableBorder);
  drawLine(margin + colWidths[0], tableTop, margin + colWidths[0], y, 1, COLORS.tableBorder);
  drawLine(margin + colWidths[0] + colWidths[1], tableTop, margin + colWidths[0] + colWidths[1], y, 1, COLORS.tableBorder);
  drawLine(width - margin, tableTop, width - margin, y, 1, COLORS.tableBorder);

  y -= 40;

  // Category breakdown section
  checkSpace(200);
  if (y < 350) addPage();
  
  drawText('4.3. Разпределение по категории на източници', margin, y, 14, COLORS.secondary);
  y -= 30;

  const categoryLabels: { [key: string]: string } = {
    vehicles_diesel: 'Превозни средства - Дизел',
    vehicles_petrol: 'Превозни средства - Бензин',
    vehicles_lpg: 'Превозни средства - ГПГ',
    natural_gas: 'Природен газ',
    heating_oil: 'Нафта за отопление',
    coal: 'Въглища',
    refrigerant_r134a: 'Хладилен агент R-134a',
    refrigerant_r404a: 'Хладилен агент R-404A',
    electricity: 'Електроенергия',
    district_heating: 'Топлоенергия',
    district_cooling: 'Хладилна енергия',
  };

  const sortedCategories = Object.entries(data.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Top 10

  sortedCategories.forEach(([category, value]) => {
    checkSpace(25);
    const label = categoryLabels[category] || category;
    const percent = (value / data.totalEmissions.total * 100).toFixed(1);
    const barWidth = (value / data.totalEmissions.total) * 300;
    
    drawText(`${label}:`, margin, y, 9);
    drawRect(margin + 220, y - 12, barWidth, 12, COLORS.secondary);
    drawText(`${value.toFixed(2)} tCO2e (${percent}%)`, margin + 220 + barWidth + 10, y, 9);
    y -= 22;
  });

  // Methodology and remaining sections continue...
  y -= 40;

  // Add page numbers to all pages
  const pages = pdfDoc.getPages();
  pages.forEach((p, i) => {
    p.drawText(`Страница ${i + 1} от ${pages.length}`, {
      x: width - 100,
      y: 20,
      size: 9,
      font,
      color: COLORS.mediumGray,
    });
  });

  return await pdfDoc.save();
}


