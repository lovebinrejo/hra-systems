import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../store';
import { authService } from '../../services/authService';
import { setUser } from '../../store/authSlice';

interface Form {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

const ForceChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>();
  const newPass = watch('new_password');

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      await authService.changePassword(data.old_password, data.new_password, data.confirm_password);
      // Update user in store
      if (user) dispatch(setUser({ ...user, must_change_password: false }));
      toast.success('Password changed successfully! Welcome to HRA System.');
      navigate(user?.is_admin_user ? '/admin/dashboard' : '/dashboard', { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const msg = e.response?.data
        ? Object.values(e.response.data).flat()[0]
        : 'Failed to change password';
      toast.error(msg as string);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/sta-logo-white.svg" alt="STA Technologies" className="h-12 mx-auto mb-4" />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 text-center" style={{ background: 'linear-gradient(135deg, #046bd2, #0D2366)' }}>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Set Your New Password</h1>
            <p className="text-blue-100 text-sm mt-1">
              This is your first login. Please set a new password to continue.
            </p>
          </div>

          <div className="px-8 py-6">
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <strong>Default password:</strong> User@1234 — Please change it now.
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Current password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showOld ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current password"
                    {...register('old_password', { required: 'Required' })}
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.old_password && <p className="text-red-500 text-xs mt-1">{errors.old_password.message}</p>}
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min 8 characters"
                    {...register('new_password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.new_password && <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Re-enter new password"
                    {...register('confirm_password', {
                      required: 'Required',
                      validate: (v) => v === newPass || 'Passwords do not match',
                    })}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                style={{ background: 'linear-gradient(135deg, #046bd2, #0D2366)' }}
              >
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg> Updating...</>
                ) : 'Change Password & Continue'}
              </button>
            </form>
          </div>

          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} STA Technologies · HRA System v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForceChangePassword;
