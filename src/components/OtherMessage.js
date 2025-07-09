// src/components/OtherMessage.js
import React from 'react';

const OtherMessage = ({ content }) => {
  return (
    <div style={styles.wrapper}>
      <div style={styles.message}>{content}</div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'flex-start',
    padding: '4px 8px',
  },
  message: {
    backgroundColor: '#f1f0f0',
    color: '#000',
    padding: '10px 14px',
    borderRadius: '16px',
    maxWidth: '70%',
    wordBreak: 'break-word',
  },
};

export default OtherMessage;