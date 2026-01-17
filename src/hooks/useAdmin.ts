import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Super admin email - ONLY this account can access admin features by default
const SUPER_ADMIN_EMAIL = 'ghostayoola@gmail.com';

export const useAdmin = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [isAdminFromDb, setIsAdminFromDb] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdminFromDb(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdminFromDb(false);
        } else {
          setIsAdminFromDb(data?.is_admin ?? false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdminFromDb(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  // User is admin if they're the super admin OR if is_admin is true in the database
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL || isAdminFromDb === true;

  return {
    isSuperAdmin,
    isLoading: authLoading || isLoading,
    adminEmail: user?.email || null,
  };
};

export const checkIsSuperAdmin = (email: string | undefined | null): boolean => {
  return email === SUPER_ADMIN_EMAIL;
};