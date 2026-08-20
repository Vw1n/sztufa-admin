import React, { useState } from 'react';
import { Plus, Trash2, User, X } from 'lucide-react';
import { Player, PlayerFormData } from '../../../types';
import { validateImageFile } from '../../../utils/imageUpload';

interface PlayerListProps {
  players: Player[];
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
  onRemovePlayer: (id: string) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  isSuperAdmin?: boolean;
  disabled?: boolean;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayer,
  disabled = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newPlayer, setNewPlayer] = useState<PlayerFormData>({
    name: '',
    studentId: '',
    jerseyNumber: '',
    photo: null,
    teamId: '',
  });
  const [preview, setPreview] = useState<string | null>(null);
  // 移动端：点击球员后弹出详情卡片的 playerId
  const [mobileCardId, setMobileCardId] = useState<string | null>(null);
  // 卡片内表单草稿（避免未点保存就写回父级）
  const [cardDraft, setCardDraft] = useState<Player | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(null);

  const activePlayer = mobileCardId ? players.find((p) => p.id === mobileCardId) : null;

  const openPlayerCard = (player: Player) => {
    if (disabled) return;
    setMobileCardId(player.id);
    setCardDraft({ ...player });
    setCardPreview(player.photo || null);
  };

  const closePlayerCard = () => {
    setMobileCardId(null);
    setCardDraft(null);
    setCardPreview(null);
  };

  const savePlayerCard = () => {
    if (!cardDraft) return;
    const updates: Partial<Player> = {
      name: cardDraft.name,
      studentId: cardDraft.studentId,
      jerseyNumber: cardDraft.jerseyNumber,
    };
    if (cardPreview !== cardDraft.photo) {
      updates.photo = cardPreview;
      updates.photoFile = cardDraft.photoFile;
    }
    onUpdatePlayer(cardDraft.id, updates);
    closePlayerCard();
  };

  const handleDeleteFromCard = () => {
    if (!cardDraft) return;
    if (confirm(`确定删除球员「${cardDraft.name}」吗？`)) {
      onRemovePlayer(cardDraft.id);
      closePlayerCard();
    }
  };

  const isValidPhoto = (file: File): boolean => {
    try {
      validateImageFile(file, '球员照片');
      return true;
    } catch (error) {
      alert(error instanceof Error ? error.message : '照片校验失败');
      return false;
    }
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (!isValidPhoto(file)) return;
      setPreview(URL.createObjectURL(file));
      setNewPlayer((prev) => ({ ...prev, photo: file }));
    } else {
      setPreview(null);
      setNewPlayer((prev) => ({ ...prev, photo: null }));
    }
  };

  const handleCardPhotoChange = (file: File | null) => {
    if (file) {
      if (!isValidPhoto(file)) return;
      setCardPreview(URL.createObjectURL(file));
      if (cardDraft) {
        setCardDraft({ ...cardDraft, photoFile: file });
      }
    }
  };

  const handleAddPlayer = () => {
    onAddPlayer({
      name: newPlayer.name.trim(),
      studentId: newPlayer.studentId.trim(),
      jerseyNumber: newPlayer.jerseyNumber,
      photo: preview,
      photoFile: newPlayer.photo instanceof File ? newPlayer.photo : null,
      teamId: '',
    });
    setNewPlayer({ name: '', studentId: '', jerseyNumber: '', photo: null, teamId: '' });
    setPreview(null);
    setIsAdding(false);
  };

  const handleFieldChange = (field: keyof PlayerFormData, value: string) => {
    setNewPlayer((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlayerPhotoChange = (playerId: string, file: File | null) => {
    if (file) {
      if (!isValidPhoto(file)) return;
      onUpdatePlayer(playerId, {
        photo: URL.createObjectURL(file),
        photoFile: file,
      });
    }
  };

  return (
    <div className="player-list">
      <div className="section-header">
        <h2 className="form-title">
          <span className="icon">👥</span> 参赛队员 ({players.length})
        </h2>
        {!disabled && (
          <button onClick={() => setIsAdding(!isAdding)} className="add-btn">
            <Plus size={20} />
            添加球员
          </button>
        )}
      </div>

      {isAdding && (
        <div className="add-player-form">
          <h3>添加新球员</h3>
          <div className="form-row">
            <div className="form-group">
              <label>姓名</label>
              <input
                type="text"
                value={newPlayer.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="请输入球员姓名"
              />
            </div>
            <div className="form-group">
              <label>学号</label>
              <input
                type="text"
                value={newPlayer.studentId}
                onChange={(e) => handleFieldChange('studentId', e.target.value)}
                placeholder="请输入学号"
              />
            </div>
            <div className="form-group">
              <label>球衣号码</label>
              <input
                type="number"
                value={newPlayer.jerseyNumber}
                onChange={(e) => handleFieldChange('jerseyNumber', e.target.value)}
                placeholder="请输入球衣号码"
              />
            </div>
            <div className="form-group image-group">
              <label>照片</label>
              <div className="upload-area small">
                {preview ? (
                  <img src={preview} alt="球员照片" className="preview-image" />
                ) : (
                  <div className="upload-placeholder">
                    <User size={24} />
                    <span>上传照片</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="file-input"
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button onClick={handleAddPlayer} className="submit-btn">
              确认添加
            </button>
            <button onClick={() => setIsAdding(false)} className="cancel-btn">
              取消
            </button>
          </div>
        </div>
      )}

      {players.length === 0 ? (
        <div className="empty-state">
          <User size={48} />
          <p>暂无球员，请添加球员或通过Excel导入</p>
        </div>
      ) : (
        <>
          <div className="player-table-wrapper player-table-desktop-only">
            <table className="player-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', minWidth: '80px' }}>照片</th>
                  <th style={{ width: '120px', minWidth: '120px' }}>姓名</th>
                  <th style={{ width: '160px', minWidth: '160px' }}>学号</th>
                  <th style={{ width: '100px', minWidth: '100px' }}>球衣号码</th>
                  <th style={{ width: '80px', minWidth: '80px', textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id}>
                    <td>
                      <div className="player-photo-upload">
                        {player.photo ? (
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="player-photo"
                          />
                        ) : (
                          <div className="no-photo">
                            <User size={24} />
                          </div>
                        )}
                        {!disabled && (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePlayerPhotoChange(player.id, e.target.files?.[0] || null)}
                            className="file-input"
                            title="点击上传照片"
                          />
                        )}
                      </div>
                    </td>
                    <td>{player.name}</td>
                    <td>{player.studentId}</td>
                    <td>{player.jerseyNumber}</td>
                    <td style={{ textAlign: 'center' }}>
                      {!disabled && (
                        <button
                          onClick={() => onRemovePlayer(player.id)}
                          className="delete-btn"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 移动端：简化列表 —— 头像 + 姓名 + #球衣号 + 删除按钮 */}
          <ul className="player-list-mobile team-entry-player-list">
            {players.map((player) => (
              <li
                key={player.id}
                className="player-list-item"
                onClick={() => !disabled && openPlayerCard(player)}
              >
                <div className="player-avatar">
                  {player.photo ? (
                    <img src={player.photo} alt={player.name} />
                  ) : (
                    <span className="avatar-placeholder">
                      {(player.name || '').slice(0, 1) || '?'}
                    </span>
                  )}
                </div>
                <div className="player-name-row">
                  <span className="player-name">{player.name}</span>
                  {player.jerseyNumber && (
                    <span className="player-jersey-badge">#{player.jerseyNumber}</span>
                  )}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    className="player-mobile-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定删除球员「${player.name}」吗？`)) {
                        onRemovePlayer(player.id);
                      }
                    }}
                    aria-label={`删除${player.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* 移动端：球员详情卡片（含编辑控件） */}
      {activePlayer && cardDraft && (
        <div
          className="player-card-overlay"
          onClick={closePlayerCard}
          role="dialog"
          aria-modal="true"
          aria-label={`编辑 ${activePlayer.name}`}
        >
          <div className="player-card-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="player-card-close"
              onClick={closePlayerCard}
              aria-label="关闭"
            >
              <X size={20} />
            </button>

            <div className="player-card-header">
              <div className="player-card-avatar editable">
                {cardPreview ? (
                  <img src={cardPreview} alt={cardDraft.name} />
                ) : (
                  <span className="avatar-placeholder">
                    {(cardDraft.name || '').slice(0, 1) || '?'}
                  </span>
                )}
                <label className="player-card-photo-picker" title="更换照片">
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCardPhotoChange(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <div className="player-card-title">
                <h3 style={{ marginBottom: '6px' }}>球员信息</h3>
                {cardDraft.jerseyNumber && (
                  <div className="player-card-jersey">#{cardDraft.jerseyNumber}</div>
                )}
              </div>
            </div>

            <div className="player-card-body">
              <div className="team-entry-card-field">
                <label>姓名</label>
                <input
                  type="text"
                  value={cardDraft.name}
                  onChange={(e) => setCardDraft({ ...cardDraft, name: e.target.value })}
                  className="form-input"
                  placeholder="球员姓名"
                />
              </div>
              <div className="team-entry-card-field">
                <label>学号</label>
                <input
                  type="text"
                  value={cardDraft.studentId}
                  onChange={(e) => setCardDraft({ ...cardDraft, studentId: e.target.value })}
                  className="form-input"
                  placeholder="学号"
                />
              </div>
              <div className="team-entry-card-field">
                <label>球衣号码</label>
                <input
                  type="number"
                  value={cardDraft.jerseyNumber}
                  onChange={(e) => setCardDraft({ ...cardDraft, jerseyNumber: e.target.value })}
                  className="form-input"
                  placeholder="如 7"
                />
              </div>

              <div className="team-entry-card-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleDeleteFromCard}
                  style={{ background: '#fff5f5', color: '#c92a2a', borderColor: '#ffc9c9' }}
                >
                  <Trash2 size={16} />
                  删除球员
                </button>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={savePlayerCard}
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerList;
