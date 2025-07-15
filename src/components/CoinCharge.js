import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';  // 경로 맞게 조정
import CoinChargeHeader from './CoinChargeHeader';


const coinOptions = [
  { id: 1, coins: 1300, price: 100000 },
  { id: 2, coins: 600, price: 50000 },
  { id: 3, coins: 350, price: 30000 },
  { id: 4, coins: 220, price: 20000 },
  { id: 5, coins: 100, price: 10000 },          
];

const styles = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  header: {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    padding: '0 0.75rem',
    borderBottom: '1px solid #ddd',
    position: 'relative',
  },
  backButton: {
    fontSize: '1.25rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginRight: 8,
  },
  title: {
    flex: 1,
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '1rem',
    margin: 0,
  },
  closeButton: {
    fontSize: '1.25rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    position: 'absolute',
    right: '0.75rem',
  },
  main: {
    padding: '1rem',
    flex: 1,
    overflowY: 'auto',
  },
  guideText: {
    fontSize: '0.85rem',
    color: '#555',
    marginBottom: '0.75rem',
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #ddd',
    marginBottom: 12,
  },
  radio: {
    marginRight: 8,
    cursor: 'pointer',
  },
  coinIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  coinAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  priceInfo: {
    marginLeft: 'auto',   // 이게 중요!
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    marginTop: '0.0rem',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  payButton: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    marginBottom: 10,
  },
  bankButton: {
    backgroundColor: '#eee',
    color: '#333',
  },
  kakaoButton: {
    backgroundColor: '#fee500',
    color: '#000',
  },
  naverButton: {
    backgroundColor: '#03c75a',
    color: '#fff',
  },
};

