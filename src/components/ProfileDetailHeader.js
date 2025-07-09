import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBackSharp } from 'react-icons/io5';
import { supabase } from '../supabaseClient';
import BlockModal from './BlockModal';
import ReportModal from './ReportModal';
import { MoreVertical } from 'lucide-react'; // 세로 점 3개 아이콘

export default function ProfileDetailHeader({ otherUserId, user, profile }) {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png');
  const [loadingRecipient, setLoadingRecipient] = useState(true);
  const [recipient, setRecipient] = useState(null);
  
  const menuRef = useRef();
  const buttonRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
console.log('🎯 otherUserId:', otherUserId);  

    const openMenu = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY - 4, // 스크롤 고려해서 위치 보정
        left: rect.left + window.scrollX - 60, // 버튼보다 약간 왼쪽으로
      });
      setMenuOpen(true);
    };

    useEffect(() => {
      if (!otherUserId) return;

      const fetchRecipient = async () => {
        setLoadingRecipient(true);

        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, nickname')
          .eq('id', otherUserId)
          .single();

        if (error) {
          console.error('상대방 정보 조회 실패:', error);
          setAvatarUrl('/default-avatar.png');
        } else {
          setRecipient(data);

          const avatar = data.avatar_url;  // 여기 선언 필수!

          if (avatar) {
            if (avatar.startsWith('http')) {
              setAvatarUrl(avatar);
            } else {
              const filePath = avatar.startsWith('profile-photos/')
                ? avatar.substring('profile-photos/'.length)
                : avatar;

              const { data: publicUrlData, error: publicUrlError } = supabase.storage
                .from('profile-photos')
                .getPublicUrl(filePath);

              if (publicUrlError) {
                console.error('❌ 공개 URL 생성 실패', publicUrlError);
                setAvatarUrl('/default-avatar.png');
              } else {
                setAvatarUrl(publicUrlData.publicUrl);
              }
            }
          }
        }

        setLoadingRecipient(false);
      };

      fetchRecipient();
    }, [otherUserId]);

  // 버튼 위치 기준으로 메뉴 위치 설정
  useEffect(() => {
    if (menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'absolute',
        top: rect.bottom + 4 + 'px',   // 버튼 바로 아래
        left: rect.left + 'px',        // 버튼 왼쪽 맞춤
        zIndex: 1000,
        background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        borderRadius: '8px',
        padding: '8px 0',
        width: '120px',
      });
    }
  }, [menuOpen]);

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
  // const menuPosition = {
  //   top: '40px',  // 점 세개 아래로 살짝 내려줌
  //   left: '240px', // 점 세개 기준으로 살짝 왼쪽 이동
  //   transform: 'translate(0, 0)', // 필요하면 미세조정 가능
  // };
  return (
    <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '0 16px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#fff',
          height: '52px',
          boxSizing: 'border-box',
          userSelect: 'none',
          position: 'relative',
          gap: '10px',
        }}
      >
        {/* 왼쪽: 뒤로가기 버튼 */}
        <button
          onClick={() => navigate(-1)}
          style={{
            fontSize: '24px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            padding: 0,
          }}
          aria-label="뒤로가기"
        >
          <IoChevronBackSharp />
        </button>

        {/* 프로필 이미지 + 텍스트 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              height: '30px',
              width: '30px',
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 0 3px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
            }}
          >
            <img
              src={avatarUrl}
              alt="상대방 아바타"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#ff7f00', fontWeight: 'bold' }}>
              {recipient?.nickname}
            </span>
          </div>

          {/* 점 3개 버튼 */}
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            // onClick={() => setMenuOpen((prev) => !prev)}
            onClick={openMenu}
          >
            <MoreVertical size={24} />
          </button>

          {/* 메뉴 팝업 */}
          {menuOpen && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: '6px 0',
                width: 'fit-content',  // 고정폭 대신 내용에 딱 맞게
                zIndex: 9999,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              <button style={styles.menuItem} onClick={() => {
                  setShowBlockModal(true);
                  setMenuOpen(false);
                }}
              >
                차단하기
              </button>
              <hr style={styles.divider} />
              <button style={styles.menuItem} onClick={() => {
                  setShowReportModal(true);
                  setMenuOpen(false);  // 메뉴 닫기 추가
                }}
              >
                신고하기
              </button>
            </div>
          )}

          {showBlockModal && (
            <BlockModal
              blockerId={user.id}
              blockedId={profile.id}
              onClose={() => {
                setShowBlockModal(false);
                setMenuOpen(false);
              }}
            />
          )}
          {showReportModal && (
            <ReportModal
              reporterId={user.id}
              reportedId={profile.id}
              onClose={() => {
                setShowReportModal(false);
                setMenuOpen(false);
              }}
            />
          )}                  
        </div>
      </header>
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
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
    borderRadius: '8px',
    padding: '4px 0',
    zIndex: 100,
    width: 'fit-content',      // 내용에 딱 맞게
    minWidth: 'unset',
    whiteSpace: 'nowrap',
    display: 'inline-block',
    boxSizing: 'border-box',   // 추가
  },

  menuItem: {
    padding: '6px 12px',  // 좌우 여백 살짝 늘려도 좋음
    fontSize: '14px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    width: '100%',  // 여기 변경
  },
  divider: {
    margin: '4px auto',
    width: '80%',
    border: 'none',
    borderTop: '1px solid #e0e0e0',
  },

};