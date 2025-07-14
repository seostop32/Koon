import React, { useState } from 'react';
import { supabase } from './supabaseClient';

function Auth({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();

    if (!emailTrimmed || !passwordTrimmed) {
      setError('이메일과 비밀번호를 입력해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = isLogin
        ? await supabase.auth.signInWithPassword({ email: emailTrimmed, password: passwordTrimmed })
        : await supabase.auth.signUp({ email: emailTrimmed, password: passwordTrimmed });

      if (error) {
        setError(error.message);
      } else {
        onAuthSuccess(data.user); // 로그인 성공 시 사용자 정보 전달 가능
      }
    } catch (err) {
      console.error(err);
      setError('예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 360,
        margin: 'auto',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        boxSizing: 'border-box',
        textAlign: 'center',
      }}
    >
      <h2>{isLogin ? '로그인' : '회원가입'}</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 15,
            borderRadius: 5,
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 15,
            borderRadius: 5,
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: 16,
          }}
        >
          {isLoading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
        </button>
      </form>

      <button
        onClick={() => {
          setError('');
          setIsLogin((prev) => !prev);
        }}
        disabled={isLoading}
        style={{
          marginTop: 15,
          background: 'none',
          border: 'none',
          color: '#0070f3',
          cursor: 'pointer',
          fontSize: 14,
          textDecoration: 'underline',
        }}
      >
        {isLogin ? '회원가입으로 전환' : '로그인으로 전환'}
      </button>
    </div>
  );
}

export default Auth;