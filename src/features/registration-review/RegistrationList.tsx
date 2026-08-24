import React from 'react';
import { RegistrationListItemDTO } from '../registration/registration.types';
import { RegistrationStatusBadge } from '../registration/RegistrationStatus';
import { Eye, Users } from 'lucide-react';

interface RegistrationListProps {
  items: RegistrationListItemDTO[];
  onViewDetail: (id: string) => void;
}

export const RegistrationList: React.FC<RegistrationListProps> = ({ items, onViewDetail }) => {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '8px' }}>
        <Users size={40} color="#ccc" style={{ marginBottom: '12px' }} />
        <p style={{ color: '#999' }}>暂无符合条件的报名记录</p>
      </div>
    );
  }

  return (
    <>
      {/* 桌面端：表格布局 */}
      <div className="player-table-wrapper registration-review-table" style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <table className="player-table">
          <thead>
            <tr>
              <th>球队名称</th>
              <th>所属赛季</th>
              <th>组别</th>
              <th>球员人数</th>
              <th>提交时间</th>
              <th>状态</th>
              <th style={{ textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>
                  {item.teamLogo && (
                    <img
                      src={item.teamLogo}
                      alt=""
                      style={{ width: 24, height: 24, borderRadius: '50%', marginRight: 8, verticalAlign: 'middle' }}
                    />
                  )}
                  {item.teamName}
                </td>
                <td>{item.seasonName}</td>
                <td>{item.gender === 'FEMALE' ? '女子组' : '男子组'}</td>
                <td>{item.playerCount} 人</td>
                <td>{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : '未提交'}</td>
                <td>
                  <RegistrationStatusBadge status={item.status} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 12px', fontSize: '13px' }}
                    onClick={() => onViewDetail(item.id)}
                  >
                    <Eye size={14} style={{ display: 'inline', marginRight: 4 }} />
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 移动端：卡片列表 —— 只显示状态和名称，点击查看详情及审核 */}
      <ul className="registration-review-mobile-list">
        {items.map((item) => (
          <li
            key={item.id}
            className="registration-review-mobile-card"
            onClick={() => onViewDetail(item.id)}
          >
            <div className="reg-mobile-team-info">
              {item.teamLogo && (
                <img
                  src={item.teamLogo}
                  alt=""
                  className="reg-mobile-team-logo"
                />
              )}
              <span className="reg-mobile-team-name">{item.teamName}</span>
            </div>
            <div className="reg-mobile-status-row">
              <RegistrationStatusBadge status={item.status} />
              <Eye size={16} className="reg-mobile-chevron" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};
