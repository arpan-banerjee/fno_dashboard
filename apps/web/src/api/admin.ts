import apiClient from './client';
import { AdminCounters, AdminSettings, User, AdminLog, UserFilter } from '@option-dashboard/shared';

export const adminApi = {
  /**
   * Get admin dashboard counters
   */
  async getCounters(): Promise<AdminCounters> {
    const response = await apiClient.get<AdminCounters>('/admin/counters');
    return response.data;
  },

  /**
   * Get admin settings
   */
  async getSettings(): Promise<AdminSettings> {
    const response = await apiClient.get<AdminSettings>('/admin/settings');
    return response.data;
  },

  /**
   * Update admin settings
   */
  async updateSettings(settings: AdminSettings): Promise<AdminSettings> {
    const response = await apiClient.put<AdminSettings>('/admin/settings', settings);
    return response.data;
  },

  /**
   * Get users list with optional filtering
   */
  async getUsers(query?: string, status?: UserFilter): Promise<Omit<User, 'password_hash'>[]> {
    const response = await apiClient.get('/admin/users', {
      params: { query, status },
    });
    return response.data;
  },

  /**
   * Update user
   */
  async updateUser(id: string, updates: Partial<User>): Promise<Omit<User, 'password_hash'>> {
    const response = await apiClient.put(`/admin/users/${id}`, updates);
    return response.data;
  },

  /**
   * Get admin logs
   */
  async getLogs(limit?: number): Promise<AdminLog[]> {
    const response = await apiClient.get<AdminLog[]>('/admin/logs', {
      params: { limit },
    });
    return response.data;
  },
};
