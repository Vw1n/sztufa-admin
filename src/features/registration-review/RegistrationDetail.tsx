import React from 'react';
import { TeamRegistrationDTO } from '../registration/registration.types';
import { RegistrationStatusBadge } from '../registration/RegistrationStatus';
import { CheckCircle, MessageSquare, User, X, XCircle } from 'lucide-react';

interface RegistrationDetailProps {
  detail: TeamRegistrationDTO;
  reviewComment: string;
  onCommentChange: (val: string) => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onClose: () => void;
  actionLoading: boolean;
}

export const RegistrationDetail: React.FC<RegistrationDetailProps> = ({
  detail,
  reviewComment,
  onCommentChange,
  onApprove,
  onRequestChanges,
  onClose,
  actionLoading,
}) => {
  const { teamData, players = [], status } = detail;
  const isPendingReview = status === 'SUBMITTED';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              {teamData?.teamName || '球队报名详情'}
              <RegistrationStatusBadge status={status} />
            </h2>
            <div style={{ fontSize: '13px', color: '#666', marginTop: 4 }}>
              赛季：{detail.season?.name || detail.seasonId} | 提交时间：
              {detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : '未提交'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
          >
            <X size={24} color="#666" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', flex: 1 }}>
          {/* 球队基本信息 */}
          <h3 style={{ borderLeft: '4px solid #1890ff', paddingLeft: '8px', margin: '0 0 16px 0' }}>
            球队资料
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              background: '#fafafa',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <div>
              <strong>主教练：</strong> {teamData?.headCoach || '未填写'} ({teamData?.coachPhone || '无电话'})
            </div>
            <div>
              <strong>领队：</strong> {teamData?.teamLeader || '未填写'} ({teamData?.leaderPhone || '无电话'})
            </div>
            <div>
              <strong>队医：</strong> {teamData?.teamDoctor || '未填写'}
            </div>
            <div>
              <strong>球衣颜色：</strong> 主场【{teamData?.homeJerseyColor || '未填'}】/ 客场【
              {teamData?.awayJerseyColor || '未填'}】
            </div>
          </div>

          {/* 球员名单列表 */}
          <h3 style={{ borderLeft: '4px solid #1890ff', paddingLeft: '8px', margin: '0 0 16px 0' }}>
            报名球员名单 ({players.length} 人)
          </h3>
          <div className="player-table-wrapper" style={{ marginBottom: '24px' }}>
            <table className="player-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>照片</th>
                  <th>姓名</th>
                  <th>学号</th>
                  <th>球衣号码</th>
                  <th>系统关联</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id || p.studentId}>
                    <td>
                      {p.photo ? (
                        <img
                          src={p.photo}
                          alt={p.name}
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <User size={24} color="#999" />
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.studentId}</td>
                    <td>{p.jerseyNumber} 号</td>
                    <td>
                      {p.playerId ? (
                        <span style={{ color: '#52c41a', fontSize: '12px' }}>已绑定已有球员</span>
                      ) : (
                        <span style={{ color: '#fa8c16', fontSize: '12px' }}>通过学号匹配/新建</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 审核意见填报区 */}
          <h3 style={{ borderLeft: '4px solid #1890ff', paddingLeft: '8px', margin: '0 0 12px 0' }}>
            <MessageSquare size={16} style={{ display: 'inline', marginRight: 4 }} />
            审核意见说明
          </h3>
          <textarea
            value={reviewComment}
            onChange={(e) => onCommentChange(e.target.value)}
            disabled={!isPendingReview || actionLoading}
            placeholder={
              isPendingReview
                ? '请输入审核意见（审核通过可选填；退回修改时必填说明具体修改项）'
                : '当前状态不可编辑审核意见'
            }
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d9d9d9',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            background: '#fcfcfc',
            borderRadius: '0 0 12px 12px',
          }}
        >
          <button className="btn-secondary" onClick={onClose} disabled={actionLoading}>
            关闭
          </button>
          {isPendingReview && (
            <>
              <button
                className="btn-danger"
                onClick={onRequestChanges}
                disabled={actionLoading}
              >
                <XCircle size={16} style={{ display: 'inline', marginRight: 4 }} />
                {actionLoading ? '处理中...' : '退回修改'}
              </button>
              <button
                className="btn-success"
                onClick={onApprove}
                disabled={actionLoading}
              >
                <CheckCircle size={16} style={{ display: 'inline', marginRight: 4 }} />
                {actionLoading ? '处理中...' : '审核通过 (物化数据)'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
