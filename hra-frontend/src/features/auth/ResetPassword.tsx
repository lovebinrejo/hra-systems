import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Building2, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';

interface ResetForm { new_password: string; confirm_password: string; }

const ResetPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetForm>();

  const onSubmit = async (data: ResetForm) => {
    if (!token) return;
    setLoading(true);
    try {
      await authService.confirmPasswordReset(token, data.new_password, data.confirm_password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Reset failed. Token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-6 py-3 mb-4 shadow-lg">
            <img src="/sta-logo.svg" alt="STA Technologies" className="h-10" />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Password Reset!</h2>
              <p className="text-gray-500 text-sm mt-2">Redirecting to login...</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Set New Password</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">New Password</label>
                  <input type="password" className="input-field"
                    {...register('new_password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                  {errors.new_password && <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>}
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" className="input-field"
                    {...register('confirm_password', {
                      required: 'Required',
                      validate: (v) => v === watch('new_password') || 'Passwords do not match',
                    })} />
                  {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
                </div>
                <Button type="submit" loading={loading} className="w-full justify-center py-2.5">
                  Reset Password
                </Button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-4">
                <Link to="/login" className="text-primary-600 hover:underline">← Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
