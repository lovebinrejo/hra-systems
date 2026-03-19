import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserCheck, UserX, Trash2, Edit2, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { employeeService } from '../../services/employeeService';
import type { User } from '../../types';

const DEPARTMENTS = ['', 'engineering', 'hr', 'finance', 'marketing', 'operations', 'sales', 'other'];

interface EditForm {
  first_name: string; last_name: string; email: string; phone: string;
  department: string; designation: string; employee_id: string;
  join_date: string; salary: number; address: string; role: string;
  gender: string; marital_status: string; new_password: string;
}

const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);
  const [editModal, setEditModal] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditForm>();

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeService.getEmployees({ search, department: dept, page, page_size: 20 });
      setEmployees(res.data.results);
      setTotalPages(res.data.total_pages);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  }, [search, dept, page]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const openEdit = async (emp: User) => {
    setEditModal(emp);
    setShowNewPass(false);
    try {
      const res = await employeeService.getEmployee(emp.id);
      const full = res.data;
      reset({
        first_name: full.first_name, last_name: full.last_name, email: full.email,
        phone: full.phone || '', department: full.department || '', designation: full.designation || '',
        employee_id: full.employee_id || '', join_date: full.join_date || '',
        salary: full.salary || 0, address: full.address || '', role: full.role,
        gender: full.gender || '', marital_status: full.marital_status || '', new_password: '',
      });
      setEditModal(full);
    } catch {
      reset({
        first_name: emp.first_name, last_name: emp.last_name, email: emp.email,
        phone: emp.phone || '', department: emp.department || '', designation: emp.designation || '',
        employee_id: emp.employee_id || '', join_date: emp.join_date || '',
        salary: emp.salary || 0, address: emp.address || '', role: emp.role,
        gender: emp.gender || '', marital_status: emp.marital_status || '', new_password: '',
      });
    }
  };

  const onSave = async (data: EditForm) => {
    if (!editModal) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...data };
      if (!data.new_password) delete payload.new_password;
      else payload.password = data.new_password;
      delete payload.new_password;
      await employeeService.updateEmployee(editModal.id, payload as Partial<User>);
      toast.success('Employee updated!');
      setEditModal(null);
      fetchEmployees();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const msg = e.response?.data ? Object.values(e.response.data).flat()[0] : 'Update failed';
      toast.error(msg as string);
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (emp: User) => {
    setActionLoading(emp.id);
    try {
      if (emp.is_active) { await employeeService.deactivateEmployee(emp.id); toast.success(`${emp.full_name} deactivated`); }
      else { await employeeService.activateEmployee(emp.id); toast.success(`${emp.full_name} activated`); }
      fetchEmployees();
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await employeeService.deleteEmployee(deleteModal.id);
      toast.success(`${deleteModal.full_name} deleted`);
      setDeleteModal(null); fetchEmployees();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm">Manage all employee accounts</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/admin/employees/new')}>
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search by name, email, ID..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field sm:w-48" value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }}>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d ? d.charAt(0).toUpperCase() + d.slice(1) : 'All Departments'}</option>
          ))}
        </select>
        <button onClick={fetchEmployees} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? <LoadingSpinner /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Department</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">No employees found</td></tr>
                ) : employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {emp.profile_photo_url ? (
                          <img src={emp.profile_photo_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                            {emp.first_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{emp.full_name}</p>
                          <p className="text-gray-400 text-xs">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{emp.employee_id || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize hidden lg:table-cell">{emp.department || '-'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant={emp.role === 'admin' ? 'info' : 'success'}>{emp.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.is_active ? 'approved' : 'cancelled'}>
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(emp)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(emp)} disabled={actionLoading === emp.id}
                          className={`p-1.5 rounded-lg ${emp.is_active
                            ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                          title={emp.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {emp.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setDeleteModal(emp)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title={`Edit — ${editModal?.full_name}`} size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModal(null)}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit(onSave)}>Save Changes</Button>
          </>
        }
      >
        <form className="space-y-5">
          {/* Personal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Personal Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name *</label>
                <input className="input-field" {...register('first_name', { required: 'Required' })} />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input className="input-field" {...register('last_name', { required: 'Required' })} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input-field" {...register('email', { required: 'Required' })} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input-field" {...register('phone')} />
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

          {/* Work */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Work Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Employee ID</label>
                <input className="input-field" {...register('employee_id')} />
              </div>
              <div>
                <label className="label">Department</label>
                <select className="input-field" {...register('department')}>
                  <option value="">Select</option>
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
            </div>
            <div className="mt-3">
              <label className="label">Address</label>
              <textarea className="input-field h-16 resize-none" {...register('address')} />
            </div>
          </div>

          {/* Reset Password */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-1 border-b">Reset Password (optional)</h3>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                className="input-field pr-20"
                placeholder="Leave blank to keep current password"
                {...register('new_password')}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                  className="p-1 text-gray-400 hover:text-gray-600">
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button type="button"
                  onClick={() => { const v = 'STA@' + Math.random().toString(36).slice(-6).toUpperCase(); reset({ ...{ new_password: v } }); navigator.clipboard.writeText(v); toast.success('New password copied!'); }}
                  className="p-1 text-gray-400 hover:text-primary-600" title="Generate & copy password">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Click the copy icon to auto-generate a new password.</p>
          </div>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{deleteModal?.full_name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default EmployeeList;
