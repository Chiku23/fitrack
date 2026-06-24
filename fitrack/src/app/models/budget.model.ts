export interface Budget {
  id?: string;
  category: string;
  amount_limit: number;
  period: 'monthly' | 'yearly';
  start_date: string;
  created_at?: string;
}

export interface BudgetProgress extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}
