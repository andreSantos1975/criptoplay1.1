// src/components/course/VideoPlayer.tsx

import React from 'react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  videoId: string;
  platform?: 'youtube' | 'vimeo';
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, platform = 'youtube' }) => {
  const getSrc = () => {
    if (platform === 'vimeo') {
      return `https://player.vimeo.com/video/${videoId}`;
    }
    // Default to YouTube
    return `https://www.youtube.com/embed/${videoId}`;
  };

  return (
    <div className={styles.videoContainer}>
      <iframe
        src={getSrc()}
        title="Course Video Player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default VideoPlayer;
