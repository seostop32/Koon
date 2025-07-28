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
        display: 'inline-block',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    },
    video: {
        width: '100%',
        height: 'auto',
        display: 'block',
        filter: isBlurred ? 'blur(8px)' : 'none',
        transition: 'filter 0.3s ease',
        borderRadius: 12,
        userSelect: 'none',
    },
    button: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 2,
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        border: '2px solid #fff',      // 하얀색 테두리 추가
        boxShadow: '0 0 8px rgba(255,255,255,0.8)',  // 반짝이는 그림자 효과
        borderRadius: '50%',
        width: 44,
        height: 44,
        fontSize: 22,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
    },
    };

  return (
    <div style={styles.container}>
        <video
        ref={videoRef}
        src={url}
        playsInline
        controls
        autoPlay
        muted
        style={{
            ...styles.image,
            filter: isBlurred ? 'blur(8px)' : 'none',
            transition: 'filter 0.3s ease',
        }}
        /> 
    </div>
  );
}