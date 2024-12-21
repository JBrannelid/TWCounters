import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

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
  onClick,
  children,
  variant = 'light',
  glowColor = 'none',
  isInteractive = false,
  isSelected = false,
  className = '',
  ...motionProps
}) => {
  const baseClasses = 'rounded-lg backdrop-blur-md transition-all';
  
  const variantClasses = {
    light: 'bg-white/5',
    dark: 'bg-space-dark/80',
    darker: 'bg-space-darker/90'
  };

  const glowClasses = {
    none: '',
    blue: 'shadow-neon-blue',
    red: 'shadow-neon-red',
    yellow: 'shadow-neon-yellow'
  };

  const interactiveClasses = isInteractive
    ? 'cursor-pointer hover:bg-white/10'
    : '';

  const selectedClasses = isSelected
    ? 'bg-white/10 border-blue-400'
    : 'border-white/10';

  return (
    <motion.div
      onClick={onClick}
      {...motionProps}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${glowClasses[glowColor]}
        ${interactiveClasses}
        ${selectedClasses}
        font-titillium
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};