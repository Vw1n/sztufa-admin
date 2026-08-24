import React from 'react';
import { AlertCircle, Trophy } from 'lucide-react';

export const CoachAssignedNotice: React.FC = () => {
  return (
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Trophy className="trophy-icon" />
            校园足球比赛球队信息录入系统
          </h1>
          <p>录入球队信息和参赛队员资料</p>
        </div>
      </header>
      <main className="page-content">
        <div
          className="error-message"
          style={{
            margin: '40px auto',
            maxWidth: '600px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            alignItems: 'center',
            textAlign: 'center',
            padding: '30px',
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          }}
        >
          <AlertCircle size={48} color="#e67e22" style={{ stroke: '#e67e22' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#333', marginTop: '10px' }}>
            球队需由超级管理员创建
          </h2>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
            教练账号不能自行创建球队。请先联系超级管理员创建球队并绑定到您的账号；绑定完成后，请前往{' '}
            <strong>【赛季报名】</strong> 填写或修改本队报名资料。
          </p>
        </div>
      </main>
    </div>
  );
};

export default CoachAssignedNotice;
