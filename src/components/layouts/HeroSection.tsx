import React, { FC } from 'react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  children?: React.ReactNode;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const HeroSection: React.FC<HeroSectionProps> = ({ children }) => {
  return (
    <div className="relative z-10 py-8 px-4 bg-space-gradient">

      <div className="absolute inset-0 bg-hero-pattern opacity-20" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />

      <div className="relative container mx-auto z-20">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-orbitron text-white text-center mb-4">
          SWGOH Territory Wars
        </h1>

        <p className="hero-text">
          Find the perfect counter for any squad or fleet
        </p>

        <div className="max-w-4xl mx-auto relative z-30">
          {children}
        </div>
      </div>
    </div>
  );
};