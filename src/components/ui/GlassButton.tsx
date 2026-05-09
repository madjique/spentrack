import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface GlassButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'secondary', size = 'md', children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-indigo-500/90 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] border-indigo-400/50 hover:bg-indigo-400 dark:bg-indigo-600/80 dark:border-indigo-500/50 dark:hover:bg-indigo-500",
      secondary: "bg-white/40 dark:bg-white/10 text-slate-800 dark:text-white border-white/50 dark:border-white/20 hover:bg-white/60 dark:hover:bg-white/20 backdrop-blur-md",
      danger: "bg-red-500/80 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-400/50 hover:bg-red-400",
      ghost: "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 border-transparent"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-xl",
      md: "px-5 py-2.5 text-base rounded-2xl",
      lg: "px-6 py-3 text-lg font-medium rounded-2xl",
      icon: "p-2.5 flex items-center justify-center rounded-2xl"
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
        className={cn(
          "border font-medium transition-colors outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
GlassButton.displayName = "GlassButton";
