import api from './api';
import type { User, LeaveBalance, PaginatedResponse } from '../types';

export const employeeService = {
  getEmployees: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<User>>('/employees/', { params }),

  getEmployee: (id: number) =>
    api.get<User>(`/employees/${id}/`),

  createEmployee: (data: Record<string, unknown>) =>
    api.post<User>('/employees/', data),

  updateEmployee: (id: number, data: Partial<User>) =>
    api.patch<User>(`/employees/${id}/`, data),

  deleteEmployee: (id: number) =>
    api.delete(`/employees/${id}/`),

  activateEmployee: (id: number) =>
    api.post(`/employees/${id}/activate/`),

  deactivateEmployee: (id: number) =>
    api.post(`/employees/${id}/deactivate/`),

  getLeaveBalance: (id: number, year?: number) =>
    api.get<LeaveBalance>(`/employees/${id}/leave_balance/`, { params: year ? { year } : {} }),

  updateLeaveBalance: (id: number, data: Partial<LeaveBalance> & { year?: number }) =>
    api.put(`/employees/${id}/leave-balance/update/`, data),

  getMyLeaveBalance: (year?: number) =>
    api.get<LeaveBalance>('/employees/my-leave-balance/', { params: year ? { year } : {} }),
};
