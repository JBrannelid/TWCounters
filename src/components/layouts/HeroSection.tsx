import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeroSectionProps extends Omit<HTMLMotionProps<"div">, "className"> {
  className?: string;
  withAnimation?: boolean;
  onAction?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  className,
  withAnimation = true,
  onAction,
  children,
  ...motionProps
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAction?.();
    }
  };

  return (
    <motion.div
      role="region"
      aria-label="Hero section"
      aria-live="polite"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      initial={withAnimation ? { opacity: 0, y: 20 } : false}
      animate={withAnimation ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden", 
        "py-8 px-4",
        className
      )}
      {...motionProps}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-hero-pattern bg-cover sm:bg-contain bg-center" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto">
        {/* Title */}
        <motion.h1
          initial={withAnimation ? { opacity: 0, y: 20 } : false}
          animate={withAnimation ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.2 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-orbitron text-white text-center mb-4"
        >
          SWGOH Territory Wars
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p
          initial={withAnimation ? { opacity: 0, y: 20 } : false}
          animate={withAnimation ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl lg:text-3xl font-titillium text-white/80 text-center mb-8 max-w-3xl mx-auto"
        >
          Find the perfect counter for any squad or fleet
        </motion.p>
        
        <motion.div
          initial={withAnimation ? { opacity: 0, y: 20 } : false}
          animate={withAnimation ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
};