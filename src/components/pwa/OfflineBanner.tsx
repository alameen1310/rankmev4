import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineBanner() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="fixed top-[calc(56px+env(safe-area-inset-top))] left-0 right-0 z-40 bg-destructive text-destructive-foreground"
        >
          <div className="flex items-center justify-between px-4 py-2 max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">You're offline</span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRetry}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </motion.div>
      )}

      {isOnline && isSlowConnection && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="fixed top-[calc(56px+env(safe-area-inset-top))] left-0 right-0 z-40 bg-warning text-warning-foreground"
        >
          <div className="flex items-center justify-center px-4 py-1 max-w-lg mx-auto">
            <span className="text-xs">Slow connection detected</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
