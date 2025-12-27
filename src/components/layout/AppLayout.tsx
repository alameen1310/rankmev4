import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';

export const AppLayout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background max-w-full overflow-x-hidden">
      <Header />
      <main className="pt-[calc(56px+env(safe-area-inset-top))] pb-[calc(80px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      {isAuthenticated && <BottomNavigation />}
    </div>
  );
};