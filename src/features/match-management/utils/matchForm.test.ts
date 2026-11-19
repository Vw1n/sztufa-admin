import { MatchFormData } from '../../../types';
import { buildMatchDto, validateMatchForm } from './matchForm';

const form = (overrides: Partial<MatchFormData> = {}): MatchFormData => ({
  matchName: 'Home vs Away',
  matchTime: '2026-07-30T19:00',
  homeTeamId: 'home',
  awayTeamId: 'away',
  homeTeamName: 'Home',
  awayTeamName: 'Away',
  homeTeamScore: '0',
  awayTeamScore: '1',
  homeTeamGoals: [],
  awayTeamGoals: [],
  events: [
    {
      eventTime: "10'",
      eventType: 'own_goal',
      playerId: '',
      playerName: '',
      description: '',
      teamType: 'home',
    },
  ],
  matchDate: '2026-07-30',
  location: '北区足球场',
  ...overrides,
});

describe('matchForm', () => {
  it.each(['1.5', '-1', '1abc', '1e2', 'Infinity', '9007199254740992'])('rejects invalid scores %s without truncating them', (score) => {
    expect(validateMatchForm(form({ homeTeamScore: score, events: [] }))).toBe('主队得分必须是非负整数');
    expect(validateMatchForm(form({ awayTeamScore: score, events: [] }))).toBe('客队得分必须是非负整数');
  });
  it('allows an own goal without an associated player', () => {
    const ownGoalForm = form();

    expect(validateMatchForm(ownGoalForm)).toBeNull();
    expect(buildMatchDto(ownGoalForm, []).goals?.[0]).toEqual(
      expect.objectContaining({
        playerId: null,
        playerName: '未记录球员 (乌龙)',
        teamType: 'away',
      }),
    );
  });

  it('allows a forfeit match with 3:0 or 0:3 score and no events', () => {
    const forfeitHomeWin = form({
      homeTeamScore: '3',
      awayTeamScore: '0',
      events: [],
    });
    const forfeitAwayWin = form({
      homeTeamScore: '0',
      awayTeamScore: '3',
      events: [],
    });

    expect(validateMatchForm(forfeitHomeWin)).toBeNull();
    expect(validateMatchForm(forfeitAwayWin)).toBeNull();
    expect(buildMatchDto(forfeitHomeWin, [])).toEqual(
      expect.objectContaining({ homeScore: 3, awayScore: 0, events: [] }),
    );
  });
});
