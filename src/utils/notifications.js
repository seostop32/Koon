// src/utils/notificationUtils.js
import { supabase } from '../supabaseClient';

export async function fetchUnreadNotificationCount(userId) {
  try {
    const { data, error } = await supabase.rpc('get_unread_notification_count', {
      user_uuid: userId,
    });

    if (error) throw error;

    return typeof data === 'number' ? data : 0;
  } catch (err) {
    console.error('알림 개수 가져오기 오류:', err);
    return 0;
  }
}

export function showNotification(title, options) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
}