// ProfileHeader.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // supabase 인스턴스 임포트
import BlockModal from './BlockModal';
import ReportModal from './ReportModal';


// console.log('차단 modal로 넘길 ID:', blockerId, blockedId);


function ProfileHeader({ profile }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [user, setUser] = useState(null); // ✅ user 상태 추가

  // ✅ supabase.auth.getUser()로 현재 유저 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      } else {
        console.error('유저 정보를 가져올 수 없습니다:', error);
      }
    };
    fetchUser();
  }, []);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // 클릭 외부 감지해서 메뉴 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={styles.header}>
      <button
        style={styles.backButton}
        onClick={() => navigate(-1)} // 이전 화면으로 이동
        aria-label="뒤로가기"
      >
        &#x3c; {/* < 문자 */}
      </button>
      <h2 style={styles.nickname}>{profile.nickname || '닉네임 없음'}</h2>
      <div style={{ position: 'relative' }}>
        <button
          style={styles.moreButton}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="더보기 메뉴"
        >
          <div style={styles.dot} />
          <div style={styles.dot} />
          <div style={styles.dot} />
        </button>

        {menuOpen && (
          <div style={styles.menu} ref={menuRef}>
            <button style={styles.menuItem} onClick={() => setShowBlockModal(true)}>차단하기</button>
            {showBlockModal && (
              <BlockModal
                blockerId={user.id}
                blockedId={profile.id}
                onClose={() => {
                  setShowBlockModal(false);
                  setMenuOpen(false); // ✅ 메뉴까지 닫기
                }}
              />
            )}            
            <button style={styles.menuItem} onClick={() => setShowReportModal(true)}>신고하기</button>
            {showReportModal && (
              <ReportModal
                reporterId={user.id}
                reportedId={profile.id}
                onClose={() => {
                  setShowReportModal(false);
                  setMenuOpen(false); // ✅ 메뉴까지 닫기
                }}
              />
            )}            
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fff',
    gap: 12,
  },
  backButton: {
    fontSize: '1.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  nickname: {
    flex: 1,
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  moreButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    lineHeight: '1',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    backgroundColor: '#333',
  },
  menu: {
    position: 'absolute',
    top: '110%',
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: 8,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    zIndex: 10,
    minWidth: 100,
    display: 'flex',
    flexDirection: 'column',
  },
  menuItem: {
    padding: '10px 15px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 14,
    color: '#333',
    borderBottom: '1px solid #eee',
  },
};

export default ProfileHeader;