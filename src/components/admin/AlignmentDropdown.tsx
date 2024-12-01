// Först skapar vi en återanvändbar AlignmentDropdown-komponent

import React, { useState } from 'react';

interface AlignmentDropdownProps {
  value: 'light' | 'dark';
  onChange: (value: 'light' | 'dark') => void;
  label?: boolean;
}

export const AlignmentDropdown: React.FC<AlignmentDropdownProps> = ({
  value,
  onChange,
  label = true
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (newValue: 'light' | 'dark') => {
    onChange(newValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          Alignment
        </label>
      )}
      <button
        type="button"
        onClick={handleClick}
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-left flex justify-between items-center"
      >
        <span>{value === 'light' ? 'Light Side' : 'Dark Side'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-space-darker border border-white/10 rounded-lg shadow-lg z-[60]">
          <button
            type="button"
            onClick={() => handleSelect('light')}
            className="w-full px-3 py-2 text-white hover:bg-white/5 text-left first:rounded-t-lg"
          >
            Light Side
          </button>
          <button
            type="button"
            onClick={() => handleSelect('dark')}
            className="w-full px-3 py-2 text-white hover:bg-white/5 text-left last:rounded-b-lg"
          >
            Dark Side
          </button>
        </div>
      )}
    </div>
  );
};