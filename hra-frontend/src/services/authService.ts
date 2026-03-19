import api from './api';
import type { AuthTokens, User } from '../types';

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthTokens>('/auth/login/', { email, password }),

  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),

  registerAdmin: (data: Record<string, string>) =>
    api.post<AuthTokens>('/auth/register-admin/', data),

  requestPasswordReset: (email: string) =>
    api.post('/auth/password-reset/', { email }),

  confirmPasswordReset: (token: string, new_password: string, confirm_password: string) =>
    api.post('/auth/password-reset/confirm/', { token, new_password, confirm_password }),

  changePassword: (old_password: string, new_password: string, confirm_password: string) =>
    api.post('/auth/change-password/', { old_password, new_password, confirm_password }),

  getMe: () => api.get<User>('/auth/me/'),

  updateProfile: (data: Partial<User>) =>
    api.patch<User>('/auth/me/', data),

  uploadPhoto: (formData: FormData) =>
    api.post('/auth/me/photo/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  requestAdminReset: (email: string, reason: string) =>
    api.post('/auth/request-admin-reset/', { email, reason }),

  getAdminResetRequests: () =>
    api.get('/auth/admin-reset-requests/'),

  resolveAdminResetRequest: (id: number) =>
    api.post(`/auth/admin-reset-requests/${id}/resolve/`),
};
