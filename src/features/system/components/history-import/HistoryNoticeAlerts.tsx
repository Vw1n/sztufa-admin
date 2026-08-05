import React from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { ImportExecutionResult, UndoImportResult } from '../../../../api/types';

interface HistoryNoticeAlertsProps {
  error: string | null;
  result: ImportExecutionResult | null;
  undoResult: UndoImportResult | null;
}

export const HistoryNoticeAlerts: React.FC<HistoryNoticeAlertsProps> = ({
  error,
  result,
  undoResult,
}) => {
  return (
    <>
      {error && (
        <div className="history-notice error">
          <div className="history-notice-title">
            <AlertTriangle size={16} />
            操作失败
          </div>
          {error}
        </div>
      )}

      {result && (
        <div className="history-notice success">
          <div className="history-notice-title">
            <CheckCircle2 size={17} />
            导入完成
          </div>
          新增 {result.created.seasons} 个赛季、{result.created.teams} 支球队、
          {result.created.players} 名球员、{result.created.matches} 场比赛；更新{' '}
          {result.updated.players} 名球员和 {result.updated.matches} 场比赛。
        </div>
      )}

      {undoResult && (
        <div className="history-notice success">
          <div className="history-notice-title">
            <RotateCcw size={17} />
            撤销完成
          </div>
          已处理 {undoResult.affectedSeasons} 个赛季，删除本批次新增的 {undoResult.deletedPlayers}{' '}
          名球员和 {undoResult.deletedMatches} 场比赛， 恢复 {undoResult.restoredPlayers} 名球员和{' '}
          {undoResult.restoredMatches} 场比赛。
        </div>
      )}
    </>
  );
};

export default HistoryNoticeAlerts;
