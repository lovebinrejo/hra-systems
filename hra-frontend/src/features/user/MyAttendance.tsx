import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { MapPin, Clock, CheckCircle, LogOut, LogIn, Timer } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { attendanceService } from '../../services/attendanceService';
import { useGeolocation } from '../../hooks/useGeolocation';
import type { Attendance, AttendanceSession } from '../../types';
import { format } from 'date-fns';

const MyAttendance: React.FC = () => {
  const [today, setToday] = useState<Attendance | { checked_in: boolean; date: string } | null>(null);
  const [summary, setSummary] = useState<{ present: number; absent: number; late_arrivals: number; total_work_hours: number; records: Attendance[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { getLocation, error: geoError, loading: geoLoading } = useGeolocation();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, summaryRes] = await Promise.all([
        attendanceService.getTodayAttendance(),
        attendanceService.getMonthlySummary(month, year),
      ]);
      setToday(todayRes.data as typeof today);
      setSummary(summaryRes.data as typeof summary);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const pos = await getLocation();
      await attendanceService.checkIn(pos.lat, pos.lng);
      const accuracyMsg = pos.accuracy ? ` (±${pos.accuracy}m)` : '';
      toast.success(`Checked in successfully!${accuracyMsg}`);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      let pos = null;
      try { pos = await getLocation(); } catch { /* optional */ }
      await attendanceService.checkOut(pos?.lat, pos?.lng);
      toast.success('Checked out successfully!');
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Determine state from sessions array (new) or legacy fields (old records)
  const todayAtt = today && 'sessions' in today ? today as Attendance : null;
  const sessions: AttendanceSession[] = todayAtt?.sessions || [];
  const hasOpenSession = sessions.length > 0 && sessions[sessions.length - 1].check_out_time === null;
  const hasAnySessions = sessions.length > 0;

  // Fall back to legacy for old records
  const legacyCheckedIn = !todayAtt && today && 'check_in_time' in today && (today as Attendance).check_in_time;

  const canCheckIn = !hasOpenSession;
  const canCheckOut = hasOpenSession;

  const totalHours = todayAtt?.work_hours ?? sessions.reduce((s, x) => s + (x.hours ?? 0), 0);

  const LocationLink = ({ loc, color = 'blue' }: { loc: { lat: number; lng: number }; color?: string }) => (
    <a
      href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
      target="_blank" rel="noreferrer"
      className={`text-${color}-600 hover:underline text-xs`}
    >
      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
    </a>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
      </div>

      {/* Today's Attendance Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Today's Attendance</h2>
          {hasAnySessions && totalHours > 0 && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
              <Timer className="w-4 h-4" />
              Total: {totalHours.toFixed(2)}h
            </div>
          )}
        </div>

        {loading ? <LoadingSpinner size="sm" /> : (
          <div className="space-y-4">
            {/* Sessions list */}
            {hasAnySessions ? (
              <div className="space-y-2">
                {sessions.map((session, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 ${session.check_out_time === null ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Session {idx + 1}
                        {session.check_out_time === null && (
                          <span className="ml-2 inline-flex items-center gap-1 text-primary-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse inline-block" />
                            Active
                          </span>
                        )}
                      </span>
                      {session.hours !== null && (
                        <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          {session.hours.toFixed(2)}h
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {/* Check-in */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <LogIn className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="font-medium">{session.check_in_time}</span>
                          {idx === 0 && todayAtt?.is_late && <Badge variant="warning">Late</Badge>}
                        </div>
                        {session.check_in_location && (
                          <div className="flex items-center gap-1 text-gray-400 ml-5">
                            <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            <LocationLink loc={session.check_in_location} color="blue" />
                            {session.distance_km != null && (
                              <span className="text-xs">({session.distance_km.toFixed(1)}km)</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Check-out */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <LogOut className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          <span className="font-medium">
                            {session.check_out_time || <span className="text-gray-400 font-normal">Not yet</span>}
                          </span>
                        </div>
                        {session.check_out_location && (
                          <div className="flex items-center gap-1 text-gray-400 ml-5">
                            <MapPin className="w-3 h-3 text-green-400 flex-shrink-0" />
                            <LocationLink loc={session.check_out_location} color="green" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : legacyCheckedIn ? (
              /* Legacy single check-in display for old records */
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Check-in: <strong>{(today as Attendance).check_in_time}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span>Check-out: <strong>{(today as Attendance).check_out_time || 'Not yet'}</strong></span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No check-in yet today.</p>
            )}

            {geoError && <p className="text-xs text-red-500">{geoError}</p>}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-1">
              {canCheckIn ? (
                <Button
                  loading={actionLoading || geoLoading}
                  icon={<MapPin className="w-4 h-4" />}
                  onClick={handleCheckIn}
                  variant="primary"
                >
                  {hasAnySessions ? 'Check In Again' : 'Check In'}
                </Button>
              ) : canCheckOut ? (
                <Button
                  loading={actionLoading || geoLoading}
                  icon={<LogOut className="w-4 h-4" />}
                  onClick={handleCheckOut}
                  variant="secondary"
                >
                  Check Out
                </Button>
              ) : null}

              {/* Summary when all sessions closed */}
              {hasAnySessions && !hasOpenSession && totalHours > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {sessions.length} session{sessions.length > 1 ? 's' : ''} · {totalHours.toFixed(2)}h total
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Month Selector */}
      <div className="flex gap-2">
        <select className="input-field w-36" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), 'MMMM')}</option>
          ))}
        </select>
        <select className="input-field w-24" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Monthly Summary */}
      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Present" value={summary.present} icon={<CheckCircle className="w-6 h-6" />} color="green" />
            <StatCard title="Absent" value={summary.absent} icon={<Clock className="w-6 h-6" />} color="red" />
            <StatCard title="Late Arrivals" value={summary.late_arrivals} icon={<Clock className="w-6 h-6" />} color="yellow" />
            <StatCard title="Work Hours" value={`${summary.total_work_hours?.toFixed(1)}h`} icon={<Clock className="w-6 h-6" />} color="blue" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="table-header">Date</th>
                    <th className="table-header">Sessions</th>
                    <th className="table-header hidden sm:table-cell">Total Hours</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.records.map((rec) => {
                    const recSessions: AttendanceSession[] = rec.sessions || [];
                    return (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="table-cell font-medium text-gray-900">
                          {format(new Date(rec.date), 'EEE, MMM d')}
                          {rec.is_late && <span className="block text-xs text-orange-500">Late arrival</span>}
                        </td>
                        <td className="table-cell">
                          {recSessions.length > 0 ? (
                            <div className="space-y-1">
                              {recSessions.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
                                    {i + 1}
                                  </span>
                                  <span className="text-green-600">{s.check_in_time}</span>
                                  <span className="text-gray-300">→</span>
                                  <span className="text-red-500">{s.check_out_time || <span className="text-gray-400">open</span>}</span>
                                  {s.hours !== null && (
                                    <span className="text-gray-400">({s.hours.toFixed(1)}h)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">
                              {rec.check_in_time ? (
                                <span>
                                  <span className="text-green-600">{rec.check_in_time}</span>
                                  {rec.check_out_time && <> → <span className="text-red-500">{rec.check_out_time}</span></>}
                                </span>
                              ) : '—'}
                            </div>
                          )}
                        </td>
                        <td className="table-cell hidden sm:table-cell font-medium">
                          {rec.work_hours ? (
                            <span className="text-primary-600">{rec.work_hours.toFixed(1)}h</span>
                          ) : '—'}
                        </td>
                        <td className="table-cell">
                          <Badge variant={rec.status}>{rec.status.replace('_', ' ')}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyAttendance;
