import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, FilePlus, Receipt, CalendarDays, ChevronRight, CheckCircle } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { leaveService } from '../../services/leaveService';
import { attendanceService } from '../../services/attendanceService';
import { eventService } from '../../services/eventService';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../hooks/useAuth';
import type { LeaveRequest, Announcement, Holiday, Attendance } from '../../types';
import { format } from 'date-fns';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [leaveStats, setLeaveStats] = useState<{ balance: Record<string, { remaining: number }> } | null>(null);
  const [todayAtt, setTodayAtt] = useState<Attendance | { checked_in: boolean; date: string } | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      leaveService.getMyLeaveStats(),
      attendanceService.getTodayAttendance(),
      leaveService.getLeaveRequests({ page_size: 3 }),
      leaveService.getUpcomingHolidays(),
      eventService.getAnnouncements({ page_size: 3 }),
    ]).then(([statsRes, attRes, leavesRes, holidayRes, annRes]) => {
      setLeaveStats(statsRes.data as typeof leaveStats);
      setTodayAtt(attRes.data as typeof todayAtt);
      setRecentLeaves(leavesRes.data.results);
      setHolidays(holidayRes.data.slice(0, 3));
      setAnnouncements(annRes.data.results);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const paidRemaining = leaveStats?.balance?.paid?.remaining ?? 0;
  const sickRemaining = leaveStats?.balance?.sick?.remaining ?? 0;
  const checkedIn = todayAtt && 'check_in_time' in todayAtt && todayAtt.check_in_time;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.first_name}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Paid Leave Left" value={paidRemaining} icon={<CalendarCheck className="w-6 h-6" />} color="green" subtitle="days remaining" />
        <StatCard title="Sick Leave Left" value={sickRemaining} icon={<FilePlus className="w-6 h-6" />} color="blue" subtitle="days remaining" />
        <StatCard title="Today's Status" value={checkedIn ? 'Present' : 'Not Checked In'}
          icon={<Clock className="w-6 h-6" />} color={checkedIn ? 'green' : 'yellow'} />
        <StatCard title="Pending Requests" value={recentLeaves.filter(l => l.status === 'pending').length}
          icon={<Receipt className="w-6 h-6" />} color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/leaves/apply" className="card flex items-center gap-3 hover:border-primary-300 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <FilePlus className="w-5 h-5 text-primary-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Apply Leave</span>
        </Link>
        <Link to="/attendance" className="card flex items-center gap-3 hover:border-primary-300 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            {checkedIn ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-green-600" />}
          </div>
          <span className="text-sm font-medium text-gray-700">{checkedIn ? 'Check Out' : 'Check In'}</span>
        </Link>
        <Link to="/payslips" className="card flex items-center gap-3 hover:border-primary-300 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">My Payslips</span>
        </Link>
        <Link to="/calendar" className="card flex items-center gap-3 hover:border-primary-300 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Calendar</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leaves */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Leave Requests</h2>
            <Link to="/leaves" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recentLeaves.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No leave requests yet</p>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{leave.leave_type.display_name}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(leave.start_date), 'MMM d')} – {format(new Date(leave.end_date), 'MMM d')} · {leave.total_days} day(s)
                    </p>
                  </div>
                  <Badge variant={leave.status}>{leave.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Holidays */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Upcoming Holidays</h2>
          {holidays.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No upcoming holidays</p>
          ) : (
            <div className="space-y-3">
              {holidays.map((h) => (
                <div key={h.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-yellow-700">{format(new Date(h.date), 'MMM').toUpperCase()}</span>
                    <span className="text-sm font-bold text-yellow-700">{format(new Date(h.date), 'd')}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{h.name}</p>
                    <p className="text-xs text-gray-400">{h.is_optional ? 'Optional' : 'Public'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Announcements</h2>
            <Link to="/news" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <Badge variant={a.priority === 'urgent' ? 'rejected' : a.priority === 'high' ? 'warning' : 'info'} className="shrink-0">
                  {a.priority}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{a.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
