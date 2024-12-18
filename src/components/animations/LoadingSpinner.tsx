/*

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue-400' | 'white';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  color = 'blue-400'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    'blue-400': 'border-blue-400',
    'white': 'border-white',
    // Add other color options as needed
  };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className={`border-2 border-t-transparent rounded-full ${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses]}`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

*/  