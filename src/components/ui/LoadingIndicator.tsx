import { motion } from 'framer-motion';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'light' | 'dark';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8',   // 32x32px
  md: 'w-12 h-12', // 48x48px
  lg: 'w-16 h-16'  // 64x64px
};

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  size = 'md',
  variant = 'default'
}) => {
  const variants = {
    default: 'border-blue-400',
    light: 'border-white/40',
    dark: 'border-gray-600'
  };

  return (
    <motion.div
      className={`border-2 border-t-transparent rounded-full ${SIZE_CLASSES[size]} ${variants[variant]}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};