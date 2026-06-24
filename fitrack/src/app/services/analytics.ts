import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AnalyticsSummary, MonthlyTrend } from '../models/analytics.model';
import { ApiResponse } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly endpoint = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getMonthlyTrend(): Observable<ApiResponse<MonthlyTrend[]>> {
    return this.http.get<ApiResponse<MonthlyTrend[]>>(`${this.endpoint}/monthly-trend`);
  }

  getSummary(period: 'month' | 'year' | 'all' = 'month'): Observable<ApiResponse<AnalyticsSummary>> {
    return this.http.get<ApiResponse<AnalyticsSummary>>(`${this.endpoint}/summary?period=${period}`);
  }
}
