// src/components/NotificationSettings.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import NotificationSettingsHeader from './NotificationSettingsHeader';

// 화면에 표시할 알림 종류 & 라벨
const notificationTypes = [
  { key: 'message',  label: '메시지 알림' },
  { key: 'like',     label: '좋아요 알림' },
  { key: 'comment',  label: '댓글 알림' },
  { key: 'event',    label: '이벤트 알림' },
];

// DB 컬럼 ↔︎ key 매핑
const columnMap = {
  message:  'message_notification',
  like:     'like_notification',
  comment:  'comment_notification',
  event:    'event_notification',
};

function NotificationSettings() {
  const [settings, setSettings] = useState({
    message: true,
    like:    true,
    comment: true,
    event:   true,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser]       = useState(null);

  /* ------------------------------------------------------------------ */
  /* 1. 최초 한 번: 유저 정보 가져오고 알림 설정 행 없으면 기본행 생성 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchAndInit = async () => {
      // ① 현재 로그인 유저 가져오기
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        alert('로그인 후 이용해주세요.');
        return;
      }
      setUser(user);

      // ② notification_settings 행 조회
      const { data, error: selErr } = await supabase
        .from('notification_settings')
        .select('message_notification, like_notification, comment_notification, event_notification')
        .eq('user_id', user.id)
        .single();

      // ③ RLS 406 우회 처리 & 행이 없으면 기본행 INSERT
      if (selErr && selErr.code !== 'PGRST116') {
        console.error('설정 조회 실패:', selErr);
        return;
      }

      if (!data) {
        // 행이 없으면 기본값으로 insert
        const { error: insErr } = await supabase.from('notification_settings').insert({
          user_id:              user.id,
          message_notification:  true,
          like_notification:     true,
          comment_notification:  true,
          event_notification:    true,
        });
        if (insErr) console.error('기본 설정 생성 실패:', insErr);
      } else {
        // 행이 있으면 state에 반영
        setSettings({
          message:  data.message_notification,
          like:     data.like_notification,
          comment:  data.comment_notification,
          event:    data.event_notification,
        });
      }

      setLoading(false);
    };

    fetchAndInit();
  }, []);
  /* ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ */
  /* 2. 스위치 토글 핸들러 */
  /* ------------------------------------------------------------------ */
  const handleToggle = async (type) => {
    console.log('clicked', type);   // ← 클릭 시 콘솔에 찍히는지?
    const column   = columnMap[type];
    const newValue = !settings[type];

    // upsert: PK(user_id) 충돌 시 UPDATE
    const { error } = await supabase
      .from('notification_settings')
      .upsert(
        { user_id: user.id, [column]: newValue },
        { onConflict: 'user_id', returning: 'minimal' }
      );

    if (error) {
      console.error('알림 설정 저장 실패:', error);
      return;
    }

    // 로컬 상태 반영
    setSettings((prev) => ({ ...prev, [type]: newValue }));
  };
  /* ------------------------------------------------------------------ */

  if (loading) return <div style={{ padding: 20 }}>불러오는 중...</div>;

  return (
    <div style={styles.container}>
      <NotificationSettingsHeader />

      <ul style={styles.list}>
        {notificationTypes.map(({ key, label }) => (
          <li key={key} style={styles.item}>
            <span>{label}</span>

            {/* 토글 스위치 */}
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

              {/* 실제 체크박스는 숨김 */}
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={() => handleToggle(key)}
                style={{ display: 'none' }}
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 스타일 정의                                                         */
/* ------------------------------------------------------------------ */
const styles = {
  container:  { maxWidth: 480, margin: '0 auto', padding: '0 16px' },
  list:       { listStyle: 'none', padding: 0 },
  item:       { marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16 },
  switch:     { position: 'relative', display: 'inline-block', width: 48, height: 24 },
  slider:     { position: 'absolute', cursor: 'pointer', top:0, left:0, right:0, bottom:0, background:'#ccc', borderRadius:24, transition:'.3s' },
  sliderChecked:      { background:'#ff9800' },
  sliderCircle:       { position:'absolute', height:18, width:18, left:3, bottom:3, background:'#fff', borderRadius:'50%', transition:'.3s' },
  sliderCircleChecked:{ transform:'translateX(24px)' },
};

export default NotificationSettings;