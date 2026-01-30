export function calculateNetSavings(
  income: number,
  expense: number
) {
  return income - expense;
}

type NetWorthPredictionOptions = {
  annualInterestRate?: number; // e.g. 0.10 = 10%
  annualInflationRate?: number; // e.g. 0.05 = 5%
};

export function predictNetWorth(
  currentNetWorth: number,
  monthlySavings: number,
  years: number,
  {
    annualInterestRate = 0.10,
    annualInflationRate = 0.05,
  }: NetWorthPredictionOptions = {}
) {
  const realAnnualRate =
    (1 + annualInterestRate) / (1 + annualInflationRate) - 1;

  const monthlyRate = realAnnualRate / 12;
  const totalMonths = years * 12;

  let netWorth = currentNetWorth;

  for (let i = 0; i < totalMonths; i++) {
    netWorth = netWorth * (1 + monthlyRate) + monthlySavings;
  }

  return Math.round(netWorth);
}
