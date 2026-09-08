import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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

export async function generateCSRDReport(data: CSRDReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Fetch Roboto font for Cyrillic support
  const fontResponse = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf');
  const fontBytes = await fontResponse.arrayBuffer();
  const customFont = await pdfDoc.embedFont(fontBytes);
  
  // Use same font for bold (we'll use larger size for emphasis)
  const boldFont = customFont;

  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  let yPosition = height - 50;

  const drawText = (text: string, x: number, y: number, size: number, font = customFont, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x, y, size, font, color });
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition - requiredSpace < 50) {
      page = pdfDoc.addPage([595.28, 841.89]);
      yPosition = height - 50;
      return true;
    }
    return false;
  };

  // Header
  drawText('ОТЧЕТ ЗА УСТОЙЧИВОСТ', 50, yPosition, 24, boldFont, rgb(0.17, 0.33, 0.09));
  yPosition -= 15;
  drawText('Директива за корпоративно отчитане на устойчивостта (CSRD)', 50, yPosition, 11);
  yPosition -= 40;

  // Company Information Section
  drawText('1. ИНФОРМАЦИЯ ЗА ОРГАНИЗАЦИЯТА', 50, yPosition, 14, boldFont, rgb(0.17, 0.33, 0.09));
  yPosition -= 25;

  const companyInfo = [
    ['Наименование:', data.company.company_name],
    ['ЕИК/Булстат:', data.company.registration_number],
    ['Сектор:', data.company.industry_sector],
    ['Брой служители:', data.company.employee_count?.toString() || 'Н/П'],
    ['Отчетен период:', `${data.reportingPeriod.start} - ${data.reportingPeriod.end}`],
    ['Отчетна година:', data.reportingYear.toString()],
  ];

  if (data.company.annual_turnover) {
    companyInfo.push(['Годишен оборот:', `${data.company.annual_turnover.toLocaleString()} EUR`]);
  }
  if (data.company.parent_company) {
    companyInfo.push(['Майчина компания:', data.company.parent_company]);
  }

  companyInfo.forEach(([label, value]) => {
    checkPageBreak(20);
    drawText(label, 50, yPosition, 10, customFont, rgb(0.3, 0.3, 0.3));
    drawText(value, 200, yPosition, 10, customFont);
    yPosition -= 18;
  });

  yPosition -= 20;
  checkPageBreak(80);

  // Reporting Boundary
  drawText('2. ГРАНИЦИ НА ОТЧИТАНЕТО', 50, yPosition, 14, boldFont, rgb(0.17, 0.33, 0.09));
  yPosition -= 25;
  
  const boundaryText = data.company.reporting_boundary || 
    'Отчетът обхваща всички дейности и обекти, контролирани от организацията на територията на България. Включени са емисии от Обхват 1 (директни) и Обхват 2 (индиректни от енергия).';
  
  const boundaryLines = wrapText(boundaryText, 495, 10, customFont);
  boundaryLines.forEach(line => {
    checkPageBreak(20);
    drawText(line, 50, yPosition, 10);
    yPosition -= 15;
  });

  yPosition -= 20;
  checkPageBreak(80);

  // Emissions Summary
  drawText('3. ОБОБЩЕНИ ДАННИ ЗА ЕМИСИИТЕ', 50, yPosition, 14, boldFont, rgb(0.17, 0.33, 0.09));
  yPosition -= 25;

  // Table header
  checkPageBreak(100);
  page.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: 495,
    height: 25,
    color: rgb(0.9, 0.95, 0.9),
  });
  drawText('Обхват', 60, yPosition, 10, boldFont);
  drawText('Описание', 200, yPosition, 10, boldFont);
  drawText('tCO2e', 450, yPosition, 10, boldFont);
  yPosition -= 25;

  // Scope 1
  page.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: 495,
    height: 20,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });
  drawText('Обхват 1', 60, yPosition, 10, customFont);
  drawText('Директни емисии', 200, yPosition, 10, customFont);
  drawText(data.totalEmissions.scope1.toFixed(2), 450, yPosition, 10, customFont);
  yPosition -= 25;

  // Scope 2
  page.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: 495,
    height: 20,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });
  drawText('Обхват 2', 60, yPosition, 10, customFont);
  drawText('Индиректни емисии от енергия', 200, yPosition, 10, customFont);
  drawText(data.totalEmissions.scope2.toFixed(2), 450, yPosition, 10, customFont);
  yPosition -= 25;

  // Total
  page.drawRectangle({
    x: 50,
    y: yPosition - 15,
    width: 495,
    height: 20,
    color: rgb(0.95, 0.97, 0.95),
    borderColor: rgb(0.6, 0.6, 0.6),
    borderWidth: 1,
  });
  drawText('ОБЩО', 60, yPosition, 10, boldFont);
  drawText(data.totalEmissions.total.toFixed(2), 450, yPosition, 10, boldFont);
  yPosition -= 40;

  // Year-over-year comparison
  if (data.comparisonData) {
    checkPageBreak(60);
    drawText('Сравнение с предходна година:', 50, yPosition, 11, boldFont);
    yPosition -= 20;
    
    const changeText = data.comparisonData.change >= 0 
      ? `Увеличение с ${data.comparisonData.change.toFixed(2)} tCO2e (${data.comparisonData.changePercent.toFixed(1)}%)`
      : `Намаление с ${Math.abs(data.comparisonData.change).toFixed(2)} tCO2e (${Math.abs(data.comparisonData.changePercent).toFixed(1)}%)`;
    
    drawText(changeText, 50, yPosition, 10, customFont, 
      data.comparisonData.change >= 0 ? rgb(0.8, 0.2, 0.2) : rgb(0.2, 0.6, 0.2));
    yPosition -= 30;
  }

  // Category Breakdown
  checkPageBreak(100);
  drawText('4. РАЗПРЕДЕЛЕНИЕ ПО КАТЕГОРИИ', 50, yPosition, 14, boldFont, rgb(0.17, 0.33, 0.09));
  yPosition -= 25;

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

  Object.entries(data.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, value]) => {
      checkPageBreak(20);
      const label = categoryLabels[category] || category;
      const percent = (value / data.totalEmissions.total * 100).toFixed(1);
      drawText(`${label}:`, 60, yPosition, 10);
      drawText(`${value.toFixed(2)} tCO2e (${percent}%)`, 350, yPosition, 10);
      yPosition -= 18;
    });

  yPosition -= 20;

  // Methodology
  checkPageBreak(100);
  drawText('5. МЕТОДОЛОГИЯ', 50, yPosition, 14, boldFont, rgb(0.17, 0.33, 0.09));
  yPosition -= 25;

  const methodologyText = data.company.methodology_statement ||
    'Изчисленията на емисиите са направени в съответствие с Протокола за парникови газове (GHG Protocol) и използват емисионни фактори от DEFRA 2023 и Българската агенция по енергетика. Всички данни са събрани от първични източници (фактури, измервателни уреди) и са валидирани за точност.';

  const methodologyLines = wrapText(methodologyText, 495, 10, customFont);
  methodologyLines.forEach(line => {
    checkPageBreak(20);
    drawText(line, 50, yPosition, 10);
    yPosition -= 15;
  });

  yPosition -= 20;

  // Data Quality
  checkPageBreak(100);
  drawText('6. КАЧЕСТВО НА ДАННИТЕ', 50, yPosition, 14, boldFont, rgb(0.17, 0.33, 0.09));
  yPosition -= 25;

  const qualityText = data.company.data_quality_assessment ||
    'Данните за емисиите са събрани от надеждни източници и са проверени за пълнота и точност. Всички значителни отклонения са документирани и обяснени. Нивото на несигурност се оценява като ниско до средно.';

  const qualityLines = wrapText(qualityText, 495, 10, customFont);
  qualityLines.forEach(line => {
    checkPageBreak(20);
    drawText(line, 50, yPosition, 10);
    yPosition -= 15;
  });

  yPosition -= 20;

  // Targets
  if (data.targets.length > 0) {
    checkPageBreak(100);
    drawText('7. ЦЕЛИ ЗА НАМАЛЯВАНЕ', 50, yPosition, 14, boldFont, rgb(0.17, 0.33, 0.09));
    yPosition -= 25;

    data.targets.forEach((target: any) => {
      checkPageBreak(40);
      drawText(`• ${target.name}`, 60, yPosition, 10, boldFont);
      yPosition -= 18;
      
      const targetDesc = target.target_type === 'percentage'
        ? `Намаление с ${target.target_value}% до ${target.target_year} г. (базова година: ${target.baseline_year})`
        : `Постигане на ${target.target_value} tCO2e до ${target.target_year} г.`;
      
      drawText(targetDesc, 70, yPosition, 9);
      yPosition -= 18;
      
      if (target.description) {
        const descLines = wrapText(target.description, 475, 9, customFont);
        descLines.forEach((line: string) => {
          checkPageBreak(15);
          drawText(line, 70, yPosition, 9, customFont, rgb(0.4, 0.4, 0.4));
          yPosition -= 13;
        });
      }
      yPosition -= 10;
    });
  }

  yPosition -= 20;

  // Governance
  checkPageBreak(100);
  drawText('8. УПРАВЛЕНИЕ И ОТГОВОРНОСТИ', 50, yPosition, 14, boldFont, rgb(0.17, 0.33, 0.09));
  yPosition -= 25;

  const governanceText = data.company.governance_structure ||
    'Управлението на климатичните въпроси е отговорност на ръководството на компанията. Редовно се извършва мониторинг на напредъка и се отчитат резултатите на заинтересованите страни.';

  const governanceLines = wrapText(governanceText, 495, 10, customFont);
  governanceLines.forEach(line => {
    checkPageBreak(20);
    drawText(line, 50, yPosition, 10);
    yPosition -= 15;
  });

  // EU Green Deal
  if (data.company.eu_green_deal_commitment) {
    yPosition -= 10;
    checkPageBreak(30);
    drawText('Компанията е ангажирана с целите на Европейския зелен пакт.', 50, yPosition, 10, customFont, rgb(0.2, 0.6, 0.2));
    yPosition -= 20;
  }

  // Verification
  yPosition -= 20;
  checkPageBreak(60);
  drawText('9. ВЪНШНА ВЕРИФИКАЦИЯ', 50, yPosition, 14, boldFont, rgb(0.17, 0.33, 0.09));
  yPosition -= 25;

  if (data.company.external_verification) {
    drawText(`Верифициран от: ${data.company.verification_body || 'Н/П'}`, 50, yPosition, 10);
    yPosition -= 18;
    if (data.company.verification_date) {
      drawText(`Дата на верификация: ${new Date(data.company.verification_date).toLocaleDateString('bg-BG')}`, 50, yPosition, 10);
    }
  } else {
    drawText('Този отчет не е подложен на външна верификация.', 50, yPosition, 10, customFont, rgb(0.5, 0.5, 0.5));
  }

  yPosition -= 30;

  // Footer
  checkPageBreak(80);
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  yPosition -= 20;

  const generatedDate = new Date().toLocaleDateString('bg-BG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  drawText(`Генериран на: ${generatedDate}`, 50, yPosition, 8, customFont, rgb(0.5, 0.5, 0.5));
  drawText(`Система: ${PDF_PLATFORM_NAME}`, width - 200, yPosition, 8, customFont, rgb(0.5, 0.5, 0.5));

  return await pdfDoc.save();
}

function wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

