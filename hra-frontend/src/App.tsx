import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store';
import { fetchMeThunk } from './store/authSlice';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Auth pages
import Login from './features/auth/Login';
import AdminSignup from './features/auth/AdminSignup';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';
import ForceChangePassword from './features/auth/ForceChangePassword';
import RequestAdminReset from './features/auth/RequestAdminReset';

// Admin pages
import AdminDashboard from './features/admin/AdminDashboard';
import EmployeeList from './features/admin/EmployeeList';
import EmployeeCreate from './features/admin/EmployeeCreate';
import AdminLeaveManagement from './features/admin/AdminLeaveManagement';
import AttendanceMonitor from './features/admin/AttendanceMonitor';
import EventManagement from './features/admin/EventManagement';
import HolidayManagement from './features/admin/HolidayManagement';
import PayslipManagement from './features/admin/PayslipManagement';
import PasswordResetRequests from './features/admin/PasswordResetRequests';

// User pages
import UserDashboard from './features/user/UserDashboard';
import UserProfile from './features/user/UserProfile';
import ApplyLeave from './features/user/ApplyLeave';
import MyLeaves from './features/user/MyLeaves';
import MyAttendance from './features/user/MyAttendance';
import MyPayslips from './features/user/MyPayslips';
import CalendarView from './features/user/CalendarView';
import NewsView from './features/user/NewsView';

const RoleBasedRedirect: React.FC = () => {
  const { user } = useAppSelector(s => s.auth);
  if (user?.must_change_password) return <Navigate to="/change-password-required" replace />;
  return <Navigate to={user?.is_admin_user ? '/admin/dashboard' : '/dashboard'} replace />;
};

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { access, user } = useAppSelector(s => s.auth);
  const [initializing, setInitializing] = React.useState(true);

  useEffect(() => {
    if (access && !user) {
      dispatch(fetchMeThunk()).finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, [access, user, dispatch]);

  if (initializing) return <LoadingSpinner fullPage />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<AdminSignup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/request-reset" element={<RequestAdminReset />} />

      {/* Force password change — requires auth but not dashboard */}
      <Route path="/change-password-required" element={
        access ? <ForceChangePassword /> : <Navigate to="/login" replace />
      } />

      {/* Protected */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/employees" element={
          <ProtectedRoute requireAdmin><EmployeeList /></ProtectedRoute>
        } />
        <Route path="/admin/employees/new" element={
          <ProtectedRoute requireAdmin><EmployeeCreate /></ProtectedRoute>
        } />
        <Route path="/admin/leaves" element={
          <ProtectedRoute requireAdmin><AdminLeaveManagement /></ProtectedRoute>
        } />
        <Route path="/admin/attendance" element={
          <ProtectedRoute requireAdmin><AttendanceMonitor /></ProtectedRoute>
        } />
        <Route path="/admin/events" element={
          <ProtectedRoute requireAdmin><EventManagement /></ProtectedRoute>
        } />
        <Route path="/admin/announcements" element={
          <ProtectedRoute requireAdmin><EventManagement /></ProtectedRoute>
        } />
        <Route path="/admin/holidays" element={
          <ProtectedRoute requireAdmin><HolidayManagement /></ProtectedRoute>
        } />
        <Route path="/admin/payslips" element={
          <ProtectedRoute requireAdmin><PayslipManagement /></ProtectedRoute>
        } />
        <Route path="/admin/password-resets" element={
          <ProtectedRoute requireAdmin><PasswordResetRequests /></ProtectedRoute>
        } />

        {/* Employee routes */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/leaves/apply" element={<ApplyLeave />} />
        <Route path="/leaves" element={<MyLeaves />} />
        <Route path="/attendance" element={<MyAttendance />} />
        <Route path="/payslips" element={<MyPayslips />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/news" element={<NewsView />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
