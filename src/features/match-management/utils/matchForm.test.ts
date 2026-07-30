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
});
