import apiClient from './client';
import { LoginRequest, RegisterRequest, AuthResponse } from '@option-dashboard/shared';

export const authApi = {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  /**
   * Verify SMS code
   */
  async verifySms(code: string, email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/verify-sms', { code, email });
    return response.data;
  },
};
