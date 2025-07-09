import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { showNotification } from '../utils/notifications';
import { send_message_with_coin } from '../utils/coinUtils';
import Message from '../components/MyMessage';
import MyMessage from '../components/MyMessage';
import OtherMessage from '../components/OtherMessage';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

function ChatPage() {
  const { userId: otherUserId } = useParams();  // 상대방 ID를 otherUserId로 변경
  const navigate = useNavigate();

  const [currentUserId, setCurrentUserId] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loadingRecipient, setLoadingRecipient] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const endRef = useRef(null);

  const [currentUserNickname, setCurrentUserNickname] = useState('');
  const [newMessage, setNewMessage] = useState("");  // 👈 이 줄을 추가해야 함
  //const { data: { user } } = useSupabaseClient().auth.getUser(); // 최신 방식에 따라 다름
  // const selectedUser = {
  //   id: selectedUser.id, // 실제로는 라우터나 props로 받아올 것
  // };

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('유저 정보 가져오기 실패:', error);
      } else {
        setCurrentUserId(user.id);

        // 닉네임도 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', user.id)
          .single();

        setCurrentUserNickname(profile?.nickname || '');
      }
    };

    getCurrentUser();
  }, []);  

  useEffect(() => {
    const fetchRecipient = async () => {
      if (!otherUserId) return;
      setLoadingRecipient(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, age, location, job_title, avatar_url')
        .eq('id', otherUserId)
        .single();

      if (error) {
        console.error('상대방 정보 불러오기 실패:', error);
      } else {
        setRecipient(data);
      }
      setLoadingRecipient(false);
    };

    fetchRecipient();
  }, [otherUserId]);

  useEffect(() => {
    const markRelatedNotificationsAsRead = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('sender_id', otherUserId) // 이건 상대방 ID
        .eq('type', 'message')
        .eq('is_read', false);
    };

    markRelatedNotificationsAsRead();
  }, [otherUserId]);

  const handleSendMessage = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();    
    if (!newMessage.trim()) return;

    // 1. 메시지 삽입
    const { error: msgError } = await supabase.from("messages").insert([
      {
        sender_id: user.id,
        recipient_id: otherUserId,
        content: newMessage,
      },
    ]);

    if (msgError) {
      console.error("메시지 전송 오류:", msgError.message);
      return;
    }

    // 2. 알림 시간 업데이트 or 생성
    const { error: notifError } = await supabase.rpc("upsert_notification", {
      p_sender_id: user.id,
      p_receiver_id: otherUserId,
      p_type: "message", // 또는 'chat'
    });

    if (notifError) {
      console.error("알림 갱신 오류:", notifError.message);
    }

    setNewMessage(""); // 입력창 초기화
  };  

  // useEffect(() => {
  //   const getCurrentUser = async () => {
  //     const {
  //       data: { user },
  //       error,
  //     } = await supabase.auth.getUser();

  //     if (error) {
  //       console.error('유저 정보 가져오기 실패:', error);
  //     } else {
  //       setCurrentUserId(user.id);
  //     }
  //   };

  //   getCurrentUser();
  // }, []);

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      console.log('RPC 호출 파라미터:', { currentUserId, otherUserId });
      
      const { data: messages, error } = await supabase.rpc('get_chat_messages', {
        p_user1: currentUserId,
        p_user2: otherUserId,        
      });

      

      if (messages) {
        console.log("✅ 메시지 개수:", messages.length);
      } else {
        console.log("📭 메시지가 없습니다 (null)");
      }

      if (error) {
        console.error("❌ 메시지 가져오기 오류:", error);
      } else if (!messages) {
  console.warn("⚠️ get_chat_messages 응답이 null입니다");
      } else {
  console.log("✅ 메시지 개수:", messages.length);
  console.log("📨 메시지 전체 데이터:", messages); // 여기가 5개? 31개?

        setMessages(messages || []);
        console.log('메시지 데이터:', messages);
        //setMessages(data || []);
        scrollToBottom();
      }
      setLoadingMessages(false);
    };

    fetchMessages();

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          //filter: `sender_id=eq.${otherUserId},recipient_id=eq.${currentUserId}`,
        },
        async (payload) => {
           console.log('실시간 메시지 도착:', payload);
          const msg = payload.new;
          if (
            (msg.sender_id === currentUserId && msg.recipient_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.recipient_id === currentUserId)
          ) {
            // ✅ 중복 방지: 이미 같은 ID 가진 메시지가 있으면 추가 안함
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            scrollToBottom();
            if (msg.recipient_id === currentUserId) {
              showNotification('새 메시지 도착', { body: msg.content });
            }
           

            
            const { data: freshMessages } = await supabase.rpc('get_chat_messages', {
              p_user1: currentUserId,
              p_user2: otherUserId,
            });

          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId]);

  // 읽음 처리 통합
 useEffect(() => {
    if (!currentUserId || !otherUserId || messages.length === 0) return;

    const unreadIds = messages
      .filter(
        (msg) =>
          msg.sender_id === otherUserId &&
          msg.recipient_id === currentUserId &&
          !msg.is_read // is_read 체크
      )
      .map((msg) => msg.id);

    if (unreadIds.length > 0) {
      const markMessagesAsRead = async () => {
        const { error } = await supabase
          .from('messages')
          .update({ 
            is_read: true,          // 여기 추가!
            // read_at: new Date().toISOString() 
            read_at: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" })
          })
          .in('id', unreadIds);

        if (error) console.error('읽음 표시 실패:', error);
      };

      markMessagesAsRead();
    }
  }, [messages, currentUserId, otherUserId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const formatDateHeader = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Seoul' };
    return date.toLocaleDateString('ko-KR', options);
  };

 
  const handleSend = async () => {
    if (!message.trim()) return;

  console.log('🔹 메시지 전송 및 코인 차감 실행:', currentUserId, otherUserId);

  const { error } = await supabase.rpc('send_message_with_coin', {
    p_sender_id: currentUserId,
    p_recipient_id: otherUserId,
    p_content: message,
    p_event_key: 'send_message'
  });

  if (error) {
    console.error('메시지 전송 실패:', error.message);
    alert(`메시지 전송 중 문제가 발생했습니다. ${error.message}`);
    return;
  }

  console.log('✅ 메시지 전송 성공');
    setMessage('');
    scrollToBottom();

    // ✅ 메시지 알림 생성
    await supabase.from('notifications').insert({
      user_id: otherUserId,
      sender_id: currentUserId,
      type: 'message',
      content: `${currentUserNickname}님이 당신에게 새 메시지를 보냈습니다.`,  // ✅ 보낸 사람 닉네임 사용
    });    

  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (endRef.current) {
        endRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50); // 약간의 지연
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loadingRecipient) return <div style={styles.loading}>상대 정보를 불러오는 중...</div>;
  if (!recipient)
    return (
      <div style={styles.loading}>
        상대방 정보를 찾을 수 없습니다.
        <br />
        <button onClick={() => navigate('/chat')}>채팅 목록으로 돌아가기</button>
      </div>
    );
  if (loadingMessages) return <div style={styles.loading}>메시지 불러오는 중...</div>;

  function formatToKoreanTime(isoString) {
    if (!isoString) return '';

    const date = new Date(isoString);

    // 한국시간 = UTC + 9시간
    // date.getTime() 는 밀리초 UTC 기준
    const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

    let hours = kstDate.getUTCHours(); // 0~23
    const minutes = kstDate.getUTCMinutes();

    const ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12;
    if (hours === 0) hours = 12;

    const paddedMinutes = minutes.toString().padStart(2, '0');

    return `${ampm} ${hours}:${paddedMinutes}`;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img
          src={recipient.avatar_url || 'https://placekitten.com/100/100'}
          alt="상대 아바타"
          style={styles.avatar}
          onError={(e) => {
            e.currentTarget.src = 'https://placekitten.com/100/100';
          }}
        />
        <div>
          <strong style={{ color: '#ff7f50' }}>{recipient.nickname}</strong>
          <div style={styles.meta}>
            {recipient.age ? `${recipient.age}세` : ''} {recipient.location ? `| ${recipient.location}` : ''} {recipient.job_title ? `| ${recipient.job_title}` : ''}
          </div>
        </div>
      </div>

      <div style={styles.messagesArea}>
        {messages.map((msg, index) => {
          const isMine = msg.sender_id === currentUserId;

          const formatTime = (timestamp) => {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            //const options = { hour: 'numeric', minute: 'numeric' };
            const options = { hour: 'numeric', minute: 'numeric', timeZone: 'Asia/Seoul' };
            return date.toLocaleTimeString('ko-KR', options);
          };

          const msgDate = msg.created_at ? new Date(msg.created_at) : null;
          const prevMsgDate = index > 0 && messages[index - 1].created_at ? new Date(messages[index - 1].created_at) : null;
          const shouldShowDateHeader =
            index === 0 || !prevMsgDate || (msgDate && msgDate.toDateString() !== prevMsgDate.toDateString());

          return (
            <React.Fragment key={msg.id}>
              {shouldShowDateHeader && msgDate && (
                <div style={styles.dateHeader}>
                  <span style={styles.calendarIcon}>📅</span>
                  {formatDateHeader(msgDate)}
                </div>
              )}
                <div
                  style={{
                    ...styles.message,
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    backgroundColor: isMine ? '#d1f7c4' : '#eee',
                    position: 'relative',  // 읽음 표시 위치를 위해 추가
                  }}
                >
                {/* ✅ '읽음' 텍스트를 시간 앞쪽에 작게 표시 */}
                {isMine && msg.read_at && (
                  <span style={{
                    fontSize: 10,
                    color: '#999', // ✔ 깔끔한 회색톤
                    marginRight: 4,
                  }}>
                    읽음
                  </span>
                )}           
                <strong style={{ fontWeight: 400, fontSize: '75%', color: '#666', marginRight: 8 }}>
                  {formatTime(msg.created_at)}
                  {/* {msg.created_at} */}
                </strong>
                {msg.content}
               </div>
            </React.Fragment>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={styles.inputArea}>
        <textarea
          placeholder="메시지를 입력하세요"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          style={styles.textarea}
        />
        <button onClick={handleSend} style={styles.sendButton}>
          보내기
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    marginTop: 20,
    textAlign: 'center',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: 10,
    borderBottom: '1px solid #ddd',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    marginRight: 10,
    objectFit: 'cover',
  },
  meta: {
    fontSize: 12,
    color: '#888',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  dateHeader: {
    margin: '20px auto 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0f0f0',
    color: '#555',
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    maxWidth: 'fit-content',
  },
  calendarIcon: {
    marginRight: 5,
  },
  message: {
    maxWidth: '70%',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    wordBreak: 'break-word',
  },
  inputArea: {
    padding: 10,
    borderTop: '1px solid #ddd',
    display: 'flex',
    gap: 8,
  },
  textarea: {
    flex: 1,
    resize: 'none',
    padding: 8,
    fontSize: 14,
  },
  sendButton: {
    padding: '0 20px',
    backgroundColor: '#5ca05c',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
};

export default ChatPage;