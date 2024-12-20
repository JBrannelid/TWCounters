import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AccentSectionProps extends Omit<HTMLMotionProps<"div">, "className"> {
  isSticky?: boolean;
  withBorder?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const AccentSection: React.FC<AccentSectionProps> = ({
  withBorder = true,
  className,
  children,
  ...motionProps
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative z-10",
        className
      )}
      {...motionProps}
    >
        <div className={cn(
          "bg-space-gradient bg-dots-pattern bg-dots",
          "backdrop-blur-md",
          withBorder && "border-b border-white/10",
          "px-4 py-6 sm:px-6 sm:py-8"
        )}>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-glow-pattern opacity-30 sm:opacity-50" />
        
        {/* Main content */}
        <div className="relative z-10 container mx-auto">
          {children}
        </div>
      </div>
    </motion.div>
  );
};