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
      primary: `bg-primary/90 text-white dark:text-slate-900 shadow-[0_0_15px_${hexToRgba(COLORS.primary, 0.4)}] border-primary/50 hover:bg-primary dark:bg-primary/80 dark:border-primary/50 dark:hover:bg-primary`,
      secondary: "bg-secondary/90 text-white shadow-[0_0_15px_rgba(20,200,255,0.4)] border-secondary/50 hover:bg-secondary dark:bg-secondary/80 dark:border-secondary/50 dark:hover:bg-secondary",
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
