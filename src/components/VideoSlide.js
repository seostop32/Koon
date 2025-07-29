import React, { useRef, useState } from 'react';

export default function VideoSlide({ url, isBlurred }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const styles = {
    container: {
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: 'auto',
      maxHeight: '100%',
      objectFit: 'contain',
      filter: isBlurred ? 'blur(8px)' : 'none',
      transition: 'filter 0.3s ease',
    },
    playPauseButton: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 2,
      background: 'rgba(0, 0, 0, 0.6)',
      color: '#fff',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      fontSize: '18px',
      cursor: 'pointer',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: '1',
    }
  };

  return (
    <div style={styles.container}>
      <video
        ref={videoRef}
        src={url}
        muted={false}
        controls
        playsInline
        style={styles.image}
        onCanPlay={() => {
          videoRef.current?.play().catch((err) => {
            console.warn('Autoplay with sound blocked:', err);
          });
        }}
      />
    </div>
  );
}