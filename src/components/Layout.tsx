import { type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, Plus, Settings } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

const navItems = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/list', label: 'Transactions', icon: <ArrowRightLeft className="w-5 h-5" /> },
  { to: '/add', label: 'Add', icon: <Plus className="w-5 h-5" /> },
  { to: '/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isAddRoute = location.pathname === '/add';
  const { isModalOpen } = useAppStore();
  const showFab = (location.pathname === '/' || location.pathname === '/list') && !isModalOpen;
  const showMobileNav = !isAddRoute && !isModalOpen;
  const bottomNavItems = navItems.filter(item => item.to !== '/add');

  return (
    <div className="flex h-screen bg-transparent">
      {/* Desktop Sidebar (Glass) */}
      <nav className="hidden md:flex flex-col w-64 bg-white/40 dark:bg-black/20 backdrop-blur-2xl border-r border-white/50 dark:border-white/10 py-8 px-4 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col gap-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-4 px-4 py-3 rounded-2xl text-[15px] font-medium transition-all duration-300",
                  isActive
                    ? 'bg-white/60 dark:bg-white/10 text-primary shadow-sm border border-white/50 dark:border-white/5'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-y-auto z-0 overscroll-x-none touch-pan-y">
          <div className="max-w-5xl mx-auto w-full min-h-full pt-[env(safe-area-inset-top,0px)] md:pt-0 pb-32 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Floating Bottom Nav (Glass Pill) */}
      <AnimatePresence mode="wait">
        {showMobileNav && (
          <motion.div
            key="mobile-nav"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:hidden fixed bottom-6 left-4 right-4 z-40"
          >
            <nav className="bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2.5rem] flex p-2 shadow-xl shadow-primary/5 dark:shadow-black/40">
              {bottomNavItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      "flex-1 flex flex-col items-center justify-center py-2 rounded-[1.75rem] transition-all duration-300",
                      isActive
                        ? 'bg-white/50 dark:bg-white/10 text-primary shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    )
                  }
                >
                  <div className="mb-1">{item.icon}</div>
                  <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Mobile) */}
      <AnimatePresence>
        {showFab && (
          <motion.div
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="md:hidden fixed bottom-[114px] right-6 z-40"
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/add')}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
                "bg-primary/10 dark:bg-primary/10 backdrop-blur-3xl border border-primary/40 dark:border-white/20",
                "shadow-[0_0_10px_rgba(0,211,120,0.2)] dark:shadow-[0_0_10px_rgba(0,0,0,0.4)]",
                "text-primary group"
              )}
            >
              <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
              <Plus className="w-8 h-8 stroke-[2.5] relative z-10" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
