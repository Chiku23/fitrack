import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BudgetProgress, Budget } from '../models/budget.model';
import { ApiResponse } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly endpoint = `${environment.apiUrl}/budgets`;

  constructor(private http: HttpClient) {}

  getBudgets(): Observable<ApiResponse<BudgetProgress[]>> {
    return this.http.get<ApiResponse<BudgetProgress[]>>(this.endpoint);
  }

  createBudget(payload: Partial<Budget>): Observable<ApiResponse<Budget>> {
    return this.http.post<ApiResponse<Budget>>(this.endpoint, payload);
  }

  updateBudget(id: string, payload: Partial<Budget>): Observable<ApiResponse<Budget>> {
    return this.http.put<ApiResponse<Budget>>(`${this.endpoint}/${id}`, payload);
  }

  deleteBudget(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.endpoint}/${id}`);
  }
}
