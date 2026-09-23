import { useCallback, useEffect, useRef, useState } from 'react';
import { pdfImportApi, ParsedTeam } from '../../../api/pdf-import.service';
import { Player, TeamFormData } from '../../../types';
import { generateId } from '../../../utils';
import { mapWithConcurrency } from '../utils/map-with-concurrency';
import {
  mapPlayerFieldsList,
  mapTeamFormFields,
} from '../utils/pdf-team-draft.mapper';

export interface PdfTeamDraft {
  formData: TeamFormData;
  players: Player[];
}

interface UsePdfTeamDraftQueueOptions {
  setTeamFormData: React.Dispatch<React.SetStateAction<TeamFormData>>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  /** 当前表单性别，用于回填到 PDF 识别出的球队 */
  gender: string;
  /** 当前赛季 ID，用于回填到 PDF 识别出的球队 */
  seasonId: string;
  /** 共享错误状态 setter */
  setError: (error: string | null) => void;
}

/** 下载 PDF 临时资产为 File */
const downloadPdfImage = async (
  batchId: string,
  url: string | null | undefined,
  fileName: string,
): Promise<File | null> => {
  if (!url) return null;
  const blob = await pdfImportApi.downloadAsset(batchId, url);
  return new File([blob], fileName, { type: blob.type || 'image/webp' });
};

/**
 * PDF 球队草稿队列 Hook。
 *
 * 职责：
 * - PDF 识别结果（ParsedTeam[]）→ 下载图片资产 → 组装为 PdfTeamDraft；
 * - 多球队队列管理：载入第一支，剩余排队，保存成功后自动载入下一支；
 * - 临时图片 object URL 的生命周期管理（创建、卸载时释放）；
 * - PDF 导入器显隐状态与提示消息。
 *
 * 关键约束（按解耦计划）：
 * - 文本字段映射由纯函数 pdf-team-draft.mapper 完成，本 Hook 只负责 IO 与状态；
 * - 球员图片下载保持 4 路并发限制（mapWithConcurrency concurrency=4）；
 * - 组件卸载时释放所有已创建的 object URL，避免内存泄漏。
 */
export function usePdfTeamDraftQueue({
  setTeamFormData,
  setPlayers,
  gender,
  seasonId,
  setError,
}: UsePdfTeamDraftQueueOptions) {
  const [pendingPdfDrafts, setPendingPdfDrafts] = useState<PdfTeamDraft[]>([]);
  const [showPdfImporter, setShowPdfImporter] = useState(false);
  const [pdfImportMessage, setPdfImportMessage] = useState<string | null>(null);

  // 追踪所有已创建的 object URL，用于卸载时统一释放
  const objectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  /**
   * 将一支 ParsedTeam 组装为 PdfTeamDraft（含图片下载与 object URL 创建）。
   */
  const assembleDraft = useCallback(
    async (batchId: string, team: ParsedTeam, teamIndex: number): Promise<PdfTeamDraft> => {
      const formFields = mapTeamFormFields(team, { gender, seasonId });
      const playerFieldsList = mapPlayerFieldsList(team.players);

      const [teamLogo, homeJersey, awayJersey, importedPlayers] = await Promise.all([
        downloadPdfImage(batchId, team.logo?.value, `team-${teamIndex + 1}-logo.webp`),
        downloadPdfImage(batchId, team.homeJerseyPhoto?.value, `team-${teamIndex + 1}-home.webp`),
        downloadPdfImage(batchId, team.awayJerseyPhoto?.value, `team-${teamIndex + 1}-away.webp`),
        mapWithConcurrency(
          team.players,
          4,
          async (player, playerIndex): Promise<Player> => {
            const photoFile = await downloadPdfImage(
              batchId,
              player.photo.value,
              `team-${teamIndex + 1}-player-${playerIndex + 1}.webp`,
            );
            const fields = playerFieldsList[playerIndex];
            const photo = photoFile ? URL.createObjectURL(photoFile) : null;
            if (photo) {
              objectUrlsRef.current.add(photo);
            }
            return {
              id: generateId(),
              name: fields.name,
              studentId: fields.studentId,
              jerseyNumber: fields.jerseyNumber,
              photo,
              photoFile: photoFile ?? undefined,
              teamId: '',
            };
          },
        ),
      ]);

      return {
        formData: {
          ...formFields,
          teamLogo,
          homeJersey,
          awayJersey,
        },
        players: importedPlayers,
      };
    },
    [gender, seasonId],
  );

  /**
   * PDF 识别成功回调：将多支球队组装为草稿，载入第一支，剩余排队。
   */
  const handlePdfTeamsRecognized = useCallback(
    async ({ batchId, teams }: { batchId: string; teams: ParsedTeam[] }) => {
      if (teams.length === 0) {
        throw new Error('PDF 中没有可回填的球队');
      }

      // 球队按顺序处理（concurrency=1），与原行为一致
      const drafts = await mapWithConcurrency(
        teams,
        1,
        async (team, teamIndex): Promise<PdfTeamDraft> => {
          return assembleDraft(batchId, team, teamIndex);
        },
      );

      const [firstDraft, ...remainingDrafts] = drafts;
      setTeamFormData(firstDraft.formData);
      setPlayers(firstDraft.players);
      setPendingPdfDrafts(remainingDrafts);
      setShowPdfImporter(false);
      setError(null);
      setPdfImportMessage(
        teams.length === 1
          ? 'PDF 信息已回填到球队录入表单，可继续修改后保存。'
          : `PDF 已识别 ${teams.length} 支球队，当前载入第 1 支；每次保存后自动载入下一支。`,
      );
    },
    [assembleDraft, setTeamFormData, setPlayers, setError],
  );

  /**
   * 保存成功后推进队列：载入下一支草稿（若有）。
   * 由 useTeamEntrySave 的 onSaveSuccess 回调触发。
   */
  const advanceQueue = useCallback(() => {
    setPendingPdfDrafts((current) => {
      if (current.length === 0) {
        return current;
      }
      const [nextDraft, ...remainingDrafts] = current;
      setTeamFormData(nextDraft.formData);
      setPlayers(nextDraft.players);
      setPdfImportMessage(
        `当前球队已保存，已自动载入下一支 PDF 球队；剩余 ${remainingDrafts.length} 支待录入。`,
      );
      return remainingDrafts;
    });
  }, [setTeamFormData, setPlayers]);

  return {
    pendingPdfDrafts,
    showPdfImporter,
    setShowPdfImporter,
    pdfImportMessage,
    setPdfImportMessage,
    handlePdfTeamsRecognized,
    advanceQueue,
  };
}

export type UsePdfTeamDraftQueueReturn = ReturnType<typeof usePdfTeamDraftQueue>;
