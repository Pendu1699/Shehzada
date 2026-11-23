// The calendar. Each turn is half a year and opens on a gathering of the Sarbat Khalsa:
//   Vaisakhi (spring, after the Rabi harvest) — the following half-year holds the monsoon.
//   Diwali  (autumn, after the Kharif harvest) — the following half-year is the cold season,
//            when Afghan armies historically came down through the passes.

export type Festival = 'vaisakhi' | 'diwali';

export interface DateInfo {
  year: number;
  festival: Festival;
  /** The harvest just gathered when the turn opens. */
  harvest: 'rabi' | 'kharif';
  /** True if the coming half-year includes the monsoon (Vaisakhi turns). */
  monsoon: boolean;
  /** True if the coming half-year is the campaigning winter (Diwali turns). */
  winter: boolean;
  label: string;
}

export function dateOf(startYear: number, startFestival: Festival, turn: number): DateInfo {
  const halfIndex = turn + (startFestival === 'diwali' ? 1 : 0);
  const year = startYear + Math.floor(halfIndex / 2);
  const festival: Festival = halfIndex % 2 === 0 ? 'vaisakhi' : 'diwali';
  return {
    year,
    festival,
    harvest: festival === 'vaisakhi' ? 'rabi' : 'kharif',
    monsoon: festival === 'vaisakhi',
    winter: festival === 'diwali',
    label: `${festival === 'vaisakhi' ? 'Vaisakhi' : 'Diwali'} ${year}`,
  };
}

/** Number of turns from a start date to a target festival of a target year. */
export function turnsUntil(startYear: number, startFestival: Festival, year: number, festival: Festival): number {
  const a = startYear * 2 + (startFestival === 'diwali' ? 1 : 0);
  const b = year * 2 + (festival === 'diwali' ? 1 : 0);
  return b - a;
}

/** The game ends in March 1849, i.e. after the Diwali 1848 turn resolves. */
export const FINAL_YEAR = 1848;
export const FINAL_FESTIVAL: Festival = 'diwali';
