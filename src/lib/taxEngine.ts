export interface TaxBracket {
  income_bracket_min: number;
  income_bracket_max: number | null; // null means no upper bound
  tax_rate: number; // percent
}

export interface TaxComputationInput {
  grossIncome: number;
  additionalDeductions: number;
  standardDeduction: number;
  brackets: TaxBracket[];
  // Sierra Leone statutory deductions (e.g., NASSIT employee contribution)
  statutoryPensionRatePercent?: number; // e.g., 5 for 5%
  statutoryPensionAnnualCap?: number; // optional cap
}

export interface TaxComputationResult {
  deductions: number;
  taxableIncome: number;
  taxOwed: number;
  effectiveRate: number;
  marginalRate: number;
  statutoryPension?: number;
  breakdown: Array<{
    income_bracket_min: number;
    income_bracket_max: number | null;
    tax_rate: number;
    taxable_at_this_bracket: number;
    tax_at_this_bracket: number;
  }>;
  deductionsCapped: boolean;
  uncappedDeductions: number;
}

export function calculateProgressiveTax(input: TaxComputationInput): TaxComputationResult {
  const pensionRate = (input.statutoryPensionRatePercent || 0) / 100;
  const rawPension = (input.grossIncome || 0) * pensionRate;
  const pension = Math.min(
    isFinite(rawPension) ? rawPension : 0,
    input.statutoryPensionAnnualCap ?? Number.POSITIVE_INFINITY
  );

  const uncappedDeductions = Math.max(
    0,
    (input.standardDeduction || 0) + (input.additionalDeductions || 0) + (pension || 0)
  );
  const totalDeductions = Math.min(input.grossIncome || 0, uncappedDeductions);
  const taxableIncome = Math.max(0, (input.grossIncome || 0) - totalDeductions);

  let taxOwed = 0;
  let marginalRate = 0;
  const breakdown: TaxComputationResult["breakdown"] = [];

  // Ensure brackets are sorted by min ascending
  const sorted = [...input.brackets].sort((a, b) => a.income_bracket_min - b.income_bracket_min);

  for (const bracket of sorted) {
    const bracketMin = bracket.income_bracket_min;
    const bracketMax = bracket.income_bracket_max ?? Number.POSITIVE_INFINITY;
    if (taxableIncome > bracketMin) {
      const taxableAtThisBracket = Math.min(taxableIncome - bracketMin, bracketMax - bracketMin);
      if (taxableAtThisBracket > 0) {
        taxOwed += taxableAtThisBracket * (bracket.tax_rate / 100);
        marginalRate = bracket.tax_rate;
        breakdown.push({
          income_bracket_min: bracket.income_bracket_min,
          income_bracket_max: bracket.income_bracket_max,
          tax_rate: bracket.tax_rate,
          taxable_at_this_bracket: taxableAtThisBracket,
          tax_at_this_bracket: taxableAtThisBracket * (bracket.tax_rate / 100),
        });
      }
    }
  }

  const effectiveRate = input.grossIncome > 0 ? (taxOwed / input.grossIncome) * 100 : 0;

  return {
    deductions: totalDeductions,
    taxableIncome,
    taxOwed,
    effectiveRate,
    marginalRate,
    statutoryPension: pension || 0,
    breakdown,
    deductionsCapped: totalDeductions < uncappedDeductions,
    uncappedDeductions,
  };
}


