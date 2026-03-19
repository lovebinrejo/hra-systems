import api from './api';
import type { LeaveType, LeaveRequest, Holiday, LeaveStats, PaginatedResponse } from '../types';

export const leaveService = {
  getLeaveTypes: () => api.get<PaginatedResponse<LeaveType>>('/leaves/types/'),

  getLeaveRequests: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<LeaveRequest>>('/leaves/requests/', { params }),

  applyLeave: (data: { leave_type: number; start_date: string; end_date: string; reason: string }) =>
    api.post<LeaveRequest>('/leaves/requests/', data),

  approveLeave: (id: number) =>
    api.post<LeaveRequest>(`/leaves/requests/${id}/approve/`),

  rejectLeave: (id: number, rejection_reason?: string) =>
    api.post<LeaveRequest>(`/leaves/requests/${id}/reject/`, { rejection_reason }),

  cancelLeave: (id: number) =>
    api.delete(`/leaves/requests/${id}/`),

  getMyLeaveStats: () => api.get<LeaveStats>('/leaves/my-stats/'),

  getHolidays: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Holiday>>('/leaves/holidays/', { params }),

  createHoliday: (data: Partial<Holiday>) => api.post<Holiday>('/leaves/holidays/', data),

  updateHoliday: (id: number, data: Partial<Holiday>) =>
    api.patch<Holiday>(`/leaves/holidays/${id}/`, data),

  deleteHoliday: (id: number) => api.delete(`/leaves/holidays/${id}/`),

  getUpcomingHolidays: () => api.get<Holiday[]>('/leaves/holidays/upcoming/'),
};
