import React from 'react';
import { RotateCcw } from 'lucide-react';
import { LastImportBatch } from '../../../../api/types';

interface LastImportUndoCardProps {
  lastImport: LastImportBatch;
  isUndoing: boolean;
  isImporting: boolean;
  onUndoLastImport: () => void;
}

export const LastImportUndoCard: React.FC<LastImportUndoCardProps> = ({
  lastImport,
  isUndoing,
  isImporting,
  onUndoLastImport,
}) => {
  return (
    <div className="history-undo-card">
      <div>
        <strong>最近一次导入可撤销</strong>
        <small>
          {new Date(lastImport.createdAt).toLocaleString('zh-CN')} · 操作人 {lastImport.username} ·{' '}
          {lastImport.summary.created.seasons + lastImport.summary.updated.seasons} 个赛季、
          {lastImport.summary.created.matches + lastImport.summary.updated.matches} 场比赛
        </small>
      </div>
      <button
        className="history-action"
        type="button"
        disabled={isUndoing || isImporting}
        onClick={() => {
          if (
            window.confirm(
              '确定撤销最近一次历史 JSON 导入吗？\n\n系统将删除本批次新增数据，并恢复被覆盖前的比赛和球员信息。',
            )
          ) {
            onUndoLastImport();
          }
        }}
      >
        <RotateCcw size={16} className={isUndoing ? 'spinning' : ''} />
        {isUndoing ? '正在撤销…' : '撤销上一次导入'}
      </button>
    </div>
  );
};

export default LastImportUndoCard;
