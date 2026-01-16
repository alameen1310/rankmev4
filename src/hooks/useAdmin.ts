import { useAuth } from '@/contexts/AuthContext';

// Super admin email - ONLY this account can access admin features
const SUPER_ADMIN_EMAIL = 'ghostayoola@gmail.com';

export const useAdmin = () => {
  const { user, isLoading } = useAuth();

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  return {
    isSuperAdmin,
    isLoading,
    adminEmail: user?.email || null,
  };
};

export const checkIsSuperAdmin = (email: string | undefined | null): boolean => {
  return email === SUPER_ADMIN_EMAIL;
};
