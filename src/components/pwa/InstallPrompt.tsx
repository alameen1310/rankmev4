import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';

export function InstallPrompt() {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isAndroid,
    hasNativePrompt,
    promptInstall, 
    dismissInstallPrompt, 
    shouldShowInstallPrompt 
  } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Show prompt immediately with a brief delay for page load
    const timer = setTimeout(() => {
      setIsVisible(shouldShowInstallPrompt());
    }, 500);

    return () => clearTimeout(timer);
  }, [shouldShowInstallPrompt]);

  if (!isVisible || isInstalled) return null;
  
  // On non-mobile or unsupported browsers, don't show
  if (!isInstallable && !isIOS) return null;

  const handleInstall = async () => {
    if (isIOS) {
      // Show iOS-specific instructions
      setShowIOSInstructions(true);
    } else if (hasNativePrompt) {
      const success = await promptInstall();
      if (success) {
        setIsVisible(false);
      }
    } else {
      // Android without native prompt - show instructions
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setIsVisible(false);
    setShowIOSInstructions(false);
  };

  // iOS-specific instructions modal
  if (showIOSInstructions) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-card rounded-2xl p-6 shadow-xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Install RankMe</h3>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To install RankMe on your iPhone or iPad:
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Share className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">1. Tap the Share button</p>
                      <p className="text-xs text-muted-foreground">At the bottom of Safari</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">2. Tap "Add to Home Screen"</p>
                      <p className="text-xs text-muted-foreground">Scroll down in the menu</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">3. Tap "Add"</p>
                      <p className="text-xs text-muted-foreground">RankMe will appear on your home screen</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To install RankMe on your device:
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MoreVertical className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">1. Tap the menu button</p>
                      <p className="text-xs text-muted-foreground">Three dots at the top right</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Download className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">2. Tap "Install app" or "Add to Home screen"</p>
                      <p className="text-xs text-muted-foreground">Look for the install option</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">3. Confirm installation</p>
                      <p className="text-xs text-muted-foreground">RankMe will appear on your home screen</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleDismiss}
              variant="outline"
              className="w-full mt-4"
            >
              Got it!
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="glass-strong rounded-2xl p-4 shadow-xl border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">Install RankMe</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {isIOS 
                    ? 'Add to your home screen for the best experience!'
                    : 'Install for quick access and offline support!'}
                </p>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {isIOS ? 'How to Install' : 'Install'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                  >
                    Not now
                  </Button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
