import React from 'react';
import { useNavigate } from 'react-router-dom';

function Intro({ onLoginClick, onSignUpClick }) {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      {/* <h3 style={{ fontSize: '2.5em', color: '#333' }}>환영합니다!</h3> */}
      <h5 style={{ fontSize: '1.4em', color: '#e91e63' }}>💗 벙개 데이팅에 오신것을 환영합니다</h5>
      <p style={{ fontSize: '0.8em', color: '#555' }}>
        당신만을 위한 따뜻한 인연을 시작해보세요.
      </p>
      <p style={{ fontSize: '0.8em', color: '#555' }}>
        계속하려면 로그인 또는 회원가입 해주세요
      </p>

      {/* 남자 여자 이미지 추가 */}
      <div style={{ margin: '20px 0', textAlign: 'center' }}>
        <img 
          src="/images/pexels-seljansalim-32392457.jpg" 
          alt="커플 이미지" 
          style={{ width: '300px', borderRadius: '20px' }} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
        {/* 로그인 버튼 */}
        <button
          onClick={onLoginClick}
          style={{
            padding: '10px 20px',
            fontSize: '1.1em',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
        >
          로그인
        </button>

        {/* 회원가입 버튼 */}
        <button
          onClick={onSignUpClick}
          style={{
            padding: '10px 20px',
            fontSize: '1.1em',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
        >
          회원가입
        </button>
      </div>

      {/* 이용약관, 개인정보처리방침 */}
      <div style={{ marginTop: 30, fontSize: '0.9em', color: '#555' }}>
        <span
          style={{ cursor: 'pointer', color: '#1976d2', marginRight: 15, textDecoration: 'underline' }}
          onClick={() => navigate('/terms')}
        >
          이용약관
        </span>
        <span
          style={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}
          onClick={() => navigate('/privacy')}
        >
          개인정보 처리방침
        </span>
      </div>
    </div>
  );
}

export default Intro;