import api from './api';
import type { Notification, PaginatedResponse } from '../types';

export const notificationService = {
  getNotifications: () =>
    api.get<PaginatedResponse<Notification>>('/notifications/'),

  getUnreadCount: () =>
    api.get<{ unread_count: number }>('/notifications/unread-count/'),

  markRead: (id: number) =>
    api.post(`/notifications/${id}/mark_read/`),

  markAllRead: () =>
    api.post('/notifications/mark_all_read/'),
};
