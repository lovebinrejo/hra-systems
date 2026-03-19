import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, XCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { leaveService } from '../../services/leaveService';
import { employeeService } from '../../services/employeeService';
import type { LeaveRequest, LeaveBalance } from '../../types';
import { format } from 'date-fns';

type StatusFilter = '' | 'pending' | 'approved' | 'rejected';

const MyLeaves: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('');
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leavesRes, balRes] = await Promise.all([
        leaveService.getLeaveRequests({ status: status || undefined, page_size: 50 } as Record<string, string | number>),
        employeeService.getMyLeaveBalance(),
      ]);
      setLeaves(leavesRes.data.results);
      setBalance(balRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this leave request?')) return;
    setCancelLoading(id);
    try {
      await leaveService.cancelLeave(id);
      toast.success('Leave cancelled');
      fetchData();
    } catch { toast.error('Failed to cancel'); }
    finally { setCancelLoading(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leaves</h1>
          <p className="text-gray-500 text-sm">Track all your leave requests</p>
        </div>
        <Link to="/leaves/apply">
          <Button icon={<Plus className="w-4 h-4" />}>Apply Leave</Button>
        </Link>
      </div>

      {/* Balance */}
      {balance && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Paid Leave', used: balance.paid_leaves_used, total: balance.paid_leaves_total, rem: balance.paid_leaves_remaining },
            { label: 'Sick Leave', used: balance.sick_leaves_used, total: balance.sick_leaves_total, rem: balance.sick_leaves_remaining },
            { label: 'Casual Leave', used: balance.casual_leaves_used, total: balance.casual_leaves_total, rem: balance.casual_leaves_remaining },
            { label: 'Unpaid Leave', used: balance.unpaid_leaves_used, total: balance.unpaid_leaves_total, rem: balance.unpaid_leaves_remaining },
          ].map(({ label, used, total, rem }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-primary-600">{rem}</span>
                <span className="text-xs text-gray-400">{used}/{total} used</span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(used / Math.max(total, 1)) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {([['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']] as [StatusFilter, string][]).map(([val, label]) => (
          <button key={val}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${status === val ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setStatus(val)}
          >{label}</button>
        ))}
      </div>

      {/* List */}
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {leaves.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-400 mb-4">No leave requests found</p>
              <Link to="/leaves/apply"><Button>Apply for Leave</Button></Link>
            </div>
          ) : leaves.map((leave) => (
            <div key={leave.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900">{leave.leave_type.display_name}</p>
                  <Badge variant={leave.status}>{leave.status}</Badge>
                  {leave.status === 'pending' && leave.leave_type.is_paid ? <Badge variant="info">Paid</Badge> : null}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {format(new Date(leave.start_date), 'MMM d')} – {format(new Date(leave.end_date), 'MMM d, yyyy')} · <strong>{leave.total_days}</strong> working day(s)
                </p>
                {leave.reason && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{leave.reason}</p>}
                {leave.rejection_reason && (
                  <p className="text-xs text-red-500 mt-0.5">Reason: {leave.rejection_reason}</p>
                )}
              </div>
              {leave.status === 'pending' && (
                <button
                  onClick={() => handleCancel(leave.id)}
                  disabled={cancelLoading === leave.id}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 shrink-0"
                >
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLeaves;
