// HeroSection.tsx
import React from 'react';
import { motion } from 'framer-motion';

const fontStyles = `
  @font-face {
    font-family: 'Orbitron';
    font-display: swap;
    src: url('/fonts/Orbitron-Regular.ttf') format('truetype');
  }
`;

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
      className="relative z-10 py-8 px-4 bg-space-gradient"
    >
      <div className="absolute inset-0 bg-hero-pattern opacity-20" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      <div className="relative container mx-auto z-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-orbitron text-white text-center mb-4"
          style={{ willChange: 'transform' }}
        >
          SWGOH Territory Wars
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg sm:text-xl lg:text-2xl font-titillium text-white/80 text-center mb-8"
        >
          Find the perfect counter for any squad or fleet
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto relative z-30"
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
};