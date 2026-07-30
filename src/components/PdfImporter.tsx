import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  Image as ImageIcon,
} from 'lucide-react';
import {
  pdfImportApi,
  ParsedTeam,
  PdfPreviewResponse,
} from '../api/pdf-import.service';

interface PdfImporterProps {
  onImportSuccess: (importedData: { batchId: string; teams: ParsedTeam[] }) => void | Promise<void>;
  onClose?: () => void;
}

const PdfImporter: React.FC<PdfImporterProps> = ({
  onImportSuccess,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PdfPreviewResponse | null>(null);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [uploadingRowIndex, setUploadingRowIndex] = useState<number | null>(null);
  const [uploadingTeamAsset, setUploadingTeamAsset] = useState<
    'logo' | 'homeJerseyPhoto' | 'awayJerseyPhoto' | null
  >(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setError('只支持上传 PDF 格式的足球赛报名表文件');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUploadAndPreview = async () => {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    // 新一次识别必须丢弃上一批预览，避免失败信息与旧数据同时显示。
    setPreviewData(null);
    setActiveTeamIndex(0);

    try {
      const res = await pdfImportApi.preview(file);
      setPreviewData(res);
    } catch (err: any) {
      setError(err?.message || 'PDF 报名表识别解析失败，请检查文件格式');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (
    fieldPath: 'teamName' | 'headCoach' | 'coachPhone' | 'teamLeader' | 'leaderPhone' | 'teamDoctor' | 'homeJerseyColor' | 'awayJerseyColor',
    value: string,
  ) => {
    if (!previewData) return;
    const updatedTeams = [...previewData.teams];
    const currentTeam = updatedTeams[activeTeamIndex];
    if (currentTeam && currentTeam[fieldPath]) {
      currentTeam[fieldPath] = {
        ...currentTeam[fieldPath],
        value,
        manuallyConfirmed: true,
      };
      setPreviewData({ ...previewData, teams: updatedTeams });
    }
  };

  const handlePlayerChange = (
    playerIndex: number,
    field: 'name' | 'studentId' | 'jerseyNumber',
    value: string,
  ) => {
    if (!previewData) return;
    const updatedTeams = [...previewData.teams];
    const currentTeam = updatedTeams[activeTeamIndex];
    if (currentTeam && currentTeam.players[playerIndex]) {
      const player = currentTeam.players[playerIndex];
      player[field] = {
        ...player[field],
        value,
        manuallyConfirmed: true,
      };
      // 如果主要数据已经修正，更新手动确认标记
      if (player.name.value && player.studentId.value && player.jerseyNumber.value) {
        player.needsManualConfirm = false;
      }
      setPreviewData({ ...previewData, teams: updatedTeams });
    }
  };

  const handleTogglePlayerConfirm = (playerIndex: number) => {
    if (!previewData) return;
    const updatedTeams = [...previewData.teams];
    const currentTeam = updatedTeams[activeTeamIndex];
    if (currentTeam && currentTeam.players[playerIndex]) {
      const player = currentTeam.players[playerIndex];
      const isConfirmed = !player.photo.manuallyConfirmed;
      player.photo.manuallyConfirmed = isConfirmed;
      player.name.manuallyConfirmed = isConfirmed;
      player.studentId.manuallyConfirmed = isConfirmed;
      player.jerseyNumber.manuallyConfirmed = isConfirmed;

      if (isConfirmed) {
        player.needsManualConfirm = false;
      }
      setPreviewData({ ...previewData, teams: updatedTeams });
    }
  };

  const handleSinglePhotoUpload = async (playerIndex: number, photoFile: File) => {
    if (!previewData) return;
    try {
      setUploadingRowIndex(playerIndex);
      setError(null);
      const res = await pdfImportApi.uploadPhoto(previewData.batchId, photoFile);

      const updatedTeams = [...previewData.teams];
      const currentTeam = updatedTeams[activeTeamIndex];
      if (currentTeam && currentTeam.players[playerIndex]) {
        const player = currentTeam.players[playerIndex];
        player.photo = {
          value: res.url,
          confidence: 1.0,
          page: player.photo.page,
          manuallyConfirmed: true,
        };
        player.needsManualConfirm = false;
        setPreviewData({ ...previewData, teams: updatedTeams });
      }
    } catch (err: any) {
      setError(err?.message || '图片上传失败');
    } finally {
      setUploadingRowIndex(null);
    }
  };

  const handleTeamAssetUpload = async (
    field: 'logo' | 'homeJerseyPhoto' | 'awayJerseyPhoto',
    imageFile: File,
  ) => {
    if (!previewData) return;
    try {
      setUploadingTeamAsset(field);
      setError(null);
      const res = await pdfImportApi.uploadPhoto(previewData.batchId, imageFile);
      const updatedTeams = [...previewData.teams];
      const current = updatedTeams[activeTeamIndex];
      current[field] = {
        value: res.url,
        confidence: 1,
        page: current[field]?.page || current.teamName.page,
        manuallyConfirmed: true,
      };
      setPreviewData({ ...previewData, teams: updatedTeams });
    } catch (err: any) {
      setError(err?.message || '球队图片上传失败');
    } finally {
      setUploadingTeamAsset(null);
    }
  };

  const handleCommit = async () => {
    if (!previewData || !currentTeam) return;

    // 只检查当前选中的球队，其他球队不影响本次回填。
    let unconfirmedCount = 0;
    for (const player of currentTeam.players) {
      if (
        (player.photo.confidence < 0.8 || player.needsManualConfirm) &&
        !player.photo.manuallyConfirmed
      ) {
        unconfirmedCount++;
      }
    }

    if (unconfirmedCount > 0) {
      setError(`还有 ${unconfirmedCount} 项低置信度数据未确认，请检查黄色警示项并勾选“确认无误”后提交`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onImportSuccess({ batchId: previewData.batchId, teams: [currentTeam] });
      await pdfImportApi.cancel(previewData.batchId);
      setPreviewData(null);
      setFile(null);
    } catch (err: any) {
      setError(err?.message || 'PDF 识别结果回填失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (previewData) {
      try {
        await pdfImportApi.cancel(previewData.batchId);
      } catch (e) {
        console.warn('取消批次异常', e);
      }
    }
    setPreviewData(null);
    setFile(null);
    if (onClose) onClose();
  };

  const isBusy = isLoading || uploadingRowIndex !== null || uploadingTeamAsset !== null;
  const currentTeam = previewData?.teams[activeTeamIndex];

  return (
    <div className="pdf-importer" style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '960px', margin: '0 auto', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
      <div className="importer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', color: '#1c7ed6' }}>
          <FileText size={22} />
          PDF 官方足球赛报名表智能识别导入
        </h3>
        {onClose && (
          <button onClick={handleCancel} disabled={isBusy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#868e96' }}>
            <X size={20} />
          </button>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fff5f5', border: '1px solid #ffc9c9', color: '#fa5252', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!previewData ? (
        <div className="upload-section">
          <div className="drop-zone" style={{ border: '2px dashed #a5d8ff', borderRadius: '10px', padding: '40px 20px', textAlign: 'center', background: '#f8f9fa', cursor: 'pointer' }}>
            <Upload size={48} style={{ color: '#339af0', marginBottom: '10px' }} />
            <p style={{ margin: '0 0 6px 0', fontWeight: 600, fontSize: '16px' }}>点击或拖拽上传官方报名表 PDF 文件</p>
            <p style={{ margin: 0, color: '#868e96', fontSize: '13px' }}>支持深圳技术大学“校长杯”等原生文本 PDF 报名表格式 (.pdf)</p>
            <input
              type="file"
              accept=".pdf"
              disabled={isLoading}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="pdf-file-input"
            />
            <label htmlFor="pdf-file-input" style={{ display: 'inline-block', marginTop: '16px', padding: '8px 20px', background: '#228be6', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              选择本地 PDF 文件
            </label>
          </div>

          {file && (
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#e7f5ff', borderRadius: '6px', border: '1px solid #74c0fc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: '#1c7ed6' }} />
                <span style={{ fontWeight: 500 }}>{file.name}</span>
                <span style={{ fontSize: '12px', color: '#868e96' }}>({Math.round(file.size / 1024)} KB)</span>
              </div>
              <button
                onClick={handleUploadAndPreview}
                disabled={isLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#12b886', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isLoading ? 'wait' : 'pointer' }}
              >
                {isLoading ? '正在识别与提取照片...' : '开始识别解析'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="preview-section">
          {previewData.teams.length > 1 && (
            <div className="team-tabs" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px', borderBottom: '1px solid #e9ecef' }}>
              {previewData.teams.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTeamIndex(idx)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: activeTeamIndex === idx ? '#228be6' : '#dee2e6',
                    background: activeTeamIndex === idx ? '#e7f5ff' : '#f8f9fa',
                    color: activeTeamIndex === idx ? '#1c7ed6' : '#495057',
                    fontWeight: activeTeamIndex === idx ? 600 : 400,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.teamName.value || `球队 #${idx + 1}`} ({t.players.length}人)
                </button>
              ))}
            </div>
          )}

          {currentTeam && (
            <div className="team-card" style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px', marginBottom: '20px', border: '1px solid #e9ecef' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#343a40', fontSize: '15px' }}>球队基本信息校对</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>球队名称</label>
                  <input
                    type="text"
                    value={currentTeam.teamName.value || ''}
                    onChange={(e) => handleFieldChange('teamName', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>主教练</label>
                  <input
                    type="text"
                    value={currentTeam.headCoach.value || ''}
                    onChange={(e) => handleFieldChange('headCoach', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>教练电话</label>
                  <input
                    type="text"
                    value={currentTeam.coachPhone.value || ''}
                    onChange={(e) => handleFieldChange('coachPhone', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>领队姓名</label>
                  <input
                    type="text"
                    value={currentTeam.teamLeader.value || ''}
                    onChange={(e) => handleFieldChange('teamLeader', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>主场球衣颜色</label>
                  <input
                    type="text"
                    value={currentTeam.homeJerseyColor.value || ''}
                    onChange={(e) => handleFieldChange('homeJerseyColor', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>客场球衣颜色</label>
                  <input
                    type="text"
                    value={currentTeam.awayJerseyColor.value || ''}
                    onChange={(e) => handleFieldChange('awayJerseyColor', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
                {([
                  ['logo', '球队队徽'],
                  ['homeJerseyPhoto', '主场球衣'],
                  ['awayJerseyPhoto', '客场球衣'],
                ] as const).map(([field, label]) => {
                  const asset = currentTeam[field];
                  const inputId = `pdf-${field}-${activeTeamIndex}`;
                  return (
                    <div key={field} style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '10px', background: '#fff' }}>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>{label}</div>
                      <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', borderRadius: '6px', overflow: 'hidden' }}>
                        {asset?.value ? (
                          <img src={asset.value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ color: '#adb5bd', fontSize: '13px' }}>未识别</span>
                        )}
                      </div>
                      <input
                        id={inputId}
                        type="file"
                        accept="image/*"
                        disabled={isBusy}
                        onChange={(event) => {
                          const selected = event.target.files?.[0];
                          if (selected) void handleTeamAssetUpload(field, selected);
                          event.target.value = '';
                        }}
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor={inputId}
                        style={{ display: 'block', marginTop: '8px', padding: '6px', textAlign: 'center', border: '1px solid #ced4da', borderRadius: '5px', cursor: isBusy ? 'wait' : 'pointer', fontSize: '12px' }}
                      >
                        {uploadingTeamAsset === field ? '上传中...' : asset?.value ? '更换图片' : '补充图片'}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '15px' }}>球员名单与免冠照列表 ({currentTeam?.players.length || 0}人)</h4>
            {previewData.hasLowConfidence && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: '#fff9db', border: '1px solid #ffe066', color: '#f59f00', borderRadius: '4px', fontSize: '12px' }}>
                <AlertTriangle size={14} />
                包含黄色低置信度预警项，请核对并勾选确认
              </span>
            )}
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f1f3f5', textAlign: 'left' }}>
                  <th style={{ padding: '10px', width: '60px', textAlign: 'center' }}>照片</th>
                  <th style={{ padding: '10px' }}>姓名</th>
                  <th style={{ padding: '10px' }}>学号</th>
                  <th style={{ padding: '10px' }}>球衣号码</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>校对确认状态</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {currentTeam?.players.map((p, pIdx) => {
                  const isLowConf = p.photo.confidence < 0.8 || p.needsManualConfirm;
                  return (
                    <tr key={pIdx} style={{ borderBottom: '1px solid #f1f3f5', background: isLowConf && !p.photo.manuallyConfirmed ? '#fff9db' : 'transparent' }}>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {p.photo.value ? (
                          <img src={p.photo.value} alt={p.name.value || '头像'} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dee2e6', color: '#868e96', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', margin: '0 auto' }}>无</div>
                        )}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="text"
                          value={p.name.value || ''}
                          onChange={(e) => handlePlayerChange(pIdx, 'name', e.target.value)}
                          style={{ width: '100px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '13px' }}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="text"
                          value={p.studentId.value || ''}
                          onChange={(e) => handlePlayerChange(pIdx, 'studentId', e.target.value)}
                          style={{ width: '130px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '13px' }}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="text"
                          value={p.jerseyNumber.value || ''}
                          onChange={(e) => handlePlayerChange(pIdx, 'jerseyNumber', e.target.value)}
                          style={{ width: '60px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '13px' }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        {isLowConf ? (
                          <button
                            type="button"
                            onClick={() => handleTogglePlayerConfirm(pIdx)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid',
                              borderColor: p.photo.manuallyConfirmed ? '#40c057' : '#f59f00',
                              background: p.photo.manuallyConfirmed ? '#ebfbee' : '#fff9db',
                              color: p.photo.manuallyConfirmed ? '#2b8a3e' : '#f59f00',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <UserCheck size={12} />
                            {p.photo.manuallyConfirmed ? '已核对确认' : '需人工确认'}
                          </button>
                        ) : (
                          <span style={{ color: '#2b8a3e', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} /> 高置信匹配
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: '#f1f3f5', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', border: '1px solid #ced4da' }}>
                          <ImageIcon size={12} />
                          更换
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isBusy}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleSinglePhotoUpload(pIdx, f);
                            }}
                            style={{ display: 'none' }}
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handleCancel}
              disabled={isBusy}
              style={{ padding: '8px 20px', background: '#f1f3f5', color: '#495057', border: '1px solid #ced4da', borderRadius: '6px', cursor: isBusy ? 'not-allowed' : 'pointer' }}
            >
              取消
            </button>
            <button
              onClick={handleCommit}
              disabled={isBusy}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 24px', background: '#228be6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: isBusy ? 'not-allowed' : 'pointer' }}
            >
              <Check size={16} />
              {isLoading ? '正在回填...' : '回填当前球队到录入表单'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfImporter;
