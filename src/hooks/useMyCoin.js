// src/hooks/useMyCoin.js
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // 경로는 프로젝트에 맞게 조정

export default function useMyCoin() {
  const [myCoin, setMyCoin] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchCoin = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMyCoin(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('코인 가져오기 실패:', error.message);
        setMyCoin(0);
      } else {
        setMyCoin(data.coin_balance);
      }

      setLoading(false);
    };

    fetchCoin();
  }, []);

  return { myCoin, loading };
}