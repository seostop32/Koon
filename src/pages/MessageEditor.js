// src/components/MessageEditor.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function MessageEditor() {
  const { id } = useParams(); // 상대 프로필 ID
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchRecipient = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, age, location, avatar_url')
        .eq('id', id)
        .single();
      if (error) {
        console.error('프로필 로딩 실패:', error);
      } else {
        setRecipient(data);
      }
    };
    fetchRecipient();
  }, [id]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('로그인이 필요합니다.');

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: id,
      content: message,
    });

    if (error) {
      console.error('메시지 저장 실패:', error);
    } else {
      setMessage('');
      navigate(`/chat/${id}`);
    }
  };

  if (!recipient) return <div style={styles.loading}>상대 정보를 불러오는 중...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.recipientInfo}>
        <img
          src={recipient.avatar_url || 'https://placekitten.com/150/150'}
          alt="avatar"
          style={styles.avatar}
        />
        <div>
          <h3 style={styles.name}>{recipient.username}</h3>
          <p style={styles.meta}>
            {recipient.age ? `${recipient.age}세` : ''} {recipient.location ? `| ${recipient.location}` : ''}
          </p>
        </div>
      </div>

      <div style={styles.spacer} />

      <div style={styles.editor}>
        <textarea
          style={styles.textarea}
          placeholder="메시지를 입력하세요...Message222"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button style={styles.sendButton} onClick={handleSend}>
          전송
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
    backgroundColor: '#f8f8f8',
  },
  recipientInfo: {
    display: 'flex',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    marginRight: 16,
    objectFit: 'cover',
  },
  name: {
    margin: 0,
    fontSize: 18,
  },
  meta: {
    margin: 0,
    color: '#666',
    fontSize: 14,
  },
  spacer: {
    flex: 1,
  },
  editor: {
    padding: 10,
    borderTop: '1px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  textarea: {
    flex: 1,
    resize: 'none',
    fontSize: 16,
    padding: 10,
    borderRadius: 8,
    border: '1px solid #ccc',
    marginRight: 10,
    height: 60,
  },
  sendButton: {
    padding: '10px 20px',
    backgroundColor: '#555',
    color: '#fff',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  loading: {
    padding: 30,
    textAlign: 'center',
  },
};

export default MessageEditor;