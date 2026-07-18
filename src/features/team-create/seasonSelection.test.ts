import {
  getCompatibleActiveSeasons,
  getSeasonGender,
  selectActiveSeasonId,
} from './seasonSelection';
import { SeasonDTO } from '../../api/types';

const seasons: SeasonDTO[] = [
  { id: 'male', name: '2026校长杯男子组', status: 'active', type: 'CUP' },
  { id: 'female', name: '2026校长杯女子组', status: 'active', type: 'LEAGUE' },
  { id: 'general', name: '2026校长杯', status: 'active', type: 'LEAGUE' },
  { id: 'archived', name: '2025校长杯男子组', status: 'archived', type: 'CUP' },
];

describe('team-create season selection', () => {
  it('infers gender only when the season name explicitly contains it', () => {
    expect(getSeasonGender('2026校长杯男子组')).toBe('MALE');
    expect(getSeasonGender('2026校长杯女子组')).toBe('FEMALE');
    expect(getSeasonGender('2026校长杯')).toBeNull();
  });

  it('keeps active gender-specific and general seasons', () => {
    expect(getCompatibleActiveSeasons(seasons, 'MALE').map((season) => season.id)).toEqual([
      'male',
      'general',
    ]);
    expect(getCompatibleActiveSeasons(seasons, 'FEMALE').map((season) => season.id)).toEqual([
      'female',
      'general',
    ]);
  });

  it('preserves a compatible current selection', () => {
    expect(selectActiveSeasonId(seasons, 'MALE', 'general')).toBe('general');
  });

  it('prefers the exact gender season when the current selection is incompatible', () => {
    expect(selectActiveSeasonId(seasons, 'MALE', 'female')).toBe('male');
    expect(selectActiveSeasonId(seasons, 'FEMALE', 'male')).toBe('female');
  });

  it('returns an empty selection when no compatible active season exists', () => {
    expect(selectActiveSeasonId([], 'MALE', '')).toBe('');
  });
});
