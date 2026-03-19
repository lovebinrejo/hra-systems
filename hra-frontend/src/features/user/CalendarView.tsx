import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { leaveService } from '../../services/leaveService';
import type { LeaveRequest, Holiday } from '../../types';
import { format, isSameDay } from 'date-fns';

const CalendarView: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Date>(new Date());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  useEffect(() => {
    Promise.all([
      leaveService.getLeaveRequests({ status: 'approved', page_size: 100 }),
      leaveService.getHolidays({ year: String(viewYear), page_size: '100' }),
    ]).then(([lRes, hRes]) => {
      setLeaves(lRes.data.results);
      setHolidays(hRes.data.results);
    }).catch(() => toast.error('Failed to load calendar data'))
      .finally(() => setLoading(false));
  }, [viewYear]);

  const isLeaveDay = (date: Date) =>
    leaves.some(l => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      return date >= start && date <= end;
    });

  const isHoliday = (date: Date) =>
    holidays.find(h => isSameDay(new Date(h.date), date));

  const getLeaveForDay = (date: Date) =>
    leaves.find(l => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      return date >= start && date <= end;
    });

  const selectedLeave = getLeaveForDay(selected);
  const selectedHoliday = isHoliday(selected);

  // Render a simple month grid
  const renderCalendar = () => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay();
    const days = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(viewYear, viewMonth, d));

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    return weeks;
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">‹</button>
            <h2 className="font-semibold text-gray-900">{format(new Date(viewYear, viewMonth), 'MMMM yyyy')}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">›</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          {renderCalendar().map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => {
                if (!day) return <div key={di} />;
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selected);
                const leave = getLeaveForDay(day);
                const holiday = isHoliday(day);

                return (
                  <button
                    key={di}
                    onClick={() => setSelected(day)}
                    className={[
                      'relative m-0.5 h-10 rounded-lg text-sm transition-colors flex items-center justify-center',
                      isSelected ? 'bg-primary-600 text-white' :
                        isToday ? 'border-2 border-primary-400 font-semibold text-primary-700' :
                          isWeekend ? 'text-gray-300' :
                            'text-gray-700 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    {day.getDate()}
                    {/* Indicators */}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {leave && <span className="w-1 h-1 bg-green-500 rounded-full" />}
                      {holiday && <span className="w-1 h-1 bg-red-500 rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> Approved Leave</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" /> Holiday</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-primary-400 rounded" /> Today</span>
          </div>
        </div>

        {/* Day detail */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">{format(selected, 'MMMM d, yyyy')}</h2>
          {selectedLeave ? (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800">On Leave</p>
              <p className="text-xs text-green-600">{selectedLeave.leave_type.display_name}</p>
              <p className="text-xs text-green-600">{selectedLeave.reason}</p>
            </div>
          ) : selectedHoliday ? (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-800">Holiday: {selectedHoliday.name}</p>
              {selectedHoliday.description && <p className="text-xs text-red-600">{selectedHoliday.description}</p>}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No events on this day.</p>
          )}

          {/* Upcoming holidays */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Upcoming Holidays</h3>
            <div className="space-y-2">
              {holidays.filter(h => new Date(h.date) >= new Date()).slice(0, 5).map(h => (
                <div key={h.id} className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-gray-400 w-16">{format(new Date(h.date), 'MMM d')}</span>
                  <span className="text-gray-700">{h.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
