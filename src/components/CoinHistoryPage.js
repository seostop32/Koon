import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import CoinHistoryPageHeader from './CoinHistoryPageHeader';

const CoinHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  const reasonMap = {
    'Coin deducted for change_setting':'이상형 찾기',
    'send_message':'대화',
    'single_profile_view':'프로필 조회',
    'full_profile_view':'프로필 전체조회',
    'like': '관심 보내기',
    // message: '메시지',
    
    // blur_photo: '블러 사진',
    // charge: '충전',
    // use: '사용',
    // 필요하면 더 추가
  };


    useEffect(() => {
      const fetchHistory = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setHistory([]);
          return;
        }

        const { data, error } = await supabase
          .from('coin_histories')
          .select('*')
          .eq('user_id', user.id)  // user_id 필터 추가
          .order('created_at', { ascending: false });

        if (error) {
          console.error('코인 내역 불러오기 실패:', error.message);
        } else {
          setHistory(data);
        }
      };

      fetchHistory();
    }, []);



  return (
    <div style={{ padding: '0 16px 16px 16px' }}>
      <div style={{ marginTop: 0, paddingTop: 0 }}>
        <CoinHistoryPageHeader />
      </div>      
      {/* <h2 style={{ fontSize: 20, marginBottom: 16 }}>코인 구매/사용 내역</h2> */}
      {history.length === 0 ? (
        <p>내역이 없습니다.</p>
      ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
              {history.map((item) => {
                const isPositive = item.amount > 0;
                // const reasonText = item.description || item.type;
                const reasonText = reasonMap[item.description] || reasonMap[item.type] || item.description || item.type;
                const date = new Date(item.created_at);
                const formattedDate = `${date.getFullYear()}-${(date.getMonth()+1)
                  .toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

                return (
                  <li
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: '1px solid #eee',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 14, color: '#888' }}>{formattedDate}</div> {/* ⬅ 날짜는 살짝 작게*/}
                    <div style={{ fontWeight: 500, fontSize: 15 }}>{reasonText}</div>  {/* ⬅ 내역 텍스트 크게*/}
                    </div>
                    <div
                      style={{
                        color: isPositive ? '#ff3b30' : '#007aff',
                        fontWeight: 'bold',
                        marginLeft: 20,
                        minWidth: 50,
                        textAlign: 'right',
                      }}
                    >
                      {isPositive ? '+' : '-'}
                      {Math.abs(item.amount).toLocaleString()}
                    </div>
                  </li>
                );
              })}
            </ul>
      )}

      {/* <button
        onClick={() => navigate(-1)}
        style={{
          marginTop: 20,
          padding: '6px 12px',
          border: '1px solid #ccc',
          borderRadius: 4,
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        ← 뒤로가기
      </button> */}
    </div>
  );
};

export default CoinHistoryPage;