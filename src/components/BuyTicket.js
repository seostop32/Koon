import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ticketOptions = [
  { id: 1, tickets: 100, price: 100000 },
  { id: 2, tickets: 50, price: 50000 },
  { id: 3, tickets: 30, price: 30000 },
  { id: 4, tickets: 20, price: 20000 },
  { id: 5, tickets: 10, price: 10000 },
  { id: 6, tickets: 5, price: 5000 },
  { id: 7, tickets: 3, price: 3000 },
  { id: 8, tickets: 1, price: 1000 },
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
  sectionTitle: {
    marginTop: '0.0rem',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  guideBox: {
    backgroundColor: '#e0f7fa',
    color: '#333',
    padding: '10px 15px',
    borderRadius: '8px',
    marginBottom: '6px',
    fontWeight: 'bold',
    display: 'inline-block',
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
  ticketIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  ticketAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  priceInfo: {
    marginLeft: 'auto',
    fontSize: 14,
    color: '#666',
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

function BuyTicket() {
  const location = useLocation();
  const navigate = useNavigate();
  const next = location.state?.next || '/';

  const [selectedOption, setSelectedOption] = useState(ticketOptions[0].id);
  const [profile, setProfile] = useState(null);

  const handleBack = () => navigate(-1);
  const handleClose = () => navigate(-1);
  const handlePurchaseComplete = () => navigate(next);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('ticket_balance')
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
      <header style={styles.header}>
        <button onClick={handleBack} style={styles.backButton} aria-label="뒤로가기">
          &lt;
        </button>
        <h1 style={styles.title}>티켓 구매</h1>
        <button onClick={handleClose} style={styles.closeButton} aria-label="닫기">
          ✕
        </button>
      </header>

      <main style={styles.main}>
        <div style={styles.guideBox}>
          현재 보유 티켓 :{' '}
          <span style={{ color: '#f97316' }}>
            {profile?.ticket_balance?.toLocaleString() ?? 0}
          </span>{' '}
          장
        </div>

        <div style={styles.sectionTitle}>
          구매 수량 선택 <small>(10% VAT 포함)</small>
        </div>

        {ticketOptions.map(({ id, tickets, price }) => {
          const priceWithVAT = Math.round(price * 1.1);
          return (
            <label key={id} style={styles.optionLabel}>
              <input
                type="radio"
                name="ticketPurchase"
                value={id}
                checked={selectedOption === id}
                onChange={() => setSelectedOption(id)}
                style={styles.radio}
              />
              <span style={styles.ticketIcon}>🎫</span>
              <span style={styles.ticketAmount}>{tickets.toLocaleString()}장</span>
              <span style={styles.priceInfo}>
                {price.toLocaleString()}원 + 10% ={' '}
                <span style={{ color: '#222', fontWeight: 'bold' }}>
                  ₩{priceWithVAT.toLocaleString()}원
                </span>
              </span>
            </label>
          );
        })}

        <div style={styles.sectionTitle}>결제 방식 선택</div>
        <button
          style={{ ...styles.payButton, ...styles.bankButton }}
          onClick={handlePurchaseComplete}
        >
          계좌이체
        </button>
        <button style={{ ...styles.payButton, ...styles.kakaoButton }}>
          카카오페이
        </button>
        <button style={{ ...styles.payButton, ...styles.naverButton }}>
          네이버페이
        </button>
      </main>
    </div>
  );
}

export default BuyTicket;