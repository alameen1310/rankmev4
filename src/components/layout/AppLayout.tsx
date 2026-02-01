import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';

export const AppLayout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-background max-w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto pt-[calc(56px+env(safe-area-inset-top))] pb-[calc(80px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      {isAuthenticated && <BottomNavigation />}
    </div>
  );
};