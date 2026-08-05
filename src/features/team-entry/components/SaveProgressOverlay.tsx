import React from 'react';

interface SaveProgressOverlayProps {
  saveProgress: { current: number; total: number; message: string };
}

export const SaveProgressOverlay: React.FC<SaveProgressOverlayProps> = ({ saveProgress }) => {
  return (
    <div
      className="progress-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="progress-card"
        style={{
          backgroundColor: '#ffffff',
          padding: '24px 32px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          width: '90%',
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#333' }}>
          正在同步球队与球员数据...
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
          {saveProgress.message} ({saveProgress.current}/{saveProgress.total})
        </p>
        <div
          className="progress-bar-container"
          style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '8px',
          }}
        >
          <div
            className="progress-bar-fill"
            style={{
              width: `${(saveProgress.current / saveProgress.total) * 100}%`,
              height: '100%',
              backgroundColor: '#3b5bdb',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ fontSize: '12px', color: '#868e96' }}>请勿关闭或刷新页面</span>
      </div>
    </div>
  );
};

export default SaveProgressOverlay;
