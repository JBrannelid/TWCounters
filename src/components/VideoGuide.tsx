import React, { useState } from 'react';
import { Play, Maximize2, X } from 'lucide-react';

interface VideoGuideProps {
  videoUrl: string;
  title?: string;
  autoplay?: boolean;
}

export const VideoGuide: React.FC<VideoGuideProps> = ({
  videoUrl,
  title,
  autoplay = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(videoUrl);

  if (!videoId) return null;

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className={`relative ${isExpanded ? 'fixed inset-0 z-50 bg-black/90' : ''}`}>
      <div className={`relative ${
        isExpanded 
          ? 'w-full h-full flex items-center justify-center p-4'
          : 'w-full aspect-video'
      }`}>
        {!isPlaying ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
            <img
              src={thumbnailUrl}
              alt={title || "Video thumbnail"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center
                         group-hover:bg-black/60 transition-colors">
              <button
                onClick={handlePlay}
                className="bg-red-600 text-white rounded-full p-4 transform
                         transition-transform group-hover:scale-110"
              >
                <Play className="w-8 h-8" />
              </button>
            </div>
            {title && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80">
                <h3 className="text-white font-medium">{title}</h3>
              </div>
            )}
          </div>
        ) : (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title || 'Strategy Guide'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className={`rounded-lg ${
              isExpanded ? 'w-full max-w-6xl aspect-video' : 'w-full h-full'
            }`}
          />
        )}
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70
                   transition-colors"
        >
          {isExpanded ? (
            <X className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};