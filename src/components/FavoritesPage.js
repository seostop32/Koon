// src/components/FavoritesPage.js
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // 이 경로 맞는지 확인!
import { useNavigate } from 'react-router-dom';
import FavoritesPageHeader from './FavoritesPageHeader';

const FavoritesPage = () => {
  const [activeTab, setActiveTab] = useState('likedByMe');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();



  const fetchFavorites = async () => {
    setLoading(true);
    setErrorMsg('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMsg('사용자 정보를 불러올 수 없습니다.');
      setLoading(false);
      return;
    }

    let query;
    // 일주일 전 날짜 ISO 형식으로 만들기
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    if (activeTab === 'likedByMe') {
      query = supabase
        .from('likes')
        .select(`
          id,
          liked_id,
          created_at,
          profiles:liked_id (
            id,
            nickname,
            username,
            avatar_url,
            location,
            age,
            region,
            created_at
          )
        `)
        .eq('liker_id', user.id)
        .gte('created_at', oneWeekAgo)  // ✅ 일주일 내 필터 추가
        .order('created_at', { ascending: false });
    } else {
      query = supabase
        .from('likes')
        .select(`
          id,
          liker_id,
          created_at,
          profiles:liker_id (
            id,
            nickname,
            username,
            avatar_url,
            location,
            age,
            region,
            created_at
          )
        `)
        .eq('liked_id', user.id)
        .gte('created_at', oneWeekAgo)  // ✅ 일주일 내 필터 추가
        .order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      setErrorMsg('관심 목록을 불러오는 중 오류가 발생했습니다.');
      console.error(error);
      setLoading(false);
      return;
    }

    setFavorites(data || []);
    setLoading(false);
  };

    // useEffect 내부에서 구독 최적화
    useEffect(() => {
      fetchFavorites();

      const subscription = supabase
        .channel('public:likes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'likes',
          },
          payload => {
            const isRelated =
              (activeTab === 'likedByMe' && payload.new.liker_id === supabase.auth.getUser().data.user.id) ||
              (activeTab === 'likedMe' && payload.new.liked_id === supabase.auth.getUser().data.user.id);

            if (isRelated) fetchFavorites();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'likes',
          },
          () => fetchFavorites()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }, [activeTab]);  

        const groupByDate = (items) => {
          const groups = {};
          items.forEach((item) => {
            const dateKey = item.created_at.slice(0, 10);
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(item);
          });
          return groups;
        };

        const handleDelete = async (likeId) => {
          if (!window.confirm('정말 관심목록에서 삭제하시겠습니까?')) return;

          const { error } = await supabase.from('likes').delete().eq('id', likeId);
          if (error) {
            alert('삭제 중 오류가 발생했습니다.');
            console.error(error);
          } else {
            alert('삭제되었습니다.');
            fetchFavorites();
          }
        };

        if (loading)
          return (
            <div className="p-4 flex justify-center items-center">
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10"></div>
              <span className="ml-2 text-gray-600">불러오는 중...</span>
              <style>{`
                .loader {
                  border-top-color: #3498db;
                  animation: spin 1s linear infinite;
                }
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          );

        if (errorMsg)
          return <div className="p-4 text-center text-red-500">{errorMsg}</div>;

        const groupedFavorites = groupByDate(favorites);

    return (
        <div className="min-h-screen bg-white">
          {/* 헤더는 패딩 밖으로 */}
          <FavoritesPageHeader />
          <div style={{ padding: '0 16px 16px 16px' }}>
            {/* 탭 버튼 영역 */}
            <div
              style={{
                width: '100%',
                padding: '0 6px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
            <div
              style={{
                display: 'flex',
                borderRadius: 4,
                backgroundColor: '#fef3e4',
                width: '100%',
                maxWidth: 600,
                margin: '0px auto 0px',
                padding: 2,
              }}
            >
              <button
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: activeTab === 'likedByMe' ? '8px 0' : '6px 0',
                  borderRadius: '4px 0 0 4px',
                  backgroundColor: activeTab === 'likedByMe' ? '#f97316' : 'transparent',
                  color: activeTab === 'likedByMe' ? 'white' : '#92400e',
                  fontWeight: '600',
                  fontSize: activeTab === 'likedByMe' ? '1.1rem' : '1rem',
                  cursor: 'pointer',
                  border: 'none',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setActiveTab('likedByMe')}
              >
                내가 관심 보인 사람
              </button>
              <button
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: activeTab === 'likedMe' ? '8px 0' : '6px 0',
                  borderRadius: '0 4px 4px 0',
                  backgroundColor: activeTab === 'likedMe' ? '#f97316' : 'transparent',
                  color: activeTab === 'likedMe' ? 'white' : '#92400e',
                  fontWeight: '600',
                  fontSize: activeTab === 'likedMe' ? '1.1rem' : '1rem',
                  cursor: 'pointer',
                  border: 'none',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setActiveTab('likedMe')}
              >
                나를 관심 보인 사람
              </button>
            </div>
          </div>

          {favorites.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              {activeTab === 'likedByMe'
                ? '관심 등록한 사람이 아직 없어요 😢'
                : '나를 관심 등록한 사람이 아직 없어요 😢'}
            </div>
          )}

          <div className="mt-4 max-w-4xl mx-auto px-4">
            {Object.entries(groupedFavorites).map(([date, items]) => (
              <div key={date} style={{ marginBottom: 40 }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: '0.8rem', color: '#999' }}>{date}</span>
                  <div
                    style={{
                      height: '1px',
                      backgroundColor: '#ccc',
                      width: '100vw',
                      position: 'relative',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: 4,
                    }}
                  />
                </div>

                <div
                  style={{
                    ...styles.photosRow,
                    justifyContent:
                      items.length === 1
                        ? 'center'
                        : items.length === 2
                        ? 'space-around'
                        : 'flex-start',
                  }}
                >
                  {items.map((item) => {
                    const profile = item.profiles;
                    return (
                      <div key={profile.id} style={styles.otherPhotoWrapper}>
                        <div
                          onClick={() => navigate(`/profile/${profile.id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            src={profile.avatar_url || '/default-avatar.png'}
                            alt={profile.username}
                            style={styles.otherPhoto}
                            loading="lazy"
                          />
                          <div style={styles.usernameSmall}>{profile.nickname}</div>
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#666',
                            textAlign: 'center',
                          }}
                        >
                          {profile?.location} · {profile?.age}세
                        </div>
                        {activeTab !== 'likedMe' && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{
                              marginTop: 4,
                              padding: '2px 6px',
                              fontSize: '0.7rem',
                              color: '#f97316',
                              border: '1px solid #f97316',
                              borderRadius: 4,
                              cursor: 'pointer',
                              backgroundColor: 'white',
                            }}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 하단 푸터 */}
          <footer style={styles.footer}>
            <div style={styles.footerButton} onClick={() => navigate('/')}>🏠</div>
            <div style={styles.footerButton} onClick={() => navigate('/search')}>🔍</div>
            <div style={styles.footerButton} onClick={() => navigate('/favorites')}>💘</div>
            <div style={styles.footerButton} onClick={() => navigate('/chat')}>💬</div>
            <div style={styles.footerButton} onClick={() => navigate('/mypage')}>👤</div>
          </footer>
        </div>
      </div>  
      );
    };

const styles = {
  photosRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'nowrap',
    overflowX: 'auto',
    padding: '8px 16px',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch', // 모바일에서 부드러운 스크롤
    maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
    justifyContent: 'flex-start',
  },
  otherPhotoWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    minWidth: 100,
    maxWidth: 120,
    flexShrink: 0,
    border: '1px solid #eee',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    scrollSnapAlign: 'start', // snap 될 수 있도록
  },
  otherPhoto: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  usernameSmall: {
    marginTop: 4,
    fontSize: '0.75rem',
    color: '#555',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: 80,
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTop: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '16px 0', // 기존 16px → 8px로 줄임
    zIndex: 50,
    userSelect: 'none',
  },
  footerButton: {
    flex: 1,
    textAlign: 'center',
    fontSize: '1.2rem',
    cursor: 'pointer',
    userSelect: 'none',
  },
};

export default FavoritesPage;