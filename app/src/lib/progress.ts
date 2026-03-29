/**
 * Calculate planned (Soll) weight for a given week
 */
export function getPlannedWeight(
  startWeight: number,
  targetWeight: number,
  totalWeeks: number,
  currentWeek: number
): number {
  const totalLoss = startWeight - targetWeight;
  const lossPerWeek = totalLoss / totalWeeks;
  return Math.round((startWeight - lossPerWeek * currentWeek) * 10) / 10;
}

/**
 * Determine course status based on Soll vs Ist
 */
export function getCourseStatus(
  plannedLoss: number,
  actualLoss: number
): "ahead" | "on-track" | "slightly-behind" | "behind" {
  const ratio = actualLoss / plannedLoss;
  if (ratio >= 1) return "ahead";
  if (ratio >= 0.9) return "on-track";
  if (ratio >= 0.7) return "slightly-behind";
  return "behind";
}

/**
 * Project goal completion date based on recent trend
 */
export function projectCompletionDate(
  currentWeight: number,
  targetWeight: number,
  avgWeeklyLoss: number
): Date | null {
  if (avgWeeklyLoss <= 0) return null;
  const remaining = currentWeight - targetWeight;
  const weeksNeeded = remaining / avgWeeklyLoss;
  const date = new Date();
  date.setDate(date.getDate() + Math.ceil(weeksNeeded * 7));
  return date;
}

/**
 * Calculate the current week number of the goal
 */
export function getCurrentWeek(startDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.min(Math.floor(diffDays / 7) + 1, 52);
}

/**
 * Calculate 7-day moving average from weight entries
 */
export function calculate7DayAverage(
  entries: { date: string; weight: number }[]
): number | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const recent = sorted.slice(0, 7);
  const sum = recent.reduce((acc, e) => acc + e.weight, 0);
  return Math.round((sum / recent.length) * 10) / 10;
}
