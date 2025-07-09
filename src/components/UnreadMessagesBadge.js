import React, { useEffect, useState } from 'react';
import { fetchUnreadCount } from '../utils/messageUtils';  // 유틸에서 가져오기
import { supabase } from '../supabaseClient';

const UnreadMessagesBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        setUserId(null);
        setUnreadCount(0);
        return;
      }
      setUserId(user.id);
      const count = await fetchUnreadCount(user.id);
      setUnreadCount(count);
    };

    init();
    
    // ... (여기에 auth state 변경, realtime 구독 코드 유지)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user;
      setUserId(newUser?.id ?? null);
      if (!newUser) setUnreadCount(0);
      else fetchUnreadCount(newUser.id);
    });

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('likes-watch')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
          filter: `liked_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCount(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (unreadCount === 0) return null;
  /*
  return (
    <div style={{ position: 'relative', width: 40, height: 40 }}>
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: -30,
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: 'red',
          color: 'white',
          fontSize: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {unreadCount}
      </div>
    </div>
  ); 
  */
};

export default UnreadMessagesBadge;