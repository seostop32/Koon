import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const ADMIN_ID = 'db323feb-a4cb-426a-a606-75d1f545ffcf';

export default function HelpDeskAdmin() {
  const [loading, setLoading] = useState(true);
  const [inquiries, setInquiries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchInquiries() {
      setLoading(true);
      console.error('ADMIN_ID==================:', ADMIN_ID);

      const { data, error } = await supabase.rpc('get_messages_for_recipient', { target_recipient: ADMIN_ID });

      if (error) {
        console.error('RPC 호출 오류:', error);
        setLoading(false);
        return;
      }

      // sender_id 기준 중복 제거
      const uniqueSenders = {};
      data.forEach(msg => {
        if (!uniqueSenders[msg.sender_id]) {
          uniqueSenders[msg.sender_id] = msg;
        }
      });

      setInquiries(Object.values(uniqueSenders));
      setLoading(false);
    }

    fetchInquiries();
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate(-1)}>{'<'}</button>
        <h1 style={styles.title}>운영자 문의 응답 목록</h1>
      </header>

      <main style={styles.main}>
        {loading && <p>불러오는 중...</p>}
        {!loading && inquiries.length === 0 && <p>문의가 없습니다.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {inquiries.map(msg => {
            const username = msg.sender_username || '알 수 없음';
            const avatarUrl = msg.sender_avatar_url;

            return (
              <li
                key={msg.id}
                style={styles.inquiryItem}
                onClick={() => navigate(`/chat/${msg.sender_id}`)}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" style={styles.avatar} />
                ) : (
                  <div style={styles.avatarFallback}>
                    {username[0] || '?'}
                  </div>
                )}
                <div style={styles.textContainer}>
                  <strong style={{ fontSize: 15 }}>{username}</strong>
                  <p style={styles.message}>
                    {msg.content.length > 30 ? msg.content.slice(0, 30) + '...' : msg.content}
                  </p>
                  <small style={styles.time}>
                    {new Date(msg.created_at).toLocaleString()}
                  </small>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: '0 auto',
    paddingTop: 56,
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
    zIndex: 10,
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
    fontSize: 18,
    fontWeight: '600',
  },
  main: {
    padding: 20,
    paddingTop: 16,
  },
  inquiryItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px 16px',
    marginBottom: 10,
    borderRadius: 12,
    background: '#f9f9f9',
    cursor: 'pointer',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: 12,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    backgroundColor: '#ddd',
    color: '#555',
    fontSize: 20,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    margin: '4px 0',
    color: '#555',
    fontSize: 14,
  },
  time: {
    color: '#999',
    fontSize: 12,
  },
};