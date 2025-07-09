import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function TestUserList() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email');

      if (!error) {
        const filtered = data.filter(u => u.id !== user.id); // 내 계정 제외
        setUsers(filtered);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>상대방 선택</h2>
      {users.map(user => (
        <div key={user.id} style={{ margin: '10px 0' }}>
          <span>{user.username || user.email}</span>
          <button
            style={{ marginLeft: 10 }}
            onClick={() => navigate(`/chat/${user.id}`)}
          >
            💬 대화하기
          </button>
        </div>
      ))}
    </div>
  );
}

export default TestUserList;