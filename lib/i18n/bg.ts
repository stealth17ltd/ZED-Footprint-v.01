// Bulgarian language resources
export const bg = {
  // General
  general: {
    loading: 'Зареждане...',
    save: 'Запази',
    cancel: 'Откажи',
    delete: 'Изтрий',
    edit: 'Редактирай',
    add: 'Добави',
    search: 'Търси',
    filter: 'Филтрирай',
    export: 'Експортирай',
    import: 'Импортирай',
    back: 'Назад',
    next: 'Напред',
    submit: 'Изпрати',
    confirm: 'Потвърди',
    yes: 'Да',
    no: 'Не',
  },

  // Authentication
  auth: {
    login: 'Вход',
    logout: 'Изход',
    email: 'Имейл',
    password: 'Парола',
    forgotPassword: 'Забравена парола?',
    signIn: 'Вход в системата',
    signOut: 'Излез от системата',
    invalidCredentials: 'Невалиден имейл или парола',
    emailRequired: 'Имейлът е задължителен',
    passwordRequired: 'Паролата е задължителна',
  },

  // Navigation
  nav: {
    dashboard: 'Табло',
    dataEntry: 'Въвеждане на данни',
    reports: 'Отчети',
    strategies: 'Стратегии',
    settings: 'Настройки',
    help: 'Помощ',
    profile: 'Профил',
    company: 'Фирма',
  },

  // Dashboard
  dashboard: {
    title: 'Табло за управление',
    totalEmissions: 'Общ въглероден отпечатък',
    scope1: 'Обхват 1',
    scope2: 'Обхват 2',
    trend: 'Тенденция',
    breakdown: 'Разпределение',
    monthlyTrend: 'Месечна тенденция',
    emissionsByCategory: 'Емисии по категория',
    targetProgress: 'Напредък към целта',
    actions: 'Действия',
    pendingEntries: 'Чакащи записи',
    upcomingDeadlines: 'Предстоящи срокове',
  },

  // Data Entry
  dataEntry: {
    title: 'Въвеждане на данни за емисии',
    addEmission: 'Добави емисия',
    reportingPeriod: 'Отчетен период',
    scope: 'Обхват',
    category: 'Категория',
    subcategory: 'Подкатегория',
    activityValue: 'Стойност на дейността',
    unit: 'Единица',
    calculatedEmissions: 'Изчислени емисии',
    notes: 'Бележки',
    supportingDocument: 'Подкрепящ документ',
    uploadFile: 'Качи файл',
    manualEntry: 'Ръчно въвеждане',
    importFromExcel: 'Импортирай от Excel',
    importFromPDF: 'Импортирай от PDF',
  },

  // Categories
  categories: {
    vehicles: 'Превозни средства',
    onsiteFuel: 'Гориво на място',
    refrigerants: 'Хладилни агенти',
    electricity: 'Електричество',
    heating: 'Отопление',
    cooling: 'Охлаждане',
  },

  // Units
  units: {
    liters: 'литри',
    kwh: 'kWh',
    kg: 'kg',
    tons: 'тона',
    m3: 'm³',
    tco2e: 'tCO₂e',
  },

  // Fuels
  fuels: {
    petrol: 'Бензин',
    diesel: 'Дизел',
    naturalGas: 'Природен газ',
    lpg: 'ГПГ',
    coal: 'Въглища',
  },

  // Reports
  reports: {
    title: 'Отчети',
    generateReport: 'Генерирай отчет',
    reportType: 'Вид отчет',
    complianceReport: 'Отчет за съответствие',
    internalReport: 'Вътрешен отчет',
    stakeholderReport: 'Отчет за заинтересовани страни',
    downloadPDF: 'Изтегли PDF',
    downloadExcel: 'Изтегли Excel',
    period: 'Период',
    generatedOn: 'Генериран на',
  },

  // Company Settings
  company: {
    title: 'Профил на компанията',
    companyName: 'Име на компанията',
    registrationNumber: 'ЕИК/БУЛСТАТ',
    industrySector: 'Отрасъл',
    employeeCount: 'Брой служители',
    contactEmail: 'Контактен имейл',
    billingAddress: 'Адрес за фактуриране',
    sustainabilityGoals: 'Цели за устойчивост',
    euGreenDeal: 'Ангажимент към ЕС Зелена сделка',
    baselineYear: 'Базова година',
    logoUpload: 'Качи лого',
  },

  // Validation Messages
  validation: {
    required: 'Това поле е задължително',
    invalidEmail: 'Невалиден имейл адрес',
    invalidNumber: 'Невалидно число',
    positiveNumber: 'Стойността трябва да е положителна',
    invalidDate: 'Невалидна дата',
    unusualValue: 'Стойността е необичайна. Моля, проверете.',
    outOfRange: 'Стойността е извън допустимия диапазон',
    selectOption: 'Моля, изберете опция',
  },

  // Success Messages
  success: {
    dataSaved: 'Данните са запазени успешно',
    reportGenerated: 'Отчетът е генериран успешно',
    fileUploaded: 'Файлът е качен успешно',
    profileUpdated: 'Профилът е актуализиран успешно',
  },

  // Error Messages
  error: {
    generic: 'Възникна грешка. Моля, опитайте отново.',
    fetchData: 'Възникна грешка при зареждане на данните',
    saveData: 'Възникна грешка при запазване на данните',
    uploadFile: 'Възникна грешка при качване на файла',
    generateReport: 'Възникна грешка при генериране на отчета',
    invalidFile: 'Невалиден файлов формат',
    networkError: 'Грешка в мрежата. Проверете връзката си.',
  },

  // Tooltips
  tooltips: {
    scope1: 'Преки емисии от източници, притежавани или контролирани от организацията',
    scope2: 'Непреки емисии от производството на закупена енергия',
    scope3: 'Всички други непреки емисии в стойностната верига на организацията',
    emissionFactor: 'Коефициент, използван за изчисляване на CO₂ еквивалента',
    gwp: 'Потенциал за глобално затопляне спрямо CO₂',
    baselineYear: 'Референтна година за сравнение на прогреса',
  },

  // Scope 3
  scope3: {
    title: 'Обхват 3',
    subtitle: 'Емисии от стойностната верига',
    import: 'Импорт на транзакции',
    classify: 'Класификация',
    surveys: 'Проучвания',
    results: 'Резултати',
    
    // Import
    importTitle: 'Импорт на финансови транзакции',
    uploadCSV: 'Качи CSV файл',
    uploadDescription: 'Качете CSV файл с финансови транзакции (фактури, разходи)',
    dropZone: 'Пуснете CSV файл тук или кликнете за избор',
    fileSelected: 'Избран файл',
    mappingTitle: 'Свързване на колони',
    mappingDescription: 'Свържете колоните от CSV файла с полетата в системата',
    requiredFields: 'Задължителни полета',
    optionalFields: 'Незадължителни полета',
    preview: 'Преглед',
    previewDescription: 'Проверете данните преди импорт',
    validRows: 'Валидни редове',
    invalidRows: 'Невалидни редове',
    startImport: 'Започни импорт',
    importSuccess: 'Импортът завърши успешно',
    importError: 'Грешка при импорт',
    
    // Columns
    columns: {
      txnDate: 'Дата на транзакция',
      supplier: 'Доставчик',
      description: 'Описание',
      amount: 'Сума',
      currency: 'Валута',
      expenseCategory: 'Категория разход',
      accountCode: 'Код на сметка',
      invoiceNumber: 'Номер на фактура',
      vatAmount: 'Сума ДДС',
      costCenter: 'Център на разходи',
      department: 'Отдел',
    },
    
    // Import History
    history: 'История на импортите',
    batchNumber: 'Номер на партида',
    importedOn: 'Импортирано на',
    importedBy: 'Импортирано от',
    rowCount: 'Брой редове',
    status: 'Статус',
    statusPending: 'Чакащ',
    statusProcessing: 'Обработва се',
    statusCompleted: 'Завършен',
    statusFailed: 'Неуспешен',
    
    // Classification
    classifyTitle: 'Класификация на транзакции',
    classifyDescription: 'Свържете транзакциите с категории на Обхват 3',
    unclassified: 'Некласифицирани',
    classified: 'Класифицирани',
    topSuppliers: 'Топ доставчици',
    rules: 'Правила',
    assignCategory: 'Присвои категория',
    createRule: 'Създай правило',
    applyToFuture: 'Приложи за бъдещи',
    lockClassification: 'Заключи класификацията',
    confidence: 'Увереност',
    methodTier: 'Ниво на метод',
    
    // Categories
    categories: {
      cat1: 'Кат. 1: Закупени стоки и услуги',
      cat4: 'Кат. 4: Транспорт нагоре по веригата',
      cat5: 'Кат. 5: Генерирани отпадъци',
      cat6: 'Кат. 6: Бизнес пътувания',
      cat7: 'Кат. 7: Пътуване на служители',
    },
    
    // Method Tiers
    tiers: {
      tierA: 'Ниво A: Специфични данни от доставчик',
      tierB: 'Ниво B: Базирано на дейност',
      tierC: 'Ниво C: Базирано на разходи',
      tierD: 'Ниво D: Приблизителна оценка',
    },
    
    // Rules
    ruleName: 'Име на правило',
    conditionType: 'Тип условие',
    conditionField: 'Поле',
    conditionValue: 'Стойност',
    outputCategory: 'Изходна категория',
    priority: 'Приоритет',
    ruleActive: 'Активно',
    ruleInactive: 'Неактивно',
    applicationCount: 'Брой приложения',
    lastApplied: 'Последно приложено',
    
    // Condition Types
    contains: 'Съдържа',
    equals: 'Равно на',
    startsWith: 'Започва с',
    endsWith: 'Завършва с',
    regex: 'Регулярен израз',
    
    // Surveys
    surveysTitle: 'Проучвания за дейности',
    travelSurvey: 'Бизнес пътувания',
    commutingSurvey: 'Пътуване на служители',
    transportSurvey: 'Транспорт нагоре по веригата',
    wasteSurvey: 'Отпадъци',
    
    // Travel Survey
    flights: 'Полети',
    flightShort: 'Къси разстояния (<1500 км)',
    flightMedium: 'Средни разстояния (1500-3700 км)',
    flightLong: 'Дълги разстояния (>3700 км)',
    flightClass: 'Клас',
    economy: 'Икономичен',
    business: 'Бизнес',
    first: 'Първи',
    hotels: 'Хотели',
    hotelNights: 'Нощувки',
    carRental: 'Наем на автомобил',
    kilometers: 'Километри',
    trains: 'Влакове',
    
    // Commuting Survey
    employees: 'Брой служители',
    commuteDistance: 'Разстояние за пътуване (в една посока)',
    workingDays: 'Работни дни на месец',
    modeSplit: 'Разпределение по начин на транспорт',
    car: 'Автомобил',
    publicTransport: 'Обществен транспорт',
    metro: 'Метро',
    bus: 'Автобус',
    tram: 'Трамвай',
    bicycle: 'Велосипед',
    walking: 'Пеша',
    remote: 'Дистанционна работа',
    
    // Transport Survey
    tonKm: 'Тон-километри',
    shipments: 'Пратки',
    transportMode: 'Начин на транспорт',
    road: 'Шосе',
    rail: 'Железопътен',
    sea: 'Морски',
    air: 'Въздушен',
    
    // Waste Survey
    wasteType: 'Тип отпадък',
    generalWaste: 'Общ отпадък',
    recycling: 'Рециклиране',
    organic: 'Органичен',
    hazardous: 'Опасен',
    disposalMethod: 'Метод на обезвреждане',
    landfill: 'Депониране',
    incineration: 'Изгаряне',
    composting: 'Компостиране',
    mass: 'Маса',
    
    // Results
    resultsTitle: 'Резултати Обхват 3',
    totalScope3: 'Общо Обхват 3',
    breakdown: 'Разбивка по категории',
    topEmitters: 'Топ емитери',
    dataQuality: 'Качество на данните',
    dataQualityGrade: 'Оценка',
    improve: 'Подобри',
    recommendations: 'Препоръки',
    
    // Data Quality
    qualityExcellent: 'Отлично',
    qualityGood: 'Добро',
    qualityFair: 'Задоволително',
    qualityPoor: 'Слабо',
    improveTip: 'Подобрете качеството чрез събиране на данни от топ {count} доставчици',
    
    // Classification Rules
    rulesTitle: 'Правила за класификация',
    rulesDescription: 'Автоматизирайте класификацията с интелигентни правила',
    createRule: 'Създай правило',
    editRule: 'Редактирай правило',
    deleteRule: 'Изтрий правило',
    ruleName: 'Име на правило',
    ruleCondition: 'Условие',
    ruleOutput: 'Резултат',
    rulePriority: 'Приоритет',
    ruleActive: 'Активно',
    ruleInactive: 'Неактивно',
    
    // Rule Conditions
    conditionType: 'Тип условие',
    conditionField: 'Поле',
    conditionValue: 'Стойност',
    contains: 'Съдържа',
    equals: 'Равно на',
    regex: 'Регулярен израз',
    supplier: 'Доставчик',
    description: 'Описание',
    expenseCategory: 'Категория разход',
    
    // Rule Actions
    applyRules: 'Приложи правила',
    applyRulesNow: 'Приложи сега',
    testRule: 'Тествай правило',
    previewMatches: 'Преглед на съвпадения',
    matchesFound: 'Намерени съвпадения',
    noMatchesFound: 'Няма съвпадения',
    ruleWillMatch: 'Това правило ще съвпадне с {count} транзакции',
    
    // Rule Stats
    applicationsCount: 'Брой приложения',
    lastApplied: 'Последно приложено',
    neverApplied: 'Никога не е прилагано',
    coverage: 'Покритие',
    
    // Rule Messages
    ruleCreated: 'Правилото е създадено успешно',
    ruleUpdated: 'Правилото е актуализирано успешно',
    ruleDeleted: 'Правилото е изтрито успешно',
    rulesApplied: '{count} транзакции класифицирани чрез правила',
    noActiveRules: 'Няма активни правила',
    createFirstRule: 'Създайте първото си правило',
    
    // Rule Tips
    ruleTip1: 'Използвайте високи приоритети за по-специфични правила',
    ruleTip2: 'Първото съвпадащо правило се прилага',
    ruleTip3: 'Тествайте правилата преди активиране',
    ruleTip4: 'Заключените класификации няма да бъдат презаписани',
    
    // Manual Entry & Delete
    manualEntry: 'Ръчно въвеждане',
    manualEntryTitle: 'Ръчно въвеждане на транзакция',
    manualEntryDescription: 'Добавете транзакция ръчно (използвайте само ако нямате CSV данни)',
    addTransaction: 'Добави транзакция',
    deleteTransaction: 'Изтриване на транзакция',
    deleteTransactionConfirm: 'Сигурни ли сте, че искате да изтриете тази транзакция?',
    deleteBatch: 'Изтрий импорт',
    deleteBatchConfirm: 'Сигурни ли сте, че искате да изтриете всички транзакции от този импорт?',
    deleteSelected: 'Изтрий избраните',
    transactionDeleted: 'Транзакцията е изтрита',
    transactionsDeleted: 'Транзакциите са изтрити',
    batchDeleted: 'Импортът е изтрит',
    manuallyAdded: 'Ръчно',
    sourceManual: 'Ръчно въведена',
    sourceImport: 'Импорт',
    
    // Calculations
    calculate: 'Изчисли',
    calculating: 'Изчисляване...',
    calculateEmissions: 'Изчисли емисии',
    calculatedEmissions: 'Изчислени емисии',
    recalculate: 'Преизчисли',
    calculationComplete: 'Изчислението завършено успешно',
    calculationFailed: 'Грешка при изчисление',
    totalEmissions: 'Общо емисии',
    emissionsCalculated: '{count} изчисления направени',
    noCalculations: 'Няма изчисления',
    co2eKg: 'kg CO2e',
    co2eTons: 'тона CO2e',
    calculationSummary: 'Обобщение на изчисленията',
    byCategory: 'По категория',
    byTier: 'По метод',
    showCalculation: 'Покажи изчисление',
    calculationTrace: 'Проследяване на изчисление',
    calculationFormula: 'Формула',
    emissionFactor: 'Емисионен фактор',
    factorSource: 'Източник на фактор',
    calculationMethod: 'Метод на изчисление',
    calculationDate: 'Дата на изчисление',
    calculationDetails: 'Детайли на изчисление',
    viewCalculation: 'Виж изчисление',
    calculationNotFound: 'Изчислението не е намерено',
    noEmissionFactor: 'Няма емисионен фактор',
    missingFactor: 'Липсва фактор за категория {category}',
    transactionsNeedCalculation: '{count} транзакции чакат изчисление',
    allTransactionsCalculated: 'Всички транзакции са изчислени',
  },
};
