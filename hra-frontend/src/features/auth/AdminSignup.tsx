import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/authService';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/authSlice';
import { Button } from '../../components/ui/Button';

interface SignupForm {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  confirm_password: string;
}

const AdminSignup: React.FC = () => {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupForm>();
  const password = watch('password');

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    try {
      const { confirm_password, ...payload } = data;
      const res = await authService.registerAdmin(payload);
      dispatch(setCredentials(res.data));
      toast.success('Admin account created! Welcome to HRA System.');
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-6 py-3 mb-4 shadow-lg">
            <img src="/sta-logo.svg" alt="STA Technologies" className="h-10" />
          </div>
          <p className="text-primary-200 mt-1">HRA System Setup — Create Admin Account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Registration</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input className="input-field" {...register('first_name', { required: 'Required' })} />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input-field" {...register('last_name', { required: 'Required' })} />
                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
              </div>
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input-field" {...register('email', { required: 'Email is required' })} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input-field" {...register('username', { required: 'Username is required' })} />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
              />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>
            <Button type="submit" loading={loading} className="w-full justify-center py-2.5 mt-2">
              Create Admin Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
