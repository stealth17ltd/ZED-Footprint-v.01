import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import * as XLSX from 'xlsx';

// Emission factors (same as in manual entry)
const EMISSION_FACTORS: Record<string, { factor: number; gwp?: number }> = {
  'vehicles_diesel': { factor: 2.68 },
  'vehicles_petrol': { factor: 2.31 },
  'vehicles_lpg': { factor: 1.67 },
  'natural_gas': { factor: 2.02 },
  'heating_oil': { factor: 3.18 },
  'coal': { factor: 2.42 },
  'refrigerant_r134a': { factor: 1, gwp: 1430 },
  'refrigerant_r404a': { factor: 1, gwp: 3922 },
  'electricity': { factor: 0.505 },
  'district_heating': { factor: 0.220 },
  'district_cooling': { factor: 0.220 },
};

const VALID_CATEGORIES = Object.keys(EMISSION_FACTORS);

interface ParsedRow {
  month: string;
  scope: number;
  category: string;
  quantity: number;
  unit: string;
  notes?: string;
  rowNumber: number;
  // Enhanced fields
  location?: string;
  equipment_id?: string;
  supplier?: string;
  invoice_number?: string;
  measurement_method?: string;
  data_quality?: string;
  cost?: number;
  currency?: string;
  responsible_person?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Неоторизиран достъп' }, { status: 401 });
    }

    // Get user's company
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!userData?.company_id) {
      return NextResponse.json(
        { error: 'Потребителят не е свързан с компания' },
        { status: 400 }
      );
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файлът е задължителен' }, { status: 400 });
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Файлът е твърде голям. Максимален размер: 5MB' },
        { status: 400 }
      );
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Невалиден формат. Разрешени формати: .xlsx, .xls, .csv' },
        { status: 400 }
      );
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse file
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (error) {
      return NextResponse.json(
        { error: 'Грешка при четене на файла. Уверете се, че файлът е валиден Excel или CSV.' },
        { status: 400 }
      );
    }

    // Get data sheet (try "Данни" first, then first sheet)
    let sheetName = workbook.SheetNames.find(name => name === 'Данни') || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      return NextResponse.json(
        { error: 'Не е намерен лист с данни във файла' },
        { status: 400 }
      );
    }

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    if (rawData.length < 2) {
      return NextResponse.json(
        { error: 'Файлът е празен или съдържа само заглавна част' },
        { status: 400 }
      );
    }

    // Parse rows
    const parsedRows: ParsedRow[] = [];
    const errors: ValidationError[] = [];

    // Skip header row (row 0)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNumber = i + 1; // Excel row number (1-based, +1 for header)

      // Skip empty rows
      if (!row || row.every(cell => !cell)) continue;

      const [
        monthStr, 
        scopeStr, 
        category, 
        quantityStr, 
        unit, 
        location,
        equipment_id,
        supplier,
        invoice_number,
        measurement_method,
        data_quality,
        costStr,
        currency,
        responsible_person,
        notes
      ] = row;

      // Validate month format
      const monthMatch = String(monthStr || '').match(/^(\d{4})-(\d{2})$/);
      if (!monthMatch) {
        errors.push({
          row: rowNumber,
          field: 'Месец',
          message: 'Невалиден формат. Използвайте ГГГГ-ММ (например: 2025-01)'
        });
        continue;
      }

      // Validate scope
      const scope = parseInt(String(scopeStr));
      if (scope !== 1 && scope !== 2) {
        errors.push({
          row: rowNumber,
          field: 'Обхват',
          message: 'Трябва да е 1 или 2'
        });
        continue;
      }

      // Validate category
      if (!category || !VALID_CATEGORIES.includes(String(category).trim())) {
        errors.push({
          row: rowNumber,
          field: 'Категория',
          message: `Невалидна категория. Допустими: ${VALID_CATEGORIES.join(', ')}`
        });
        continue;
      }

      // Validate quantity
      const quantity = parseFloat(String(quantityStr || '').replace(',', '.'));
      if (isNaN(quantity) || quantity <= 0) {
        errors.push({
          row: rowNumber,
          field: 'Количество',
          message: 'Трябва да е положително число'
        });
        continue;
      }

      // Validate unit
      if (!unit || String(unit).trim() === '') {
        errors.push({
          row: rowNumber,
          field: 'Единица',
          message: 'Единицата е задължителна'
        });
        continue;
      }

      // Validate optional fields
      const validMeasurementMethods = ['measured', 'calculated', 'estimated'];
      const validDataQualities = ['high', 'medium', 'low'];
      const validCurrencies = ['BGN', 'EUR', 'USD'];

      if (measurement_method && !validMeasurementMethods.includes(String(measurement_method).trim())) {
        errors.push({
          row: rowNumber,
          field: 'Метод на измерване',
          message: `Трябва да е един от: ${validMeasurementMethods.join(', ')}`
        });
        continue;
      }

      if (data_quality && !validDataQualities.includes(String(data_quality).trim())) {
        errors.push({
          row: rowNumber,
          field: 'Качество на данните',
          message: `Трябва да е един от: ${validDataQualities.join(', ')}`
        });
        continue;
      }

      if (currency && !validCurrencies.includes(String(currency).trim())) {
        errors.push({
          row: rowNumber,
          field: 'Валута',
          message: `Трябва да е един от: ${validCurrencies.join(', ')}`
        });
        continue;
      }

      // Parse cost
      let parsedCost: number | undefined = undefined;
      if (costStr) {
        const cost = parseFloat(String(costStr).replace(',', '.'));
        if (!isNaN(cost) && cost > 0) {
          parsedCost = cost;
        }
      }

      parsedRows.push({
        month: monthStr,
        scope,
        category: String(category).trim(),
        quantity,
        unit: String(unit).trim(),
        notes: notes ? String(notes) : undefined,
        rowNumber,
        // Enhanced fields
        location: location ? String(location).trim() : undefined,
        equipment_id: equipment_id ? String(equipment_id).trim() : undefined,
        supplier: supplier ? String(supplier).trim() : undefined,
        invoice_number: invoice_number ? String(invoice_number).trim() : undefined,
        measurement_method: measurement_method ? String(measurement_method).trim() : undefined,
        data_quality: data_quality ? String(data_quality).trim() : undefined,
        cost: parsedCost,
        currency: currency ? String(currency).trim() : undefined,
        responsible_person: responsible_person ? String(responsible_person).trim() : undefined,
      });
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Намерени са грешки във файла',
          errors,
          validRows: parsedRows.length,
          totalRows: rawData.length - 1,
        },
        { status: 400 }
      );
    }

    // If no valid rows
    if (parsedRows.length === 0) {
      return NextResponse.json(
        { error: 'Няма валидни редове за импортиране' },
        { status: 400 }
      );
    }

    // Calculate emissions and prepare for insertion
    const serviceSupabase = createServiceClient();
    const emissionsToInsert = parsedRows.map(row => {
      const factorData = EMISSION_FACTORS[row.category];
      const gwp = factorData.gwp || 1;
      const calculatedCO2e_kg = row.quantity * factorData.factor * gwp;
      const calculatedCO2e_tons = calculatedCO2e_kg / 1000;
      const reportingDate = new Date(`${row.month}-01`);

      return {
        company_id: userData.company_id,
        reporting_period: reportingDate.toISOString().split('T')[0],
        scope: row.scope,
        category: row.category,
        activity_value: row.quantity,
        unit: row.unit,
        emission_factor: factorData.factor,
        emission_factor_value: factorData.factor,
        gwp_factor: gwp,
        calculated_co2e: calculatedCO2e_tons,
        data_source: 'import',
        validation_status: 'validated',
        notes: row.notes,
        uploaded_by: user.id,
        // Enhanced fields
        location: row.location || null,
        equipment_id: row.equipment_id || null,
        supplier: row.supplier || null,
        invoice_number: row.invoice_number || null,
        measurement_method: row.measurement_method || 'measured',
        data_quality: row.data_quality || 'high',
        cost: row.cost || null,
        currency: row.currency || 'BGN',
        responsible_person: row.responsible_person || null,
      };
    });

    // Insert all emissions
    const { data: insertedData, error: insertError } = await serviceSupabase
      .from('emission_data')
      .insert(emissionsToInsert)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: `Успешно импортирани ${insertedData.length} записа`,
      imported: insertedData.length,
      totalCO2e: emissionsToInsert.reduce((sum, e) => sum + e.calculated_co2e, 0).toFixed(2),
    });

  } catch (error) {
    console.error('Error importing emissions:', error);
    return NextResponse.json(
      { error: 'Възникна грешка при импортиране на данните' },
      { status: 500 }
    );
  }
}

