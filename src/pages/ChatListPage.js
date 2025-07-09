import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import UnreadMessagesBadge from '../components/UnreadMessagesBadge';
import AvatarList from '../components/AvatarList';
import ChatListPageHeader from '../pages/ChatListPageHeader';

function ChatListPage() {
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();


  
  // 채팅 클릭 시 이동
  const handleChatClick = (chat) => {
    navigate(`/chat/${chat.otherUser.id}`);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
      }
    };

    fetchUser();
  }, []);  

  // 초기 데이터 로딩
  const loadInitialData = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error('로그인이 필요합니다.');
      navigate('/intro');
      return null;
    }
    const userId = userData.user.id;
    await loadChatList(userId);
    return userId;
  };

  // 채팅 목록 불러오기
  const loadChatList = async (currentUserId) => {
    setLoading(true);

    const { data, error } = await supabase.rpc('get_chat_list_with_unread', {
      current_user_id: currentUserId,
    });

    if (error) {
      console.error('채팅 리스트 불러오기 실패:', error);
      setChatList([]);
      return;
    }

    const seenUserIds = new Set();
    const processedChats = [];

    for (const msg of data) {
      const otherUserId = msg.sender_id === currentUserId ? msg.recipient_id : msg.sender_id;

      // ✅ null/undefined 아닌 것만 Set에 추가!
      if (otherUserId && typeof otherUserId === 'string') {
        seenUserIds.add(otherUserId);
        processedChats.push({ ...msg, otherUserId });
      }      
    }

    // ✅ 여기서도 null/빈 문자열 제거
    const filteredUserIds = Array.from(seenUserIds).filter(
      id => typeof id === 'string' && id.trim() !== ''
    );


    // 프로필 정보 로딩
    let profilesMap = {};
    const validIds = filteredUserIds.filter(id => !!id); // ✅ 변수 이름 맞춰줌
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .in('id', validIds);

    if (profileError) {
      console.error('🔥 Supabase error:', profileError);
      return;
    }

console.log(profileData);            // 배열 전체 출력
console.log(profileData[0]?.nickname);  // 첫 번째 프로필 닉네임 출력 (있으면)

    if (profileData) {
      profilesMap = profileData.reduce((acc, cur) => {
        acc[cur.id] = {
          id: cur.id,
          nickname: cur.nickname || '알 수 없음',
          avatar_url: cur.avatar_url ? `${cur.avatar_url}?t=${Date.now()}` : '',
        };
        return acc;
      }, {});
    }

    const finalChatList = processedChats.map((chat) => ({
      id: chat.id,
      content: chat.content,
      created_at: chat.created_at,
      unreadCount: chat.unread_count || 0,
      otherUser: profilesMap[chat.otherUserId] || {
        id: '',
        nickname: '알 수 없음',
        avatar_url: '',
      },
    }));

    setChatList(finalChatList);
    setLoading(false);
  };

  useEffect(() => {
    let subscription;
    let currentUserId;

    const init = async () => {
      currentUserId = await loadInitialData();
      if (!currentUserId) return;

      subscription = supabase
        .channel('public:messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            const msg = payload.new;
            if (msg.sender_id === currentUserId || msg.recipient_id === currentUserId) {
              loadChatList(currentUserId);
            }
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [navigate]);

  useEffect(() => {
    const fetchChatList = async () => {
        // 기본 채팅 목록 불러오기
        const { data: chats, error } = await supabase.rpc('get_chat_list_with_unread', {
          user_id: userId,
        });

        if (error) {
          console.error('채팅 목록 가져오기 실패:', error.message);
          return;
        }

        // 알림 설정 불러와서 각 채팅에 추가
        const enhancedChats = await Promise.all(
          chats.map(async (chat) => {
console.log('chat unreadCount:', chat.unreadCount);  // 여기서 로그 찍기            
            const { data: setting } = await supabase
              .from('notification_settings')
              .select('enabled')
              .eq('user_id', chat.other_user_id) // 상대방이
              .eq('notification_type', 'message') // 메시지 알림 설정 중에서
              .maybeSingle();

            const isNotificationOn = setting?.enabled !== false; // 꺼져있지 않으면 켜진 걸로 간주
            return {
              ...chat,
              showBadge: chat.unreadCount > 0 && isNotificationOn,
            };
          })
        );

        setChatList(enhancedChats);
      };

      fetchChatList();
    }, [userId]);  

  return (
    <div>
      {/* 상단 헤더 */}
      <div>
        <ChatListPageHeader />
      </div>

      {/* 채팅 리스트 */}
      <div style={{ padding: 10 }}>
        {loading ? (
          <p>채팅 목록을 불러오는 중입니다...</p>
        ) : chatList.length === 0 ? (
          <p>채팅 내역이 없습니다.</p>
        ) : (
          chatList.map((chat) => (
            <div key={chat.id} onClick={() => handleChatClick(chat)} style={styles.chatItem}>
              {/* 아바타 */}
              <div style={styles.avatarWrapper}>
                {chat.otherUser.avatar_url ? (
                  <>
                    <img
                      src={chat.otherUser.avatar_url}
                      alt="아바타"
                      style={styles.avatar}
                    />
                    <UnreadMessagesBadge
                      userId={chat.otherUser.id}
                      style={styles.badge}
                    />
                  </>
                ) : (
                  <div style={styles.placeholderAvatar} />
                )}
              </div>

              {/* 닉네임 + 마지막 메시지 */}
              <div style={styles.chatContent}>
                <div style={styles.nickname}>{chat.otherUser.nickname}</div>
                <div style={styles.message}>{chat.content}</div>
              </div>

              {/* 시간 */}
              <div style={styles.timestamp}>
                {chat.created_at &&
                  new Date(chat.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {/* 읽지 않은 메시지 수 뱃지 */}
                  {chat.showBadge && (
                    <div style={styles.unreadBadgeSmall}>{chat.unreadCount}</div>
                  )}

{/* {chat.unreadCount > 0 && (
  <div style={styles.unreadBadgeSmall}>{chat.unreadCount}</div>
)} */}
              </div>
            </div>
          ))
        )}
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
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: 10,
    borderBottom: '1px solid #ddd',
  },
  headerTitle: {
    flexGrow: 1,
    textAlign: 'center',
    margin: 0,
  },
  chatItem: {
    display: 'flex',
    alignItems: 'center',
    padding: 10,
    borderBottom: '1px solid #ccc',
    cursor: 'pointer',
  },
  avatarWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
    marginRight: 12,
    flexShrink: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: '#ccc',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  chatContent: {
    flexGrow: 1,
    minWidth: 0,
  },
  nickname: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    color: '#555',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 0,  // 왼쪽 마진 제거
    whiteSpace: 'nowrap',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
  timestampWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 40,
    marginLeft: 12,
  },
  unreadBadge: {
    marginTop: 4,
    backgroundColor: '#ff3b30',
    color: 'white',
    borderRadius: '12px',
    padding: '2px 6px',
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  // 새로 뱃지 스타일 (시간 아래 중앙 정렬)
  unreadBadgeSmall: {
    backgroundColor: 'red',
    color: 'white',
    borderRadius: '50%',  // 완전 둥글게
    width: 20,            // 너비 고정
    height: 20,           // 높이 고정 (width와 같게)
    fontSize: 12,
    marginTop: 4,
    display: 'flex',      // 플렉스로 중앙 정렬
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    userSelect: 'none',
  },
};

export default ChatListPage;