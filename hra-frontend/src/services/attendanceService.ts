import api from './api';
import type { Attendance, PaginatedResponse } from '../types';

export const attendanceService = {
  checkIn: (lat: number, lng: number, notes?: string) =>
    api.post<Attendance>('/attendance/check-in/', { lat, lng, notes }),

  checkOut: (lat?: number, lng?: number, notes?: string) =>
    api.post<Attendance>('/attendance/check-out/', { lat, lng, notes }),

  getTodayAttendance: () =>
    api.get<Attendance | { checked_in: boolean; date: string }>('/attendance/today/'),

  getAttendance: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Attendance>>('/attendance/records/', { params }),

  getMonthlySummary: (month: number, year: number, employeeId?: number) =>
    api.get('/attendance/records/monthly_summary/', {
      params: { month, year, ...(employeeId ? { employee: employeeId } : {}) },
    }),
};
