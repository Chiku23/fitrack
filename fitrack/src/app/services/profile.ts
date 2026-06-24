import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfile } from '../models/profile.model';
import { ApiResponse } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly endpoint = `${environment.apiUrl}/profile`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(this.endpoint);
  }

  updateProfile(payload: Partial<UserProfile>): Observable<ApiResponse<UserProfile>> {
    return this.http.put<ApiResponse<UserProfile>>(this.endpoint, payload);
  }

  changePassword(payload: { current_password: string; new_password: string }): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.endpoint}/password`, payload);
  }
}
