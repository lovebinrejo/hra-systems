import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { attendanceService } from '../../services/attendanceService';
import { format } from 'date-fns';

const AttendanceMonitor: React.FC = () => {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [summary, setSummary] = useState<{
    present: number; absent: number; on_leave: number; late_arrivals: number;
    total_work_hours: number; records: unknown[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getMonthlySummary(month, year);
      setSummary(res.data as typeof summary);
    } catch {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Monitor</h1>
          <p className="text-gray-500 text-sm">Track employee attendance records</p>
        </div>
        <div className="flex gap-2">
          <select className="input-field w-36" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {format(new Date(2024, i, 1), 'MMMM')}
              </option>
            ))}
          </select>
          <select className="input-field w-24" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Present" value={summary.present} icon={<CheckCircle className="w-6 h-6" />} color="green" />
            <StatCard title="Absent" value={summary.absent} icon={<XCircle className="w-6 h-6" />} color="red" />
            <StatCard title="On Leave" value={summary.on_leave} icon={<Calendar className="w-6 h-6" />} color="yellow" />
            <StatCard title="Late Arrivals" value={summary.late_arrivals} icon={<AlertCircle className="w-6 h-6" />} color="purple" />
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">
              Total Work Hours: <span className="text-primary-600">{summary.total_work_hours?.toFixed(1)}h</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Check In</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Check Out</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Hours</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(summary.records as Array<{
                    id: number; user_name: string; date: string;
                    check_in_time: string | null; check_out_time: string | null;
                    work_hours: number | null; status: string; is_late: boolean;
                  }>).map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{rec.user_name}</td>
                      <td className="px-4 py-3 text-gray-600">{format(new Date(rec.date), 'MMM d')}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {rec.check_in_time || '-'}
                        {rec.is_late && <span className="ml-1 text-xs text-orange-500">(late)</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{rec.check_out_time || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{rec.work_hours ? `${rec.work_hours}h` : '-'}</td>
                      <td className="px-4 py-3"><Badge variant={rec.status as 'present' | 'absent'}>{rec.status.replace('_', ' ')}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Fix missing import
import { Calendar } from 'lucide-react';

export default AttendanceMonitor;
