export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'employee';
  profile_photo: string | null;
  profile_photo_url: string | null;
  department: string;
  designation: string;
  employee_id: string | null;
  phone: string;
  gender: 'male' | 'female' | 'other' | '';
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | '';
  date_of_birth: string | null;
  join_date: string | null;
  salary: number;
  address: string;
  is_active: boolean;
  is_admin_user: boolean;
  date_joined: string;
  must_change_password: boolean;
}

export interface AdminPasswordResetRequest {
  id: number;
  user: number;
  user_name: string;
  user_email: string;
  user_department: string;
  reason: string;
  status: 'pending' | 'completed' | 'rejected';
  requested_at: string;
  new_password?: string;
}

export interface LeaveBalance {
  id: number;
  year: number;
  paid_leaves_total: number;
  paid_leaves_used: number;
  paid_leaves_remaining: number;
  unpaid_leaves_total: number;
  unpaid_leaves_used: number;
  unpaid_leaves_remaining: number;
  sick_leaves_total: number;
  sick_leaves_used: number;
  sick_leaves_remaining: number;
  casual_leaves_total: number;
  casual_leaves_used: number;
  casual_leaves_remaining: number;
}

export interface LeaveType {
  id: number;
  name: string;
  display_name: string;
  yearly_quota: number;
  description: string;
  is_paid: boolean;
  is_active: boolean;
}

export interface LeaveRequest {
  id: number;
  user: User;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by: { id: number; full_name: string } | null;
  reviewed_at: string | null;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSession {
  check_in_time: string;
  check_out_time: string | null;
  check_in_location: { lat: number; lng: number } | null;
  check_out_location: { lat: number; lng: number } | null;
  distance_km: number | null;
  hours: number | null;
}

export interface Attendance {
  id: number;
  user: number;
  user_name: string;
  user_email: string;
  user_department: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_location: { lat: number; lng: number } | null;
  check_out_location: { lat: number; lng: number } | null;
  check_in_distance_km: number | null;
  sessions: AttendanceSession[];
  status: 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday' | 'weekend';
  is_late: boolean;
  work_hours: number | null;
  notes: string;
}

export interface Payslip {
  id: number;
  user: number;
  user_name: string;
  user_email: string;
  user_employee_id: string;
  user_department: string;
  month: number;
  year: number;
  basic_salary: number;
  hra: number;
  da: number;
  ta: number;
  other_allowances: number;
  pf_deduction: number;
  tax_deduction: number;
  other_deductions: number;
  loss_of_pay: number;
  gross_salary: number;
  net_salary: number;
  working_days: number;
  present_days: number;
  absent_days: number;
  leaves_taken: number;
  pdf_path: string;
  status: 'draft' | 'generated' | 'sent';
  generated_at: string | null;
}

export interface Event {
  id: number;
  title: string;
  content: string;
  event_date: string;
  event_time: string | null;
  location: string;
  is_published: boolean;
  banner_image: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  target_departments: string[];
  created_by_name: string | null;
  created_at: string;
}

export interface Holiday {
  id: number;
  name: string;
  date: string;
  description: string;
  is_public: boolean;
  is_optional: boolean;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  read_at: string | null;
  action_url: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export interface LeaveStats {
  year: number;
  balance: Record<string, { total: number; used: number; remaining: number }>;
  pending_requests: number;
  approved_this_year: number;
}
