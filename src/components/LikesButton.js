import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';


function LikesButton({ targetUserId, currentUserId }) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  // 내가 이 사용자한테 좋아요 눌렀는지 확인
  useEffect(() => {
    if (!currentUserId || !targetUserId) return;

    const checkLike = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('liker_id', currentUserId)
        .eq('liked_id', targetUserId)
        .single();
console.log('좋아요 결과: AAAAA');
      if (!error && data) {
        setLiked(true);
      } else {
        setLiked(false);
      }
      setLoading(false);
    };

    checkLike();
  }, [currentUserId, targetUserId]);

  
  // 좋아요 토글 함수
  const toggleLike = async () => {
    if (!currentUserId || !targetUserId) return;

    if (!liked) {
      const confirm = window.confirm('관심 등록 시 코인이 차감됩니다. 계속하시겠습니까?');
      if (!confirm) return;
    }

    setLoading(true);

    if (liked) {
      // 좋아요 삭제
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('liker_id', currentUserId)
        .eq('liked_id', targetUserId);

     
      if (!error) setLiked(false);
      else console.error('좋아요 삭제 오류:', error);
    } else {
      try {
        // 좋아요 존재 여부 재확인
        const { data: existing, error: fetchError } = await supabase
          .from('likes')
          .select('*')
          .eq('liker_id', currentUserId)
          .eq('liked_id', targetUserId)
          .single();

console.log('좋아요 결과: BBBBBB');                     
        if (!fetchError && existing) {
          // 이미 좋아요가 존재함
          setLiked(true);
          setLoading(false);
          return;
        }

        // 코인 차감 RPC 호출
        const { error: rpcError } = await supabase.rpc('deduct_coin_for_like', {
          p_user_id: currentUserId,
          p_target_id: targetUserId,
        });
        if (rpcError) throw rpcError;

        // 좋아요 생성
        const { error: insertError } = await supabase
          .from('likes')
          .insert([{ liker_id: currentUserId, liked_id: targetUserId }]);

        if (insertError) {
          // 중복키 오류면 무시하고 liked true로 맞춤
          if (insertError.code === '23505') {
            setLiked(true);
          } else {
            throw insertError;
          }
        } else {
          setLiked(true);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', currentUserId)
          .single();

        const likerNickname = profile?.nickname || '누군가';

        // 알림 생성
        const { error: notifyError } = await supabase
          .from('notifications')
          .insert([{
            user_id: targetUserId,
            sender_id: currentUserId,
            type: 'like',
            // content: '누군가가 당신을 좋아합니다.',
            content: `${likerNickname}님이 당신을 좋아합니다.`, // ✅ 보낸 사람 닉네임 포함
            related_id: null,
          }]);
          console.log('알림 생성 결과:', notifyError);
        if (notifyError) throw notifyError;

        alert('좋아요 완료! 코인이 차감되고 알림이 전송되었습니다.');
      } catch (error) {
        alert(`오류 발생: ${error.message}`);
      }
    }

    setLoading(false);
  };

  return (
    <button
    onClick={(e) => {
        e.stopPropagation();  // 카드 클릭 막기
        toggleLike();         // 좋아요 토글
    }}
    disabled={loading}
    style={{
        marginBottom: 6,
        padding: '4px 8px',
        backgroundColor: liked ? '#ff5a5f' : '#eee',
        color: liked ? '#fff' : '#333',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9rem',
    }}
    >
    {liked ? '❤️ 좋아요' : '🤍 좋아요'}
    </button>
  );
}

export default LikesButton;