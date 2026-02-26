/**
 * APR Calculation using the Actuarial Method (Newton-Raphson iteration)
 *
 * Per NY DFS Commercial Finance Disclosure Law and CA SB 1235,
 * the APR must be calculated using the actuarial method — the same
 * method specified by the federal Truth in Lending Act (Regulation Z).
 *
 * For a series of equal periodic payments:
 *   P = A * [1 - (1 + r)^(-n)] / r
 *
 * Where:
 *   P = net amount financed (amount received by merchant)
 *   A = periodic payment amount
 *   n = total number of payments
 *   r = periodic interest rate (unknown, solved for)
 *
 * APR = r * periodsPerYear * 100
 */

const MAX_ITERATIONS = 1000;
const CONVERGENCE_THRESHOLD = 1e-10;

/**
 * Calculate APR using Newton-Raphson iteration on the actuarial method.
 *
 * @param netAmountFinanced - Amount actually received by merchant (funding minus fees deducted from proceeds)
 * @param paymentAmount - Amount of each periodic payment
 * @param numberOfPayments - Total number of payments
 * @param periodsPerYear - Payment periods per year (252 daily, 52 weekly, 26 bi-weekly, 12 monthly)
 * @returns APR as a percentage (e.g., 45.67 means 45.67%)
 * @throws Error if calculation does not converge
 */
export function calculateAPR(
  netAmountFinanced: number,
  paymentAmount: number,
  numberOfPayments: number,
  periodsPerYear: number,
): number {
  if (netAmountFinanced <= 0 || paymentAmount <= 0 || numberOfPayments <= 0) {
    return 0;
  }

  // If total payments equal the funded amount, APR is 0
  const totalPayments = paymentAmount * numberOfPayments;
  if (Math.abs(totalPayments - netAmountFinanced) < 0.01) {
    return 0;
  }

  // Initial guess for periodic rate using simple interest approximation
  const totalInterest = totalPayments - netAmountFinanced;
  let r = (totalInterest / netAmountFinanced) / numberOfPayments * 2;

  // Ensure initial guess is positive and reasonable
  if (r <= 0) {
    r = 0.001;
  }

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const { pv, dpv } = presentValueAndDerivative(paymentAmount, r, numberOfPayments);
    const f = pv - netAmountFinanced;
    const fPrime = dpv;

    if (Math.abs(fPrime) < 1e-20) {
      break;
    }

    const rNew = r - f / fPrime;

    if (Math.abs(rNew - r) < CONVERGENCE_THRESHOLD) {
      // Converged — return annualized rate as percentage
      return roundToDecimals(Math.max(0, rNew * periodsPerYear * 100), 4);
    }

    // Prevent negative rates during iteration
    r = Math.max(rNew, 1e-10);
  }

  // If we didn't converge, return best estimate
  return roundToDecimals(Math.max(0, r * periodsPerYear * 100), 4);
}

/**
 * Calculate present value of an annuity and its derivative with respect to the periodic rate.
 *
 * PV = A * [1 - (1+r)^(-n)] / r
 * dPV/dr = A * [-(1+r)^(-n) * (-n/(1+r)) * r - (1 - (1+r)^(-n))] / r^2
 *        = A * [n * (1+r)^(-n-1) * r - (1 - (1+r)^(-n))] / r^2
 *        = A * [n * (1+r)^(-n-1) / r - (1 - (1+r)^(-n)) / r^2]
 */
function presentValueAndDerivative(
  paymentAmount: number,
  r: number,
  n: number,
): { pv: number; dpv: number } {
  const onePlusR = 1 + r;
  const onePlusRnegN = Math.pow(onePlusR, -n);

  // PV = A * (1 - (1+r)^-n) / r
  const pv = paymentAmount * (1 - onePlusRnegN) / r;

  // dPV/dr = A * [ n*(1+r)^(-n-1) / r  -  (1 - (1+r)^(-n)) / r^2 ]
  const onePlusRnegN1 = Math.pow(onePlusR, -n - 1);
  const dpv = paymentAmount * (n * onePlusRnegN1 / r - (1 - onePlusRnegN) / (r * r));

  return { pv, dpv };
}

function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Get the number of payment periods per year for a given frequency.
 * Daily uses 252 business days (standard for MCA).
 */
export function getPeriodsPerYear(
  frequency: "daily" | "weekly" | "bi_weekly" | "monthly",
): number {
  switch (frequency) {
    case "daily":
      return 252;
    case "weekly":
      return 52;
    case "bi_weekly":
      return 26;
    case "monthly":
      return 12;
  }
}