function CoinCharge() {
  const location = useLocation();
  const navigate = useNavigate();

  const next = location.state?.next || '/'; // 충전 후 이동할 곳

  const [selectedOption, setSelectedOption] = useState(coinOptions[0].id);
  const [loadingTestCharge, setLoadingTestCharge] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => navigate(-1);
  const handleBack = () => navigate(-1);

  const handleChargeComplete = () => {
    // 실제 결제 로직 후...
    navigate(next);
  };

  //코인결제
const handleCharge = async (method) => {
  const selected = coinOptions.find((opt) => opt.id === selectedOption);
  if (!selected) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('로그인이 필요합니다.');
    return;
  }

  try {
    setLoading(true);
    
    // supabase.auth.getUser()가 프로미스니까 async/await 써야 해
    const { data: { user } } = await supabase.auth.getUser();
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token; // 토큰 얻기 (버전에 따라 달라질 수 있음)

    const res = await fetch('https://xppsavlzabbdgjrnvwyq.functions.supabase.co/createPayment', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,  // 여기에 토큰 추가
      },
      body: JSON.stringify({
        method,
        amount: selected.price,
        coins: selected.coins,
        userId: user.id,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '결제 요청 실패');
      return;
    }

    if (method === '카카오페이') {
      window.location.href = data.paymentUrl;
    } else {
      alert('결제 요청이 성공적으로 처리되었습니다.');
    }
  } catch (error) {
    console.error('결제 요청 중 오류:', error);
    alert('결제 요청 중 오류가 발생했습니다.');
  } finally {
    setLoading(false);
  }
};  
  // const handleCharge = async (method) => {
  //   const selected = coinOptions.find((opt) => opt.id === selectedOption);
  //   if (!selected) return;

  //   const { data: { user } } = await supabase.auth.getUser();
  //   if (!user) {
  //     alert('로그인이 필요합니다.');
  //     return;
  //   }

  //   const coinsToAdd = selected.coins;
  //   const ticketsToAdd = Math.floor(coinsToAdd / 1000); // 예: 10,000코인 → 10티켓

  //   const { data: profileData, error: profileError } = await supabase
  //     .from('profiles')
  //     .select('coin_balance, view_tickets')
  //     .eq('id', user.id)
  //     .single();

  //   if (profileError || !profileData) {
  //     console.error(profileError);
  //     alert('사용자 정보 조회 실패');
  //     return;
  //   }

  //   const updatedBalance = (profileData.coin_balance || 0) + coinsToAdd;
  //   const updatedTickets = (profileData.view_tickets || 0) + ticketsToAdd;

  //   const { error: updateError } = await supabase
  //     .from('profiles')
  //     .update({
  //       coin_balance: updatedBalance,
  //       view_tickets: updatedTickets,
  //     })
  //     .eq('id', user.id);

  //   if (updateError) {
  //     console.error(updateError);
  //     alert('충전에 실패했습니다.');
  //   } else {
  //     alert(`결제방식: ${method}\n${coinsToAdd.toLocaleString()} 코인 충전 완료!`);
  //     navigate(next);
  //   }
  // };  

  // 테스트용 코인 1000개 충전 함수 추가
  const handleTestCharge = async () => {
  setLoadingTestCharge(true);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert('로그인이 필요합니다.');
    setLoadingTestCharge(false);
    return;
  }

  const chargeAmount = 1000;

  try {
    // 현재 프로필 상태가 없으면 DB에서 다시 조회
    let currentBalance = 0;
    if (profile && typeof profile.coin_balance === 'number') {
      currentBalance = profile.coin_balance;
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      currentBalance = data?.coin_balance || 0;
    }

    // coin_histories 테이블에 충전 내역 추가
    const { error: insertError } = await supabase.from('coin_histories').insert([{
      user_id: user.id,
      type: 'purchase', // 충전 기록이므로 'charge' 타입
      description: '테스트용 코인 충전',
      amount: chargeAmount, // 충전은 양수로 넣음
    }]);

    if (insertError) throw insertError;

    // profiles 테이블 코인 잔액 업데이트
    const updatedBalance = currentBalance + chargeAmount;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ coin_balance: updatedBalance })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // UI 갱신
    setProfile((prev) => ({ ...prev, coin_balance: updatedBalance }));

    alert(`테스트용 코인 ${chargeAmount}개가 충전되었습니다! 현재 잔액: ${updatedBalance.toLocaleString()} 코인`);
  } catch (error) {
    alert(`충전 실패: ${error.message}`);
  }

  setLoadingTestCharge(false);
};


  const [profile, setProfile] = useState(null);
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error(error);
        setProfile(null);
        return;
      }
      setProfile(data);
    };

    fetchProfile();
  }, []);  

  return (
    <div style={styles.container}>
      <div style={{ marginTop: 0, paddingTop: 0 }}>
        <CoinChargeHeader />
      </div>          
      {/* <header style={styles.header}>
        <button onClick={handleBack} style={styles.backButton} aria-label="뒤로가기">
          &lt;
        </button>
        <h1 style={styles.title}>코인충전</h1>
        <button onClick={handleClose} style={styles.closeButton} aria-label="닫기">
          ✕
        </button>
      </header> */}

      <main style={styles.main}>
        <div
          style={{
            backgroundColor: '#fff8c4', // 연한 노란색
            color: '#333',              // 글자색 짙은 회색
            padding: '10px 15px',
            borderRadius: '8px',
            marginBottom: '6px',
            fontWeight: 'bold',
            display: 'inline-block',   // 크기 딱 맞게
          }}
        >
          현재보유코인 : <span style={{ color: '#f97316' }}>
                        {profile?.coin_balance?.toLocaleString() ?? 0}
                      </span> 코인 입니다.
        </div>
        <div style={styles.sectionTitle}>결제금액 선택  <small>(우측금액은 VAT 10% 포함 금액입니다.)</small></div>
          


        {coinOptions.map(({ id, coins, price }) => {
          const priceWithBonus = Math.round(price * 1.1);
          return (
          <label key={id} style={styles.optionLabel}>
            <input
              type="radio"
              name="coinCharge"
              value={id}
              checked={selectedOption === id}
              onChange={() => setSelectedOption(id)}
              style={styles.radio}
            />
            <span style={styles.coinIcon}>🪙</span>
            <span style={styles.coinAmount}>{coins.toLocaleString()}</span>
            <span style={styles.priceInfo}>
              {price.toLocaleString()}원 + 10% = <span style={{ color: '#222', fontWeight: 'bold' }}>₩{priceWithBonus.toLocaleString()}원</span>
            </span>
          </label>
          );
        })}

        <div style={styles.sectionTitle}>결제방식 선택</div>
          <button
            style={{ ...styles.payButton, ...styles.bankButton }}
            onClick={() => handleCharge('계좌이체')}
          >
            계좌이체
          </button>
          <button
            style={{ ...styles.payButton, ...styles.kakaoButton }}
            onClick={() => handleCharge('카카오페이')}
          >
            카카오페이
          </button>
          <button
            style={{ ...styles.payButton, ...styles.naverButton }}
            onClick={() => handleCharge('네이버페이')}
          >
            네이버페이
          </button>
          <button
            style={{ ...styles.payButton, backgroundColor: '#1e40af', color: '#fff' }}
            onClick={() => handleCharge('카드결제')}
          >
            카드결제
          </button>

          {/* 테스트용 코인 충전 버튼 추가 */}
          <button
            style={{
              ...styles.payButton,
              backgroundColor: '#f97316',
              color: '#fff',
              marginTop: 20,
            }}
            onClick={handleTestCharge}
            disabled={loadingTestCharge}
          >
            {loadingTestCharge ? '충전 중...' : '테스트용 코인 1000개 충전'}
          </button>          
      </main>
    </div>
  );
}

export default CoinCharge;