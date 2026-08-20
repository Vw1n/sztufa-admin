import React from 'react';
import '../registration/registration.css';
import { useRegistrationReview } from './useRegistrationReview';
import { RegistrationList } from './RegistrationList';
import { RegistrationDetail } from './RegistrationDetail';
import LoadingSpinner from '../../components/LoadingSpinner';
import { RegistrationStatusType } from '../registration/registration.types';

const RegistrationReviewPage: React.FC = () => {
  const {
    loading,
    error,
    seasons,
    selectedSeasonId,
    setSelectedSeasonId,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    listData,
    detail,
    detailLoading,
    reviewComment,
    setReviewComment,
    actionLoading,
    openDetail,
    closeDetail,
    handleApprove,
    handleRequestChanges,
  } = useRegistrationReview();

  return (
    <div className="registration-container">
      {/* 头部与筛选栏 */}
      <div className="registration-header-bar">
        <h2 style={{ margin: 0, fontSize: '20px' }}>📋 赛季领队报名审核</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '14px', marginRight: '6px' }}>赛季：</label>
            <select
              value={selectedSeasonId}
              onChange={(e) => {
                setSelectedSeasonId(e.target.value);
                setPage(1);
              }}
              style={{ height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="">全部赛季</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.status === 'active' ? '(活跃)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '14px', marginRight: '6px' }}>状态：</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as RegistrationStatusType | '');
                setPage(1);
              }}
              style={{ height: '36px', padding: '0 10px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value="">全部状态</option>
              <option value="SUBMITTED">已提交 (待审核)</option>
              <option value="CHANGES_REQUESTED">退回修改</option>
              <option value="APPROVED">审核通过</option>
              <option value="DRAFT">草稿</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            padding: '12px 16px',
            borderRadius: '6px',
            color: '#ff4d4f',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="正在获取报名申请列表..." />
      ) : (
        <>
          {/* 报名摘要列表 */}
          <RegistrationList items={listData.items} onViewDetail={openDetail} />

          {/* 分页控制 */}
          {listData.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                marginTop: '16px',
              }}
            >
              <span style={{ fontSize: '14px', color: '#666' }}>
                共 {listData.total} 条记录，第 {page} / {listData.totalPages} 页
              </span>
              <button
                className="btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </button>
              <button
                className="btn-secondary"
                disabled={page >= listData.totalPages}
                onClick={() => setPage((p) => Math.min(listData.totalPages, p + 1))}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* 详情及审核弹窗 */}
      {detailLoading && <LoadingSpinner fullScreen text="加载报名详情中..." />}
      {detail && (
        <RegistrationDetail
          detail={detail}
          reviewComment={reviewComment}
          onCommentChange={setReviewComment}
          onApprove={handleApprove}
          onRequestChanges={handleRequestChanges}
          onClose={closeDetail}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default RegistrationReviewPage;
