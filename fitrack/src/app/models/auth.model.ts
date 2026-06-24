export interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface UserSession {
  id: string;
  email: string;
  baseCurrency: string;
  timezone: string;
}