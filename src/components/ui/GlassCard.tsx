// GlassCard.tsx
import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: 'light' | 'dark' | 'darker';
  glowColor?: 'blue' | 'red' | 'yellow' | 'none';
  isInteractive?: boolean;
  isSelected?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'light',
  glowColor = 'none',
  isInteractive = false,
  isSelected = false,
  className = '',
  onClick,
  ...motionProps
}) => {
  const variantClasses = {
    light: 'bg-white/5 backdrop-blur-sm',
    dark: 'bg-space-dark/90 backdrop-blur-md',
    darker: 'bg-space-darker/95 backdrop-blur-lg'
  };

  const glowClasses = {
    none: '',
    blue: 'shadow-[0_0_30px_rgba(59,130,246,0.5)] border border-blue-400/30',
    red: 'shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-red-400/30',
    yellow: 'shadow-[0_0_30px_rgba(234,179,8,0.5)] border border-yellow-400/30'
  };

  const containerClasses = cn(
    'rounded-lg transition-all duration-300 h-full', // Lagt till h-full
    variantClasses[variant],
    glowColor !== 'none' && glowClasses[glowColor],
    isInteractive && !isSelected && 'hover:scale-[1.01] hover:bg-white/10',
    'touch-action: pan-y', // Bättre touch-hantering
    className
  );

  return (
    <motion.div
      onClick={onClick}
      className={containerClasses}
      {...motionProps}
    >
      <div className="relative h-full">
        {children}
        
        {glowColor !== 'none' && (
          <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
            <div className={cn(
              'absolute inset-0 opacity-20 blur-xl',
              `bg-${glowColor}-500/20`
            )} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GlassCard;