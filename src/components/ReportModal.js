// components/ReportModal.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';  // 이 부분 추가

function ReportModal({ reporterId, reportedId, onClose }) {
    const navigate = useNavigate();
    const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) return alert('신고 사유를 입력해주세요.');
    // reporter 닉네임 조회
    const { data: reporterData, error: reporterError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', reporterId)
        .single();

    // reported 닉네임 조회
    const { data: reportedData, error: reportedError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', reportedId)
        .single();

    if (reporterError || reportedError) {
        alert('사용자 정보를 불러오는 중 오류가 발생했습니다.');
        console.error(reporterError || reportedError);
        return;
    }

    const reporterName = reporterData?.username || '알 수 없음';
    const reportedName = reportedData?.username || '알 수 없음';

    // 신고 데이터 저장
    const { error } = await supabase.from('reports').insert([
      {
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
        created_at: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }), // 한국시간
      },
    ]);

    if (error) {
      alert('신고 중 오류가 발생했어요.');
      console.error(error);
    } else {

    // 관리자를 위한 메시지 저장
    const ADMIN_ID = process.env.REACT_APP_ADMIN_ID; // 관리자 Supabase ID
    const adminMessage = `[신고 접수] ${reporterName} → ${reportedName}\n사유: ${reason}`;

    const { error: adminError } = await supabase.from('messages').insert([
        {
        support_type: 'report',
        content: adminMessage,
        sender_id: reporterId,
        recipient_id: ADMIN_ID,
        is_read: false,
        created_at: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }),
        },
    ]);

    if (adminError) {
        console.error('관리자 메시지 저장 실패:', adminError);
    }

      alert('신고가 접수되었습니다. 감사합니다.');
      onClose(); // ✅ ProfileHeader에서 이 함수가 메뉴까지 닫음

           // 2초 후에 대시보드로 이동
      setTimeout(() => {
        navigate('/dashboard'); // 대시보드 경로로 변경 가능
      }, 2000);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>신고하기</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="신고 사유를 입력해주세요."
          rows={4}
          style={styles.textarea}
        />
        <button onClick={handleSubmit} style={styles.submitBtn}>신고</button>
        <button onClick={onClose} style={styles.cancelBtn}>취소</button>
      </div>
    </div>
  );
}

// const modalWidth = 300;
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
  },
  textarea: {
    width: '100%', // ✅ 부모 기준 100%
    padding: 10,
    resize: 'none',
    boxSizing: 'border-box', // ✅ 패딩 포함 너비로 정확히 계산
  },
  submitBtn: {
    width: '100%',
    background: '#ff5a5f',
    color: '#fff',
    padding: 8,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  cancelBtn: {
    width: '100%',
    background: '#ccc',
    color: '#000',
    padding: 8,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
};

export default ReportModal;