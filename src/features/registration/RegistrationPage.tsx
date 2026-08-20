import React from 'react';
import './registration.css';
import { useRegistration } from './useRegistration';
import { RegistrationStatusBadge } from './RegistrationStatus';
import TeamForm from '../team-entry/components/TeamForm';
import PlayerList from '../team-entry/components/PlayerList';
import ExcelImporter from '../../components/ExcelImporter';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AlertTriangle, FileText, Lock, Save, Send } from 'lucide-react';

const RegistrationPage: React.FC = () => {
  const {
    loading,
    saving,
    submitting,
    error,
    hasBoundTeam,
    activeSeasons,
    selectedSeasonId,
    setSelectedSeasonId,
    registration,
    teamForm,
    setTeamForm,
    players,
    isReadOnly,
    handleCreateDraft,
    handleSaveDraft,
    handleSubmit,
    handleAddPlayer,
    handleRemovePlayer,
    handleUpdatePlayer,
    handleImportPlayers,
  } = useRegistration();

  if (loading) {
    return <LoadingSpinner text="正在加载赛季报名信息..." />;
  }

  return (
    <div className="registration-container">
      {/* 顶部赛季与状态栏 */}
      <div className="registration-header-bar">
        <div className="season-selector">
          <label htmlFor="season-select" style={{ fontWeight: 600 }}>
            选择赛季：
          </label>
          <select
            id="season-select"
            value={selectedSeasonId}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
          >
            {activeSeasons.length === 0 ? (
              <option value="">暂无活跃赛季</option>
            ) : (
              activeSeasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (活跃中)
                </option>
              ))
            )}
          </select>
        </div>

        {registration && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>报名状态：</span>
            <RegistrationStatusBadge status={registration.status} />
          </div>
        )}
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

      {!hasBoundTeam && (
        <div className="empty-registration-state">
          <AlertTriangle size={48} color="#fa8c16" style={{ marginBottom: '16px' }} />
          <h2>尚未绑定球队</h2>
          <p style={{ color: '#666', marginBottom: 0 }}>
            教练不能自行创建球队。请联系超级管理员先创建球队并绑定到您的账号，绑定后即可在这里填写和修改报名资料。
          </p>
        </div>
      )}

      {/* 已绑定球队但尚无报名草稿 */}
      {hasBoundTeam && !registration && (
        <div className="empty-registration-state">
          <FileText size={48} color="#1890ff" style={{ marginBottom: '16px' }} />
          <h2>尚未创建本赛季报名信息</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            请点击下方按钮开始为您绑定的球队创建本赛季报名表。
          </p>
          <button
            className="btn-primary"
            onClick={handleCreateDraft}
            disabled={!selectedSeasonId}
          >
            开始填报本赛季报名
          </button>
        </div>
      )}

      {/* 报名表单内容 */}
      {hasBoundTeam && registration && (
        <>
          {/* 退回修改提示框 */}
          {registration.status === 'CHANGES_REQUESTED' && registration.reviewComment && (
            <div className="review-comment-alert">
              <div className="review-comment-title">
                <AlertTriangle size={18} /> 管理员审核意见 (退回修改)
              </div>
              <div style={{ marginTop: '6px', whiteSpace: 'pre-wrap' }}>
                {registration.reviewComment}
              </div>
            </div>
          )}

          {/* 只读状态 Banner */}
          {isReadOnly && (
            <div className="readonly-notice-banner">
              <Lock size={16} style={{ display: 'inline', marginRight: '6px' }} />
              当前报名状态为『
              {registration.status === 'SUBMITTED' ? '已提交 (待审核)' : '审核通过'}
              』，表单与球员名单已锁定只读。
            </div>
          )}

          {/* 球队基本资料 */}
          <TeamForm
            data={teamForm}
            onChange={setTeamForm}
            activeSeasons={activeSeasons}
            disabled={isReadOnly}
          />

          {/* Excel 导入功能 (只读状态下隐去) */}
          {!isReadOnly && (
            <div style={{ marginTop: '20px' }}>
              <ExcelImporter onImport={handleImportPlayers} />
            </div>
          )}

          {/* 球员名单列表 */}
          <div style={{ marginTop: '20px' }}>
            <PlayerList
              players={players}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              onUpdatePlayer={handleUpdatePlayer}
              disabled={isReadOnly}
            />
          </div>

          {/* 底部操作栏 */}
          {!isReadOnly && (
            <div className="registration-action-bar">
              <button
                className="btn-secondary"
                onClick={handleSaveDraft}
                disabled={saving || submitting}
              >
                <Save size={16} style={{ display: 'inline', marginRight: '6px' }} />
                {saving ? '保存中...' : '保存草稿'}
              </button>
              <button
                className="btn-success"
                onClick={handleSubmit}
                disabled={saving || submitting}
              >
                <Send size={16} style={{ display: 'inline', marginRight: '6px' }} />
                {submitting ? '提交中...' : '提交报名'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RegistrationPage;
