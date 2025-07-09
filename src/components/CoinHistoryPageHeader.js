import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBackSharp } from 'react-icons/io5';
import { supabase } from '../supabaseClient';

export default function CoinHistoryPageHeader({ title = '구매/사용 내역' }) {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png');

  useEffect(() => {
    async function fetchAvatar() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('사용자 정보를 가져올 수 없습니다.', userError);
        return;
      }

      // profiles 테이블에서 avatar_url 조회
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('프로필 정보를 가져올 수 없습니다.', profileError);
        return;
      }

      if (profileData?.avatar_url) {
        setAvatarUrl(profileData.avatar_url);
      }
    }

    fetchAvatar();
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',   // 기존 16px에서 8px로 줄임
        borderBottom: '1px solid #eee',
        backgroundColor: '#fff',
        height: '52px',
        boxSizing: 'border-box',
        userSelect: 'none',
        position: 'relative',
      }}
    >
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
          marginLeft: '-8px',  // 왼쪽 끝으로 밀기
        }}
        aria-label="뒤로가기"
      >
        <IoChevronBackSharp />
      </button>

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
        {title}
      </div>

      <div
        style={{
          cursor: 'default',
          height: '30px',
          width: '30px',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 0 3px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
          marginRight: '-8px',  // 오른쪽 끝으로 밀기
        }}
        aria-label="프로필 페이지로 이동"
      >
        <img
          src={avatarUrl}
          alt="사용자 아바타"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    </header>
  );
}