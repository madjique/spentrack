import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useEffect } from 'react';

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates periodically (every 1 hour)
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  // Check for updates when the app is focused (e.g. returning from home screen)
  useEffect(() => {
    const handleFocus = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.update();
          }
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const close = () => {
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-28 left-4 right-4 z-50 flex flex-col items-center md:bottom-10 md:right-10 md:left-auto"
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-white/40 dark:border-white/10 bg-white/20 dark:bg-black/40 p-6 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/20"
              >
                <RefreshCw size={24} className="animate-spin-slow" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Update Available</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-white/60 leading-tight">
                  A new version of SpenTrack is ready. Refresh for the latest features.
                </p>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => updateServiceWorker(true)}
                    className="flex-1 rounded-2xl bg-primary px-4 py-3 text-[13px] font-bold text-white dark:text-slate-900 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                  >
                    Update Now
                  </button>
                  <button
                    onClick={close}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 transition-all hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
