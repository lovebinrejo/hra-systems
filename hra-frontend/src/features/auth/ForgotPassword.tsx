import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, CheckCircle, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authService } from '../../services/authService';
import { Button } from '../../components/ui/Button';

const ForgotPassword: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    try {
      await authService.requestPasswordReset(data.email);
      setSent(true);
    } catch {
      toast.error('Failed to send reset email. Please try again.');
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
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email Sent!</h2>
              <p className="text-gray-500 text-sm">Check your inbox for a password reset link. It expires in 1 hour.</p>
              <Link to="/login" className="mt-6 block text-primary-600 font-medium hover:underline">← Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your email to receive a reset link.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      className="input-field pl-10"
                      placeholder="you@company.com"
                      {...register('email', { required: 'Email is required' })}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <Button type="submit" loading={loading} className="w-full justify-center py-2.5">
                  Send Reset Link
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

export default ForgotPassword;
