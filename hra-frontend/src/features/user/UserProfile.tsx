import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Camera, User, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAppDispatch } from '../../store';
import { setUser } from '../../store/authSlice';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

interface ProfileForm { first_name: string; last_name: string; phone: string; address: string; date_of_birth: string; gender: string; marital_status: string; }
interface PwForm { old_password: string; new_password: string; confirm_password: string; }

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [photoLoading, setPhotoLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const profileForm = useForm<ProfileForm>({ defaultValues: {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    marital_status: user?.marital_status || '',
  }});

  const pwForm = useForm<PwForm>();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { toast.error('Photo must be 1MB or less'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    setPhotoLoading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      await authService.uploadPhoto(fd);
      const meRes = await authService.getMe();
      dispatch(setUser(meRes.data));
      toast.success('Photo updated!');
    } catch { toast.error('Upload failed'); }
    finally { setPhotoLoading(false); }
  };

  const onProfileSave = async (data: ProfileForm) => {
    setProfileLoading(true);
    try {
      const res = await authService.updateProfile(data as Parameters<typeof authService.updateProfile>[0]);
      dispatch(setUser(res.data));
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setProfileLoading(false); }
  };

  const onPasswordChange = async (data: PwForm) => {
    if (data.new_password !== data.confirm_password) { toast.error('Passwords do not match'); return; }
    setPwLoading(true);
    try {
      await authService.changePassword(data.old_password, data.new_password, data.confirm_password);
      toast.success('Password changed successfully!');
      pwForm.reset();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally { setPwLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Photo + Info */}
      <div className="card flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          {user?.profile_photo_url ? (
            <img src={user.profile_photo_url} className="w-24 h-24 rounded-full object-cover" alt="avatar" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600">
              {user?.first_name?.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
            {photoLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Camera className="w-4 h-4 text-white" />}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
          <p className="text-gray-500">{user?.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {user?.employee_id && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">ID: {user.employee_id}</span>}
            {user?.department && <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded capitalize">{user.department}</span>}
            {user?.designation && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{user.designation}</span>}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Edit Profile</h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">First Name</label>
              <input className="input-field" {...profileForm.register('first_name')} />
            </div>
            <div><label className="label">Last Name</label>
              <input className="input-field" {...profileForm.register('last_name')} />
            </div>
            <div><label className="label">Phone</label>
              <input className="input-field" {...profileForm.register('phone')} />
            </div>
            <div><label className="label">Date of Birth</label>
              <input type="date" className="input-field" {...profileForm.register('date_of_birth')} />
            </div>
            <div><label className="label">Gender</label>
              <select className="input-field" {...profileForm.register('gender')}>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div><label className="label">Marital Status</label>
              <select className="input-field" {...profileForm.register('marital_status')}>
                <option value="">Select Status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>
          <div><label className="label">Address</label>
            <textarea className="input-field h-20 resize-none" {...profileForm.register('address')} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={profileLoading}>Save Changes</Button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h2>
        <form onSubmit={pwForm.handleSubmit(onPasswordChange)} className="space-y-4">
          <div><label className="label">Current Password</label>
            <input type="password" className="input-field" {...pwForm.register('old_password', { required: true })} />
          </div>
          <div><label className="label">New Password</label>
            <input type="password" className="input-field" {...pwForm.register('new_password', { required: true, minLength: { value: 8, message: 'Min 8 characters' } })} />
          </div>
          <div><label className="label">Confirm New Password</label>
            <input type="password" className="input-field" {...pwForm.register('confirm_password', { required: true })} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={pwLoading}>Change Password</Button>
          </div>
        </form>
      </div>

      {/* Read-only Info */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Employment Details</h2>
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          {[
            ['Join Date', user?.join_date || '-'],
            ['Salary', user?.salary ? `₹${Number(user.salary).toLocaleString()}` : '-'],
            ['Role', user?.role || '-'],
            ['Status', user?.is_active ? 'Active' : 'Inactive'],
          ].map(([label, value]) => (
            <React.Fragment key={label as string}>
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-900 capitalize">{value}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
