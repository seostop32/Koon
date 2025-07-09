// components/BlockModal.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function BlockModal({ blockerId, blockedId, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    setLoading(true);

    // 이미 차단했는지 중복 확인(옵션)
    const { data: existing, error: checkError } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // Not found 오류 무시
      alert('차단 상태 확인 중 오류가 발생했습니다.');
      setLoading(false);
      return;
    }

    if (existing) {
      alert('이미 차단한 사용자입니다.');
      setLoading(false);
      return;
    }

    // 차단 저장
    const { error } = await supabase.from('blocks').insert([
      {
        blocker_id: blockerId,
        blocked_id: blockedId,
        created_at: new Date().toISOString(), // UTC 저장
      },
    ]);

    setLoading(false);

    if (error) {
      alert('차단 중 오류가 발생했습니다.');
      console.error(error);
    } else {
      alert('차단되었습니다.');
      onClose();
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>사용자를 차단하시겠습니까?</h3>
        <button onClick={handleBlock} disabled={loading} style={styles.blockBtn}>
          {loading ? '처리중...' : '차단하기'}
        </button>
        <button onClick={onClose} style={styles.cancelBtn}>취소</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    width: 300,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxSizing: 'border-box', // ✅ padding 포함 계산    
    // background: '#fff',
    // padding: 20,
    // borderRadius: 12,
    // width: 300,
    // display: 'flex',
    // flexDirection: 'column',
    // gap: 10,
  },
  blockBtn: {
    width: '100%',
    background: '#ff5a5f',
    color: '#fff',
    padding: 8,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  cancelBtn: {
    width: '100%',
    background: '#ccc',
    color: '#000',
    padding: 8,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
};

export default BlockModal;