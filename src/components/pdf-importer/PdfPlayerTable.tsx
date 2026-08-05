import React from 'react';
import { AlertTriangle, Check, Image as ImageIcon, UserCheck } from 'lucide-react';
import { ParsedTeam } from '../../api/pdf-import.service';

interface PdfPlayerTableProps {
  currentTeam: ParsedTeam;
  hasLowConfidence: boolean;
  isBusy: boolean;
  onPlayerChange: (
    playerIndex: number,
    field: 'name' | 'studentId' | 'jerseyNumber',
    value: string,
  ) => void;
  onTogglePlayerConfirm: (playerIndex: number) => void;
  onSinglePhotoUpload: (playerIndex: number, photoFile: File) => Promise<void>;
}

export const PdfPlayerTable: React.FC<PdfPlayerTableProps> = ({
  currentTeam,
  hasLowConfidence,
  isBusy,
  onPlayerChange,
  onTogglePlayerConfirm,
  onSinglePhotoUpload,
}) => {
  return (
    <>
      <div
        style={{
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '15px' }}>
          球员名单与免冠照列表 ({currentTeam.players.length}人)
        </h4>
        {hasLowConfidence && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: '#fff9db',
              border: '1px solid #ffe066',
              color: '#f59f00',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            <AlertTriangle size={14} />
            包含黄色低置信度预警项，请核对并勾选确认
          </span>
        )}
      </div>

      <div
        style={{
          maxHeight: '350px',
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
        }}
      >
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
            {currentTeam.players.map((p, pIdx) => {
              const isLowConf = p.photo.confidence < 0.8 || p.needsManualConfirm;
              return (
                <tr
                  key={pIdx}
                  style={{
                    borderBottom: '1px solid #f1f3f5',
                    background: isLowConf && !p.photo.manuallyConfirmed ? '#fff9db' : 'transparent',
                  }}
                >
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {p.photo.value ? (
                      <img
                        src={p.photo.value}
                        alt={p.name.value || '头像'}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: '#dee2e6',
                          color: '#868e96',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          margin: '0 auto',
                        }}
                      >
                        无
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input
                      type="text"
                      value={p.name.value || ''}
                      onChange={(e) => onPlayerChange(pIdx, 'name', e.target.value)}
                      style={{
                        width: '100px',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        border: '1px solid #ced4da',
                        fontSize: '13px',
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input
                      type="text"
                      value={p.studentId.value || ''}
                      onChange={(e) => onPlayerChange(pIdx, 'studentId', e.target.value)}
                      style={{
                        width: '130px',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        border: '1px solid #ced4da',
                        fontSize: '13px',
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input
                      type="text"
                      value={p.jerseyNumber.value || ''}
                      onChange={(e) => onPlayerChange(pIdx, 'jerseyNumber', e.target.value)}
                      style={{
                        width: '60px',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        border: '1px solid #ced4da',
                        fontSize: '13px',
                      }}
                    />
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {isLowConf ? (
                      <button
                        type="button"
                        onClick={() => onTogglePlayerConfirm(pIdx)}
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
                      <span
                        style={{
                          color: '#2b8a3e',
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Check size={12} /> 高置信匹配
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: '#f1f3f5',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        border: '1px solid #ced4da',
                      }}
                    >
                      <ImageIcon size={12} />
                      更换
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isBusy}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void onSinglePhotoUpload(pIdx, f);
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
    </>
  );
};

export default PdfPlayerTable;
