import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoChevronBackSharp } from 'react-icons/io5';
import { FaBell } from 'react-icons/fa';

export default function Header({ title, unreadCount = 0 }) {
  const navigate = useNavigate();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#fff',
        height: '52px',
        boxSizing: 'border-box',
        userSelect: 'none',
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          fontSize: '24px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#555',
          display: 'flex',
          alignItems: 'center',
        //   height: '52px',
          height: '100%', // ✅ 부모 기준으로 맞춤
          lineHeight: '52px',
          padding: 0,
        }}
        aria-label="뒤로가기"
      >
        <IoChevronBackSharp />
      </button>

      <div
        style={{
          flexGrow: 1,
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '20px',
        }}
      >
        {title}
      </div>

      <div
        style={{
          position: 'relative',
          cursor: 'pointer',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          color: '#555',
        }}
        onClick={() => navigate('/notifications')}
        aria-label="알림 페이지로 이동"
      >
        <FaBell size={24} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 0,
              backgroundColor: 'red',
              borderRadius: '50%',
              color: 'white',
              minWidth: 18,
              height: 18,
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: '18px',
            }}
          >
            {unreadCount}
          </span>
        )}
      </div>
    </header>
  );
}