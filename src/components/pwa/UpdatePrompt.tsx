import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';

export function UpdatePrompt() {
  const { needsRefresh, refreshApp } = usePWA();

  return (
    <AnimatePresence>
      {needsRefresh && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-[calc(56px+env(safe-area-inset-top)+8px)] left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="glass-strong rounded-xl p-3 shadow-lg border border-success/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Update available!</span>
              </div>
              <Button
                size="sm"
                onClick={refreshApp}
                className="bg-success hover:bg-success/90"
              >
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
