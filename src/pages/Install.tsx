import { Download, Smartphone, Apple, Monitor, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { Link } from 'react-router-dom';

export function Install() {
  const { isInstallable, isInstalled, promptInstall } = usePWA();

  const handleInstall = async () => {
    await promptInstall();
  };

  // Detect platform
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

  if (isInstalled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <Check className="h-10 w-10 text-success" />
        </div>
        <h1 className="text-2xl font-bold mb-2">App Already Installed!</h1>
        <p className="text-muted-foreground mb-6">
          You're using RankMe as an app. Enjoy the full experience!
        </p>
        <Link to="/dashboard">
          <Button size="lg">
            Go to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 pattern-geometric">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-success/5" />
        <div className="relative max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Install RankMe</h1>
          <p className="text-muted-foreground">
            Add to your home screen for instant access and an app-like experience
          </p>
        </div>
      </section>

      {/* Install Button or Instructions */}
      <section className="px-4 py-6">
        <div className="max-w-md mx-auto">
          {isInstallable ? (
            <div className="glass rounded-2xl p-6 text-center">
              <Button
                size="lg"
                onClick={handleInstall}
                className="w-full h-14 text-lg mb-4"
              >
                <Download className="h-5 w-5 mr-2" />
                Install Now
              </Button>
              <p className="text-xs text-muted-foreground">
                Free • No app store needed • Works offline
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {isIOS && (
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Apple className="h-6 w-6" />
                    <h2 className="font-semibold">Install on iOS</h2>
                  </div>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">1</span>
                      <span>Tap the <strong>Share</strong> button at the bottom of Safari</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">2</span>
                      <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">3</span>
                      <span>Tap <strong>"Add"</strong> in the top right corner</span>
                    </li>
                  </ol>
                </div>
              )}

              {isAndroid && (
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Smartphone className="h-6 w-6" />
                    <h2 className="font-semibold">Install on Android</h2>
                  </div>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">1</span>
                      <span>Tap the <strong>menu</strong> (three dots) in Chrome</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">2</span>
                      <span>Tap <strong>"Add to Home screen"</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">3</span>
                      <span>Tap <strong>"Add"</strong> to confirm</span>
                    </li>
                  </ol>
                </div>
              )}

              {!isMobile && (
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Monitor className="h-6 w-6" />
                    <h2 className="font-semibold">Install on Desktop</h2>
                  </div>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">1</span>
                      <span>Look for the install icon in your browser's address bar</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0">2</span>
                      <span>Click <strong>"Install"</strong> when prompted</span>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-6">
        <div className="max-w-md mx-auto">
          <h2 className="font-semibold mb-4 text-center">Why Install?</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '⚡', title: 'Faster Launch', desc: 'Opens instantly' },
              { icon: '📶', title: 'Works Offline', desc: 'Play anywhere' },
              { icon: '🔔', title: 'Notifications', desc: 'Never miss a streak' },
              { icon: '🎮', title: 'Full Screen', desc: 'No browser bars' },
            ].map((benefit) => (
              <div key={benefit.title} className="glass rounded-xl p-4 text-center">
                <span className="text-2xl mb-2 block">{benefit.icon}</span>
                <h3 className="font-medium text-sm">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skip Option */}
      <section className="px-4 py-4">
        <div className="max-w-md mx-auto text-center">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              Continue in browser
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
