import React from 'react';
import { Upload } from 'lucide-react';

export const HistoryImportHeader: React.FC = () => {
  return (
    <div className="history-import-heading">
      <div>
        <h2>
          <Upload size={21} />
          历史 JSON 智能导入
        </h2>
        <p>
          一次可上传多个重新分类后的分赛季 JSON。系统会自动识别赛季、球队、球员、比赛和事件，
          先展示新增与覆盖数量，确认后再一次性写入数据库。
        </p>
      </div>
      <span className="history-import-badge">仅超级管理员</span>
    </div>
  );
};

export default HistoryImportHeader;
