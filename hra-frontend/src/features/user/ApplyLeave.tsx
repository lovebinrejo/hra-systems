import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Calendar, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { leaveService } from '../../services/leaveService';
import { employeeService } from '../../services/employeeService';
import type { LeaveType, LeaveBalance } from '../../types';
import { differenceInBusinessDays } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';

function suggestLeaveType(reason: string, types: LeaveType[]): LeaveType | null {
  if (!reason || reason.length < 5) return null;
  const r = reason.toLowerCase();
  const rules: { keywords: string[]; name: string }[] = [
    { keywords: ['sick','fever','ill','hospital','doctor','medical','medicine','health','pain','cold','flu','injury','covid','surgery'], name: 'sick' },
    { keywords: ['vacation','trip','travel','tour','holiday','outing','visit','family trip','leisure'], name: 'paid' },
    { keywords: ['family','wedding','marriage','funeral','death','ceremony','function','personal','baby','maternity','paternity'], name: 'casual' },
    { keywords: ['unpaid','no pay','without pay','financial','emergency leave'], name: 'unpaid' },
  ];
  for (const rule of rules) {
    if (rule.keywords.some(k => r.includes(k))) {
      return types.find(t => t.name === rule.name) || null;
    }
  }
  return null;
}

interface LeaveForm {
  leave_type: number;
  start_date: string;
  end_date: string;
  reason: string;
}

const ApplyLeave: React.FC = () => {
  const { user } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LeaveForm>();
  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const leaveTypeId = watch('leave_type');
  const reason = watch('reason');

  const days = startDate && endDate
    ? Math.max(0, differenceInBusinessDays(new Date(endDate), new Date(startDate)) + 1)
    : 0;

  const selectedType = leaveTypes.find(t => t.id === Number(leaveTypeId));

  useEffect(() => {
    Promise.all([leaveService.getLeaveTypes(), employeeService.getMyLeaveBalance()])
      .then(([typesRes, balRes]) => {
        const gender = user?.gender;
        const all = (typesRes.data.results || []).filter((t: LeaveType) => t.is_active);
        const filtered = all.filter((t: LeaveType) => {
          if (t.name === 'maternity' && gender === 'male') return false;
          if (t.name === 'paternity' && gender === 'female') return false;
          return true;
        });
        setLeaveTypes(filtered);
        setBalance(balRes.data);
      })
      .finally(() => setInitLoading(false));
  }, [user?.gender]);

  const getAvailable = (typeName: string) => {
    if (!balance) return 0;
    const map: Record<string, number> = {
      paid: balance.paid_leaves_remaining,
      unpaid: balance.unpaid_leaves_remaining,
      sick: balance.sick_leaves_remaining,
      casual: balance.casual_leaves_remaining,
    };
    return map[typeName] ?? 0;
  };

  const onSubmit = async (data: LeaveForm) => {
    setLoading(true);
    try {
      await leaveService.applyLeave({ ...data, leave_type: Number(data.leave_type) });
      toast.success('Leave application submitted successfully!');
      navigate('/leaves');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; non_field_errors?: string[] } } };
      const msg = error.response?.data?.message
        || error.response?.data?.non_field_errors?.[0]
        || 'Failed to apply for leave';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apply for Leave</h1>
          <p className="text-gray-500 text-sm">Submit a new leave request</p>
        </div>
      </div>

      {/* Balance Cards */}
      {balance && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'paid', label: 'Paid', val: balance.paid_leaves_remaining },
            { key: 'sick', label: 'Sick', val: balance.sick_leaves_remaining },
            { key: 'casual', label: 'Casual', val: balance.casual_leaves_remaining },
            { key: 'unpaid', label: 'Unpaid', val: balance.unpaid_leaves_remaining },
          ].map(({ key, label, val }) => (
            <div key={key} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">{label} Leave</p>
              <p className="text-xl font-bold text-primary-600">{val}</p>
              <p className="text-xs text-gray-400">days left</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="label">Leave Type *</label>
          <select className="input-field" {...register('leave_type', { required: 'Please select leave type', valueAsNumber: true })}>
            <option value="">Select type</option>
            {leaveTypes.map(lt => (
              <option key={lt.id} value={lt.id}>{lt.display_name}</option>
            ))}
          </select>
          {errors.leave_type && <p className="text-red-500 text-xs mt-1">{errors.leave_type.message}</p>}
          {selectedType && (
            <p className="text-xs text-gray-500 mt-1">
              Available: <strong>{getAvailable(selectedType.name)}</strong> day(s)
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date *</label>
            <input type="date" className="input-field"
              min={new Date().toISOString().split('T')[0]}
              {...register('start_date', { required: 'Start date is required' })} />
            {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
          </div>
          <div>
            <label className="label">End Date *</label>
            <input type="date" className="input-field"
              min={startDate || new Date().toISOString().split('T')[0]}
              {...register('end_date', { required: 'End date is required' })} />
            {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
          </div>
        </div>

        {days > 0 && (
          <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-lg text-sm text-primary-700">
            <Calendar className="w-4 h-4" />
            <span><strong>{days} working day(s)</strong> requested (excludes weekends)</span>
          </div>
        )}

        <div>
          <label className="label">Reason *</label>
          <textarea
            className="input-field h-24 resize-none"
            placeholder="Briefly describe the reason for your leave..."
            {...register('reason', { required: 'Reason is required', minLength: { value: 10, message: 'Please provide more detail' } })}
          />
          {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
          {(() => {
            const suggestion = suggestLeaveType(reason || '', leaveTypes);
            if (!suggestion || suggestion.id === Number(leaveTypeId)) return null;
            return (
              <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                <p className="text-xs text-indigo-700 flex-1">
                  AI suggests: <strong>{suggestion.display_name}</strong> based on your reason
                </p>
                <button
                  type="button"
                  onClick={() => setValue('leave_type', suggestion.id, { shouldValidate: true })}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-2 py-0.5 rounded transition-colors"
                >
                  Apply
                </button>
              </div>
            );
          })()}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={loading}>Submit Application</Button>
        </div>
      </form>
    </div>
  );
};

export default ApplyLeave;
