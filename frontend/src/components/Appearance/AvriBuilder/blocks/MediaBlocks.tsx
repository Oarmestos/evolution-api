import React from 'react';
import { getBlockStyles } from '../utils/getBlockStyles';
import type { LibraryProps } from '../BlockLibrary';

export const Video: React.FC<LibraryProps> = ({ block }) => {
  const isYoutube = block.props.url?.includes('youtube.com') || block.props.url?.includes('youtu.be');
  
  if (isYoutube) {
    const videoId = block.props.url.split('v=')[1] || block.props.url.split('/').pop();
    return (
      <div style={getBlockStyles(block)} className="aspect-video w-full overflow-hidden rounded-xl">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video 
      src={block.props.url} 
      controls={block.props.controls !== false}
      autoPlay={block.props.autoPlay}
      loop={block.props.loop}
      muted={block.props.muted}
      style={getBlockStyles(block)}
      className="w-full h-auto rounded-xl"
    />
  );
};

export const Map: React.FC<LibraryProps> = ({ block }) => {
  const address = encodeURIComponent(block.props.address || 'New York, USA');
  const zoom = block.props.zoom || 15;
  return (
    <div style={getBlockStyles(block)} className="w-full aspect-video rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSy...&q=${address}&zoom=${zoom}`}
        allowFullScreen
      />
    </div>
  );
};
