import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Search, LayoutList, CalendarDays } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import CalendarGrid, { CalendarEvent } from '../../components/ui/CalendarGrid';
import { leaveService } from '../../services/leaveService';
import type { LeaveRequest } from '../../types';
import { format } from 'date-fns';

type StatusFilter = '' | 'pending' | 'approved' | 'rejected' | 'cancelled';
type ViewMode = 'list' | 'calendar';

const STATUS_COLOR: Record<string, CalendarEvent['color']> = {
  pending: 'blue', approved: 'green', rejected: 'red', cancelled: 'yellow',
};

const AdminLeaveManagement: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rejectModal, setRejectModal] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [dayModal, setDayModal] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveService.getLeaveRequests({ status: status || undefined, search, page } as Record<string, string | number>);
      setLeaves(res.data.results);
      setTotalPages(res.data.total_pages);
    } catch { toast.error('Failed to load leave requests'); }
    finally { setLoading(false); }
  }, [status, search, page]);

  // Fetch all leaves for calendar (no filter)
  const fetchAllLeaves = useCallback(async () => {
    try {
      const res = await leaveService.getLeaveRequests({ page_size: 200 } as Record<string, string | number>);
      setAllLeaves(res.data.results);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);
  useEffect(() => { fetchAllLeaves(); }, [fetchAllLeaves]);

  const calendarEvents: CalendarEvent[] = allLeaves.flatMap((leave) => {
    const events: CalendarEvent[] = [];
    const start = new Date(leave.start_date + 'T00:00:00');
    const end = new Date(leave.end_date + 'T00:00:00');
    const cur = new Date(start);
    while (cur <= end) {
      events.push({
        date: cur.toISOString().split('T')[0],
        label: `${leave.user.full_name} (${leave.leave_type.display_name})`,
        color: STATUS_COLOR[leave.status] || 'blue',
      });
      cur.setDate(cur.getDate() + 1);
    }
    return events;
  });

  const handleApprove = async (leave: LeaveRequest) => {
    setActionLoading(leave.id);
    try {
      await leaveService.approveLeave(leave.id);
      toast.success('Leave approved!');
      fetchLeaves(); fetchAllLeaves();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to approve');
    } finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    try {
      await leaveService.rejectLeave(rejectModal.id, rejectReason);
      toast.success('Leave rejected');
      setRejectModal(null); setRejectReason('');
      fetchLeaves(); fetchAllLeaves();
    } catch { toast.error('Failed to reject'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-500 text-sm">Review and manage employee leave requests</p>
        </div>
        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutList className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <CalendarDays className="w-4 h-4" /> Calendar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search by employee..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {([['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']] as [StatusFilter, string][]).map(([val, label]) => (
            <button key={val}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${status === val
                ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => { setStatus(val); setPage(1); }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <CalendarGrid
          events={calendarEvents}
          onDayClick={(date, events) => events.length > 0 && setDayModal({ date, events })}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? <LoadingSpinner /> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Dates</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Days</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaves.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">No leave requests found</td></tr>
                  ) : leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{leave.user.full_name}</p>
                        <p className="text-xs text-gray-400">{leave.user.department}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{leave.leave_type.display_name}</td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {format(new Date(leave.start_date), 'MMM d')} – {format(new Date(leave.end_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{leave.total_days}</td>
                      <td className="px-4 py-3"><Badge variant={leave.status}>{leave.status}</Badge></td>
                      <td className="px-4 py-3">
                        {leave.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleApprove(leave)} disabled={actionLoading === leave.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => setRejectModal(leave)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {leave.status !== 'pending' && leave.rejection_reason && (
                          <p className="text-xs text-gray-400 max-w-xs truncate">{leave.rejection_reason}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Day detail modal */}
      <Modal isOpen={!!dayModal} onClose={() => setDayModal(null)}
        title={dayModal ? format(dayModal.date, 'MMMM d, yyyy') : ''}>
        <div className="space-y-2">
          {dayModal?.events.map((ev, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                ev.color === 'green' ? 'bg-green-500' : ev.color === 'blue' ? 'bg-blue-500' :
                ev.color === 'red' ? 'bg-red-500' : 'bg-yellow-400'
              }`} />
              <span className="text-sm text-gray-800">{ev.label}</span>
            </div>
          ))}
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }}
        title="Reject Leave Request"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" loading={actionLoading === rejectModal?.id} onClick={handleReject}>Reject</Button>
          </>
        }
      >
        <p className="text-gray-600 mb-4">
          Rejecting <strong>{rejectModal?.user.full_name}</strong>'s {rejectModal?.leave_type.display_name} ({rejectModal?.total_days} days).
        </p>
        <label className="label">Rejection Reason (optional)</label>
        <textarea className="input-field h-20 resize-none" placeholder="Enter reason..."
          value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
      </Modal>
    </div>
  );
};

export default AdminLeaveManagement;
