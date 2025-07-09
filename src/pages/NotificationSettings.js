import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import NotificationSettingsHeader from './NotificationSettingsHeader';

const notificationTypes = [
  { key: 'message', label: '메시지 알림' },
  { key: 'like', label: '좋아요 알림' },
  { key: 'comment', label: '댓글 알림' },
  { key: 'event', label: '이벤트 알림' },
];

function NotificationSettings({ targetUserId }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // ✅ user 상태 추가

    useEffect(() => {
      const initNotificationSettings = async () => {
        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id;

        const { data, error } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!data) {
          // 데이터 없으면 디폴트로 insert
          await supabase.from('notification_settings').insert([
            {
              user_id: userId,
              message_enabled: true,
              like_enabled: true,
            },
          ]);
        }
      };

      initNotificationSettings();
    }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert('로그인 후 이용해주세요.');
        return;
      }

      setUser(user); // ✅ 전역에서 쓸 수 있도록 저장

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error(error);
        return;
      }

      const initialSettings = {};
      notificationTypes.forEach(({ key }) => {
        initialSettings[key] = true;
      });

      data.forEach(({ notification_type, enabled }) => {
        initialSettings[notification_type] = enabled;
      });

      setSettings(initialSettings);
      setLoading(false);
    };

    fetchSettings();
  }, []);
  
  // targetUserId = '71b546bb-87bb-4f6a-8783-3fe38e567550';
console.log('targetUserId:', targetUserId);

 const handleToggle = async (type, targetUserId) => {
    const newValue = !settings[type];

    const { data, error } = await supabase
      .from('notification_settings')
      .upsert(
        {
          user_id: user.id,
          target_user_id: targetUserId,
          notification_type: type,
          enabled: newValue,
        },
        {
          onConflict: ['user_id', 'notification_type', 'target_user_id'],
          returning: 'representation',
        }
      );

    if (error) {
      console.error('설정 저장 실패:', error);
      return;
    }

    setSettings((prev) => ({
      ...prev,
      [type]: newValue,
    }));
  };

  if (loading) return <div style={{ padding: 20 }}>불러오는 중...</div>;

  return (
    <div style={styles.container}>
      <div style={{ marginTop: 0, paddingTop: 0 }}>
        <NotificationSettingsHeader />
      </div>

      <ul style={styles.list}>
        {notificationTypes.map(({ key, label }) => (
          <li key={key} style={styles.item}>
            <span>{label}</span>
            <label style={styles.switch}>
              <div
                style={{
                  ...styles.slider,
                  ...(settings[key] ? styles.sliderChecked : {}),
                }}
              >
                <div
                  style={{
                    ...styles.sliderCircle,
                    ...(settings[key] ? styles.sliderCircleChecked : {}),
                  }}
                />
              </div>
              <input
                type="checkbox"
                checked={!!settings[key]}
                onChange={() => handleToggle(key, targetUserId)}
                style={{ display: 'none' }}
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 480,
    margin: '0px auto',
    padding: '0 16px',
  },
  title: {
    fontSize: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  item: {
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 16,
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: 48,
    height: 24,
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    borderRadius: 24,
    transition: '.4s',
  },
  sliderChecked: {
    backgroundColor: '#ff9800',
  },
  sliderCircle: {
    position: 'absolute',
    content: '""',
    height: 18,
    width: 18,
    left: 3,
    bottom: 3,
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: '.4s',
  },
  sliderCircleChecked: {
    transform: 'translateX(24px)',
  },
};

export default NotificationSettings;