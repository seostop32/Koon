import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationsListHeader from './NotificationsListHeader';

function NotificationsList() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*, sender:sender_id(nickname)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('알림 불러오기 오류:', error);
      } else {
        // 메시지 타입 중 중복 제거
        const filtered = [];
        const seenSenders = new Set();

        for (const n of data) {
          if (n.type === 'message' && !n.is_read) {
            if (!seenSenders.has(n.sender_id)) {
              filtered.push(n);
              seenSenders.add(n.sender_id);
            }
          } else {
            filtered.push(n);
          }
        }

        setNotifications(filtered);
      }
    };

    fetchNotifications();
  }, []);

  // 메시지 알림은 sender_id로 전체 읽음 처리
  const markAsRead = async (n) => {
    if (n.type === 'message') {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', n.user_id)
        .eq('type', 'message')
        .eq('sender_id', n.sender_id)
        .eq('is_read', false);

      if (!error) {
        setNotifications((prev) =>
          prev.map((x) =>
            x.type === 'message' && x.sender_id === n.sender_id
              ? { ...x, is_read: true }
              : x
          )
        );
      }
    } else {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', n.id);

      if (!error) {
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      }
    }
  };

  const handleClick = (n) => {
    markAsRead(n);

    if (n.type === 'message' && n.sender_id) {
      navigate(`/chat/${n.sender_id}`);
    } else if ((n.type === 'like' || n.type === 'profile_view') && n.sender_id) {
      navigate(`/profile/${n.sender_id}`);
    }
  };

  const getTitleAndBody = (n) => {
    const senderName = n.sender?.nickname || '누군가';
    let title = '';
    let body = '';

    switch (n.type) {
      case 'like':
        title = '좋아요 알림';
        body = n.content || `${senderName}님이 당신을 좋아합니다.`;
        break;
      case 'view':
        title = '프로필 열람';
        body = n.content || `${senderName}님이 당신의 프로필을 열람했습니다.`;
        break;
      case 'message':
        title = '새 메시지';
        body = n.content || `${senderName}님이 메시지를 보냈습니다.`;
        break;
      default:
        title = '알림';
        body = n.content || '새로운 알림이 있습니다.';
    }

    return { title, body };
  };

  return (
    <div style={{ padding: '0 16px 16px 16px' }}>
      <div style={{ marginTop: 0, paddingTop: 0 }}>
        <NotificationsListHeader />
      </div>
      {notifications.map((n) => {
        const { title, body } = getTitleAndBody(n);
        return (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              backgroundColor: n.is_read ? '#f3f3f3' : '#fff6f6',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {n.is_read ? (
              <CheckCircle size={18} color="#999" style={{ marginRight: 8 }} />
            ) : (
              <Circle size={18} color="red" style={{ marginRight: 8 }} />
            )}
            <div>
              <div style={{ fontWeight: 'bold' }}>{title}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>{body}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NotificationsList;