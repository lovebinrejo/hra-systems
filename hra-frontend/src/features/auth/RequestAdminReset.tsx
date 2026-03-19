import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';

const RequestAdminReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    setLoading(true); setError('');
    try {
      await authService.requestAdminReset(email, reason);
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/sta-logo-white.svg" alt="STA Technologies" className="h-12 mx-auto mb-4" />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-6" style={{ background: 'linear-gradient(135deg, #046bd2, #0D2366)' }}>
            <h1 className="text-xl font-bold text-white text-center">Forgot Password?</h1>
            <p className="text-blue-100 text-sm text-center mt-1">
              Submit a request — your admin will reset your password.
            </p>
          </div>

          <div className="px-8 py-6">
            {done ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Request Sent!</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Your request has been sent to the admin. They will reset your password shortly. Please contact your admin for your new temporary password.
                </p>
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#046bd2' }}>
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="you@statech.in"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason (optional)</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20"
                      placeholder="E.g. Forgot my password after vacation"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #046bd2, #0D2366)' }}
                >
                  {loading ? (
                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg> Sending...</>
                  ) : 'Send Reset Request to Admin'}
                </button>

                <div className="text-center">
                  <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>

          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} STA Technologies · HRA System v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAdminReset;
