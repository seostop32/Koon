import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../supabaseClient';
import HelpDeskHeader from './HelpDeskHeader';

const TABS = [
  { id: 'inquiry', label: '문의' },
  { id: 'suggestion', label: '제안' },
];

const ADMIN_ID = '운영자-id-여기에'; // 실제 운영자 Supabase 유저 ID로 바꿔줘야 함

function HelpDesk() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inquiry');
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);
  

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUserId(user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (!error) setProfile(data);
    };
    fetchProfile();
  }, [navigate]);

  const handleSubmit = async () => {
    const ADMIN_ID = process.env.REACT_APP_ADMIN_ID;
console.log('ADMIN ID:', process.env.REACT_APP_ADMIN_ID);
    if (!message.trim()) return alert('내용을 입력해주세요.');

    const { error } = await supabase.from('messages').insert({
      sender_id: userId,
      recipient_id: ADMIN_ID,
      content: message,
      created_at: new Date().toISOString(),
      support_type: activeTab, // 'inquiry' or 'suggestion'
    });

    if (error) {
      console.error(error);
      alert('메시지 전송에 실패했습니다.');
    } else {
      setMessage('');
      alert('메시지가 전송되었습니다.');
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <HelpDeskHeader />
      </div>

      <nav style={styles.tabContainer}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.id ? styles.activeTab : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={{ padding: 16 }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            activeTab === 'inquiry'
              ? '문의 내용을 입력하세요...'
              : '제안 내용을 입력하세요...'
          }
          style={styles.textarea}
        />
        <div style={styles.noticeText}>
          문의나 제안사항을 보내주시면 빠르게 처리해 드리겠습니다. 감사합니다.
        </div>
      </main>

      <footer style={styles.footer}>
        <button style={styles.submitButton} onClick={handleSubmit}>
          보내기
        </button>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9fafb',
  },
  header: {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    borderBottom: '1px solid #ddd',
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  bellButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#333',
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid #ddd',
  },
  tabButton: {
    flex: 1,
    padding: 12,
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: 16,
    cursor: 'pointer',
    color: '#555',
  },
  activeTab: {
    borderBottomColor: '#4a90e2',
    fontWeight: '700',
    color: '#4a90e2',
  },
  textarea: {
    width: '100%',
    minHeight: 250,
    padding: 8,
    fontSize: 16,
    borderRadius: 8,
    border: '1px solid #ccc',
    resize: 'vertical',
    boxSizing: 'border-box',
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 480,
    borderTop: '1px solid #ddd',
    backgroundColor: '#fff',
    padding: 12,
    boxSizing: 'border-box',
    zIndex: 10,
  },
  submitButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#4a90e2',
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
  },
};

export default HelpDesk;