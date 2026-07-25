import React, { useState } from 'react';
import { AuditLogDTO } from '../../../api/types';
import {
  parseLogDetails,
  extractSubLogAttrs,
  parseSubLogItem,
} from '../utils/auditLogFormatter';

interface AuditLogDetailsProps {
  log: AuditLogDTO;
}

export const AuditLogDetails: React.FC<AuditLogDetailsProps> = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const details = log.details || '';

  if (log.subLogs && log.subLogs.length > 0) {
    const allAttrs = extractSubLogAttrs(log.subLogs);
    const attrsSuffix = allAttrs.length > 0 ? ` (修改了: ${allAttrs.join(', ')})` : '';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div>
          <span style={{ fontWeight: 500, color: '#2d3748' }}>{details}{attrsSuffix}</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#3182ce',
              cursor: 'pointer',
              padding: '0 6px',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'underline'
            }}
          >
            {isExpanded ? '收起明细 ▴' : '展开合并的全部明细 ▾'}
          </button>
        </div>
        {isExpanded && (
          <div style={{ marginTop: '4px', padding: '8px 12px', background: '#f7fafc', borderRadius: '6px', borderLeft: '3px solid #3182ce', fontSize: '13px', color: '#4a5568', lineHeight: '1.5' }}>
            {log.subLogs.map((sub, idx) => {
              const { mainText, diffText } = parseSubLogItem(sub.details || '');
              return (
                <div key={sub.id || idx} style={{ borderBottom: idx < (log.subLogs?.length || 0) - 1 ? '1px dashed #e2e8f0' : 'none', padding: '6px 0' }}>
                  <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '2px' }}>
                    ⏱️ {new Date(sub.createdAt).toLocaleTimeString()}
                  </div>
                  <div>
                    <span style={{ fontWeight: 500 }}>{mainText}</span>
                    {diffText && (
                      <span style={{ color: '#718096', fontSize: '12px', marginLeft: '5px' }}>
                        ({diffText})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const { summary, diffItems } = parseLogDetails(details);
  if (diffItems.length === 0) {
    return <span>{details}</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontWeight: 500, color: '#2d3748' }}>{summary}</span>
      <div style={{ fontSize: '12px', color: '#718096', paddingLeft: '8px', borderLeft: '2px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {diffItems.map((item, idx) => (
          <span key={idx} style={{ display: 'inline-block' }}>
            🔹 {item}
          </span>
        ))}
      </div>
    </div>
  );
};
