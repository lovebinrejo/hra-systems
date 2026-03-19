import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { employeeService } from '../../services/employeeService';

const DEFAULT_PASSWORD = 'STA@2024!';

interface CreateForm {
  email: string; username: string; first_name: string; last_name: string;
  role: string; department: string; designation: string; employee_id: string;
  phone: string; join_date: string; salary: number; address: string; password: string;
  gender: string; marital_status: string;
}

const EmployeeCreate: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateForm>({
    defaultValues: { role: 'employee', password: DEFAULT_PASSWORD },
  });
  const currentPassword = watch('password');

  const onSubmit = async (data: CreateForm) => {
    setLoading(true);
    try {
      const emp = await employeeService.createEmployee(data as unknown as Record<string, unknown>);
      toast.success(`${emp.data.full_name} created successfully!`);
      navigate(`/admin/employees/${emp.data.id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const msg = error.response?.data ? Object.values(error.response.data).flat()[0] : 'Failed to create employee';
      toast.error(msg as string);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Employee</h1>
          <p className="text-gray-500 text-sm">Create a new employee account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input className="input-field" {...register('first_name', { required: 'Required' })} />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input-field" {...register('last_name', { required: 'Required' })} />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input-field" {...register('email', { required: 'Required' })} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Username *</label>
              <input className="input-field" {...register('username', { required: 'Required' })} />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input-field" {...register('phone')} />
            </div>
            <div>
              <label className="label">Employee ID</label>
              <input className="input-field" {...register('employee_id')} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input-field" {...register('gender')}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Marital Status</label>
              <select className="input-field" {...register('marital_status')}>
                <option value="">Select Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Work Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Department</label>
              <select className="input-field" {...register('department')}>
                <option value="">Select Department</option>
                {['engineering','hr','finance','marketing','operations','sales','other'].map(d => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Designation</label>
              <input className="input-field" {...register('designation')} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input-field" {...register('role')}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Join Date</label>
              <input type="date" className="input-field" {...register('join_date')} />
            </div>
            <div>
              <label className="label">Salary (₹)</label>
              <input type="number" className="input-field" {...register('salary', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="label">Initial Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-20"
                  {...register('password', { required: 'Required' })}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button type="button" onClick={() => setShowPass(!showPass)} className="p-1 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button type="button"
                    onClick={() => { navigator.clipboard.writeText(currentPassword); toast.success('Password copied!'); }}
                    className="p-1 text-gray-400 hover:text-primary-600" title="Copy password">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-800">Default Password</p>
                  <p className="text-sm font-mono font-bold text-amber-900">{DEFAULT_PASSWORD}</p>
                </div>
                <button type="button"
                  onClick={() => { setValue('password', DEFAULT_PASSWORD); navigator.clipboard.writeText(DEFAULT_PASSWORD); toast.success('Default password set & copied!'); }}
                  className="text-xs px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded-md font-medium flex items-center gap-1">
                  <Copy className="w-3 h-3" /> Use Default
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Address</label>
            <textarea className="input-field h-20 resize-none" {...register('address')} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Employee</Button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeCreate;
