import { useAppSelector } from '../store';

export const useAuth = () => {
  const { user, access, loading } = useAppSelector((state) => state.auth);
  return {
    user,
    access,
    loading,
    isAuthenticated: !!access && !!user,
    isAdmin: user?.is_admin_user ?? false,
  };
};
