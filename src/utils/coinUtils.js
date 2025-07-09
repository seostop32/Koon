// utils/deductCoinRpc.js
import { supabase } from '../supabaseClient';

export const deductCoinRpc = async (userId, eventKey) => {
  console.log("📌 userId: ", userId);
  console.log("📌 eventKey: ", eventKey);

  const { error } = await supabase.rpc('deduct_coin_and_change_setting', {
    p_user_id: userId,      // UUID string
    p_event_key: eventKey,  // 텍스트
  });

  if (error) {
    if (error.message.includes('Insufficient coins') || error.message.includes('코인 부족')) {
      return false;
    } else {
      throw new Error(`코인 차감 오류: ${error.message}`);
    }
  }

  return true;
};