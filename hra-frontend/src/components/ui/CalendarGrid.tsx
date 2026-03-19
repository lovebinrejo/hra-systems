import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';

export interface CalendarEvent {
  date: string; // 'YYYY-MM-DD'
  label: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
}

interface CalendarGridProps {
  events: CalendarEvent[];
  onDayClick?: (date: Date, events: CalendarEvent[]) => void;
}

const COLOR_DOT: Record<CalendarEvent['color'], string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-400',
};

const COLOR_BG: Record<CalendarEvent['color'], string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarGrid: React.FC<CalendarGridProps> = ({ events, onDayClick }) => {
  const [current, setCurrent] = useState(new Date());

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.date + 'T00:00:00'), day));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1))}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-gray-900">{format(current, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1))}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {/* Padding cells */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[80px] border-b border-r border-gray-50" />
        ))}

        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const today = isToday(day);
          const isSunday = day.getDay() === 0;
          const isSaturday = day.getDay() === 6;

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick?.(day, dayEvents)}
              className={`min-h-[80px] border-b border-r border-gray-100 p-1.5 cursor-pointer hover:bg-gray-50 transition-colors
                ${isSunday || isSaturday ? 'bg-gray-50/50' : ''}`}
            >
              <div className={`w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full mb-1
                ${today ? 'bg-primary-600 text-white' : isSunday ? 'text-red-400' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((ev, i) => (
                  <div key={i} className={`text-xs px-1 py-0.5 rounded truncate font-medium ${COLOR_BG[ev.color]}`}>
                    {ev.label}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-3">
        {(['blue', 'green', 'yellow', 'red', 'orange'] as CalendarEvent['color'][]).map((c) => {
          const hasEvent = events.some((e) => e.color === c);
          if (!hasEvent) return null;
          const labels: Record<string, string> = { blue: 'Pending', green: 'Approved', yellow: 'Holiday', red: 'Rejected', orange: 'Optional' };
          return (
            <div key={c} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${COLOR_DOT[c]}`} />
              <span className="text-xs text-gray-500">{labels[c]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
