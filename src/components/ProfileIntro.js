import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import debounce from 'lodash/debounce';
import ProfileIntroHeader from './ProfileIntroHeader';
import VideoSlide from './VideoSlide'; // 경로에 맞게

function useDebounce(callback, delay) {
  const timer = useRef(null);

  return (...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

function shouldBlurPhoto({ isUnlocked, isFullyUnlocked, userId, profileUserId, photoUrl, avatarUrl }) {
  if (isFullyUnlocked || userId === profileUserId) return false;
  if (photoUrl === avatarUrl) return false;
  // if (!isUnlocked) return true;

  // 배열로 왔을 때 해당 사진이 포함되어 있어야만 블러 해제
  if (Array.isArray(isUnlocked)) {
    return !isUnlocked.includes(photoUrl);
  }  

  return false;
}

function ProfileIntro() {
  const location = useLocation();
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  console.log('[ProfileIntro] location.state:', location.state);
  console.log('[ProfileIntro] 받은 photos:', location.state?.photos);
  //const photos = location.state?.photos || [];

  // location.state가 없으면 빈 객체로 초기화
  const state = location.state || {};

  //const photos = location.state?.photos || [];



  const {
    photos: rawPhotos = [],
    isUnlocked = false,
    isFullyUnlocked = false,
    userId = null,
    profileUserId = null,
    avatarUrl = '',
    startIndex = 0,
  } = location.state || {};

console.log('[ProfileIntro] location.state:', location.state);
   let photos = Array.isArray(rawPhotos) ? rawPhotos : [rawPhotos];

  // photos 배열을 받아오되, 배열 아니면 배열로 변환
  //let photos = state.photos || [];  
  if (!Array.isArray(photos)) photos = [photos];
console.log('[ProfileIntro] photos:========', photos);
  // const startIndex = state.startIndex || 0;
  // const isUnlocked = state.isUnlocked || false;
  // const isFullyUnlocked = state.isFullyUnlocked || false;
  // const userId = state.userId || null;
  // const profileUserId = state.profileUserId || null;
  // const avatarUrl = state.avatarUrl || '';


   console.log('[ProfileIntro] 받은 photos:', rawPhotos);

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const currentIndexRef = useRef(currentIndex);

  // 초기 위치 맞춤(useEffect)
  useEffect(() => {
    if (!sliderRef.current) return;

    const width = sliderRef.current.clientWidth;
    if (width === 0) {
      setTimeout(() => {
        sliderRef.current.scrollTo({
          left: startIndex * width,
          behavior: 'auto',
        });
        setCurrentIndex(startIndex);
        currentIndexRef.current = startIndex;
      }, 50);
      return;
    }
    sliderRef.current.scrollTo({
      left: startIndex * width,
      behavior: 'auto',
    });
    setCurrentIndex(startIndex);
    currentIndexRef.current = startIndex;
  }, [startIndex, photos]);

  // 정확한 위치로 스크롤 이동
  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.scrollTo({
        left: currentIndex * sliderRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
    currentIndexRef.current = currentIndex; // ref도 같이 업데이트
  }, [currentIndex]);

  // 디바운스된 인덱스 설정 함수
  const debouncedSetCurrentIndex = useDebounce((index) => {
    setCurrentIndex(index);
  }, 200);  // 100~200ms로 늘려보세요


  const isUserScrolling = useRef(false);

  // 스크롤 시 인덱스 계산
  const onScroll = () => {
    if (!sliderRef.current) return;

    isUserScrolling.current = true;

    const slider = sliderRef.current;
    const scrollLeft = slider.scrollLeft;
    const width = slider.clientWidth;
    if (width === 0) return;

    let index = Math.round(scrollLeft / width);

    // 인덱스 범위 제한
    if (index < 0) index = 0;
    if (index >= photos.length) index = photos.length - 1;

    // 너무 큰 변화는 무시
    if (Math.abs(index - currentIndexRef.current) > 1) return;

    debouncedSetCurrentIndex(index);
  };

  // 스크롤이 끝났을 때 강제 해제
  useEffect(() => {
    const handleScrollEnd = debounce(() => {
      isUserScrolling.current = false;
    }, 200);

    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', handleScrollEnd);
      return () => slider.removeEventListener('scroll', handleScrollEnd);
    }
  }, []);  

  const goToPrevious = () => {
    if (!isUserScrolling.current && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      currentIndexRef.current = newIndex;
    }
  };

  const goToNext = () => {
    if (!isUserScrolling.current && currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      currentIndexRef.current = newIndex;
    }
  };

  return (
   
    <div style={styles.container}>
     {/* <div style={{ padding: '0 16px 16px 16px' }}> */}
      <div style={{ marginTop: 0, paddingTop: 0 }}>
        <ProfileIntroHeader />
      </div>     

      <div style={styles.sliderWrapper}>
        {photos.length > 1 && (
          <button style={styles.navLeft} onClick={goToPrevious}>{'<'}</button>
        )}

        <div
          ref={sliderRef}
          style={styles.slider}
          onScroll={onScroll}
        >
        {photos.map((url, idx) => {
          const isBlurred = shouldBlurPhoto({
            isUnlocked,
            isFullyUnlocked,
            userId,
            profileUserId,
            photoUrl: url,
            avatarUrl,
          });

          const isVideo = url.toLowerCase().endsWith('.mp4');
          // const videoRef = useRef(null);
          // const [isPlaying, setIsPlaying] = useState(false);

          // const handlePlay = () => {
          //   videoRef.current?.play();
          //   setIsPlaying(true);
          // };
          return (
            // <div key={idx} style={{ ...styles.slide, position: 'relative' }}>
            //   {isVideo ? (
            //   <>
            //     <video
            //       ref={videoRef}
            //       src={url}
            //       playsInline
            //       style={{
            //         ...styles.image,
            //         filter: isBlurred ? 'blur(8px)' : 'none',
            //         transition: 'filter 0.3s ease',
            //       }}
            //     />
            //     {!isPlaying && (
            //       <button
            //         onClick={handlePlay}
            //         style={{
            //           position: 'absolute',
            //           bottom: '10px',
            //           right: '10px',
            //           background: 'rgba(0,0,0,0.6)',
            //           color: '#fff',
            //           border: 'none',
            //           borderRadius: '50%',
            //           width: '36px',
            //           height: '36px',
            //           fontSize: '16px',
            //           cursor: 'pointer',
            //         }}
            //       >
            //         ▶
            //       </button>
            //     )}
            //   </>                
            //   ) : (
            //     <img
            //       src={url}
            //       alt={`photo-${idx}`}
            //       style={{
            //         ...styles.image,
            //         filter: isBlurred ? 'blur(8px)' : 'none',
            //         transition: 'filter 0.3s ease',
            //       }}
            //     />
            //   )}
            // </div>
            <div key={idx} style={styles.slide}>
              {isVideo ? (
                <VideoSlide url={url} isBlurred={isBlurred} style={styles.image} />
              ) : (
                <img
                  src={url}
                  alt={`photo-${idx}`}
                  style={{
                    ...styles.image,
                    filter: isBlurred ? 'blur(8px)' : 'none',
                    transition: 'filter 0.3s ease',
                  }}
                />
              )}
            </div>            
          );
        })}
        </div>

        {photos.length > 1 && (
          <button style={styles.navRight} onClick={goToNext}>{'>'}</button>
        )}
      </div>

      <div style={styles.dots}>
        {photos.map((_, idx) => (
          <div
            key={idx}
            style={{
              ...styles.dot,
              backgroundColor: idx === currentIndex ? '#ff3366' : '#ccc',
            }}
          />
        ))}
      </div>

      <footer style={styles.footer}>
        <div style={styles.footerButton} onClick={() => navigate('/')}>🏠</div>
        <div style={styles.footerButton} onClick={() => navigate('/search')}>🔍</div>
        <div style={styles.footerButton} onClick={() => navigate('/favorites')}>💘</div>
        <div style={styles.footerButton} onClick={() => navigate('/chat')}>💬</div>
        <div style={styles.footerButton} onClick={() => navigate('/mypage')}>👤</div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#000',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    height: 60,
    display: 'flex',
    alignItems: 'center',
    padding: '0 1.5rem',
    borderBottom: '1px solid #ddd',
    width: '100%',
    boxSizing: 'border-box',
    flexShrink: 0,
    color: '#000',
    backgroundColor: '#fff',
    position: 'relative',
  },
  backButton: {
    fontSize: 24,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    color: '#000',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    margin: 0,
    fontWeight: 'bold',
    fontSize: 20,
    color: '#000',
  },
  closeButton: {
    fontSize: 24,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    color: '#000',
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  sliderWrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',   // 슬라이더 바깥쪽 스크롤 숨기기
  },
  // 스크롤바 숨기기 (웹킷 기반 브라우저)
  slider: {
    display: 'flex',
    flexDirection: 'row',  // 가로 배치
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    scrollbarWidth: 'none',  // (optional) 스크롤바 숨기기
    msOverflowStyle: 'none', // (optional) IE, Edge 스크롤바 숨기기
  },
  slide: {
    flexShrink: 0,
    width: '100%', // 한 슬라이드가 부모 슬라이더 너비 100%
    scrollSnapAlign: 'start',
    position: 'relative',  // (필요시)
  },
  image: {
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'cover', // 비율 유지하며 꽉 채우기
  },  
  navLeft: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
    fontSize: 30,
    color: '#fff',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  navRight: {
    position: 'absolute',
    right: 10,
    zIndex: 1,
    fontSize: 30,
    color: '#fff',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    padding: 10,
    gap: 8,
    backgroundColor: '#111',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: '#ccc',
    transition: 'background-color 0.3s ease',
  },
  footer: {
    height: 60,
    backgroundColor: '#fff', // 변경된 부분
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  footerIcon: {
    fontSize: 28,
    cursor: 'pointer',
    color: '#000', // 흰 배경에 어울리도록 검은색
  },
  footerButton: {
    fontSize: 20,
    cursor: 'pointer',
  },  
};

export default ProfileIntro;