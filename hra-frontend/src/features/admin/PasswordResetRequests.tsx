import React, { useState, useEffect, useCallback } from 'react';
import { KeyRound, RefreshCw, Copy, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { authService } from '../../services/authService';
import type { AdminPasswordResetRequest } from '../../types';
import { format } from 'date-fns';

const PasswordResetRequests: React.FC = () => {
  const [requests, setRequests] = useState<AdminPasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);
  const [resultModal, setResultModal] = useState<{ email: string; password: string } | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authService.getAdminResetRequests();
      setRequests(res.data);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleResolve = async (req: AdminPasswordResetRequest) => {
    setResolving(req.id);
    try {
      const res = await authService.resolveAdminResetRequest(req.id);
      const { new_password, user_email } = res.data;
      setResultModal({ email: user_email, password: new_password });
      fetch();
    } catch { toast.error('Failed to reset password'); }
    finally { setResolving(null); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Password Reset Requests</h1>
          <p className="text-gray-500 text-sm">Employees requesting password reset</p>
        </div>
        <button onClick={fetch} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? <LoadingSpinner /> : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
            <p className="font-medium text-gray-500">No pending reset requests</p>
            <p className="text-sm mt-1">All caught up!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Department</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Reason</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Requested</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{req.user_name}</p>
                    <p className="text-xs text-gray-400">{req.user_email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize hidden md:table-cell">
                    {req.user_department || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell max-w-xs truncate">
                    {req.reason || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(req.requested_at), 'MMM d, h:mm a')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="pending">Pending</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      loading={resolving === req.id}
                      icon={<KeyRound className="w-3.5 h-3.5" />}
                      onClick={() => handleResolve(req)}
                    >
                      Reset Password
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Result modal showing new password */}
      <Modal
        isOpen={!!resultModal}
        onClose={() => setResultModal(null)}
        title="Password Reset Successful"
        footer={<Button onClick={() => setResultModal(null)}>Done</Button>}
      >
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-800 text-sm font-medium mb-1">Password has been reset for:</p>
            <p className="text-green-900 font-bold">{resultModal?.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">New temporary password (share this with the employee):</p>
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl font-mono text-lg font-bold text-gray-900">
              <span className="flex-1">{resultModal?.password}</span>
              <button
                onClick={() => resultModal && copyToClipboard(resultModal.password)}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg"
                title="Copy password"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
            The employee will be prompted to change this password on their next login.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PasswordResetRequests;
