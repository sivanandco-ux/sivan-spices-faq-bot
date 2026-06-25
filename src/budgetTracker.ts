// Haiku 4.5 pricing
const INPUT_COST_PER_TOKEN  = 1.00 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 5.00 / 1_000_000;

export const DAILY_BUDGET_USD = 1.00;

let dailySpendUSD = 0;
let resetDate = todayKey();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function maybeReset() {
  const today = todayKey();
  if (today !== resetDate) {
    dailySpendUSD = 0;
    resetDate = today;
  }
}

export function isBudgetExceeded(): boolean {
  maybeReset();
  return dailySpendUSD >= DAILY_BUDGET_USD;
}

export function recordUsage(inputTokens: number, outputTokens: number): void {
  maybeReset();
  const cost = inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN;
  dailySpendUSD += cost;
  console.log(
    `[budget] +$${cost.toFixed(5)} | daily total: $${dailySpendUSD.toFixed(5)} / $${DAILY_BUDGET_USD.toFixed(2)}`
  );
}

export function getDailySpend(): number {
  maybeReset();
  return dailySpendUSD;
}
