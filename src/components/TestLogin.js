// TestLogin.jsx
import React from 'react';
import { supabase } from '../supabaseClient';

const testUsers = [
  { email: 'test1@example.com', password: 'test1234' },
  { email: 'test2@example.com', password: 'test1234' },
];

function TestLogin() {
  const loginTestUser = async (index = 0) => {
    const { email, password } = testUsers[index];
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert('로그인 실패: ' + error.message);
    } else {
      alert(`${email} 으로 로그인 성공!`);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>테스트 계정 로그인</h2>
      {testUsers.map((user, idx) => (
        <button
          key={user.email}
          style={{
            margin: 5,
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: 16,
          }}
          onClick={() => loginTestUser(idx)}
        >
          {user.email} 로그인
        </button>
      ))}
    </div>
  );
}

export default TestLogin;