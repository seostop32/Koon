import React from 'react';
import { useNavigate } from 'react-router-dom';

const styles = {
  footer: {
    display: 'flex',
    justifyContent: 'space-around', // 가로 중앙 정렬
    padding: '15px 0',
    borderTop: '1px solid #ddd',
    backgroundColor: '#fafafa',
    width: '100%',          // 화면 가득 채우기
  },
  footerIcon: {
    fontSize: '24px',
    cursor: 'pointer',
  },
};

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer style={styles.footer}>
      <div style={styles.footerIcon} onClick={() => navigate('/')}>🏠</div>
      <div style={styles.footerIcon} onClick={() => navigate('/search')}>🔍</div>
      <div style={styles.footerIcon} onClick={() => navigate('/favorites')}>💘</div>
      <div style={styles.footerIcon} onClick={() => navigate('/chat')}>💬</div>
      <div style={styles.footerIcon} onClick={() => navigate('/mypage')}>👤</div>
    </footer>
  );
};

export default Footer;