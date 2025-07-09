import { supabase } from '../supabaseClient';
// 전체 미확인 메시지 수 가져오기
export async function fetchTotalUnreadCount() {
  try {
    // Supabase RPC (프로시저) 호출
    const { data, error } = await supabase.rpc('get_total_unread_count');
    if (error) throw error;

    // 프로시저 결과가 숫자여야 함
    return data ?? 0;
  } catch (err) {
    console.error('fetchTotalUnreadCount 실패:', err);
    return 0;
  }
}
// 사용자별 미확인 메시지 수 가져오기
export const fetchUnreadCount = async (userId) => {
  console.log('fetchUnreadCount 호출됨, userId:', userId);

  try {
    // 1. 알림 설정 확인
    const { data: setting, error: settingError } = await supabase
      .from('notification_settings')
      .select('enabled')
      .eq('user_id', userId)
      .eq('notification_type', 'message')
      .maybeSingle();

    if (settingError) {
      console.error('알림 설정 조회 실패:', settingError);
      // 안전하게 0 반환
      return 0;
    }

    if (setting?.enabled === false) {
      // 알림 꺼져있으면 0 반환
      return 0;
    }

    // 2. 알림 켜져있으면 RPC 호출해서 미확인 메시지 수 가져오기
    const { data, error } = await supabase.rpc('get_my_unread_message_count', { user_id: userId });
    if (error) throw error;

    console.log('RPC get_my_unread_message_count data:', data);

    return typeof data === 'number' ? data : (data?.count || 0);

  } catch (err) {
    console.error('fetchUnreadCount 실패:', err);
    return 0;
  }
};

