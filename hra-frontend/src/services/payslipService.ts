import api from './api';
import type { Payslip, PaginatedResponse } from '../types';

export const payslipService = {
  getPayslips: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Payslip>>('/payslips/', { params }),

  getPayslip: (id: number) => api.get<Payslip>(`/payslips/${id}/`),

  generatePayslip: (data: {
    user_id: number;
    month: number;
    year: number;
    other_allowances?: number;
    tax_deduction?: number;
    other_deductions?: number;
  }) => api.post<Payslip>('/payslips/generate/', data),

  generateBulk: (month: number, year: number) =>
    api.post('/payslips/generate-bulk/', { month, year }),

  downloadPayslip: (id: number) =>
    api.get(`/payslips/${id}/download/`, { responseType: 'blob' }),
};
