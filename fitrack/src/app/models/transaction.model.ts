export interface Transaction {
  id?: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
  payment_method?: string;
  source?: 'manual' | 'import';
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  total?: number;
  pages?: number;
  data: T;
  error?: string;
  message?: string;
}