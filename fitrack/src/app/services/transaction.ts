import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Transaction, ApiResponse } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly endpoint = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  // Resolves to an array of transactions ordered by date from the backend
  getTransactions(): Observable<ApiResponse<Transaction[]>> {
    return this.http.get<ApiResponse<Transaction[]>>(this.endpoint);
  }

  // Dispatches a payload to register a single manual transaction entry
  createTransaction(transaction: Transaction): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>(this.endpoint, transaction);
  }
}