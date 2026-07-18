import { SeasonDTO } from '../../api/types';

export type TeamGender = 'MALE' | 'FEMALE';

export const getSeasonGender = (seasonName: string): TeamGender | null => {
  if (seasonName.includes('女')) return 'FEMALE';
  if (seasonName.includes('男')) return 'MALE';
  return null;
};

export const getCompatibleActiveSeasons = (
  seasons: SeasonDTO[],
  teamGender: string,
): SeasonDTO[] => seasons.filter((season) => {
  if (season.status !== 'active') return false;
  const seasonGender = getSeasonGender(season.name);
  return seasonGender === null || seasonGender === teamGender;
});

export const selectActiveSeasonId = (
  seasons: SeasonDTO[],
  teamGender: string,
  currentSeasonId: string,
): string => {
  const compatibleSeasons = getCompatibleActiveSeasons(seasons, teamGender);
  if (compatibleSeasons.some((season) => season.id === currentSeasonId)) {
    return currentSeasonId;
  }

  const exactGenderSeason = compatibleSeasons.find(
    (season) => getSeasonGender(season.name) === teamGender,
  );
  return (exactGenderSeason || compatibleSeasons[0])?.id || '';
};
