import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from './AuthCard';
import { supabase } from '../supabaseClient';  // 경로는 실제 위치에 맞게 조정


function AuthPage({ mode, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');  
  const navigate = useNavigate();

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert('회원가입 실패: ' + error.message);
      return;
    }

    // 회원가입 성공 시 프로필 기본 데이터 생성
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, created_at: new Date().toISOString(), profile_completed: false }]);
      
      if (profileError) {
        console.error('프로필 기본 데이터 생성 실패:', profileError.message);
      } else {
        console.log('프로필 기본 데이터 생성 성공');
      }
    }

    alert('회원가입 완료! 이메일 인증 후 로그인 해주세요.');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#e3f2fd',
        boxSizing: 'border-box',
      }}
    >
      <header
        style={{
          backgroundColor: 'white',
          padding: '12px 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <h3
          style={{ color: '#1976d2', cursor: 'pointer', margin: 0 }}
          onClick={() => navigate('/')}
        >
          💗 벙개 데이팅
        </h3>
        {/* <button
          style={{
            background: 'none',
            border: 'none',
            color: '#1976d2',
            cursor: 'pointer',
            fontSize: 14,
          }}
          onClick={() => navigate('/intro')}
        >
          Intro로 이동
        </button> */}
      </header>

      <main
        style={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <AuthCard mode={mode} onAuthSuccess={onAuthSuccess} />
      </main>
    </div>
  );
}

export default AuthPage;