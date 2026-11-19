import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Save, Loader2, AlertCircle } from 'lucide-react';
import { useMatchForm } from './hooks/useMatchForm';
import MatchBasicInfo from './components/MatchBasicInfo';
import TeamScoreSection from './components/TeamScoreSection';
import LineupSection from './components/LineupSection';
import EventTable from './components/EventTable';
import SuccessToast from '../../components/SuccessToast';

import { useAuth } from '../../contexts/AuthContext';

const MatchManagementPage: React.FC = () => {
  const { user } = useAuth();
  const {
    formData,
    setFormData,
    activeSeasons,
    activeSeason,
    isSaved,
    isLoading,
    isVerifyingTeams,
    error,
    availableTeams,
    homeTeamPlayers,
    awayTeamPlayers,
    lineups,
    handleLineupChange,
    handleSeasonSelect,
    getFilteredTeams,
    addEvent,
    removeEvent,
    updateEvent,
    handleEventPlayerSelect,
    handleSubPlayerSelect,
    handleAssistPlayerSelect,
    handleSubmit,
    handleChange,
    handleTeamSelect,
  } = useMatchForm();

  return (
    <div className="match-entry-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Calendar className="trophy-icon" />
            比赛信息录入
          </h1>
          <p>录入比赛时间、比分及进球球员信息</p>
        </div>
      </header>

      <main className="page-content">
        {!activeSeason && <div className="form-section" role="status">
          <p>当前没有可录入比赛的活跃赛季，请先创建或激活赛季。</p>
          {user?.role === 'super_admin' && <Link to="/settings?tab=backup">前往赛季管理</Link>}
        </div>}
        {isSaved && <SuccessToast message="赛事信息录入成功！" />}

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset disabled={!activeSeason || isLoading} className="match-entry-fields">
          <MatchBasicInfo
            formData={formData}
            activeSeasons={activeSeasons}
            handleChange={handleChange}
            handleSeasonSelect={handleSeasonSelect}
            isSuperAdmin={user?.role === 'super_admin'}
          />

          <TeamScoreSection
            formData={formData}
            setFormData={setFormData}
            activeSeason={activeSeason}
            availableTeams={availableTeams}
            getFilteredTeams={getFilteredTeams}
            handleChange={handleChange}
            handleTeamSelect={handleTeamSelect}
            isSuperAdmin={user?.role === 'super_admin'}
          />

          <LineupSection
            homeTeamId={formData.homeTeamId}
            awayTeamId={formData.awayTeamId}
            homeTeamName={formData.homeTeamName}
            awayTeamName={formData.awayTeamName}
            homeTeamPlayers={homeTeamPlayers}
            awayTeamPlayers={awayTeamPlayers}
            lineups={lineups}
            handleLineupChange={handleLineupChange}
            isSuperAdmin={user?.role === 'super_admin'}
          />

          <EventTable
            teamType="home"
            events={formData.events}
            players={homeTeamPlayers}
            addEvent={addEvent}
            removeEvent={removeEvent}
            updateEvent={updateEvent}
            handleEventPlayerSelect={handleEventPlayerSelect}
            handleSubPlayerSelect={handleSubPlayerSelect}
            handleAssistPlayerSelect={handleAssistPlayerSelect}
            isSuperAdmin={user?.role === 'super_admin'}
          />

          <EventTable
            teamType="away"
            events={formData.events}
            players={awayTeamPlayers}
            addEvent={addEvent}
            removeEvent={removeEvent}
            updateEvent={updateEvent}
            handleEventPlayerSelect={handleEventPlayerSelect}
            handleSubPlayerSelect={handleSubPlayerSelect}
            handleAssistPlayerSelect={handleAssistPlayerSelect}
            isSuperAdmin={user?.role === 'super_admin'}
          />
          </fieldset>
        </form>
      </main>

      <footer className="page-footer">
        <div className="footer-actions">
          <button 
            onClick={handleSubmit} 
            className="save-btn"
            disabled={isLoading || !activeSeason}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="loader" />
                {isVerifyingTeams ? '验证球队信息中...' : '保存中...'}
              </>
            ) : (
              <>
                <Save size={18} />
                保存比赛信息
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default MatchManagementPage;
