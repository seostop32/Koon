// src/pages/AccountManagement.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AccountManagementHeader from './AccountManagementHeader';

function AccountManagement({ onLogout }) {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);  
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('로그인 유저 없음', userError);
        navigate('/login');
        return;
      }

      setEmail(user.email);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('받아온 프로필 데이터:', data);

      if (error) {
        console.error('프로필 로드 실패:', error);
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div>
        <AccountManagementHeader />
      </div>

      <main style={styles.main}>
        <div style={styles.fieldRow}>
          <span style={styles.label}>이름</span>
          <span style={styles.value}>{profile?.username || '정보 없음'}</span>
        </div>
        <div style={styles.fieldRow}>
          <span style={styles.label}>성별</span>
          <span style={styles.value}>{profile?.gender || '정보 없음'}</span>
        </div>
        <div style={styles.fieldRow}>
          <span style={styles.label}>나이</span>
          <span style={styles.value}>{profile?.age != null ? `${profile.age}세` : '정보 없음'}</span>
        </div>
        <div style={styles.fieldRow}>
          <span style={styles.label}>연락처</span>
          <span style={styles.value}>{profile?.phone || '정보 없음'}</span>
        </div>
        <div style={styles.fieldRow}>
          <span style={styles.label}>이메일</span>
          <span style={styles.value}>{email || '정보 없음'}</span>
        </div>

        {/* 버튼 컨테이너 */}
        <div style={styles.buttonContainer}>
          <button
            style={styles.actionButton}
            onClick={() => {
              alert('회원탈퇴 기능은 나중에 구현할게요.');
            }}
          >
            회원탈퇴
          </button>
          {/* <button style={styles.actionButton} onClick={onLogout}>로그아웃</button> */}
          <button
            style={styles.actionButton}
            onClick={() => {
                console.log('로그아웃 버튼 클릭!');
                onLogout();
            }}
            >
            로그아웃
          </button>
        </div>        
      </main>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  header: {
    height: 56,
    backgroundColor: '#4a90e2',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
  },
  backButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  main: {
    padding: 16,
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #ddd',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    width: 80,
    paddingLeft: 8,
    flexShrink: 0,
  },
  value: {
    fontSize: 16,
    color: '#555',
    marginLeft: 12,
    flex: 1,
    textAlign: 'left',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 24,
  },
  actionButton: {
    padding: '8px 16px',
    fontSize: 14,
    borderRadius: 8,
    border: '1px solid #f97316',
    backgroundColor: '#fff',
    color: '#f97316',
    cursor: 'pointer',
    userSelect: 'none',
  },
};

export default AccountManagement;