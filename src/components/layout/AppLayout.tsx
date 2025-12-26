import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';

export const AppLayout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-14 pb-20">
        <Outlet />
      </main>
      {isAuthenticated && <BottomNavigation />}
    </div>
  );
};
