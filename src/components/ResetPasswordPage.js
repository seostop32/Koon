import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setErr('유효하지 않은 링크이거나 세션이 만료되었습니다.');
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (pw1.length < 6)          return setErr('6자 이상 입력해 주세요.');
    if (pw1 !== pw2)             return setErr('비밀번호가 일치하지 않습니다.');

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setLoading(false);

    if (error) setErr(error.message);
    else {
      setMsg('비밀번호가 성공적으로 변경되었습니다.');
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/auth');
      }, 2000);
    }
  };

  if (err && !pw1) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.errorText}>{err}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>새 비밀번호 설정</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            placeholder="새 비밀번호"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            style={styles.input}
          />
          {err && <p style={styles.errorText}>{err}</p>}
          {msg && <p style={styles.successText}>{msg}</p>}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxSizing: 'border-box',
  },
  title: {
    textAlign: 'center',
    marginBottom: '24px',
    fontSize: '22px',
    fontWeight: 600,
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '12px',
    marginBottom: '16px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '16px',
    outline: 'none',
  },
  button: {
    padding: '12px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: '12px',
    fontSize: '14px',
  },
  successText: {
    color: '#2e7d32',
    marginBottom: '12px',
    fontSize: '14px',
  },
};