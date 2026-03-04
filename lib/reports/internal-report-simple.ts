import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

interface EmissionData {
  id: string;
  reporting_period: string;
  scope: number;
  category: string;
  activity_value: number;
  unit: string;
  calculated_co2e: number;
  notes?: string;
}

interface CompanyData {
  company_name: string;
  registration_number: string;
  industry_sector: string;
  employee_count?: number;
}

interface ReportData {
  company: CompanyData;
  emissions: EmissionData[];
  startDate: string;
  endDate: string;
}

// Category labels in Bulgarian (Cyrillic)
const CATEGORY_LABELS: Record<string, string> = {
  'vehicles_diesel': 'Превозни средства - Дизел',
  'vehicles_petrol': 'Превозни средства - Бензин',
  'vehicles_lpg': 'Превозни средства - ГПГ',
  'natural_gas': 'Природен газ',
  'heating_oil': 'Нафта за отопление',
  'coal': 'Въглища',
  'refrigerant_r134a': 'Хладилен агент R-134a',
  'refrigerant_r404a': 'Хладилен агент R-404A',
  'electricity': 'Електроенергия',
  'district_heating': 'Топлоенергия',
  'district_cooling': 'Хладилна енергия',
};

export async function generateInternalReport(data: ReportData): Promise<Buffer> {
  try {
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Register fontkit
    pdfDoc.registerFontkit(fontkit);
    
    // Fetch Roboto font with Cyrillic support from Google Fonts
    const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf';
    const fontBytes = await fetch(fontUrl).then(res => res.arrayBuffer());
    const customFont = await pdfDoc.embedFont(fontBytes);
    
    // For bold text, use the same font (Roboto Regular) but we'll just use it
    const customFontBold = customFont;

    // Calculate totals
    const totalEmissions = data.emissions.reduce((sum, e) => sum + e.calculated_co2e, 0);
    const scope1Total = data.emissions.filter(e => e.scope === 1).reduce((sum, e) => sum + e.calculated_co2e, 0);
    const scope2Total = data.emissions.filter(e => e.scope === 2).reduce((sum, e) => sum + e.calculated_co2e, 0);
    const totalRecords = data.emissions.length;

    // Calculate category totals
    const categoryTotals: Record<string, number> = {};
    data.emissions.forEach(e => {
      const category = CATEGORY_LABELS[e.category] || e.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + e.calculated_co2e;
    });

    // Format dates in Bulgarian
    const startDateFormatted = new Date(data.startDate).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' });
    const endDateFormatted = new Date(data.endDate).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' });
    const generatedDate = new Date().toLocaleDateString('bg-BG', { year: 'numeric', month: 'long', day: 'numeric' });

    // Add first page
    let page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // Colors
    const earthGreen = rgb(0.176, 0.314, 0.086);
    const mediumGreen = rgb(0.290, 0.467, 0.161);
    const lightGreen = rgb(0.545, 0.765, 0.290);

    // Header
    page.drawText('ZED Carbon Footprint Management', {
      x: width - 250,
      y: yPosition,
      size: 10,
      font: customFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    yPosition -= 30;

    // Title
    page.drawText('Вътрешен отчет за емисии', {
      x: width / 2 - 120,
      y: yPosition,
      size: 22,
      font: customFontBold,
      color: earthGreen,
    });

    yPosition -= 25;

    page.drawText(data.company.company_name, {
      x: width / 2 - (data.company.company_name.length * 3),
      y: yPosition,
      size: 14,
      font: customFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    yPosition -= 40;

    // Company Information
    page.drawText('Информация за компанията', {
      x: 50,
      y: yPosition,
      size: 16,
      font: customFontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    const companyInfo = [
      `Име: ${data.company.company_name}`,
      `ЕІК: ${data.company.registration_number}`,
      `Отрасъл: ${data.company.industry_sector}`,
      ...(data.company.employee_count ? [`Брой служители: ${data.company.employee_count}`] : []),
    ];

    companyInfo.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 11,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 18;
    });

    yPosition -= 10;

    // Reporting Period
    page.drawText('Отчетен период', {
      x: 50,
      y: yPosition,
      size: 16,
      font: customFontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    const periodInfo = [
      `От: ${startDateFormatted}`,
      `До: ${endDateFormatted}`,
      `Генериран на: ${generatedDate}`,
    ];

    periodInfo.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 11,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 18;
    });

    yPosition -= 20;

    // Executive Summary
    page.drawText('Обобщение', {
      x: 50,
      y: yPosition,
      size: 16,
      font: customFontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;

    // Summary boxes
    const boxWidth = 150;
    const boxHeight = 60;
    const boxSpacing = 15;
    const boxY = yPosition;

    // Box 1: Total
    page.drawRectangle({
      x: 50,
      y: boxY - boxHeight,
      width: boxWidth,
      height: boxHeight,
      color: earthGreen,
    });

    page.drawText('Общо емисии', {
      x: 60,
      y: boxY - 20,
      size: 10,
      font: customFont,
      color: rgb(1, 1, 1),
    });

    // Draw CO2e with proper subscript
    page.drawText(`${totalEmissions.toFixed(2)} tCO`, {
      x: 60,
      y: boxY - 45,
      size: 16,
      font: customFontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText('2', {
      x: 60 + customFontBold.widthOfTextAtSize(`${totalEmissions.toFixed(2)} tCO`, 16),
      y: boxY - 48,
      size: 11,
      font: customFontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText('e', {
      x: 60 + customFontBold.widthOfTextAtSize(`${totalEmissions.toFixed(2)} tCO2`, 16),
      y: boxY - 45,
      size: 16,
      font: customFontBold,
      color: rgb(1, 1, 1),
    });

    // Box 2: Scope 1
    page.drawRectangle({
      x: 50 + boxWidth + boxSpacing,
      y: boxY - boxHeight,
      width: boxWidth,
      height: boxHeight,
      color: mediumGreen,
    });

    page.drawText('Обхват 1', {
      x: 60 + boxWidth + boxSpacing,
      y: boxY - 20,
      size: 10,
      font: customFont,
      color: rgb(1, 1, 1),
    });

    // Scope 1 with subscript
    const scope1X = 60 + boxWidth + boxSpacing;
    page.drawText(`${scope1Total.toFixed(2)} tCO`, {
      x: scope1X,
      y: boxY - 45,
      size: 16,
      font: customFontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText('2', {
      x: scope1X + customFontBold.widthOfTextAtSize(`${scope1Total.toFixed(2)} tCO`, 16),
      y: boxY - 48,
      size: 11,
      font: customFontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText('e', {
      x: scope1X + customFontBold.widthOfTextAtSize(`${scope1Total.toFixed(2)} tCO2`, 16),
      y: boxY - 45,
      size: 16,
      font: customFontBold,
      color: rgb(1, 1, 1),
    });

    // Box 3: Scope 2
    page.drawRectangle({
      x: 50 + (boxWidth + boxSpacing) * 2,
      y: boxY - boxHeight,
      width: boxWidth,
      height: boxHeight,
      color: lightGreen,
    });

    page.drawText('Обхват 2', {
      x: 60 + (boxWidth + boxSpacing) * 2,
      y: boxY - 20,
      size: 10,
      font: customFont,
      color: rgb(1, 1, 1),
    });

    // Scope 2 with subscript
    const scope2X = 60 + (boxWidth + boxSpacing) * 2;
    page.drawText(`${scope2Total.toFixed(2)} tCO`, {
      x: scope2X,
      y: boxY - 45,
      size: 16,
      font: customFontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText('2', {
      x: scope2X + customFontBold.widthOfTextAtSize(`${scope2Total.toFixed(2)} tCO`, 16),
      y: boxY - 48,
      size: 11,
      font: customFontBold,
      color: rgb(1, 1, 1),
    });
    page.drawText('e', {
      x: scope2X + customFontBold.widthOfTextAtSize(`${scope2Total.toFixed(2)} tCO2`, 16),
      y: boxY - 45,
      size: 16,
      font: customFontBold,
      color: rgb(1, 1, 1),
    });

    yPosition = boxY - boxHeight - 30;

    // Key Metrics
    const metrics = [
      `Общ брой записи: ${totalRecords}`,
      `Обхват 1 (директни): ${((scope1Total / totalEmissions) * 100 || 0).toFixed(1)}%`,
      `Обхват 2 (индиректни): ${((scope2Total / totalEmissions) * 100 || 0).toFixed(1)}%`,
      `Средно на запис: ${(totalEmissions / totalRecords || 0).toFixed(2)} tCO2e`,
    ];

    metrics.forEach(line => {
      page.drawText(`• ${line}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 18;
    });

    yPosition -= 10;

    // Additional detailed metrics
    page.drawText('Детайлна статистика:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: customFontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 20;

    // Calculate additional statistics
    const scope1Count = data.emissions.filter(e => e.scope === 1).length;
    const scope2Count = data.emissions.filter(e => e.scope === 2).length;
    const avgScope1 = scope1Count > 0 ? scope1Total / scope1Count : 0;
    const avgScope2 = scope2Count > 0 ? scope2Total / scope2Count : 0;

    // Get date range of data
    const dates = data.emissions.map(e => new Date(e.reporting_period).getTime()).sort((a, b) => a - b);
    const firstDate = dates[0] ? new Date(dates[0]).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' }) : '-';
    const lastDate = dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' }) : '-';

    const detailedMetrics = [
      `Период на данните: ${firstDate} - ${lastDate}`,
      ``,
      `Обхват 1 - Директни емисии:`,
      `  • Брой записи: ${scope1Count}`,
      `  • Средно на запис: ${avgScope1.toFixed(2)} tCO2e`,
      `  • Дял от общите: ${((scope1Total / totalEmissions) * 100 || 0).toFixed(1)}%`,
      ``,
      `Обхват 2 - Индиректни емисии:`,
      `  • Брой записи: ${scope2Count}`,
      `  • Средно на запис: ${avgScope2.toFixed(2)} tCO2e`,
      `  • Дял от общите: ${((scope2Total / totalEmissions) * 100 || 0).toFixed(1)}%`,
    ];

    detailedMetrics.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 10,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    });

    // New page for detailed data
    page = pdfDoc.addPage([595, 842]);
    yPosition = height - 50;

    // Detailed Data Table
    page.drawText('Детайлни данни за емисиите', {
      x: 50,
      y: yPosition,
      size: 16,
      font: customFontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;

    // Table header
    page.drawRectangle({
      x: 50,
      y: yPosition - 20,
      width: 495,
      height: 20,
      color: earthGreen,
    });

    const headers = ['Период', 'Обхват', 'Категория', 'Количество', 'CO2e'];
    const colWidths = [80, 60, 180, 90, 85];
    let xPos = 55;

    headers.forEach((header, i) => {
      page.drawText(header, {
        x: xPos,
        y: yPosition - 15,
        size: 9,
        font: customFontBold,
        color: rgb(1, 1, 1),
      });
      xPos += colWidths[i];
    });

    yPosition -= 25;

    // Table rows
    data.emissions.slice(0, 20).forEach((emission, index) => {
      if (yPosition < 100) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        page.drawRectangle({
          x: 50,
          y: yPosition - 18,
          width: 495,
          height: 18,
          color: rgb(0.96, 0.96, 0.96),
        });
      }

      const period = new Date(emission.reporting_period).toLocaleDateString('bg-BG', { year: 'numeric', month: 'short' });
      const category = CATEGORY_LABELS[emission.category] || emission.category;

      const rowData = [
        period,
        `Обхват ${emission.scope}`,
        category.substring(0, 25), // Truncate if too long
        `${emission.activity_value} ${emission.unit}`,
        `${emission.calculated_co2e.toFixed(2)} tCO2e`,
      ];

      xPos = 55;
      rowData.forEach((text, i) => {
        page.drawText(text, {
          x: xPos,
          y: yPosition - 13,
          size: 8,
          font: customFont,
          color: rgb(0, 0, 0),
        });
        xPos += colWidths[i];
      });

      yPosition -= 18;
    });

    if (data.emissions.length > 20) {
      yPosition -= 10;
      page.drawText(`... и още ${data.emissions.length - 20} записа`, {
        x: width / 2 - 70,
        y: yPosition,
        size: 9,
        font: customFont,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    // Category breakdown page
    page = pdfDoc.addPage([595, 842]);
    yPosition = height - 50;

    page.drawText('Разпределение по категория', {
      x: 50,
      y: yPosition,
      size: 16,
      font: customFontBold,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;

    // Category table header
    page.drawRectangle({
      x: 50,
      y: yPosition - 20,
      width: 445,
      height: 20,
      color: mediumGreen,
    });

    const catHeaders = ['Категория', 'Емисии', 'Дял'];
    const catColWidths = [280, 100, 65];
    xPos = 55;

    catHeaders.forEach((header, i) => {
      page.drawText(header, {
        x: xPos,
        y: yPosition - 15,
        size: 9,
        font: customFontBold,
        color: rgb(1, 1, 1),
      });
      xPos += catColWidths[i];
    });

    yPosition -= 25;

    // Category rows
    Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .forEach(([category, total], index) => {
        if (index % 2 === 0) {
          page.drawRectangle({
            x: 50,
            y: yPosition - 18,
            width: 445,
            height: 18,
            color: rgb(0.96, 0.96, 0.96),
          });
        }

        const catRowData = [
          category.substring(0, 35),
          `${total.toFixed(2)} tCO2e`,
          `${((total / totalEmissions) * 100).toFixed(1)}%`,
        ];

        xPos = 55;
        catRowData.forEach((text, i) => {
          page.drawText(text, {
            x: xPos,
            y: yPosition - 13,
            size: 8,
            font: customFont,
            color: rgb(0, 0, 0),
          });
          xPos += catColWidths[i];
        });

        yPosition -= 18;
      });

    // Add page numbers to all pages
    const pages = pdfDoc.getPages();
    pages.forEach((pg, index) => {
      pg.drawText(`Страница ${index + 1} от ${pages.length}`, {
        x: width / 2 - 50,
        y: 30,
        size: 8,
        font: customFont,
        color: rgb(0.6, 0.6, 0.6),
      });
      pg.drawText('Генерирано от ZED Carbon Footprint Management System', {
        x: width / 2 - 150,
        y: 20,
        size: 8,
        font: customFont,
        color: rgb(0.6, 0.6, 0.6),
      });
    });

    // Serialize PDF to bytes
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

