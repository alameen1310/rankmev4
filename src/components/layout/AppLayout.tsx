import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { PageTransition } from './PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { UpdatePrompt } from '@/components/pwa/UpdatePrompt';

export const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-background max-w-full overflow-x-hidden">
      <Header />
      <OfflineBanner />
      <UpdatePrompt />
      <main className="flex-1 pt-14 pb-16 lg:pb-4 lg:pl-56">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      {isAuthenticated && <BottomNavigation />}
      <InstallPrompt />
    </div>
  );
};
