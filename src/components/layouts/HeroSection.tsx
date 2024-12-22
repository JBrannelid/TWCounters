import React from 'react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  children?: React.ReactNode;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  children
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden py-8 px-4"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-hero-pattern bg-cover sm:bg-contain bg-center" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-orbitron text-white text-center mb-4"
        >
          SWGOH Territory Wars
        </motion.h1>
        
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl lg:text-3xl font-titillium text-white/80 text-center mb-8 max-w-3xl mx-auto"
        >
          Find the perfect counter for any squad or fleet
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
};