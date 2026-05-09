import { useAppStore } from '../store/useAppStore';
import { formatPeriodLabel } from '../utils/date.utils';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export function PeriodHeader() {
  const { currentPeriodDate, periodType, setPeriodType, goToPrevPeriod, goToNextPeriod } = useAppStore();

  return (
    <div className="sticky top-0 z-30 pt-4 px-4 pb-2 md:pt-6 md:px-6">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl shadow-xl shadow-primary/5 dark:shadow-black/40"
      >
        <div className="flex gap-1 p-1 bg-white/40 dark:bg-white/5 rounded-2xl w-full sm:w-auto">
          {(['week', 'month', 'year'] as const).map(pt => (
            <button
              key={pt}
              onClick={() => setPeriodType(pt)}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300",
                periodType === pt
                  ? "bg-white dark:bg-white/20 text-primary shadow-sm border border-white/60 dark:border-white/10"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10 border border-transparent"
              )}
            >
              {pt.charAt(0).toUpperCase() + pt.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex items-center justify-between w-full sm:w-auto px-2 gap-4">
          <button 
            onClick={goToPrevPeriod} 
            className="p-2 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all duration-300 border border-white/50 dark:border-white/5 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-[15px] font-bold text-slate-800 dark:text-white min-w-[140px] text-center tracking-wide">
            {formatPeriodLabel(currentPeriodDate, periodType)}
          </span>
          
          <button 
            onClick={goToNextPeriod} 
            className="p-2 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all duration-300 border border-white/50 dark:border-white/5 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
