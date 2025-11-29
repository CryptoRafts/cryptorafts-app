import React from 'react';

interface VideoBackgroundProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({
  src,
  className = '',
  style = {},
  onLoadStart,
  onCanPlay,
  onError
}) => {
  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      className={className}
      style={style}
      onLoadStart={onLoadStart}
      onCanPlay={onCanPlay}
      onError={onError}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default VideoBackground;

