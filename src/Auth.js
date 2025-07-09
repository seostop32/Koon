import React, { useState } from 'react';
import { supabase } from './supabaseClient';

function Auth({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (isLogin) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({ email, password });
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      onAuthSuccess(); // 인증 성공 시 부모로 알림
    }
  };

  return (
    <div>
      <h2>{isLogin ? '로그인' : '회원가입'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        /><br />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        /><br />
        <button type="submit">{isLogin ? '로그인' : '회원가입'}</button>
      </form>
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? '회원가입으로 전환' : '로그인으로 전환'}
      </button>
    </div>
  );
}

export default Auth;