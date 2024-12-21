import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeroSectionProps extends Omit<HTMLMotionProps<"div">, "className"> {
  title?: string;
  subtitle?: string;
  className?: string;
  withAnimation?: boolean;
  onAction?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
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
        aria-label={title || "Hero section"}
        aria-live="polite"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        initial={withAnimation ? { opacity: 0, y: 20 } : false}
        animate={withAnimation ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.5 }}
        className={cn(
          "relative overflow-hidden hero-section",  // Lägg till hero-section här
          "min-h-[300px] py-16 px-4",               // Eventuellt annan padding för större skärmar
          className
        )}
        {...motionProps}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-hero-pattern bg-cover sm:bg-contain bg-center animate-pulse-slow" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
      
      {/* Animated glow spots */}
      <motion.div
        animate={{
          opacity: [0.4, 0.6, 0.4],
          scale: [1, 1.1, 1.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="absolute inset-0 bg-glow-pattern transform-none sm:scale-110 md:scale-125"
      />
      {/* Content */}
      <div className="relative z-10 container mx-auto">
        {title && (
          <motion.h1
          initial={withAnimation ? { opacity: 0, y: 20 } : false}
          animate={withAnimation ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.2 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-orbitron text-white text-center mb-4 tracking-wider"
          >
          {title}
        </motion.h1>
        )}
        
        {subtitle && (
          <motion.p
          initial={withAnimation ? { opacity: 0, y: 20 } : false}
          animate={withAnimation ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl lg:text-3xl font-titillium text-white/80 text-center mb-8 max-w-3xl mx-auto"
          >
          {subtitle}
        </motion.p>
        )}
        
        <motion.div
          initial={withAnimation ? { opacity: 0, y: 20 } : false}
          animate={withAnimation ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.4 }}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
};