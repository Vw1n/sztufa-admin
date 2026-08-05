import React from 'react';
import { ParsedTeam } from '../../api/pdf-import.service';

interface PdfTeamInfoEditorProps {
  currentTeam: ParsedTeam;
  activeTeamIndex: number;
  isBusy: boolean;
  uploadingTeamAsset: 'logo' | 'homeJerseyPhoto' | 'awayJerseyPhoto' | null;
  onFieldChange: (
    fieldPath:
      | 'teamName'
      | 'headCoach'
      | 'coachPhone'
      | 'teamLeader'
      | 'leaderPhone'
      | 'teamDoctor'
      | 'homeJerseyColor'
      | 'awayJerseyColor',
    value: string,
  ) => void;
  onTeamAssetUpload: (
    field: 'logo' | 'homeJerseyPhoto' | 'awayJerseyPhoto',
    imageFile: File,
  ) => Promise<void>;
}

export const PdfTeamInfoEditor: React.FC<PdfTeamInfoEditorProps> = ({
  currentTeam,
  activeTeamIndex,
  isBusy,
  uploadingTeamAsset,
  onFieldChange,
  onTeamAssetUpload,
}) => {
  return (
    <div
      className="team-card"
      style={{
        background: '#f8f9fa',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        border: '1px solid #e9ecef',
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', color: '#343a40', fontSize: '15px' }}>
        球队基本信息校对
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        <div>
          <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>球队名称</label>
          <input
            type="text"
            value={currentTeam.teamName.value || ''}
            onChange={(e) => onFieldChange('teamName', e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>主教练</label>
          <input
            type="text"
            value={currentTeam.headCoach.value || ''}
            onChange={(e) => onFieldChange('headCoach', e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>教练电话</label>
          <input
            type="text"
            value={currentTeam.coachPhone.value || ''}
            onChange={(e) => onFieldChange('coachPhone', e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>领队姓名</label>
          <input
            type="text"
            value={currentTeam.teamLeader.value || ''}
            onChange={(e) => onFieldChange('teamLeader', e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>
            主场球衣颜色
          </label>
          <input
            type="text"
            value={currentTeam.homeJerseyColor.value || ''}
            onChange={(e) => onFieldChange('homeJerseyColor', e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>
            客场球衣颜色
          </label>
          <input
            type="text"
            value={currentTeam.awayJerseyColor.value || ''}
            onChange={(e) => onFieldChange('awayJerseyColor', e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))',
          gap: '12px',
          marginTop: '16px',
        }}
      >
        {([
          ['logo', '球队队徽'],
          ['homeJerseyPhoto', '主场球衣'],
          ['awayJerseyPhoto', '客场球衣'],
        ] as const).map(([field, label]) => {
          const asset = currentTeam[field];
          const inputId = `pdf-${field}-${activeTeamIndex}`;
          return (
            <div
              key={field}
              style={{
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '10px',
                background: '#fff',
              }}
            >
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>{label}</div>
              <div
                style={{
                  height: '110px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                {asset?.value ? (
                  <img
                    src={asset.value}
                    alt={label}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
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
                  if (selected) void onTeamAssetUpload(field, selected);
                  event.target.value = '';
                }}
                style={{ display: 'none' }}
              />
              <label
                htmlFor={inputId}
                style={{
                  display: 'block',
                  marginTop: '8px',
                  padding: '6px',
                  textAlign: 'center',
                  border: '1px solid #ced4da',
                  borderRadius: '5px',
                  cursor: isBusy ? 'wait' : 'pointer',
                  fontSize: '12px',
                }}
              >
                {uploadingTeamAsset === field ? '上传中...' : asset?.value ? '更换图片' : '补充图片'}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PdfTeamInfoEditor;
