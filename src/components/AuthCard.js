import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import { Toaster } from 'react-hot-toast';

function AuthCard({ mode, onAuthSuccess, onSignUp }) {


  const [isLogin] = useState(mode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // 회원가입용
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail || !trimmedPassword || (!isLogin && !trimmedUsername)) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
console.log('가입 시도 이메일:', JSON.stringify(trimmedEmail));
console.log('로그인 시도:', { email: trimmedEmail, password: trimmedPassword });
    try {
      if (isLogin) {
        // 로그인
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
  //email: "test4@example.com",
  //password: "test1234",          
        });

        if (error) {
          setError(error.message);
          return;
        }

        onAuthSuccess();
      } else {
        // 회원가입
          // 1) signUp
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: trimmedEmail,
            password: trimmedPassword,
            options: {
              data: { username: trimmedUsername },  // user_metadata
            },            
          });
          if (signUpError) {
            console.error(signUpError.message);
            return;
          }

          // 2) 트리거가 만든 행을 “업데이트” (INSERT 대신 UPDATE)
          const userId = signUpData.user?.id;        // email 인증 여부와 관계없이 존재
        console.log('userId 이름:', userId); // 빈 문자열이 아닌지 확인
        console.log('업서트할 이름:', trimmedUsername); // 빈 문자열이 아닌지 확인

          if (userId && trimmedUsername) {
            const { error: updateError, data: updateData } = await supabase
              .from('profiles')
              .update({ username: trimmedUsername })
              .eq('id', userId)
              .select('id, username');   // ← 반환될 행이 없으면 RLS 문제
            console.log('업데이트 결과:', updateData);      // 빈 배열이면 0행

            if (updateError) {
              console.error('username 업데이트 실패:', updateError.message);
            } else if (!updateData || updateData.length === 0) {
              console.warn('0행 업데이트: RLS 정책 또는 조건 미일치');
            }else {
              console.log('username 업데이트 성공');
            }
          } else {
            console.warn('userId 또는 username이 없음');
          }


          // ✅ 여기서만 호출해야 함
          toast.success('회원가입 완료! 환영합니다 🎉');

          onAuthSuccess();
      }
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다.');
      console.error(err);
    }
  };

  return (
    <div
      className="auth-card"
      style={{
        maxWidth: 360,
        width: '100%',
        margin: 'auto',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 8,
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        boxSizing: 'border-box',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>
        {isLogin ? '로그인' : '회원가입'}
      </h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 15,
            borderRadius: 5,
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 15,
            borderRadius: 5,
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
        />
        {!isLogin && (
          <input
            type="text"
            placeholder="사용자 이름"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 10,
              marginBottom: 15,
              borderRadius: 5,
              border: '1px solid #ccc',
              boxSizing: 'border-box',
            }}
          />
        )}

        {error && (
          <p style={{ color: 'red', marginBottom: 10, wordBreak: 'break-word' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          {isLogin ? '로그인' : '회원가입'}
        </button>
      </form>
    </div>
  );
}

export default AuthCard;