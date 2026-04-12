// Hardcoded weekly schedule
// day 1=Monday … 5=Friday

export const WEEKLY_SCHEDULE: Record<number, string[]> = {
  1: ['English', 'Ingurune', 'Mate', 'Gazte'],
  2: ['Euskera', 'English', 'Plastika', 'Bertsolaritza'],
  3: ['Musika', 'Mate', 'English', 'Plastika', 'Euskara'],
  4: ['Ingurune', 'English', 'H.F.', 'Gazte'],
  5: ['Tutoretza', 'Mate', 'Euskara'],
};

/** Returns today's subject names (empty array on weekends). */
export function getTodaySubjects(): string[] {
  const dow = new Date().getDay(); // 0=Sun … 6=Sat
  return WEEKLY_SCHEDULE[dow] ?? [];
}
