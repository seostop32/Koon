import React from 'react';

function AvatarList({ avatars, unreadCounts }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {avatars.map(({ url, userId }) => {
        const count = unreadCounts[userId] || 0;
        return (
          <div key={userId} style={{ position: 'relative', width: 40, height: 40 }}>
            {url ? (
              <img
                src={url}
                alt="아바타"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: '#ccc',
                }}
              />
            )}
            {count > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: 'red',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  padding: '2px 5px',
                  minWidth: 16,
                  textAlign: 'center',
                  lineHeight: 1,
                  boxShadow: '0 0 2px rgba(0,0,0,0.5)',
                  userSelect: 'none',
                }}
              >
                {count > 9 ? '9+' : count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AvatarList;