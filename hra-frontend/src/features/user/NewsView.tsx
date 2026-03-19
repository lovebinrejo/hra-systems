import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Megaphone, Calendar } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { eventService } from '../../services/eventService';
import type { Event, Announcement } from '../../types';
import { format } from 'date-fns';

type Tab = 'announcements' | 'events';

const NewsView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('announcements');
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      eventService.getEvents(),
      eventService.getAnnouncements(),
    ]).then(([evRes, annRes]) => {
      setEvents(evRes.data.results);
      setAnnouncements(annRes.data.results);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">News & Events</h1>
        <p className="text-gray-500 text-sm">Stay up to date with company announcements and events</p>
      </div>

      <div className="flex gap-2">
        {(['announcements', 'events'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >{t}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {tab === 'announcements' ? (
            announcements.length === 0 ? (
              <div className="card text-center py-12 text-gray-400">No announcements</div>
            ) : announcements.map((a) => (
              <div key={a.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <Badge variant={a.priority === 'urgent' ? 'rejected' : a.priority === 'high' ? 'warning' : 'info'}>
                        {a.priority}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {a.published_at ? format(new Date(a.published_at), 'MMM d, yyyy') : ''}
                      {a.created_by_name ? ` · by ${a.created_by_name}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            events.length === 0 ? (
              <div className="card text-center py-12 text-gray-400">No events</div>
            ) : events.map((e) => (
              <div key={e.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{e.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{e.content}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span>📅 {format(new Date(e.event_date), 'MMMM d, yyyy')}</span>
                      {e.event_time && <span>🕐 {e.event_time}</span>}
                      {e.location && <span>📍 {e.location}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NewsView;
