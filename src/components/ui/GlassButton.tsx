import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { COLORS, hexToRgba } from '../../utils/theme';

export interface GlassButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'secondary', size = 'md', children, ...props }, ref) => {
    
    const variants = {
      primary: `bg-primary/80 text-white dark:text-slate-900 backdrop-blur-xl shadow-[0_8px_25px_${hexToRgba(COLORS.primary, 0.3)}] border-white/20 hover:bg-primary dark:bg-primary/70 dark:border-white/10`,
      secondary: "bg-white/40 dark:bg-white/10 backdrop-blur-xl text-slate-900 dark:text-white shadow-lg border-white/50 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/20",
      danger: "bg-rose-500/80 text-white backdrop-blur-xl shadow-[0_8px_25px_rgba(244,63,94,0.3)] border-white/20 hover:bg-rose-600",
      ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 border-transparent"
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
          "border font-medium transition-colors outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:pointer-events-none",
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
