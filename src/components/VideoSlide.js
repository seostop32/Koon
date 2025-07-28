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
    autoPlay={false}
    muted={false}
    controls
    playsInline
    onCanPlay={() => {
        videoRef.current?.play().catch((err) => {
        console.warn('Autoplay with sound blocked:', err);
        });
    }}
    style={{
        ...styles.image,
        filter: isBlurred ? 'blur(8px)' : 'none',
        transition: 'filter 0.3s ease',
    }}
    />
    {/* <button
    style={styles.playPauseButton}
    onClick={handlePlayPause}
    >
    {isPlaying ? '⏸' : '▶'}
    </button> */}
    </div>
  );
}