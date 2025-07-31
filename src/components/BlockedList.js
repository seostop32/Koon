import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BlockedListHeader from './BlockedListHeader';

function BlockedList() {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUserId(data.user.id);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchBlocked = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blocks')
        .select('id, blocked_id, blocked_user:blocked_id (id, nickname)')
        .eq('blocker_id', userId);

      if (error) {
        alert('차단 목록을 불러오는 중 오류가 발생했습니다.');
        console.error(error);
      } else {
        setBlockedUsers(data || []);
      }
      setLoading(false);
    };

    fetchBlocked();
  }, [userId]);

  const handleUnblock = async (blockRecordId) => {
    setLoading(true);
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockRecordId);

    if (error) {
      alert('차단 해제 중 오류가 발생했습니다.');
      console.error(error);
    } else {
      alert('차단이 해제되었습니다.');
      setBlockedUsers(blockedUsers.filter(b => b.id !== blockRecordId));
    }
    setLoading(false);
  };

  const styles = {
    header: {
      position: 'fixed',
      top: 0,
      width: '100%',
      height: 50,
      backgroundColor: '#f8f8f8',
      borderBottom: '1px solid #ddd',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      zIndex: 10,
    },
    content: {
      padding: '0px 20px 0px', // 헤더/푸터 공간 확보
    },
    footer: {
      position: 'fixed',
      bottom: 0,
      width: '100%',
      height: 60,
      backgroundColor: '#f8f8f8',
      borderTop: '1px solid #ccc',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    footerButton: {
      flex: 1,
      textAlign: 'center',
      fontSize: '1.2rem',
      cursor: 'pointer',
      userSelect: 'none',
    },  
    unblockButton: {
      backgroundColor: '#4caf50',
      color: '#fff',
      border: 'none',
      borderRadius: 4,
      padding: '6px 12px',
      cursor: 'pointer',
    },
  };

  return (
    <>
      <div>
        <BlockedListHeader />
      </div>

      {/* 본문 */}
      <div style={styles.content}>
        {loading && <p>불러오는 중...</p>}
        {blockedUsers.length === 0 && !loading && <p>차단한 사용자가 없습니다.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {blockedUsers.map(({ id, blocked_user }) => (
            <li
              key={id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span>{blocked_user?.nickname || '닉네임 없음'}</span>
              <button
                onClick={() => handleUnblock(id)}
                disabled={loading}
                style={styles.unblockButton}
              >
                {loading ? '처리중...' : '차단 해제'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 하단 푸터 */}
      <footer style={styles.footer}>
        <div style={styles.footerButton} onClick={() => navigate('/')}>🏠</div>
        <div style={styles.footerButton} onClick={() => navigate('/search')}>🔍</div>
        <div style={styles.footerButton} onClick={() => navigate('/favorites')}>💘</div>
        <div style={styles.footerButton} onClick={() => navigate('/chat')}>💬</div>
        <div style={styles.footerButton} onClick={() => navigate('/mypage')}>👤</div>
      </footer>
    </>
  );
}

export default BlockedList;