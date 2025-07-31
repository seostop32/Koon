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

  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
      } else {
        console.error('유저 정보 불러오기 실패:', error);
      }
    };

    fetchUser();
  }, []);  

  //회원탈퇴
  async function handleDeleteAccount(userId) {
    const confirm = window.confirm('정말 탈퇴하시겠어요? 😢');

    if (!confirm) return;

    // Step 1: 프로필에서 is_deleted 처리
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_deleted: true })
      .eq('id', userId);

    if (profileError) {
      alert('프로필 삭제 실패');
      console.error(profileError);
      return;
    }

    // Step 2: 로그아웃 처리
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      alert('로그아웃 실패');
      console.error(signOutError);
      return;
    }

    // Step 3: 홈 또는 로그인 페이지로 이동
    // window.location.href = '/login'; // or navigate('/login');
    window.location.href = '/auth'; // or navigate('/login');
    
  }  

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
        .select('username, gender, age, phone') // 필요한 필드만 요청
        .eq('id', user.id)
        .is('is_deleted', false);

      if (error) {
        console.error('프로필 로드 실패:', error);
        setLoading(false);  // 에러 처리 후 로딩 상태 해제
        return;
      }

      if (data && data.length > 0) {
        setProfile(data[0]); // 프로필이 있을 경우
      } else {
        setProfile(null);  // 없으면 null 처리
      }

      setLoading(false);  // 데이터 처리 후 로딩 상태 해제
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
            onClick={() => handleDeleteAccount(currentUserId)}
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