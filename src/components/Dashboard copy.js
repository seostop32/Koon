// Dashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DashboardHeader from './DashboardHeader';
import { getZodiac } from '../utils/zodiac';
import LikesButton from './LikesButton';

function truncate(str, maxLength) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

function Dashboard({ onSignOut }) {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndProfiles = async () => {
  setLoading(true);
  try {
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;
    if (!currentUser) throw new Error('로그인된 사용자가 없습니다.');
    setUser(currentUser);

    // 내 프로필 조회 (is_ideal_search_activated 확인)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (profileError) throw profileError;

    if (!profile?.profile_completed) {
      navigate(`/profile/${currentUser.id}/edit`);
      return;
    }

    let query = supabase.from('profiles').select('*').neq('id', currentUser.id); // 본인 제외

    if (profile.is_ideal_search_activated) {
      // 이상형 조건 활성화 상태이면 partner_settings 조건 적용
        const { data: settings, error: settingsError } = await supabase
          .from('partner_settings')
          // .select('gender, age_min, age_max, height_min, height_max, religion, region, hobbies')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
console.log('🧾 쿼리 settings ===', settings);  
        if (settingsError) {
          console.error('이상형 조건 조회 오류:', settingsError);
        } else {
          const {
            gender,
            age_min = 18,
            age_max = 65,
            height_min = 120,
            height_max = 210,
            region,
            body_type,
            religion,
            drinking,
            smoking,
            hobbies,
            blood_type,
          } = settings;

          if (gender && gender !== 'all') query = query.eq('gender', gender);
          query = query.gte('age', age_min).lte('age', age_max);
          query = query.gte('height', height_min).lte('height', height_max);
          if (region) query = query.eq('region', region);
          if (body_type) query = query.eq('body_type', body_type); // ✅ Supabase query에는 붙음
          if (religion) query = query.eq('religion', religion);
          if (drinking) query = query.eq('drinking', drinking);
          if (smoking) query = query.eq('smoking', smoking);
          if (hobbies) query = query.ilike('hobbies', `%${hobbies}%`);
          if (blood_type) query = query.ilike('blood_type', `%${blood_type}%`);          


          let sql = `SELECT * FROM profiles WHERE id != '${currentUser.id}'`;

          if (gender && gender !== 'all') sql += ` AND gender = '${gender}'`;
          sql += ` AND age BETWEEN ${age_min} AND ${age_max}`;
          sql += ` AND height::int BETWEEN ${height_min} AND ${height_max}`;
          if (region) sql += ` AND region = '${region}'`;
          if (body_type) sql += ` AND body_type = '${body_type}'`;
          if (religion) sql += ` AND religion = '${religion}'`;
          if (drinking) sql += ` AND drinking = '${drinking}'`;
          if (smoking) sql += ` AND smoking = '${smoking}'`;
          if (hobbies) sql += ` AND hobbies ILIKE '%${hobbies}%'`;
          if (blood_type) sql += ` AND blood_type ILIKE '%${blood_type}%'`;          

          console.log('🧾 쿼리 텍스트 ===', sql);          
        
      }
    }

    const { data: filteredProfiles, error: profilesError } = await query;

    if (profilesError) throw profilesError;
console.log("✅ 내 프로필 정보:", profile); // 이걸 추가
console.log(profile.avatar_url)
    if (!profile?.profile_completed) {
      
      navigate(`/profile/${currentUser.id}/edit`);
      return;
    }

    setProfiles(filteredProfiles);
  } catch (error) {
    console.error('데이터 불러오기 오류:', error.message);
  } finally {
    setLoading(false);
  }
};

    fetchUserAndProfiles();
  }, []);

  const handleSelect = (profileId) => {
    navigate(`/profile/${profileId}`);
  };

  if (loading) return <div style={styles.loading}>로딩 중...</div>;

  return (
    <div style={styles.container}>
      <div>
        <DashboardHeader />
      </div>

      <p style={styles.title}>
        <span style={styles.orangeStar}>✦</span> 회원목록
      </p>

      <main style={styles.main}>
        {profiles.length === 0 && <p>회원 프로필이 없습니다.</p>}
        <div style={styles.cardList}>
          {profiles.map((profile) => (
            <div key={profile.id} style={styles.card} onClick={() => handleSelect(profile.id)}>
              <div style={{ position: 'relative' }}>
                <img
                  src={profile.avatar_url || 'https://via.placeholder.com/100x100?text=No+Image'}
                  alt={profile.username || '프로필 이미지'}
                  style={styles.avatar}
                  
                />
                
                <div
                  style={{ textAlign: 'center', marginTop: 2, marginBottom: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <LikesButton
                    currentUserId={user.id}
                    targetUserId={profile.id}
                  />
                </div>
              </div>
              <div style={styles.info}>
                <p style={styles.nickname}>{profile.nickname || '별명 없음'}</p>
                <p style={styles.detailText}>
                  {profile.username ? `${profile.username[0]}OO` : '이름 없음'} | {profile.age ? `${profile.age}세` : '나이 정보 없음'} | {getZodiac(profile.age)} | {profile.location || '지역 없음'}
                </p>
                <p style={styles.detailText}>{profile.hobbies || '취미 정보 없음'}</p>
                <p style={styles.detailText}>
                  {profile.bio ? truncate(profile.bio, 20) : '자기소개 정보 없음'}
                </p>
              </div>
            </div>
          ))}
        </div>
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
    height: '100vh',
    width: '100vw',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Arial, sans-serif',
  },
  main: {
    flex: 1,
    overflowY: 'auto',
    padding: 20,
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: 24,
    color: '#888',
  },
  cardList: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 20,
  },
  card: {
    display: 'flex',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
  },
  avatar: {
    width: 120,
    height: 120,
    objectFit: 'cover',
    borderRadius: '12px 0 0 12px',
  },
  info: {
    padding: 15,
    flex: 1,
  },
  detailText: {
    fontSize: 15,
    color: '#555',
    margin: '1px 0',
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
    padding: '8px 0',
    zIndex: 50,
  },
  footerButton: {
    flex: 1,
    textAlign: 'center',
    fontSize: '1.2rem',
    cursor: 'pointer',
    userSelect: 'none',
  },  

  orangeStar: {
    color: '#ff8c00',
    marginRight: 4,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 'normal',
    fontSize: 15,
    paddingLeft: 20,
    margin: '10px 0',
  },
  nickname: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#ff7a00',
    margin: '0 0 2px 0',
  },
};

export default Dashboard;