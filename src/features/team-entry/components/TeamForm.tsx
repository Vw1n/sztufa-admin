import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import { TeamFormData } from '../../../types';
import { SeasonDTO } from '../../../api/types';
import { validateImageFile } from '../../../utils/imageUpload';

interface TeamFormProps {
  data: TeamFormData;
  onChange: (data: TeamFormData) => void;
  activeSeasons: SeasonDTO[];
  isSuperAdmin?: boolean;
  disabled?: boolean;
}

const TeamForm: React.FC<TeamFormProps> = ({ data, onChange, activeSeasons, disabled = false }) => {
  const [preview, setPreview] = useState<{ [key: string]: string }>({});
  const { teamLogo, homeJersey, awayJersey } = data;

  useEffect(() => {
    const objectUrls: string[] = [];
    const nextPreview: { [key: string]: string } = {};
    for (const field of ['teamLogo', 'homeJersey', 'awayJersey'] as const) {
      const image = { teamLogo, homeJersey, awayJersey }[field];
      if (image instanceof File) {
        const url = URL.createObjectURL(image);
        objectUrls.push(url);
        nextPreview[field] = url;
      } else if (typeof image === 'string') {
        nextPreview[field] = image;
      }
    }
    setPreview(nextPreview);
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [teamLogo, homeJersey, awayJersey]);

  const handleFieldChange = (field: keyof TeamFormData, value: string) => {
    if (disabled) return;
    onChange({ ...data, [field]: value });
  };

  const handleFileChange = (
    field: 'teamLogo' | 'homeJersey' | 'awayJersey',
    file: File | null
  ) => {
    if (disabled) return;
    if (file) {
      try {
        validateImageFile(file, '球队图片');
      } catch (error) {
        alert(error instanceof Error ? error.message : '图片校验失败');
        return;
      }
    } else {
      setPreview((prev) => {
        const newPreview = { ...prev };
        delete newPreview[field];
        return newPreview;
      });
    }
    onChange({ ...data, [field]: file });
  };

  const renderImageUpload = (
    label: string,
    field: 'teamLogo' | 'homeJersey' | 'awayJersey'
  ) => (
    <div className="image-upload">
      <label>{label}</label>
      <div className={`upload-area ${disabled ? 'disabled' : ''}`}>
        {preview[field] ? (
          <img src={preview[field]} alt={label} className="preview-image" />
        ) : (
          <div className="upload-placeholder">
            <Upload size={32} />
            <span>{disabled ? '未提供图片' : '点击上传图片'}</span>
          </div>
        )}
        {!disabled && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
            className="file-input"
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="team-form">
      <h2 className="form-title">
        <span className="icon">⚽</span> 球队信息
      </h2>

      <div className="form-row">
        <div className="form-group">
          <label>队伍名称</label>
          <input
            type="text"
            value={data.teamName}
            disabled={disabled}
            onChange={(e) => handleFieldChange('teamName', e.target.value)}
            placeholder="请输入队伍名称"
            maxLength={100}
          />
        </div>
        <div className="form-group">
          <label>球队组别</label>
          <select
            value={data.gender || 'MALE'}
            disabled={disabled}
            onChange={(e) => handleFieldChange('gender', e.target.value)}
            style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff' }}
          >
            <option value="MALE">男子组 (Men's)</option>
            <option value="FEMALE">女子组 (Women's)</option>
          </select>
        </div>
        <div className="form-group">
          <label>所属活跃赛季</label>
          <select
            value={data.seasonId}
            disabled={disabled}
            onChange={(e) => handleFieldChange('seasonId', e.target.value)}
            style={{ width: '100%', height: '42px', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff' }}
          >
            <option value="">暂不选择赛季</option>
            {activeSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}（当前活跃）
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>主教练姓名</label>
          <input
            type="text"
            value={data.headCoach}
            disabled={disabled}
            onChange={(e) => handleFieldChange('headCoach', e.target.value)}
            placeholder="请输入主教练姓名"
          />
        </div>
        <div className="form-group">
          <label>领队姓名</label>
          <input
            type="text"
            value={data.teamLeader}
            disabled={disabled}
            onChange={(e) => handleFieldChange('teamLeader', e.target.value)}
            placeholder="请输入领队姓名"
          />
        </div>
        <div className="form-group">
          <label>队医姓名</label>
          <input
            type="text"
            value={data.teamDoctor}
            disabled={disabled}
            onChange={(e) => handleFieldChange('teamDoctor', e.target.value)}
            placeholder="请输入队医姓名"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>主教练联系方式</label>
          <input
            type="tel"
            value={data.coachPhone}
            disabled={disabled}
            onChange={(e) => handleFieldChange('coachPhone', e.target.value)}
            placeholder="请输入主教练手机号"
          />
        </div>
        <div className="form-group">
          <label>领队联系方式</label>
          <input
            type="tel"
            value={data.leaderPhone}
            disabled={disabled}
            onChange={(e) => handleFieldChange('leaderPhone', e.target.value)}
            placeholder="请输入领队手机号"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>主队球衣颜色</label>
          <input
            type="text"
            value={data.homeJerseyColor}
            disabled={disabled}
            onChange={(e) => handleFieldChange('homeJerseyColor', e.target.value)}
            placeholder="请输入主队球衣颜色，如：蓝色、红色"
          />
        </div>
        <div className="form-group">
          <label>客队球衣颜色</label>
          <input
            type="text"
            value={data.awayJerseyColor}
            disabled={disabled}
            onChange={(e) => handleFieldChange('awayJerseyColor', e.target.value)}
            placeholder="请输入客队球衣颜色，如：白色、黑色"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group image-group">
          {renderImageUpload('队徽', 'teamLogo')}
        </div>
        <div className="form-group image-group">
          {renderImageUpload('主场球衣', 'homeJersey')}
        </div>
        <div className="form-group image-group">
          {renderImageUpload('客场球衣', 'awayJersey')}
        </div>
      </div>
    </div>
  );
};

export default TeamForm;
