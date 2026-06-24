import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Transaction, ApiResponse } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly endpoint = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  getTransactions(filters?: { type?: string; category?: string; from?: string; to?: string; page?: number; limit?: number }): Observable<ApiResponse<Transaction[]>> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params = params.set(k, String(v)); });
    }
    return this.http.get<ApiResponse<Transaction[]>>(this.endpoint, { params });
  }

  createTransaction(payload: Partial<Transaction>): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>(this.endpoint, payload);
  }

  updateTransaction(id: string, payload: Partial<Transaction>): Observable<ApiResponse<Transaction>> {
    return this.http.put<ApiResponse<Transaction>>(`${this.endpoint}/${id}`, payload);
  }

  deleteTransaction(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.endpoint}/${id}`);
  }

  bulkDeleteTransactions(ids: string[]): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.endpoint}/bulk-delete`, { ids });
  }
}