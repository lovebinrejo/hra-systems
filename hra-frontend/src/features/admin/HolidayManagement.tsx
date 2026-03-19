import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, LayoutList, CalendarDays } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import CalendarGrid, { CalendarEvent } from '../../components/ui/CalendarGrid';
import { leaveService } from '../../services/leaveService';
import type { Holiday } from '../../types';
import { format } from 'date-fns';

interface HolidayForm { name: string; date: string; description: string; is_public: boolean; is_optional: boolean; }
type ViewMode = 'list' | 'calendar';

const HolidayManagement: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [dayModal, setDayModal] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<HolidayForm>();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveService.getHolidays({ page_size: '100' });
      setHolidays(res.data.results);
    } catch { toast.error('Failed to load holidays'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => { setEditing(null); reset({ is_public: true }); setModalOpen(true); };
  const openEdit = (h: Holiday) => { setEditing(h); reset(h); setModalOpen(true); };

  const onSubmit = async (data: HolidayForm) => {
    setSaving(true);
    try {
      if (editing) { await leaveService.updateHoliday(editing.id, data); toast.success('Updated!'); }
      else { await leaveService.createHoliday(data); toast.success('Holiday added!'); }
      setModalOpen(false); fetch();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this holiday?')) return;
    try { await leaveService.deleteHoliday(id); toast.success('Deleted'); fetch(); }
    catch { toast.error('Delete failed'); }
  };

  const calendarEvents: CalendarEvent[] = holidays.map((h) => ({
    date: h.date,
    label: h.name,
    color: h.is_optional ? 'orange' : h.is_public ? 'yellow' : 'blue',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holidays</h1>
          <p className="text-gray-500 text-sm">Manage public and office holidays</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutList className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CalendarDays className="w-4 h-4" /> Calendar
            </button>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Holiday</Button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <>
          {loading ? <LoadingSpinner /> : (
            <CalendarGrid
              events={calendarEvents}
              onDayClick={(date, events) => events.length > 0 && setDayModal({ date, events })}
            />
          )}
          {/* Legend override for holidays */}
          <div className="flex gap-4 flex-wrap text-sm text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> Public Holiday</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Office Holiday</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Optional Holiday</span>
          </div>
        </>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? <LoadingSpinner /> : (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Holiday</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Day</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {holidays.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">No holidays added</td></tr>
                ) : holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{h.name}</p>
                      {h.description && <p className="text-xs text-gray-400">{h.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{format(new Date(h.date + 'T00:00:00'), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3 text-gray-600">{format(new Date(h.date + 'T00:00:00'), 'EEEE')}</td>
                    <td className="px-4 py-3">
                      <Badge variant={h.is_optional ? 'warning' : h.is_public ? 'info' : 'success'}>
                        {h.is_optional ? 'Optional' : h.is_public ? 'Public' : 'Office'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(h)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg mr-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(h.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Day click modal */}
      <Modal isOpen={!!dayModal} onClose={() => setDayModal(null)}
        title={dayModal ? format(dayModal.date, 'MMMM d, yyyy — EEEE') : ''}>
        <div className="space-y-2">
          {dayModal?.events.map((ev, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                ev.color === 'yellow' ? 'bg-yellow-400' : ev.color === 'orange' ? 'bg-orange-400' : 'bg-blue-500'
              }`} />
              <span className="text-sm font-medium text-gray-800">{ev.label}</span>
              <Badge variant={ev.color === 'orange' ? 'warning' : 'info'} >
                {ev.color === 'orange' ? 'Optional' : ev.color === 'yellow' ? 'Public' : 'Office'}
              </Badge>
            </div>
          ))}
        </div>
      </Modal>

      {/* Add/Edit modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Holiday' : 'Add Holiday'}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Save</Button></>}
      >
        <form className="space-y-4">
          <div><label className="label">Holiday Name *</label>
            <input className="input-field" {...register('name', { required: 'Required' })} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div><label className="label">Date *</label>
            <input type="date" className="input-field" {...register('date', { required: 'Required' })} />
          </div>
          <div><label className="label">Description</label>
            <input className="input-field" {...register('description')} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" {...register('is_public')} className="rounded" /> Public Holiday
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" {...register('is_optional')} className="rounded" /> Optional Holiday
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HolidayManagement;
