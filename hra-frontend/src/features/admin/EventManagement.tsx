import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { eventService } from '../../services/eventService';
import type { Event, Announcement } from '../../types';
import { format } from 'date-fns';

type Tab = 'events' | 'announcements';

const EventManagement: React.FC = () => {
  const [tab, setTab] = useState<Tab>('announcements');
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Event | Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  const eventForm = useForm<Partial<Event>>();
  const annForm = useForm<Partial<Announcement>>({ defaultValues: { priority: 'medium' } });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, annRes] = await Promise.all([
        eventService.getEvents({ page_size: '50' }),
        eventService.getAnnouncements({ page_size: '50' }),
      ]);
      setEvents(evRes.data.results);
      setAnnouncements(annRes.data.results);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Delete event?')) return;
    try { await eventService.deleteEvent(id); toast.success('Deleted'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const handleDeleteAnn = async (id: number) => {
    if (!confirm('Delete announcement?')) return;
    try { await eventService.deleteAnnouncement(id); toast.success('Deleted'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const onSaveEvent = async (data: Partial<Event>) => {
    setSaving(true);
    try {
      if (editing) await eventService.updateEvent((editing as Event).id, data);
      else await eventService.createEvent(data);
      toast.success('Saved!'); setModalOpen(false); fetchAll();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const onSaveAnn = async (data: Partial<Announcement>) => {
    setSaving(true);
    try {
      if (editing) await eventService.updateAnnouncement((editing as Announcement).id, data);
      else await eventService.createAnnouncement(data);
      toast.success('Saved!'); setModalOpen(false); fetchAll();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Events & Announcements</h1>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditing(null); setModalOpen(true); }}>
          Add {tab === 'events' ? 'Event' : 'Announcement'}
        </Button>
      </div>

      <div className="flex gap-2">
        {(['announcements', 'events'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >{t}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {tab === 'announcements' ? (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Created</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {announcements.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400">No announcements</td></tr>
                ) : announcements.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-400 line-clamp-1">{a.content}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={a.priority === 'urgent' ? 'rejected' : a.priority === 'high' ? 'warning' : 'info'}>{a.priority}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{a.created_at ? format(new Date(a.created_at), 'MMM d') : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(a); annForm.reset(a); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg mr-1"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteAnn(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Event</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Location</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {events.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400">No events</td></tr>
                ) : events.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><p className="font-medium text-gray-900">{e.title}</p></td>
                    <td className="px-4 py-3 text-gray-600">{format(new Date(e.event_date), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{e.location || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(e); eventForm.reset(e); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg mr-1"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteEvent(e.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${tab === 'events' ? 'Event' : 'Announcement'}` : `Add ${tab === 'events' ? 'Event' : 'Announcement'}`}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={tab === 'events' ? eventForm.handleSubmit(onSaveEvent) : annForm.handleSubmit(onSaveAnn)}>Save</Button></>}
      >
        {tab === 'announcements' ? (
          <form className="space-y-4">
            <div><label className="label">Title *</label><input className="input-field" {...annForm.register('title', { required: true })} /></div>
            <div><label className="label">Content *</label><textarea className="input-field h-24 resize-none" {...annForm.register('content', { required: true })} /></div>
            <div><label className="label">Priority</label>
              <select className="input-field" {...annForm.register('priority')}>
                {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label">Expires At</label><input type="date" className="input-field" {...annForm.register('expires_at')} /></div>
          </form>
        ) : (
          <form className="space-y-4">
            <div><label className="label">Title *</label><input className="input-field" {...eventForm.register('title', { required: true })} /></div>
            <div><label className="label">Content</label><textarea className="input-field h-20 resize-none" {...eventForm.register('content')} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Event Date *</label><input type="date" className="input-field" {...eventForm.register('event_date', { required: true })} /></div>
              <div><label className="label">Time</label><input type="time" className="input-field" {...eventForm.register('event_time')} /></div>
            </div>
            <div><label className="label">Location</label><input className="input-field" {...eventForm.register('location')} /></div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default EventManagement;
