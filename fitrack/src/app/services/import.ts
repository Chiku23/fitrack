import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/transaction.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private readonly endpoint = `${environment.apiUrl}/import`;

  constructor(private http: HttpClient) {}

  importCsv(file: File): Observable<ApiResponse<Transaction[]> & { imported: number; skipped: number; format: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.endpoint}/csv`, form);
  }

  importExcel(file: File): Observable<ApiResponse<Transaction[]> & { imported: number }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.endpoint}/excel`, form);
  }

  importPdf(file: File): Observable<ApiResponse<Transaction[]> & { imported: number }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.endpoint}/pdf`, form);
  }

  parseFile(file: File, statementType: string): Observable<{ success: boolean; format: string; count: number; transactions: Transaction[] }> {
    const form = new FormData();
    form.append('file', file);
    form.append('statementType', statementType);
    return this.http.post<any>(`${this.endpoint}/parse`, form);
  }

  confirmImport(transactions: Transaction[]): Observable<{ success: boolean; imported: number }> {
    return this.http.post<any>(`${this.endpoint}/confirm`, { transactions });
  }
}
