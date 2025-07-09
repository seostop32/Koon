import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../supabaseClient';
import BlockedList from './BlockedList'; // 경로는 실제 위치에 따라 조정
import MyPageHeader from './MyPageHeader';
import { FaBitcoin } from 'react-icons/fa';

// 유틸 함수
function getZodiac(age) {
  if (!age) return '띠 정보 없음';
  const zodiacs = ['쥐띠', '소띠', '호랑이띠', '토끼띠', '용띠', '뱀띠', '말띠', '양띠', '원숭이띠', '닭띠', '개띠', '돼지띠'];
  return zodiacs[age % 12];
}
function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '...' : str;
}

const DEFAULT_PROFILE = {
  avatar_url: 'https://placehold.co/150x150?text=No+Image',
  nickname: '별명 없음',
  username: '홍길동',
  age: 29,
  location: '서울',
  hobbies: '독서, 여행',
  bio: '안녕하세요! 자기소개입니다.',
};

function MyPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
const [isAdmin, setIsAdmin] = useState(false);

  const handleChargeClick = () => {
    navigate('/coin-charge');
  };

    useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('로그인 유저 없음', userError);
        navigate('/login');
        return;
      }

      // 관리자 여부 확인 (이 줄 추가!)
      if (user?.email === 'admin@yourapp.com') {
        setIsAdmin(true);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('프로필 로드 실패:', error);
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <div style={{ padding: 20 }}>불러오는 중...</div>;

  const displayProfile = profile || DEFAULT_PROFILE;

  return (
    <div style={styles.container}>
        <MyPageHeader />

      <main style={styles.main}>
        <p style={styles.title}>
        <span style={styles.orangeStar}>✦</span> 내 프로필
        </p>        
        <section style={styles.profileSection}>
          
          <div style={styles.profileHeader}>
            <img src={displayProfile.avatar_url} alt="프로필" style={styles.avatar} />
            <div style={styles.info}>
              <p style={styles.nickname}>{displayProfile.nickname}</p>
              <p style={styles.detailText}>
                {displayProfile.username ? `${displayProfile.username}` : '이름 없음'} · {displayProfile.age ? `${displayProfile.age}세` : '나이 정보 없음'} · {displayProfile.location || '지역 없음'}
              </p>
              <p style={styles.detailText}>{profile.job_title || '직업 정보 없음'}</p>
              {/* <p style={styles.detailText}>{displayProfile.hobbies || '취미 정보 없음'}</p> */}
              <p style={styles.detailText}>{displayProfile.bio ? truncate(displayProfile.bio, 30) : '자기소개 정보 없음'}</p>
            </div>
          </div>
        </section>
          {displayProfile.gender !== '여성' && (
              <>
              <p style={styles.title}>
              <span style={styles.orangeStar}>✦</span> 보유 코인
              </p>
              <section style={{ ...styles.coinSection, marginBottom: 16 }}>
                <div>
                  {[
                    { label: '보유 코인', content: (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <FaBitcoin style={{ marginRight: 6, color: '#f2a900' }} />
                          {profile?.coin_balance?.toLocaleString() ?? 0}
                        </div>
                      )
                    },
                    { label: '구매/사용 내역', content: (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          &gt;
                        </div>
                      )
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.coinRow,
                        marginBottom: idx === 0 ? 8 : 0,  // 항목 간 간격 줄임
                        paddingTop: 4,
                        paddingBottom: 4,
                      }}
                      onClick={() => {
                        if (item.label === '구매/사용 내역') {
                          navigate('/coin-history');
                        }
                      }}                
                    >
                      <p
                        style={{
                          ...styles.coinText,
                          margin: 0,       // p 기본 위아래 margin 없애기
                          padding: 0,
                          lineHeight: 1.2, // 줄 높이 줄이기
                        }}
                      >
                        {item.label}
                      </p>
                      <p
                        style={{
                          ...styles.coinAmount,
                          display: 'flex',
                          alignItems: 'center',
                          margin: 0,
                          padding: 0,
                          lineHeight: 1.2,
                          cursor: item.label === '사용 내역' ? 'pointer' : 'default',
                        }}
                      >
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
                <button onClick={handleChargeClick} style={styles.chargeButton}>충전하기</button>
              </section>
              </>
            )}

        <p style={styles.title}>
        <span style={styles.orangeStar}>✦</span> 설정 및 기타
        </p>         
        <section style={{ ...styles.coinSection, marginBottom: 16 }}>
            <div>
            {[
              { label: '계정 관리', path: '/account' },
              { label: '알림 설정', path: '/notificationSettings' },
              { label: '고객 1:1 문의', path: '/help' },
              { label: '차단 목록', path: '/blockList' },
            ].map((item, idx) => (
              <div
                key={item.path}
                style={{
                  ...styles.coinRow,
                  marginBottom: idx < 2 ? 1 : 0,
                }}
                onClick={() => navigate(item.path)}  // 전체 줄에 클릭 이벤트 추가
              >
                <span style={{ ...styles.coinText, margin: 0, padding: 0, lineHeight: 2 }}>
                  {item.label}
                </span>
                <span
                  style={{ ...styles.coinAmount, cursor: 'pointer', margin: 0, padding: 0, lineHeight: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(item.path);
                  }}
                >
                  &gt;
                </span>
              </div>
            ))}
            </div>            
        </section>        

        {isAdmin && (
          <div style={styles.coinRow}>
            <h3 style={styles.sectionTitle}>관리자</h3>
            <section style={{ ...styles.coinSection, marginBottom: 16 }}>
            <p style={{ ...styles.coinText, color: '#dc2626' }}>관리자 페이지</p>
            <p
              style={{ ...styles.coinAmount, cursor: 'pointer', color: '#dc2626' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/admin/HelpDeskAdmin'); // 관리자 라우트로 이동
              }}
            >
              &gt;
            </p>
            </section>
          </div>
        )}
      </main>

      {/* 하단 푸터 */}
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
    maxWidth: 480,
    margin: '0 auto',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
    position: 'relative',
  },
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: '#4a90e2',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    zIndex: 9999,
  },
  backButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginRight: 12,
    lineHeight: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: 'grey',
  },
  bellButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'white',
    marginLeft: 'auto',
  },
  main: {
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 72,
  },
  profileSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    marginBottom: 16,
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 12, // 덜 둥글게, 픽셀로 고정
    objectFit: 'cover',
    marginRight: 16,
    border: '2px solid #4a90e2',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
  },
  nickname: {
    color: '#ff7f00',  // 주황색
    fontWeight: 'bold', // 필요하면 굵게
    fontSize: '16px',   // 원래 있던 크기 유지    
    margin: 0, // ✅ 추가
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    margin: '2px 0', // ✅ 위아래 간격만 약간 주고 싶을 때
  },
  coinSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  coinRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a4a4a',
    margin: 0, // ✅ 기본 여백 제거
  },
  coinAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a90e2',
    cursor: 'default',
  },
  chargeButton: {
    display: 'block',
    width: '100%',
    padding: '14px 0',
    backgroundColor: '#f97316',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontWeight: '700',
    fontSize: 18,
    cursor: 'pointer',
    textAlign: 'center',
    marginTop: 10,
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
    padding: '16px 0',
    zIndex: 50,
  },
  footerButton: {
    flex: 1,
    textAlign: 'center',
    fontSize: '1.2rem',
    cursor: 'pointer',
    userSelect: 'none',
  }, 
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1f2937',
  },
  cardSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    marginBottom: 24,
  },
  coinAmountClickable: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a90e2',
    margin: 0, // ✅ 기본 여백 제거
    cursor: 'pointer',
  },
  orangeStar: {
    color: '#ff8c00',
    marginRight: 4,
  },  
};

export default MyPage;