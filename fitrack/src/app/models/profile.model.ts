export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  base_currency: string;
  timezone: string;
  status: string;
  created_at?: string;
}
