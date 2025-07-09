import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function ProfileActionButtons({ profileId, myCoin, onUnlock }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  //블러사진해제
  const handleUnlockClick = async () => {
    if (loading) return;
    setLoading(true);

    if (myCoin < 10) {
      alert('코인이 부족합니다. 충전 페이지로 이동합니다.');
      navigate('/coin-charge');
      return;
    }

    // 코인 차감 처리
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ coin_balance: myCoin - 10 })
      .eq('id', userId);

    if (updateError) {
      alert('코인 차감에 실패했습니다.');
      setLoading(false);
      return;
    }

    onUnlock();  // 부모에게 열람 허용 상태 전달
    //alert('전체 열람이 활성화되었습니다.');
    setLoading(false);
  };

  async function checkUserCoin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', user.id)
      .single();

    if (error || !data) return 0;
    return data.coin_balance  || 0;
  }


  const handleContactClick = () => {
    // 코인 충분 → 채팅 페이지로 이동
    if (myCoin > 0) {
      navigate(`/chat/${profileId}`);
    // 코인 부족 → 코인 충전 페이지로 이동  
    } else {
      navigate('/coin-charge');
    }
  };

const handleLike = async () => {
    setLoading(true);

    // 현재 로그인한 사용자 가져오기
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert('로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    // 이미 관심 표시했는지 검사
      const { data: existingLikes, error: checkError } = await supabase
        .from('likes')
        .select('*')
        .eq('liker_id', user.id)
        .eq('liked_id', profileId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { 
        // 'PGRST116'은 없을 때 에러로, 이 경우 무시해도 됨
        alert('관심 상태 확인 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      if (existingLikes) {
        alert('이미 관심 표시한 프로필입니다.');
        setLoading(false);
        return;
      }

      // 중복 없으면 삽입
      const { error } = await supabase.from('likes').insert([
        {
          liker_id: user.id,
          liked_id: profileId,
        },
      ]);


    if (error) {
      alert('관심 등록 중 오류가 발생했습니다.');
      console.error(error);
      setLoading(false);
      return;
    }

    // 성공하면 관심 목록 페이지로 이동
    navigate('/favorites');

    setLoading(false);
  };  

  return (
      <div style={styles.fixedButtons}>
        <button
          style={{ ...styles.button, marginRight: 12, opacity: loading ? 0.6 : 1 }}
          onClick={handleUnlockClick}
          disabled={loading}
        >
          {loading ? '처리 중...' : '전체 열람'}
        </button>
        <button
          style={{ ...styles.button, marginRight: 12, opacity: loading ? 0.6 : 1 }}
          onClick={handleLike}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded"
        >
          {loading ? '처리중...' : '관심있어요'}
        </button>
        <button
          style={{ ...styles.button, marginRight: 0, opacity: loading ? 0.6 : 1 }}
          onClick={handleContactClick}
          disabled={loading}
        >
          {loading ? '확인 중...' : '연락하기'}
        </button>
      </div>
  );
}

const styles = {
  fixedButtons: {
    position: 'static',
    width: '100%',
    backgroundColor: 'transparent',
    padding: '10px 0',
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: 20,
    overflowX: 'auto',
    whiteSpace: 'nowrap',  // 한 줄로 유지
  },
  button: {
    minWidth: 120,
    flexShrink: 0,
    padding: '12px 24px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'opacity 0.3s',
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    boxShadow: '0 2px 6px rgba(249, 115, 22, 0.5)',
    // marginLeft 제거하고 대신 marginRight를 마지막 버튼 제외하고 줌
    marginRight: 12,
  },
  buttonHover: {
    backgroundColor: '#ea580c',   // 조금 더 진한 주황 (orange-600)
  },
};

export default ProfileActionButtons;