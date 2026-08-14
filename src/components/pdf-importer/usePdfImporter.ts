import { useState } from 'react';
import { ParsedTeam, pdfImportApi, PdfPreviewResponse } from '../../api/pdf-import.service';
import { getErrorMessage } from '../../utils/errors';

interface UsePdfImporterOptions {
  onImportSuccess: (importedData: { batchId: string; teams: ParsedTeam[] }) => void | Promise<void>;
  onClose?: () => void;
}

export const usePdfImporter = ({ onImportSuccess, onClose }: UsePdfImporterOptions) => {
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
    setPreviewData(null);
    setActiveTeamIndex(0);

    try {
      const res = await pdfImportApi.preview(file);
      setPreviewData(res);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'PDF 报名表识别解析失败，请检查文件格式'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, '图片上传失败'));
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, '球队图片上传失败'));
    } finally {
      setUploadingTeamAsset(null);
    }
  };

  const currentTeam = previewData?.teams[activeTeamIndex] || null;

  const handleCommit = async () => {
    if (!previewData || !currentTeam) return;

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
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'PDF 识别结果回填失败'));
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

  return {
    file,
    isLoading,
    error,
    setError,
    previewData,
    activeTeamIndex,
    setActiveTeamIndex,
    uploadingRowIndex,
    uploadingTeamAsset,
    currentTeam,
    isBusy,
    handleFileChange,
    handleUploadAndPreview,
    handleFieldChange,
    handlePlayerChange,
    handleTogglePlayerConfirm,
    handleSinglePhotoUpload,
    handleTeamAssetUpload,
    handleCommit,
    handleCancel,
  };
};
