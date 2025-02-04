import React from 'react';
import { Video } from 'lucide-react'; 

interface VideoIndicatorProps {
  videoUrl: string;
}

export const VideoIndicator: React.FC<VideoIndicatorProps> = ({ videoUrl }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(videoUrl, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-2 py-1 rounded-full bg-red-500/20 text-red-400 
                 hover:bg-red-500/30 transition-colors text-sm"
    >
      <Video className="w-4 h-4" />  
      <span>Watch Guide</span>
    </button>
  );
};