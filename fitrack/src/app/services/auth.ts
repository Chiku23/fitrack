import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly endpoint = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'fitrack_auth_token';

  constructor(private http: HttpClient) {}

  // Posts credential payloads to register a unique profile resource
  register(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.endpoint}/register`, payload);
  }

  // Requests authorization access tokens and handles structural storage upon resolution
  login(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.endpoint}/login`, payload).pipe(
      tap(response => {
        if (response.success && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
        }
      })
    );
  }

  // Verifies the presence of a current session string token locally
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    // Real systems incorporate expiration or JWT parsing validation algorithms here
    return !!token;
  }

  // Clears state persistence values from local storage
  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  // Exposes internal token properties safely to routing interceptors
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}