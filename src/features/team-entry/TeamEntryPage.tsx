import React, { useEffect, useState } from 'react';
import { Save, Download, Trophy, FileJson, Loader2, AlertCircle, FileText, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import TeamForm from './components/TeamForm';
import PlayerList from './components/PlayerList';
import ExcelImporter from '../../components/ExcelImporter';
import PdfImporter from '../../components/PdfImporter';
import { ParsedTeam, pdfImportApi } from '../../api/pdf-import.service';
import SuccessToast from '../../components/SuccessToast';
import { Team, TeamFormData, Player } from '../../types';
import { generateId } from '../../utils';
import { seasonApi } from '../../api/service';
import { SeasonDTO } from '../../api/types';
import { useAuth } from '../../contexts/AuthContext';
import {
  createTeam,
  getCompatibleActiveSeasons,
  selectActiveSeasonId,
  validateTeamCreation,
} from '../team-create';

interface PdfTeamDraft {
  formData: TeamFormData;
  players: Player[];
}

const downloadPdfImage = async (
  batchId: string,
  url: string | null | undefined,
  fileName: string,
) => {
  if (!url) return null;
  const blob = await pdfImportApi.downloadAsset(batchId, url);
  return new File([blob], fileName, { type: blob.type || 'image/webp' });
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
};

const TeamEntryPage: React.FC = () => {
  const { user } = useAuth();
  const [teamFormData, setTeamFormData] = useState<TeamFormData>({
    teamName: '',
    teamDoctor: '',
    headCoach: '',
    teamLeader: '',
    coachPhone: '',
    leaderPhone: '',
    homeJerseyColor: '',
    awayJerseyColor: '',
    teamLogo: null,
    homeJersey: null,
    awayJersey: null,
    gender: 'MALE',
    seasonId: '',
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [activeSeasons, setActiveSeasons] = useState<SeasonDTO[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTeam, setSavedTeam] = useState<Team | null>(null);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [showPdfImporter, setShowPdfImporter] = useState(false);
  const [pdfImportMessage, setPdfImportMessage] = useState<string | null>(null);
  const [pendingPdfDrafts, setPendingPdfDrafts] = useState<PdfTeamDraft[]>([]);

  useEffect(() => {
    let cancelled = false;
    seasonApi.getAll()
      .then((seasons) => {
        if (!cancelled) {
          setActiveSeasons(seasons.filter((season) => season.status === 'active'));
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : '未知错误';
          setError(`加载活跃赛季失败：${message}`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const compatibleActiveSeasons = getCompatibleActiveSeasons(
    activeSeasons,
    teamFormData.gender,
  );

  useEffect(() => {
    setTeamFormData((previous) => {
      const seasonId = selectActiveSeasonId(
        activeSeasons,
        previous.gender,
        previous.seasonId,
      );
      if (seasonId === previous.seasonId) {
        return previous;
      }
      return { ...previous, seasonId };
    });
  }, [activeSeasons, teamFormData.gender]);

  const handleAddPlayer = (player: Omit<Player, 'id'>) => {
    const sId = String(player.studentId).trim();
    const jNum = String(player.jerseyNumber ?? '').trim();
    if (players.some((p) => p.studentId === sId)) {
      setError(`已存在学号为 ${sId} 的球员`);
      return;
    }
    if (players.some((p) => String(p.jerseyNumber ?? '') === jNum)) {
      setError(`球衣号码 ${jNum} 在本队中已被占用`);
      return;
    }
    setPlayers((prev) => [...prev, { ...player, studentId: sId, jerseyNumber: jNum, id: generateId() }]);
    setError(null);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setError(null);
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    setError(null);
  };

  const handleImportPlayers = (importedPlayers: Omit<Player, 'id'>[]) => {
    const mergedPlayers = [...players];
    let studentIdDupCount = 0;
    let jerseyNumDupCount = 0;

    for (const p of importedPlayers) {
      const sId = String(p.studentId ?? '').trim();
      const jNum = String(p.jerseyNumber ?? '').trim();
      if (mergedPlayers.some((mp) => mp.studentId === sId)) {
        studentIdDupCount++;
        continue;
      }
      if (mergedPlayers.some((mp) => String(mp.jerseyNumber ?? '') === jNum)) {
        jerseyNumDupCount++;
        continue;
      }
      mergedPlayers.push({
        ...p,
        studentId: sId,
        jerseyNumber: jNum,
        id: generateId()
      });
    }

    setPlayers(mergedPlayers);
    setError(null);

    if (studentIdDupCount > 0 || jerseyNumDupCount > 0) {
      let msg = `成功导入 ${importedPlayers.length - studentIdDupCount - jerseyNumDupCount} 名球员。`;
      if (studentIdDupCount > 0) msg += `跳过了 ${studentIdDupCount} 名学号重复的球员。`;
      if (jerseyNumDupCount > 0) msg += `跳过了 ${jerseyNumDupCount} 名球衣号码重复的球员。`;
      alert(msg);
    } else {
      alert(`成功导入 ${importedPlayers.length} 名球员`);
    }
  };

  const validateForm = (): boolean => {
    const validationError = validateTeamCreation(teamFormData, players);
    setError(validationError);
    return validationError === null;
  };

  const handleSave = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const team = await createTeam(teamFormData, players, setSaveProgress);

      setSavedTeam(team);
      setIsSaved(true);
      setError(null);

      if (pendingPdfDrafts.length > 0) {
        const [nextDraft, ...remainingDrafts] = pendingPdfDrafts;
        setTeamFormData(nextDraft.formData);
        setPlayers(nextDraft.players);
        setPendingPdfDrafts(remainingDrafts);
        setPdfImportMessage(
          `当前球队已保存，已自动载入下一支 PDF 球队；剩余 ${remainingDrafts.length} 支待录入。`,
        );
      }

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (err) {
      console.error('保存球队信息失败:', err);
      if (err instanceof Error) {
        setError('保存失败: ' + err.message);
      } else {
        setError('保存失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
      setSaveProgress(null);
    }
  };

  const handlePdfTeamsRecognized = async ({
    batchId,
    teams,
  }: {
    batchId: string;
    teams: ParsedTeam[];
  }) => {
    if (teams.length === 0) {
      throw new Error('PDF 中没有可回填的球队');
    }

    // 限制并发下载，避免一支球队的全部图片瞬间打满 Serverless 请求额度。
    const drafts = await mapWithConcurrency(
      teams,
      1,
      async (team, teamIndex): Promise<PdfTeamDraft> => {
        const [teamLogo, homeJersey, awayJersey, importedPlayers] = await Promise.all([
          downloadPdfImage(batchId, team.logo?.value, `team-${teamIndex + 1}-logo.webp`),
          downloadPdfImage(
            batchId,
            team.homeJerseyPhoto?.value,
            `team-${teamIndex + 1}-home.webp`,
          ),
          downloadPdfImage(
            batchId,
            team.awayJerseyPhoto?.value,
            `team-${teamIndex + 1}-away.webp`,
          ),
          mapWithConcurrency(
            team.players,
            4,
            async (player, playerIndex): Promise<Player> => {
              const photoFile = await downloadPdfImage(
                batchId,
                player.photo.value,
                `team-${teamIndex + 1}-player-${playerIndex + 1}.webp`,
              );
              return {
                id: generateId(),
                name: player.name.value || '',
                studentId: player.studentId.value || '',
                jerseyNumber: player.jerseyNumber.value || '',
                photo: photoFile ? URL.createObjectURL(photoFile) : null,
                photoFile,
                teamId: '',
              };
            },
          ),
        ]);

        return {
          formData: {
            teamName: team.teamName.value || '',
            teamDoctor: team.teamDoctor.value || '',
            headCoach: team.headCoach.value || '',
            teamLeader: team.teamLeader.value || '',
            coachPhone: team.coachPhone.value || '',
            leaderPhone: team.leaderPhone.value || '',
            homeJerseyColor: team.homeJerseyColor.value || '',
            awayJerseyColor: team.awayJerseyColor.value || '',
            teamLogo,
            homeJersey,
            awayJersey,
            gender: teamFormData.gender,
            seasonId: teamFormData.seasonId,
          },
          players: importedPlayers,
        };
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
  };

  const handleExportJson = () => {
    if (!savedTeam) {
      setError('请先保存球队信息');
      return;
    }

    const dataStr = JSON.stringify(savedTeam, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${savedTeam.teamName}_球队信息.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!savedTeam) {
      setError('请先保存球队信息');
      return;
    }

    const teamInfo = [
      { '信息类型': '队伍名称', '内容': savedTeam.teamName },
      { '信息类型': '队医姓名', '内容': savedTeam.teamDoctor },
      { '信息类型': '主教练姓名', '内容': savedTeam.headCoach },
      { '信息类型': '领队姓名', '内容': savedTeam.teamLeader },
      { '信息类型': '主教练联系方式', '内容': savedTeam.coachPhone },
      { '信息类型': '领队联系方式', '内容': savedTeam.leaderPhone },
      { '信息类型': '主队球衣颜色', '内容': savedTeam.homeJerseyColor },
      { '信息类型': '客队球衣颜色', '内容': savedTeam.awayJerseyColor },
    ];

    const playerData = savedTeam.players?.map((player) => ({
      '姓名': player.name,
      '学号': player.studentId,
      '球衣号码': player.jerseyNumber,
    })) || [];

    const workbook = XLSX.utils.book_new();
    
    const teamSheet = XLSX.utils.json_to_sheet(teamInfo);
    XLSX.utils.book_append_sheet(workbook, teamSheet, '球队信息');

    const playerSheet = XLSX.utils.json_to_sheet(playerData);
    XLSX.utils.book_append_sheet(workbook, playerSheet, '球员名单');

    XLSX.writeFile(workbook, `${savedTeam.teamName}_球队信息.xlsx`);
  };

  if (user && user.role === 'coach' && user.teamId) {
    return (
      <div className="team-info-page">
        <header className="page-header">
          <div className="header-content">
            <h1>
              <Trophy className="trophy-icon" />
              校园足球比赛球队信息录入系统
            </h1>
            <p>录入球队信息和参赛队员资料</p>
          </div>
        </header>
        <main className="page-content">
          <div className="error-message" style={{ margin: '40px auto', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', textAlign: 'center', padding: '30px', background: '#fff', border: '1px solid #e9ecef', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <AlertCircle size={48} color="#e67e22" style={{ stroke: '#e67e22' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#333', marginTop: '10px' }}>您已拥有绑定的球队</h2>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
              系统检测到您已分配或注册了所辖球队。如需修改球员名单、球衣颜色、联系方式或日常名单维护，请直接前往左侧导航的 <strong>【球队信息管理】</strong> 菜单。
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Trophy className="trophy-icon" />
            校园足球比赛球队信息录入系统
          </h1>
          <p>录入球队信息和参赛队员资料</p>
        </div>
      </header>

      <main className="page-content">
        {isSaved && <SuccessToast message="球队信息录入成功！" />}

        {pdfImportMessage && (
          <SuccessToast message={pdfImportMessage} onClose={() => setPdfImportMessage(null)} />
        )}

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {user?.role === 'super_admin' && (
          <section
            className="form-section"
            style={{
              border: '1px solid #a5d8ff',
              background: '#f8fbff',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h2 className="form-title" style={{ marginBottom: '6px' }}>
                  <FileText size={20} />
                  PDF 报名表批量导入
                </h2>
                <p style={{ margin: 0, color: '#5c677d', fontSize: '14px' }}>
                  可上传一份包含多支球队的官方 PDF，逐队预览；确认当前球队后即可回填到下方录入表单继续修改。
                </p>
              </div>
              <button
                type="button"
                className="add-btn"
                onClick={() => {
                  setShowPdfImporter((visible) => !visible);
                  setPdfImportMessage(null);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {showPdfImporter ? <X size={16} /> : <FileText size={16} />}
                {showPdfImporter ? '关闭 PDF 导入' : '上传多球队 PDF'}
              </button>
            </div>

            {showPdfImporter && (
              <div style={{ marginTop: '18px' }}>
                <PdfImporter
                  onImportSuccess={handlePdfTeamsRecognized}
                  onClose={() => setShowPdfImporter(false)}
                />
              </div>
            )}
          </section>
        )}

        <div className="form-section">
          <TeamForm
            data={teamFormData}
            onChange={setTeamFormData}
            activeSeasons={compatibleActiveSeasons}
          />
        </div>

        <div className="player-section">
          <PlayerList
            players={players}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onUpdatePlayer={handleUpdatePlayer}
          />
        </div>

        <div className="importer-section">
          <ExcelImporter onImport={handleImportPlayers} />
        </div>
      </main>

      <footer className="page-footer">
        <div className="footer-actions">
          <button onClick={handleExportExcel} className="export-btn">
            <Download size={18} />
            导出为 Excel
          </button>
          <button onClick={handleExportJson} className="export-btn">
            <FileJson size={18} />
            导出为 JSON
          </button>
          <button 
            onClick={handleSave} 
            className="save-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="loader" />
                保存中...
              </>
            ) : (
              <>
                <Save size={18} />
                保存球队信息
              </>
            )}
          </button>
        </div>
      </footer>

      {saveProgress && (
        <div className="progress-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div className="progress-card" style={{
            backgroundColor: '#ffffff',
            padding: '24px 32px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center',
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#333' }}>
              正在同步球队与球员数据...
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
              {saveProgress.message} ({saveProgress.current}/{saveProgress.total})
            </p>
            <div className="progress-bar-container" style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '8px',
            }}>
              <div className="progress-bar-fill" style={{
                width: `${(saveProgress.current / saveProgress.total) * 100}%`,
                height: '100%',
                backgroundColor: '#3b5bdb',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: '12px', color: '#868e96' }}>
              请勿关闭或刷新页面
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamEntryPage;
