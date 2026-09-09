import { apiClient } from './client';

export interface EmployeeSummary {
  id: number;
  matricule: string;
  full_name: string;
  photo: string | null;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  employee: EmployeeSummary | null;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface ActivatePayload {
  matricule: string;
  temporary_password: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  matricule: string;
  password: string;
}

export async function activateAccount(payload: ActivatePayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/activate', payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function fetchMe(): Promise<{ user: AuthUser }> {
  const { data } = await apiClient.get<{ user: AuthUser }>('/auth/me');
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  const { data } = await apiClient.put<{ message: string }>('/auth/password', payload);
  return data;
}
