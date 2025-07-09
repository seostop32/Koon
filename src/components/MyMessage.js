// src/components/MyMessage.js
import React from 'react';

const MyMessage = ({ content }) => {
  return (
    <div style={styles.wrapper}>
      <div style={styles.message}>{content}</div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '4px 8px',
  },
  message: {
    backgroundColor: '#dcf8c6',
    color: '#000',
    padding: '10px 14px',
    borderRadius: '16px',
    maxWidth: '70%',
    wordBreak: 'break-word',
  },
};

export default MyMessage;