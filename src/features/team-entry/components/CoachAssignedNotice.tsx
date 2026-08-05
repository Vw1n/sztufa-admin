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
            您已拥有绑定的球队
          </h2>
          <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
            系统检测到您已分配或注册了所辖球队。如需修改球员名单、球衣颜色、联系方式或日常名单维护，请直接前往左侧导航的{' '}
            <strong>【球队信息管理】</strong> 菜单。
          </p>
        </div>
      </main>
    </div>
  );
};

export default CoachAssignedNotice;
