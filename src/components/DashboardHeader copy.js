// DashboardHeader.js
import React, { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { SlidersHorizontal } from 'lucide-react';
import logo from '../assets/logo.svg';
import { fetchUnreadCount, fetchTotalUnreadCount } from '../utils/messageUtils';
import { fetchUnreadNotificationCount } from '../utils/notifications';
import { showNotification } from '../utils/notifications';


function DashboardHeader() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  // ✅ 1단계: unreadCount 분리 및 상태 리팩토링
  // const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [user, setUser] = useState(null);

  // ✅ 2단계: 메시지 미확인 수 로직 정리
  useEffect(() => {
    const loadUnreadMessages = async () => {
      if (!user) return;
      const count = await fetchUnreadCount(user.id);
      setUnreadMessageCount(count);
    };

    loadUnreadMessages();
  }, [user]);

  // ✅ 3단계: 알림 미확인 수 로직 정리
  useEffect(() => {
    const loadUnreadNotifications = async () => {
      if (!user) return;
      const count = await fetchUnreadNotificationCount(user.id);
      setUnreadNotificationCount(count);

      if (count > 0 && Notification.permission === 'granted') {
        showNotification('새 알림이 있습니다!', { body: `읽지 않은 알림 ${count}건` });
      }
    };

    Notification.requestPermission(); // 알림 권한 요청
    loadUnreadNotifications();
  }, [user]);

  // ✅ 4단계: 실시간 알림 구독 추가
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifications:realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.new.user_id === userId) {
            setUnreadNotificationCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ✅ 5단계: 버튼 클릭 이동 경로 바꾸기
  const onBellClick = () => {
    navigate('/notifications');
  };

  // const totalUnread = unreadCount + unreadNotificationCount;
  const totalUnread = unreadMessageCount + unreadNotificationCount;
console.log('unreadMessageCount:', unreadMessageCount);
console.log('unreadNotificationCount:', unreadNotificationCount);
console.log('totalUnread:', unreadMessageCount + unreadNotificationCount);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error);
        return;
      }
      if (data?.user) {
        setUser(data.user);
      }
    };

    fetchUser();
  }, []);  

  const handleNotificationClick = () => {
    console.log('알림 버튼 클릭됨!');
  };
  const fetchNotifications = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('User fetch error:', error);
      return;
    }

    if (!user) {
      console.log('No user logged in');
      return;
    }

    const userId = user.id;
    // userId 사용해서 작업 진행
  };

    // 유저 정보 및 아바타 가져오기
    useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (error.message.includes('InvalidJWTToken')) {
          await supabase.auth.signOut();
          navigate('/');
          return;
        }
        console.error('유저 정보 에러:', error.message);
        return;
      }
      if (data?.user) {
        setUserId(data.user.id);
        // 프로필 아바타 불러오기
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', data.user.id)
          .single();

        if (profileData?.avatar_url) {
          const { data: imageUrl } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(profileData.avatar_url);
          setAvatarUrl(imageUrl.publicUrl);
        }
      }
    };

    fetchUser();
  }, [navigate]);



  // 알림 개수 불러오기 및 Notification 권한 요청
  useEffect(() => {
    Notification.requestPermission();

    const fetchNotifications = async () => {
      if (!userId) return;
      const { data, error } = await supabase.rpc('get_unread_notification_count', { user_uuid: userId });
      if (error) {
        console.error('알림 개수 가져오기 실패:', error);
        return;
      }
      setUnreadNotificationCount(data);
      if (data > 0) {
        showNotification('새 알림이 있습니다!', { body: `읽지 않은 알림 ${data}건` });
      }
    };

    fetchNotifications();
  }, [userId]);
  
  
  // 실시간 메시지 구독
  useEffect(() => {
    if (!userId) return;

      const subscription = supabase
        .channel('messages:realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async (payload) => {
            if (payload.new.recipient_id === userId) {
              // 미확인 메시지 개수 재조회
              const count = await fetchUnreadCount(userId);
              setUnreadMessageCount(count);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }, [userId]);

    // 알림 클릭 핸들러
    // const onBellClick = () => {
    //   navigate('/chat'); // 알림 클릭시 채팅 리스트로 이동
    //   // navigate('/chat-list'); // 알림 클릭시 채팅 리스트로 이동
    // };

  

  // BellButton 컴포넌트
    function BellButton({ unreadCount, onClick }) {
      return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <FaBell size={24} color="#555" />
          </button>
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: 'red',
                borderRadius: '50%',
                color: 'white',
                minWidth: 18,
                height: 18,
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
      );
    }  



  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('로그아웃 실패:', error.message);
      alert('로그아웃 중 오류가 발생했습니다.');
    } else {
      navigate('/');
    }
  };

  const handleMyProfileClick = () => {
    if (userId) {
      navigate(`/profile/${userId}`);
    } else {
      alert('로그인 정보가 없습니다.');
    }
  };

 

  return (
    <div style={styles.header}>
      <div style={styles.leftGroup}>
        <img src={logo} alt="벙개 로고" style={styles.logo} />
        <span style={styles.logoText}>벙개</span>
        {/* 아바타 보여주고 싶으면 주석 해제하세요 */}
        {/*avatarUrl && <img src={avatarUrl} alt="avatar" style={styles.avatar} />*/}
      </div>

      <div style={styles.buttonGroup}>
        <button style={{ ...styles.smallButton, display: 'none' }} onClick={() => navigate('/profiles')}>
          전체보기
        </button>
        <button style={styles.smallButton} onClick={handleMyProfileClick}>
          내프로필
        </button>
        {/* <BellButton unreadCount={unreadCount} onClick={onBellClick} /> */}
        {/* ✅ 6단계: BellButton에 알림 뱃지 적용 */}
        {/* <BellButton unreadCount={unreadNotificationCount} onClick={onBellClick} /> */}
        
        {/* ✅ 하나로 통합된 알림 버튼 */}
        {/* <BellButton unreadCount={unreadCount + unreadNotificationCount} onClick={() => navigate('/notifications')} /> */}
        {/* <BellButton unreadCount={unreadMessageCount + unreadNotificationCount} onClick={() => navigate('/notifications')}/> */}

        <BellButton unreadCount={unreadNotificationCount} onClick={() => navigate('/notifications')}/>
        <button style={styles.smallButton} onClick={handleLogout}>
          로그아웃
        </button>
        <button style={styles.iconButton} onClick={() => navigate('/settings')}>
          <SlidersHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 20px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fff',
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    width: 32,
    height: 32,
    objectFit: 'contain',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#ff5a5f',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarWrapper: {
    position: 'relative',
    width: 36,
    height: 36,
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  buttonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  smallButton: {
    padding: '4px 10px',
    fontSize: '0.85rem',
    backgroundColor: '#ff5a5f',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  iconButton: {
    fontSize: '1.25rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '4px',
    color: '#555',
    transition: 'color 0.2s ease',
  },
  iconWithBadge: {
    position: 'relative',
    display: 'inline-block',
  },

  badge: {
    position: 'absolute',
    top: -6,  // 여기 값을 -6으로 올림 (더 음수일수록 위로 올라감)
    right: -4,
    backgroundColor: 'red',
    color: '#fff',
    fontSize: '10px',
    padding: '2px 4px',
    borderRadius: '10px',
    lineHeight: 1,
  },
};

export default DashboardHeader;