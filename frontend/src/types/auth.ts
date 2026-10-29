export type Role = 'ADMIN' | 'OPERADOR';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: Role;
  companyId: number;
  companyName: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}
