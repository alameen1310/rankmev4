import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
        // Check user_roles table first (proper RBAC)
        // Cast to any since types may not be regenerated yet
        const { data: roleData, error: roleError } = await (supabase as any)
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!roleError && roleData?.role === 'admin') {
          setIsAdminFromDb(true);
          setIsLoading(false);
          return;
        }

        // Fallback: check legacy is_admin on profiles
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

  // User is admin if they have admin role in user_roles OR is_admin is true in profiles
  const isSuperAdmin = isAdminFromDb === true;

  return {
    isSuperAdmin,
    isLoading: authLoading || isLoading,
    adminEmail: user?.email || null,
  };
};

export const checkIsSuperAdmin = async (userId: string): Promise<boolean> => {
  try {
    // Check user_roles table (cast to any for type safety)
    const { data: roleData } = await (supabase as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleData?.role === 'admin') return true;

    // Fallback to profiles
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    return data?.is_admin === true;
  } catch {
    return false;
  }
};
