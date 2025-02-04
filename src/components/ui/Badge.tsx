import React from 'react';
import { cn } from '@/lib/utils'; // combine classnames with cn utility

// Define the possible badge variants. Use for displaying status messages
type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

// Badge color styles
const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-blue-500/10 text-blue-400 border-blue-400/20',
  secondary: 'bg-white/5 text-white/60 border-white/10',
  success: 'bg-green-500/10 text-green-400 border-green-400/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-400/20',
  danger: 'bg-red-500/10 text-red-400 border-red-400/20'
};

// Badge Size Styles
const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1 py-0.5',
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1'
};

// Badge component to display status messages (variant and size can be customized)
export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary',
  size = 'sm',
  className = ''
}) => {
  return (
    <span className={cn(
      'inline-flex items-center justify-center',
      'font-medium rounded-full border',
      'whitespace-nowrap',
      variantStyles[variant],
      sizeStyles[size],
      className
    )}>
      {children}
    </span>
  );
};