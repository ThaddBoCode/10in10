/**
 * Mifflin-St Jeor BMR calculation
 * Returns estimated daily calorie burn at rest
 */
export function calculateBMR(
  weightKg: number,
  heightCm?: number | null,
  age?: number | null,
  gender?: string | null
): number {
  if (heightCm && age && gender) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return Math.round(gender === "male" ? base + 5 : base - 161);
  }
  // Simplified fallback: ~24 kcal per kg body weight
  return Math.round(weightKg * 24);
}

/**
 * Activity level multiplier for daily calorie estimate
 */
export function getActivityMultiplier(level: string): number {
  switch (level) {
    case "sedentary":
      return 1.2;
    case "light":
      return 1.375;
    case "active":
      return 1.55;
    default:
      return 1.375;
  }
}

/**
 * Calculate required daily deficit to reach weight goal
 * 1 kg fat ≈ 7700 kcal
 */
export function calculateDailyDeficit(
  kgToLose: number,
  daysRemaining: number
): number {
  if (daysRemaining <= 0) return 0;
  return Math.round((kgToLose * 7700) / daysRemaining);
}
