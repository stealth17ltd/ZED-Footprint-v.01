/**
 * Compliance rule engine checks — Stealth17-like SME profile.
 * Usage: npm run verify:compliance
 */

function summarizeCompliance(rows) {
  const fulfilled = rows.filter((r) => r.status === 'compliant').length;
  const partial = rows.filter((r) => r.status === 'partial').length;
  const gap = rows.filter((r) => r.status === 'gap').length;
  const notApplicable = rows.filter((r) => r.status === 'na').length;
  const requiresReview = rows.filter((r) => r.status === 'requires_review').length;
  const applicableTotal = rows.filter((r) => r.status !== 'na').length;
  const actionsRequired = partial + gap + requiresReview;
  const readinessScore =
    applicableTotal > 0 ? Math.round((fulfilled / applicableTotal) * 100) : 0;
  return {
    totalRows: rows.length,
    fulfilled,
    partial,
    gap,
    notApplicable,
    requiresReview,
    applicableTotal,
    readinessScore,
    actionsRequired,
  };
}

function evaluateCsrdApplicability(company) {
  const employees = company.employee_count ?? 0;
  const turnover = company.annual_turnover_eur;
  const employeeThreshold = 1000;
  const turnoverThresholdEur = 450_000_000;

  if (employees <= employeeThreshold) {
    return { mandatoryScope: 'out_of_scope' };
  }
  if (turnover == null) {
    return { mandatoryScope: 'requires_review' };
  }
  if (employees > employeeThreshold && turnover > turnoverThresholdEur) {
    return { mandatoryScope: 'in_scope' };
  }
  return { mandatoryScope: 'out_of_scope' };
}

/** Stealth17-like: 22 employees, full scope data, targets, scope1>0, no ETS questionnaire */
const stealthProfile = { employee_count: 22 };
const csrd = evaluateCsrdApplicability(stealthProfile);

if (csrd.mandatoryScope !== 'out_of_scope') {
  console.error(`FAIL CSRD scope: expected out_of_scope for 22 employees, got ${csrd.mandatoryScope}`);
  process.exit(1);
}
console.log('OK CSRD mandatory scope: out_of_scope (22 employees)');

const demoRows = [
  { status: 'compliant' },       // ZOOS
  { status: 'requires_review' }, // Naredba 7
  { status: 'requires_review' }, // Naredba 6
  { status: 'requires_review' }, // EU ETS (no questionnaire, scope1>0)
  { status: 'partial' },         // CSRD voluntary route
  { status: 'requires_review' }, // Taxonomy
  { status: 'partial' },         // GHG Protocol
  { status: 'requires_review' }, // SBTi
  { status: 'requires_review' }, // ISO
];

const summary = summarizeCompliance(demoRows);

const checks = [
  ['totalRows', summary.totalRows, 9],
  ['fulfilled', summary.fulfilled, 1],
  ['partial', summary.partial, 2],
  ['requiresReview', summary.requiresReview, 6],
  ['notApplicable', summary.notApplicable, 0],
  ['applicableTotal', summary.applicableTotal, 9],
  ['readinessScore', summary.readinessScore, 11],
  ['actionsRequired', summary.actionsRequired, 8],
];

let failed = 0;
for (const [label, actual, expected] of checks) {
  if (actual !== expected) {
    console.error(`FAIL ${label}: expected ${expected}, got ${actual}`);
    failed += 1;
  } else {
    console.log(`OK ${label}: ${actual}`);
  }
}

const allPartial = summarizeCompliance([
  { status: 'partial' },
  { status: 'partial' },
  { status: 'partial' },
]);
if (allPartial.readinessScore !== 0) {
  console.error(`FAIL partial-only readiness: expected 0, got ${allPartial.readinessScore}`);
  failed += 1;
} else {
  console.log('OK partial-only readiness: 0');
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}

console.log('\nCompliance scoring checks passed.');
