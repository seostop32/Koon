import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';
import { Visibility, VisibilityOff } from '@mui/icons-material';

/**
 * AuthCard
 * @param {'login' | 'signup' | 'resetPassword'} mode
 * @param {() => void} onAuthSuccess
 */
function AuthCard({ mode: initialMode = 'login', onAuthSuccess = () => {} }) {
  // ─────────────────────────────── state
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 모드 변경 시 초기화
  useEffect(() => {
    setMode(initialMode);
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
    setMessage('');
    setShowPassword(false);
  }, [initialMode]);

  // 제출 핸들러
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
      // 로그인
      if (mode === 'login') {
        if (!trimmedPassword) {
          setError('비밀번호를 입력해주세요.');
          return;
        }

        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
                
        // const { error } = await supabase.auth.signInWithPassword({
        //   email: trimmedEmail,
        //   password: trimmedPassword,
        // });
        if (error) {
          setError(error.message);
          return;
        }

        // 🔐 로그인 성공 후, is_deleted 여부 확인
        const userId = signInData?.user?.id;
        if (userId) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_deleted')
            .eq('id', userId)
            .single(); 

          if (profileError || profile?.is_deleted) {
            setError('이미 탈퇴한 계정입니다.');
            await supabase.auth.signOut(); // 세션 제거
            return;
          }
        }

        onAuthSuccess();
      }

      // 회원가입
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

      // 비밀번호 재설정
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
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>
        {mode === 'login' && '로그인'}
        {mode === 'signup' && '회원가입'}
        {mode === 'resetPassword' && '비밀번호 찾기'}
      </h2>

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

        {/* 비밀번호 */}
        {(mode === 'login' || mode === 'signup') && (
          <div style={{ position: 'relative', marginBottom: 15 }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{
                width: '100%',
                padding: '10px 40px 10px 10px', // 오른쪽 아이콘 공간
                borderRadius: 5,
                border: '1px solid #ccc',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
              {/* {showPassword ? <VisibilityOff /> : <Visibility />} */}
            </button>
          </div>
        )}

        {/* 사용자 이름 */}
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

        {error && <p style={{ color: 'red', marginBottom: 10 }}>{error}</p>}
        {message && <p style={{ color: 'green', marginBottom: 10 }}>{message}</p>}

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
