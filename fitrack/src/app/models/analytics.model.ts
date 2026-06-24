export interface MonthlyTrend {
  month: string; // 'YYYY-MM'
  income: number;
  expense: number;
}

export interface CategoryAmount {
  category: string;
  amount: number;
}

export interface AnalyticsSummary {
  income: number;
  expense: number;
  net: number;
  savings_rate: number;
  expense_by_category: CategoryAmount[];
  income_by_category: CategoryAmount[];
}
