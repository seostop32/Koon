import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import { Visibility, VisibilityOff } from '@mui/icons-material';

/**
 * AuthCard
 * - mode: 'login' | 'signup' | 'resetPassword'
 * - onAuthSuccess: () => void (callback after successful login)
 */
function AuthCard({ mode: initialMode = 'login', onAuthSuccess = () => {} }) {
  // ───────────────────────────────────────────────────────────── state
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ─────────────────────────────────────────────────────────── effects
  // 모드가 바뀌면 필드 초기화
  useEffect(() => {
    setMode(initialMode);
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
    setMessage('');
    setShowPassword(false);
  }, [initialMode]);

  // ───────────────────────────────────────────────────────── handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail) {
      setError('이메일을 입력해주세요.');
      return;
    }

    try {
      if (mode === 'login') {
        if (!trimmedPassword) {
          setError('비밀번호를 입력해주세요.');
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (error) {
          setError(error.message);
          return;
        }
        onAuthSuccess();
      }

      if (mode === 'signup') {
        if (!trimmedPassword || !trimmedUsername) {
          setError('모든 필드를 입력해주세요.');
          return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: { data: { username: trimmedUsername } },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        // 프로필 username 업데이트
        const userId = signUpData.user?.id;
        if (userId) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ username: trimmedUsername })
            .eq('id', userId);
          if (updateError) console.error('username 업데이트 실패:', updateError.message);
        }

        toast.success('회원가입 완료! 이메일 인증 후 로그인 해주세요.');
        setMode('login');
      }

      if (mode === 'resetPassword') {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: window.location.origin + '/reset-password',
        });
        if (error) {
          setError(error.message);
          return;
        }
        setMessage('비밀번호 재설정 이메일을 발송했습니다. 메일함을 확인해주세요.');
      }
    } catch (err) {
      console.error(err);
      setError('예상치 못한 오류가 발생했습니다.');
    }
  };

  // ─────────────────────────────────────────────────────────── JSX
  return (
    <div
      className="auth-card"
      style={{
        maxWidth: 360,
        width: '100%',
        margin: 'auto',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        boxSizing: 'border-box',
      }}
    >
      {/* ───────── 헤더 */}
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>
        {mode === 'login' && '로그인'}
        {mode === 'signup' && '회원가입'}
        {mode === 'resetPassword' && '비밀번호 찾기'}
      </h2>

      {/* ───────── 폼 */}
      <form onSubmit={handleSubmit}>
        {/* 이메일 */}
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

        {/* 비밀번호 (로그인, 회원가입) */}
        {(mode === 'login' || mode === 'signup') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 15,
              border: '1px solid #ccc',
              borderRadius: 5,
              paddingRight: 6,
              boxSizing: 'border-box',
            }}
          >
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{
                flex: 1,
                padding: 10,
                border: 'none',
                outline: 'none',
                fontSize: 16,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </button>
          </div>
        )}

        {/* 사용자 이름 (회원가입) */}
        {mode === 'signup' && (
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

        {/* 에러 / 메시지 */}
        {error && <p style={{ color: 'red', marginBottom: 10, wordBreak: 'break-word' }}>{error}</p>}
        {message && <p style={{ color: 'green', marginBottom: 10, wordBreak: 'break-word' }}>{message}</p>}

        {/* 제출 버튼 */}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          {mode === 'login' && '로그인'}
          {mode === 'signup' && '회원가입'}
          {mode === 'resetPassword' && '비밀번호 재설정 이메일 발송'}
        </button>
      </form>

      {/* ───────── 하단 링크 */}
      <div style={{ marginTop: 15, fontSize: 14, textAlign: 'center' }}>
        {mode === 'login' && (
          <>
            <span
              onClick={() => setMode('signup')}
              style={{ color: '#0070f3', cursor: 'pointer', marginRight: 10 }}
            >
              회원가입
            </span>
            <span
              onClick={() => setMode('resetPassword')}
              style={{ color: '#0070f3', cursor: 'pointer' }}
            >
              비밀번호 찾기
            </span>
          </>
        )}

        {mode === 'signup' && (
          <span onClick={() => setMode('login')} style={{ color: '#0070f3', cursor: 'pointer' }}>
            로그인
          </span>
        )}

        {mode === 'resetPassword' && (
          <span onClick={() => setMode('login')} style={{ color: '#0070f3', cursor: 'pointer' }}>
            로그인으로 돌아가기
          </span>
        )}
      </div>
    </div>
  );
}

export default AuthCard;
