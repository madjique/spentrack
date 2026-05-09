import { type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, Plus, Settings } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';
import { COLORS, hexToRgba } from '../utils/theme';

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
  const showFab = location.pathname === '/' || location.pathname === '/list';
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
        <main className="flex-1 overflow-y-auto z-0">
          <div className="max-w-5xl mx-auto w-full min-h-full pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] md:pt-6 pb-32 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Floating Bottom Nav (Glass Pill) */}
      {!isAddRoute && (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-40">
          <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl flex p-2 shadow-xl shadow-primary/5 dark:shadow-black/40"
          >
            {bottomNavItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    "flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-all duration-300",
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
          </motion.nav>
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      {showFab && (
        <div className="md:hidden fixed bottom-[104px] right-6 z-40">
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/add')}
            className={`w-14 h-14 bg-primary hover:bg-primary/90 text-white dark:text-slate-900 rounded-full flex items-center justify-center shadow-[0_8px_30px_${hexToRgba(COLORS.primary, 0.3)}] backdrop-blur-md border border-white/20 transition-all duration-300`}
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </div>
      )}
    </div>
  );
}
