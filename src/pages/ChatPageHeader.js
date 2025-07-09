import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBackSharp } from 'react-icons/io5';
import { supabase } from '../supabaseClient';

export default function ChatListPageHeader({ title = '채팅', otherUserId }) {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png');
  const [loadingRecipient, setLoadingRecipient] = useState(true);
  const [recipient, setRecipient] = useState(null);

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
        </div>

        {/* 가운데 타이틀 (중앙 고정)
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '18px',
            color: '#000',
            pointerEvents: 'none',
          }}
        >
          {loadingRecipient ? '불러오는 중...' : title}
        </div> */}
      </header>
      
  );
}