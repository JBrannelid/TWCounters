import React from 'react';

export const SithEmpireIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 512 512" fill="currentColor">
    <path d="M256 48l-48 48-48-48L48 160l48 48-48 48 112 112 48-48 48 48 112-112-48-48 48-48L256 48zm0 336l-32-32 32-32 32 32-32 32z"/>
    <path d="M256 128l-32 32 32 32 32-32-32-32zm-96 96l-32 32 32 32 32-32-32-32zm192 0l-32 32 32 32 32-32-32-32z"/>
  </svg>
);