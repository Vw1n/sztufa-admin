import React, { useState } from 'react';
import { Trash2, Plus, Users, Download, FileText, X } from 'lucide-react';
import ExcelImporter from '../../../components/ExcelImporter';
import PdfImporter from '../../../components/PdfImporter';
import { Team, Player, PlayerValue } from '../../../types';
import { uploadImageFile } from '../../../utils/imageUpload';
import { getErrorMessage } from '../../../utils/errors';

interface TeamPlayerPanelProps {
  selectedTeam: Team;
  isEditing: boolean;
  editData: Team | null;
  showImporter: boolean;
  onToggleImporter: () => void;
  onAddPlayerRow: () => void;
  onDeletePlayerRow: (index: number) => void;
  onPlayerFieldChange: (index: number, field: keyof Player, value: PlayerValue) => void;
  onExcelImport: (players: Omit<Player, 'id'>[]) => void;
  onExportPlayers: () => void;
}

export const TeamPlayerPanel: React.FC<TeamPlayerPanelProps> = ({
  selectedTeam, isEditing, editData,
  showImporter, onToggleImporter,
  onAddPlayerRow, onDeletePlayerRow, onPlayerFieldChange,
  onExcelImport, onExportPlayers,
}) => {
  const [showPdfImporter, setShowPdfImporter] = useState(false);
  const players = isEditing ? (editData?.players || []) : (selectedTeam.players || []);
  const count = players.length;
  // 查看态：通过 playerId 找到详情卡片
  const [mobileCardId, setMobileCardId] = useState<string | null>(null);
  // 编辑态：通过 index 找到编辑卡片 + 草稿态 + 照片预览
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [editingCardDraft, setEditingCardDraft] = useState<Player | null>(null);
  const [editingCardPreview, setEditingCardPreview] = useState<string | null>(null);

  if (!isEditing && count === 0) return null;

  const activePlayer = mobileCardId ? players.find(p => p.id === mobileCardId) : null;
  const activeEditIndex = editingCardIndex;
  const activeEditPlayer = activeEditIndex != null ? players[activeEditIndex] : null;

  const openEditingCard = (index: number) => {
    const p = players[index];
    if (!p) return;
    setEditingCardIndex(index);
    setEditingCardDraft({ ...p });
    setEditingCardPreview(p.photo || null);
  };

  const closeEditingCard = () => {
    setEditingCardIndex(null);
    setEditingCardDraft(null);
    setEditingCardPreview(null);
  };

  const saveEditingCard = async () => {
    if (editingCardIndex == null || !editingCardDraft) return;
    const draft = editingCardDraft;
    const idx = editingCardIndex;
    onPlayerFieldChange(idx, 'name', draft.name);
    onPlayerFieldChange(idx, 'studentId', draft.studentId);
    onPlayerFieldChange(idx, 'jerseyNumber', draft.jerseyNumber);
    onPlayerFieldChange(idx, 'yellowCards', draft.yellowCards ?? 0);
    onPlayerFieldChange(idx, 'redCards', draft.redCards ?? 0);
    onPlayerFieldChange(idx, 'status', draft.status || 'active');
    // 照片：如果预览与草稿中的 photo 不同，说明改了，这里暂不重传
    if (editingCardPreview !== (activeEditPlayer?.photo ?? null)) {
      onPlayerFieldChange(idx, 'photo', editingCardPreview);
    }
    closeEditingCard();
  };

  const handleEditingCardPhoto = async (file: File | null) => {
    if (!file || editingCardIndex == null || !editingCardDraft) return;
    try {
      const url = await uploadImageFile(file, `球员 ${editingCardDraft.name || editingCardIndex + 1} 的照片`);
      setEditingCardPreview(url);
      setEditingCardDraft({ ...editingCardDraft, photo: url });
    } catch (err: unknown) {
      alert(getErrorMessage(err, '图片上传失败'));
    }
  };

  const handleDeleteFromEditingCard = () => {
    if (editingCardIndex == null || !editingCardDraft) return;
    if (confirm(`确定删除球员「${editingCardDraft.name}」吗？`)) {
      onDeletePlayerRow(editingCardIndex);
      closeEditingCard();
    }
  };

  return (
    <div className="form-section">
      <div className="section-header" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="form-title" style={{ margin: 0 }}>
          <span className="icon">👥</span>
          球员名单 ({count}人)
        </h2>
        {!isEditing && (
          <button onClick={onExportPlayers} className="add-btn small refresh-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
            <Download size={14} />
            导出名单
          </button>
        )}
      </div>

      {/* 编辑态：添加球员的三个操作按钮 — 放在名单最上方，并排为三个小按键 */}
      {isEditing && (
        <div
          className="player-actions-toolbar"
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'nowrap',
            marginBottom: '15px',
          }}
        >
          <button
            onClick={onAddPlayerRow}
            className="add-btn small"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '6px 8px',
              height: 'auto',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <Plus size={13} />
            添加球员
          </button>
          <button
            onClick={onToggleImporter}
            className="add-btn small refresh-btn"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '6px 8px',
              height: 'auto',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <Users size={13} />
            {showImporter ? '隐藏Excel' : 'Excel导入'}
          </button>
          <button
            onClick={() => setShowPdfImporter(!showPdfImporter)}
            className="add-btn small refresh-btn"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '6px 8px',
              height: 'auto',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              background: '#e7f5ff',
              color: '#1c7ed6',
              borderColor: '#a5d8ff',
            }}
          >
            <FileText size={13} />
            {showPdfImporter ? '隐藏PDF' : 'PDF导入'}
          </button>
        </div>
      )}

      {/* 桌面端表格：宽度充足时显示 */}
      <div className="player-table-wrapper player-table-desktop-only">
        <table className="player-table">
          <thead>
            <tr>
              <th style={{ width: '120px', minWidth: '120px' }}>姓名</th>
              <th style={{ width: '120px', minWidth: '120px' }}>照片</th>
              <th style={{ width: '160px', minWidth: '160px' }}>学号</th>
              <th style={{ width: '100px', minWidth: '100px' }}>球衣号码</th>
              <th style={{ width: '90px', minWidth: '90px' }}>黄牌数</th>
              <th style={{ width: '90px', minWidth: '90px' }}>红牌数</th>
              <th style={{ width: '120px', minWidth: '120px' }}>可用状态</th>
              {isEditing && <th style={{ width: '60px', minWidth: '60px' }}>操作</th>}
            </tr>
          </thead>
          <tbody>
            {isEditing ? (
              (editData?.players || []).map((player, index) => (
                <tr key={player.id || index} style={player.status === 'suspended' ? { background: '#fff5f5' } : undefined}>
                  <td>
                    <input type="text" value={player.name} onChange={(e) => onPlayerFieldChange(index, 'name', e.target.value)} className="form-input" placeholder="姓名" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {player.photo ? (
                        <img src={player.photo} alt="头像" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666' }}>无</div>
                      )}
                      <label style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 6px', background: '#e9ecef', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', border: '1px solid #ced4da' }}>
                        上传
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const url = await uploadImageFile(file, `球员 ${player.name || index + 1} 的照片`);
                                onPlayerFieldChange(index, 'photo', url);
                              } catch (err: unknown) {
                                alert(getErrorMessage(err, '图片上传失败'));
                              }
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </td>
                  <td>
                    <input type="text" value={player.studentId} onChange={(e) => onPlayerFieldChange(index, 'studentId', e.target.value)} className="form-input" placeholder="学号" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }} />
                  </td>
                  <td>
                    <input type="text" value={player.jerseyNumber} onChange={(e) => onPlayerFieldChange(index, 'jerseyNumber', e.target.value)} className="form-input" placeholder="号码" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }} />
                  </td>
                  <td>
                    <input type="number" min="0" value={player.yellowCards || 0} onChange={(e) => onPlayerFieldChange(index, 'yellowCards', parseInt(e.target.value) || 0)} className="form-input" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }} />
                  </td>
                  <td>
                    <input type="number" min="0" value={player.redCards || 0} onChange={(e) => onPlayerFieldChange(index, 'redCards', parseInt(e.target.value) || 0)} className="form-input" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }} />
                  </td>
                  <td>
                    <select value={player.status || 'active'} onChange={(e) => onPlayerFieldChange(index, 'status', e.target.value)} className="form-input" style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100%', boxSizing: 'border-box' }}>
                      <option value="active">🟢 可用</option>
                      <option value="suspended">🔴 停赛</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => onDeletePlayerRow(index)} className="delete-btn small" title="删除" style={{ padding: '6px 10px', height: '32px' }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              (selectedTeam.players || []).map((player) => (
                <tr key={player.id} style={player.status === 'suspended' ? { background: '#fff5f5' } : undefined}>
                  <td style={{ fontWeight: player.status === 'suspended' ? 600 : undefined }}>
                    {player.name}
                    {player.status === 'suspended' && (
                      <span style={{ marginLeft: '8px', color: '#fa5252', fontSize: '11px', fontWeight: 'normal', background: '#ffe3e3', padding: '2px 6px', borderRadius: '4px' }}>
                        🛑 停赛
                      </span>
                    )}
                  </td>
                  <td>
                    {player.photo ? (
                      <img src={player.photo} alt="头像" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666' }}>无</div>
                    )}
                  </td>
                  <td>{player.studentId}</td>
                  <td>{player.jerseyNumber}</td>
                  <td>🟨 {player.yellowCards || 0}</td>
                  <td>🟥 {player.redCards || 0}</td>
                  <td>{player.status === 'suspended' ? <span style={{ color: '#fa5252', fontWeight: 600 }}>停赛中</span> : <span style={{ color: '#2b8a3e' }}>可用</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 移动端：简化球员列表（仅头像 + 姓名 + 球衣号）——查看态 */}
      {!isEditing && count > 0 && (
        <ul className="player-list-mobile">
          {(selectedTeam.players || []).map((player) => (
            <li
              key={player.id}
              className={`player-list-item${player.status === 'suspended' ? ' suspended' : ''}`}
              onClick={() => setMobileCardId(player.id)}
            >
              <div className="player-avatar">
                {player.photo ? (
                  <img src={player.photo} alt={player.name} />
                ) : (
                  <span className="avatar-placeholder">{(player.name || '').slice(0, 1) || '?'}</span>
                )}
              </div>
              <div className="player-name-row">
                <span className="player-name">{player.name}</span>
                {player.jerseyNumber && (
                  <span className="player-jersey-badge">#{player.jerseyNumber}</span>
                )}
                {(player.yellowCards ?? 0) > 0 && (
                  <span className="player-card-chip yellow">🟨 {player.yellowCards}</span>
                )}
                {(player.redCards ?? 0) > 0 && (
                  <span className="player-card-chip red">🟥 {player.redCards}</span>
                )}
                {player.status === 'suspended' && (
                  <span className="player-suspended-chip">🛑 停赛</span>
                )}
              </div>
              <span className="player-chevron">›</span>
            </li>
          ))}
        </ul>
      )}

      {/* 移动端：简化球员列表（含牌+停赛+删除）——编辑态 */}
      {isEditing && count > 0 && (
        <ul className="player-list-mobile team-entry-player-list">
          {(editData?.players || []).map((player, index) => (
            <li
              key={player.id || index}
              className={`player-list-item${player.status === 'suspended' ? ' suspended' : ''}`}
              onClick={() => openEditingCard(index)}
            >
              <div className="player-avatar">
                {player.photo ? (
                  <img src={player.photo} alt={player.name} />
                ) : (
                  <span className="avatar-placeholder">{(player.name || '').slice(0, 1) || '?'}</span>
                )}
              </div>
              <div className="player-name-row">
                <span className="player-name">{player.name}</span>
                {player.jerseyNumber && (
                  <span className="player-jersey-badge">#{player.jerseyNumber}</span>
                )}
                {(player.yellowCards ?? 0) > 0 && (
                  <span className="player-card-chip yellow">🟨 {player.yellowCards}</span>
                )}
                {(player.redCards ?? 0) > 0 && (
                  <span className="player-card-chip red">🟥 {player.redCards}</span>
                )}
                {player.status === 'suspended' && (
                  <span className="player-suspended-chip">🛑 停赛</span>
                )}
              </div>
              <button
                type="button"
                className="player-mobile-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`确定删除球员「${player.name}」吗？`)) {
                    onDeletePlayerRow(index);
                  }
                }}
                aria-label={`删除${player.name}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 移动端：球员详情卡片 Modal（查看态） */}
      {activePlayer && !isEditing && (
        <div
          className="player-card-overlay"
          onClick={() => setMobileCardId(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${activePlayer.name} 的详情`}
        >
          <div
            className="player-card-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="player-card-close"
              onClick={() => setMobileCardId(null)}
              aria-label="关闭"
            >
              <X size={20} />
            </button>

            <div className="player-card-header">
              <div className="player-card-avatar">
                {activePlayer.photo ? (
                  <img src={activePlayer.photo} alt={activePlayer.name} />
                ) : (
                  <span className="avatar-placeholder">
                    {(activePlayer.name || '').slice(0, 1) || '?'}
                  </span>
                )}
              </div>
              <div className="player-card-title">
                <h3>{activePlayer.name}</h3>
                {activePlayer.jerseyNumber && (
                  <div className="player-card-jersey">#{activePlayer.jerseyNumber}</div>
                )}
                {activePlayer.status === 'suspended' ? (
                  <div className="player-card-status suspended">🔴 停赛中</div>
                ) : (
                  <div className="player-card-status active">🟢 可用</div>
                )}
              </div>
            </div>

            <div className="player-card-body">
              <div className="player-info-row">
                <span className="player-info-label">学号</span>
                <span className="player-info-value">{activePlayer.studentId || '—'}</span>
              </div>
              <div className="player-info-row">
                <span className="player-info-label">球衣号码</span>
                <span className="player-info-value">{activePlayer.jerseyNumber || '—'}</span>
              </div>
              <div className="player-info-row">
                <span className="player-info-label">黄牌数</span>
                <span className="player-info-value">🟨 {activePlayer.yellowCards || 0}</span>
              </div>
              <div className="player-info-row">
                <span className="player-info-label">红牌数</span>
                <span className="player-info-value">🟥 {activePlayer.redCards || 0}</span>
              </div>
              <div className="player-info-row">
                <span className="player-info-label">可用状态</span>
                <span className="player-info-value">
                  {activePlayer.status === 'suspended' ? '停赛中' : '正常可用'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 移动端：球员详情卡片 Modal（编辑态） */}
      {activeEditPlayer && editingCardDraft && isEditing && (
        <div
          className="player-card-overlay"
          onClick={closeEditingCard}
          role="dialog"
          aria-modal="true"
          aria-label={`编辑 ${editingCardDraft.name}`}
        >
          <div className="player-card-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="player-card-close"
              onClick={closeEditingCard}
              aria-label="关闭"
            >
              <X size={20} />
            </button>

            <div className="player-card-header">
              <div className="player-card-avatar editable">
                {editingCardPreview ? (
                  <img src={editingCardPreview} alt={editingCardDraft.name} />
                ) : (
                  <span className="avatar-placeholder">
                    {(editingCardDraft.name || '').slice(0, 1) || '?'}
                  </span>
                )}
                <label className="player-card-photo-picker" title="更换照片">
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleEditingCardPhoto(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <div className="player-card-title">
                <h3 style={{ marginBottom: '6px' }}>编辑球员信息</h3>
                {editingCardDraft.jerseyNumber && (
                  <div className="player-card-jersey">#{editingCardDraft.jerseyNumber}</div>
                )}
              </div>
            </div>

            <div className="player-card-body">
              <div className="team-entry-card-field">
                <label>姓名</label>
                <input
                  type="text"
                  value={editingCardDraft.name}
                  onChange={(e) => setEditingCardDraft({ ...editingCardDraft, name: e.target.value })}
                  className="form-input"
                  placeholder="球员姓名"
                />
              </div>
              <div className="team-entry-card-field">
                <label>学号</label>
                <input
                  type="text"
                  value={editingCardDraft.studentId}
                  onChange={(e) => setEditingCardDraft({ ...editingCardDraft, studentId: e.target.value })}
                  className="form-input"
                  placeholder="学号"
                />
              </div>
              <div className="team-entry-card-field">
                <label>球衣号码</label>
                <input
                  type="text"
                  value={editingCardDraft.jerseyNumber}
                  onChange={(e) => setEditingCardDraft({ ...editingCardDraft, jerseyNumber: e.target.value })}
                  className="form-input"
                  placeholder="如 7"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="team-entry-card-field">
                  <label>黄牌数</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCardDraft.yellowCards ?? 0}
                    onChange={(e) => setEditingCardDraft({ ...editingCardDraft, yellowCards: parseInt(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>
                <div className="team-entry-card-field">
                  <label>红牌数</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCardDraft.redCards ?? 0}
                    onChange={(e) => setEditingCardDraft({ ...editingCardDraft, redCards: parseInt(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="team-entry-card-field">
                <label>可用状态</label>
                <select
                  value={editingCardDraft.status || 'active'}
                  onChange={(e) => setEditingCardDraft({ ...editingCardDraft, status: e.target.value })}
                  className="form-input"
                  style={{
                    margin: 0,
                    padding: '10px 12px',
                    fontSize: '14px',
                    height: 'auto',
                    borderRadius: '10px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                  }}
                >
                  <option value="active">🟢 可用</option>
                  <option value="suspended">🔴 停赛</option>
                </select>
              </div>

              <div className="team-entry-card-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleDeleteFromEditingCard}
                  style={{ background: '#fff5f5', color: '#c92a2a', borderColor: '#ffc9c9' }}
                >
                  <Trash2 size={16} />
                  删除球员
                </button>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={saveEditingCard}
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditing && (
        <>
          {showImporter && (
            <div style={{ marginTop: '20px', padding: '20px', border: '1px dashed #ddd', borderRadius: '8px', background: '#fcfcfc' }}>
              <ExcelImporter onImport={onExcelImport} />
            </div>
          )}

          {showPdfImporter && (
            <div style={{ marginTop: '20px' }}>
              <PdfImporter
                onImportSuccess={() => {
                  setShowPdfImporter(false);
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
                onClose={() => setShowPdfImporter(false)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
