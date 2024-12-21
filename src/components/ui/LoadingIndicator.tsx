// src/components/ui/LoadingIndicator.tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light' | 'dark';
  message?: string;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8',   // 32x32px
  md: 'w-12 h-12', // 48x48px
  lg: 'w-16 h-16'  // 64x64px
};

export const LoadingIndicator = ({ 
  size = 'md',
  variant = 'default',
  message,
  className = ''
}: LoadingIndicatorProps) => {
  const variants = {
    default: 'border-blue-400',
    light: 'border-white/40',
    dark: 'border-gray-600'
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className={cn(
          'border-2 border-t-transparent rounded-full',
          SIZE_CLASSES[size],
          variants[variant],
          className
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {message && (
        <p className="mt-4 text-white/60 font-titillium">{message}</p>
      )}
    </div>
  );
};