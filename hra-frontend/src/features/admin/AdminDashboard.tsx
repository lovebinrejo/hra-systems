import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, Calendar, AlertCircle, CheckCircle, ChevronRight, Brain, TrendingUp, AlertTriangle, Lightbulb, Info } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { employeeService } from '../../services/employeeService';
import { leaveService } from '../../services/leaveService';
import { attendanceService } from '../../services/attendanceService';
import { eventService } from '../../services/eventService';
import type { LeaveRequest, Announcement } from '../../types';
import { format } from 'date-fns';

type InsightLevel = 'warning' | 'success' | 'info' | 'tip';
interface Insight { level: InsightLevel; message: string; action?: string; actionPath?: string; }

function generateInsights(
  total: number,
  present: number,
  onLeave: number,
  pending: LeaveRequest[],
  lateArrivals: number,
): Insight[] {
  const insights: Insight[] = [];
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  if (pending.length >= 3)
    insights.push({ level: 'warning', message: `${pending.length} leave requests are pending approval — review soon to avoid delays.`, action: 'Review Leaves', actionPath: '/admin/leaves' });

  if (total > 0 && attendanceRate < 70)
    insights.push({ level: 'warning', message: `Attendance today is low at ${attendanceRate}% (${present}/${total} employees present).`, action: 'View Attendance', actionPath: '/admin/attendance' });
  else if (total > 0 && attendanceRate >= 90)
    insights.push({ level: 'success', message: `Excellent attendance today — ${attendanceRate}% of employees are present.` });

  if (lateArrivals > 0)
    insights.push({ level: 'info', message: `${lateArrivals} employee${lateArrivals > 1 ? 's' : ''} arrived late today. Consider sending a reminder.` });

  if (onLeave > 0 && present === 0)
    insights.push({ level: 'warning', message: `All ${onLeave} absent employees are on approved leave — no unplanned absences today.` });

  if (dayOfMonth >= daysInMonth - 5)
    insights.push({ level: 'tip', message: `Month-end approaching (${daysInMonth - dayOfMonth} days left). Ensure payslips are generated for all ${total} employees.`, action: 'Manage Payslips', actionPath: '/admin/payslips' });

  if (pending.length === 0 && attendanceRate >= 80)
    insights.push({ level: 'success', message: 'No pending leave backlog and good attendance. Workforce is healthy!' });

  if (insights.length === 0)
    insights.push({ level: 'info', message: 'All systems normal. No action items right now.' });

  return insights;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [todaySummary, setTodaySummary] = useState<{ present: number; absent: number; on_leave: number; late_arrivals: number } | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    Promise.all([
      employeeService.getEmployees({ page_size: 1 }),
      leaveService.getLeaveRequests({ status: 'pending', page_size: 5 }),
      attendanceService.getMonthlySummary(today.getMonth() + 1, today.getFullYear()),
      eventService.getAnnouncements({ page_size: 3 }),
    ]).then(([empRes, leaveRes, attRes, annRes]) => {
      setStats({ total: empRes.data.count, active: empRes.data.count });
      setPendingLeaves(leaveRes.data.results);
      setTodaySummary(attRes.data as unknown as typeof todaySummary);
      setAnnouncements(annRes.data.results);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const insights = generateInsights(
    stats.total,
    todaySummary?.present || 0,
    todaySummary?.on_leave || 0,
    pendingLeaves,
    todaySummary?.late_arrivals || 0,
  );

  const insightStyles: Record<InsightLevel, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />, text: 'text-amber-800' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />, text: 'text-green-800' },
    info:    { bg: 'bg-blue-50',  border: 'border-blue-200',  icon: <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />, text: 'text-blue-800' },
    tip:     { bg: 'bg-purple-50',border: 'border-purple-200',icon: <Lightbulb className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />, text: 'text-purple-800' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={stats.total} icon={<Users className="w-6 h-6" />} color="blue" />
        <StatCard title="Present Today" value={todaySummary?.present || 0} icon={<CheckCircle className="w-6 h-6" />} color="green" />
        <StatCard title="On Leave" value={todaySummary?.on_leave || 0} icon={<Calendar className="w-6 h-6" />} color="yellow" />
        <StatCard title="Pending Leaves" value={pendingLeaves.length} icon={<AlertCircle className="w-6 h-6" />} color="red" />
      </div>

      {/* AI Smart Insights */}
      <div className="card border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold text-gray-900">AI Smart Insights</h2>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live Analysis
          </span>
        </div>
        <div className="space-y-2">
          {insights.map((ins, i) => {
            const s = insightStyles[ins.level];
            return (
              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${s.bg} ${s.border}`}>
                {s.icon}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${s.text}`}>{ins.message}</p>
                  {ins.action && ins.actionPath && (
                    <Link to={ins.actionPath} className="text-[11px] font-semibold text-indigo-600 hover:underline mt-0.5 inline-block">
                      {ins.action} →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Pending Leave Requests</h2>
            <Link to="/admin/leaves" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {pendingLeaves.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{leave.user.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {leave.leave_type.display_name} · {leave.total_days} day(s) · {format(new Date(leave.start_date), 'MMM d')}
                    </p>
                  </div>
                  <Badge variant="pending">Pending</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Announcements</h2>
            <Link to="/admin/announcements" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Manage <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No announcements</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={a.priority === 'urgent' ? 'rejected' : a.priority === 'high' ? 'warning' : 'info'}>
                      {a.priority}
                    </Badge>
                    <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
