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
  ariaLabel?: string; 
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'light',
  glowColor = 'none',
  isInteractive = false,
  isSelected = false,
  className = '',
  onClick,
  ariaLabel,
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
    // base-classes
    'rounded-lg transition-all duration-300',
    'relative flex flex-col',
    'w-full',
    "p-4", 

    // Mobile specific classes
    'min-h-0 h-full',
    'sm:min-h-screen-small',
    'overflow-hidden',
    
    // Variant and glow
    variantClasses[variant],
    glowColor !== 'none' && glowClasses[glowColor],
    
    // Custom classes
    className
  );

  return (
    <motion.div
      onClick={onClick}
      className={containerClasses}
      role={isInteractive ? 'button' : undefined} // add role="button" if interactive
      aria-label={ariaLabel || (isInteractive ? "Interactive GlassCard" : undefined)} // IF ariaLabel is provided, use it, otherwise use default
      aria-selected={isSelected}
      tabIndex={isInteractive ? 0 : -1}
      {...motionProps}
    >
      {/* Content container */}
      <div className="relative flex flex-col flex-1 w-full h-full">
        {children}
        
        {/* Glow-effekt */}
        {glowColor !== 'none' && (
          <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
            <div className={cn(
              'absolute inset-0 opacity-20 blur-xl transition-opacity duration-300',
              `bg-${glowColor}-500/20`
            )} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GlassCard;
