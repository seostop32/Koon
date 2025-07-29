import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { showNotification } from '../utils/notifications';
import { send_message_with_coin } from '../utils/coinUtils';
import Message from '../components/MyMessage';
import MyMessage from '../components/MyMessage';
import OtherMessage from '../components/OtherMessage';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import ChatPageHeader from '../pages/ChatPageHeader';
import NotificationSettings from '../pages/NotificationSettings';

function ChatPage() {
  const navigate = useNavigate();
  const { userId: otherUserId } = useParams();  // 상대방 ID를 otherUserId로 변경
  // const { otherUserId } = useParams();  

  const [currentUserId, setCurrentUserId] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loadingRecipient, setLoadingRecipient] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const endRef = useRef(null);

  const [currentUserNickname, setCurrentUserNickname] = useState('');
  const [newMessage, setNewMessage] = useState("");  // 👈 이 줄을 추가해야 함
  
  async function uploadFile(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`; // 고유 이름 생성
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('profile-photos')  // 버킷 이름 바꿔야 해
      .upload(filePath, file);

    if (error) {
      console.error('파일 업로드 실패:', error);
      return null;
    }

    // 파일 URL 얻기
    const { publicURL, error: urlError } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    if (urlError) {
      console.error('URL 생성 실패:', urlError);
      return null;
    }

    return publicURL;
  }

  async function saveMessage({ sender_id, content, type, name }) {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        { sender_id, content, type, name }
      ]);

    if (error) {
      console.error('메시지 저장 실패:', error);
      return null;
    }

    return data[0]; // 저장된 메시지 객체 리턴
  }

  // async function handleSendFile(file) {
  //   const fileUrl = await uploadFile(file);
  //   if (!fileUrl) return;

  //   // 파일 타입 정하기 (image, video, file 등)
  //   let type = 'file';
  //   if (file.type.startsWith('image/')) type = 'image';
  //   else if (file.type.startsWith('video/')) type = 'video';

  //   const savedMessage = await saveMessage({
  //     sender_id: currentUserId,
  //     content: fileUrl,
  //     type,
  //     name: file.name,
  //   });

  //   if (savedMessage) {
  //     setMessages(prev => [...prev, savedMessage]); // 메시지 목록에 추가
  //     setIsFileModalOpen(false); // 모달 닫기
  //   }
  // }

  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');

  const fileInputRef = useRef(null);

  const handlePlusClick = () => {
    fileInputRef.current?.click(); // 직접 파일 선택창 열기
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsFileModalOpen(true); // 파일이 선택되면 모달 열기
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile) return;

    const fileType = selectedFile.type;

    // 1. 먼저 Supabase Storage에 업로드
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos') // ← 버킷 이름
      .upload(filePath, selectedFile);

    if (uploadError) {
      console.error('파일 업로드 실패:', uploadError);
      return;
    }

    // 2. URL 가져오기
    const { data: publicData, error: urlError } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    if (urlError || !publicData?.publicUrl) {
      console.error('공개 URL 실패:', urlError);
      return;
    }

    const fileURL = publicData.publicUrl;

    // 3. 타입 설정
    let type = 'file';
    if (fileType.startsWith('image/')) type = 'image';
    else if (fileType.startsWith('video/')) type = 'video';

    // 4. 메시지 DB에 저장
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: currentUserId, // 로그인 유저 아이디
          recipient_id: otherUserId,   // 이 부분 추가해줘야 할 것 같아
          content: fileURL,
          type,
          name: selectedFile.name,
        }
      ]);

    if (messageError) {
      console.error('메시지 저장 실패:', messageError);
      return;
    }

    // 5. 화면에 반영
    setMessages(prev => [...(prev || []), ...(messageData?.[0] ? [messageData[0]] : [])]);
    setSelectedFile(null);
    setIsFileModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsFileModalOpen(false); // 모달 닫기
  };



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
    if (!newMessage.trim()) return;

    console.log('🔹 메시지 전송 및 코인 차감 실행:', currentUserId, otherUserId);

    const { error } = await supabase.rpc('send_message_with_coin', {
      p_sender_id: currentUserId,
      p_recipient_id: otherUserId,
      p_content: newMessage,
      p_event_key: 'send_message',
    });

    if (error) {
      console.error('메시지 전송 실패:', error.message);
      alert(`메시지 전송 중 문제가 발생했습니다. ${error.message}`);
      return;
    }

    console.log('✅ 메시지 전송 성공');

    setNewMessage(''); // 입력창 초기화
    scrollToBottom();

    // 메시지 알림 생성
    await supabase.from('notifications').insert({
      user_id: otherUserId,
      sender_id: currentUserId,
      type: 'message',
      content: `${currentUserNickname}님이 당신에게 새 메시지를 보냈습니다.`,
    });

    // noti_setting 업데이트
    const { error: notiError } = await supabase
      .from('notification_settings')
      .update({ target_user_id: currentUserId }) // 보내는 사람 아이디
      .eq('user_id', otherUserId);              // 받는 사람 아이디

    if (notiError) {
      console.error('noti_setting 업데이트 실패:', notiError.message);
    }
  };  



  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      console.log('RPC 호출 파라미터:', { currentUserId, otherUserId });
      
      const { data: messages, error } = await supabase.rpc('get_chat_messages', {
        p_user1: currentUserId,
        p_user2: otherUserId,        
      });

      console.log('messages 배열:', messages);

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

    // 여기서 noti_setting 업데이트 추가
    const { error: notiError } = await supabase
      .from('notification_settings')
      .update({ target_user_id: currentUserId }) // 너(보낸 사람) 아이디로 변경
      .eq('user_id', otherUserId);             // 상대방(user_id)이 대상

    if (notiError) {
      console.error('noti_setting 업데이트 실패:', notiError.message);
    }    

  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (endRef.current) {
        endRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50); // 약간의 지연
  };

  const handleDownload = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.click();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('다운로드 실패:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
      <div>
        {/* <ChatPageHeader recipient={recipient} /> */}
        <ChatPageHeader otherUserId={otherUserId} />
      </div>      
    
      <div style={styles.messagesArea}>
        {messages.map((msg, index) => {
          console.log('🔍 메시지 타입:', msg.type, '내용:', msg.content);

          const isMine = msg.sender_id === currentUserId;

          // 🕒 시간 포맷 함수 (서울 시간 기준)
          const formatTime = (timestamp) => {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const options = { hour: 'numeric', minute: 'numeric', timeZone: 'Asia/Seoul' };
            return date.toLocaleTimeString('ko-KR', options);
          };

          // 📅 날짜 헤더 표시 여부 판단
          const msgDate = msg.created_at ? new Date(msg.created_at) : null;
          const prevMsgDate =
            index > 0 && messages[index - 1].created_at
              ? new Date(messages[index - 1].created_at)
              : null;

          const shouldShowDateHeader =
            index === 0 ||
            !prevMsgDate ||
            (msgDate && msgDate.toDateString() !== prevMsgDate.toDateString());

          return (
            <div
              key={msg.id || `msg-${index}`}
              style={{
                display: 'flex',
                flexDirection: isMine ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                marginBottom: '8px',
                // maxWidth: '100%',
                width: '100%', // maxWidth 대신 width 100%로 부모 너비 꽉 채우기
                gap: '8px',
              }}
            >
              {/* 텍스트, 파일 메시지는 말풍선 스타일 적용 */}
              {(msg.type === 'text' || msg.type === 'file' || !msg.type) && (
                <div
                  style={{
                    backgroundColor: isMine ? '#d1f7c4' : '#eee',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    wordBreak: 'break-word',
                    cursor: 'default',
                    maxWidth: '100%',
                  }}
                >
                  {msg.type === 'file' && (
                    <div>
                      📎{' '}
                      <span
                        onClick={() => handleDownload(msg.content, msg.name)}
                        style={{ color: '#0077cc', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {msg.name || '파일 다운로드'}
                      </span>
                    </div>
                  )}
                  {(msg.type === 'text' || !msg.type) && <span>{msg.content}</span>}
                </div>
              )}

              {/* 사진 메시지 */}
              {msg.type === 'image' && (
                <img
                  src={msg.content}
                  alt={msg.name || 'image'}
                  style={{
                    maxWidth: '150px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onClick={() => setSelectedMedia({ type: 'image', url: msg.content })}
                />
              )}

              {/* 동영상 메시지 */}
              {msg.type === 'video' && (
                <video
                  src={msg.content}
                  controls
                  style={{
                    maxWidth: '200px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'block',
                  }}
                  onClick={() => setSelectedMedia({ type: 'video', url: msg.content })}
                />
              )}

              {/* 시간 + 읽음 표시 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#666',
                  fontSize: 12,
                  gap: '4px',
                  minWidth: '40px',
                  justifyContent: 'flex-end',
                  flexDirection: 'row',
                }}
              >
                {isMine && msg.read_at && (
                  <span style={{ fontSize: 10, color: '#999' }}>읽음</span>
                )}
                <span>{formatTime(msg.created_at)}</span>
              </div>
            </div>                   
          );
        })}
        {/* 📍 스크롤 하단 고정용 ref */}
        <div ref={endRef} />
      </div>      

      <div style={{ ...styles.inputContainer, display: 'flex', alignItems: 'center' }}>
        {/* ✅ label 대신 div 사용 */}
        <div
          onClick={handlePlusClick}
          style={{ ...styles.plusButton, marginLeft: '4px', marginRight: '4px' }}
        >
          +
        </div>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <textarea
          style={{
            width: '100%', // 말풍선 maxWidth와 동일하게!
            maxWidth: '100%', // 말풍선 최대 너비와 비슷하게
            padding: '8px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            resize: 'none',
            boxSizing: 'border-box',
          }}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)} // ✅ 이 부분 고침
        />

        {/* <textarea
          placeholder="메시지를 입력하세요"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)} // ✅ 이 부분 고침
          onKeyDown={handleKeyDown}
          rows={2}
          style={{
            ...styles.textarea,
            width: 'calc(100% - 20px)',
            paddingLeft: '10px',
            paddingRight: '10px',
            fontSize: '14px',
            letterSpacing: '0.5px',
            lineHeight: '1.6',
            resize: 'none',
            marginBottom: '8px',
            borderRadius: '8px',
            backgroundColor: '#f1f1f1',
          }}
        /> */}
      </div>

      {isFileModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <p>📄 선택한 파일: <strong>{selectedFile?.name}</strong></p>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handleSendFile} style={styles.modalButton}>파일 전송</button>
              <button onClick={handleCloseModal} style={styles.cancelButton}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>        
        

  );
}

const modalStyles = {
  backdrop: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    minWidth: 300,
  }
};
const styles = {
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  plusButton: {
    fontSize: '24px',
    cursor: 'pointer',
  },
  textarea: {
    width: '300px',
    height: '50px',
    padding: '10px',
    borderRadius: '5px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    width: '80%', // 모달의 너비 조정 (좌우 꽉 찬 문제 해결)
    maxWidth: '400px', // 최대 너비 설정
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
  },

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
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
    gap: 8,
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
    alignItems: 'center',  // 세로 가운데 정렬
  },
  sendButton: {
    padding: '10px 20px',  // 버튼에 적당한 상하 패딩 추가
    backgroundColor: '#5ca05c',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',  // 버튼 텍스트 줄 바꿈 방지
    height: '50px',        // textarea와 높이 맞추기
  },
  fullscreenOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    fontSize: 28,
    color: '#fff',
    cursor: 'pointer',
    zIndex: 10000,
  },
  fullscreenImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain',
  },
  fullscreenVideo: {
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: 8,
  }  
};

export default ChatPage;