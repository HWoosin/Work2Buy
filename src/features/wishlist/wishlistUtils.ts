export type WishlistStatus = 'pending' | 'purchased';

export type WishlistItem = {
  id: number;
  name: string;
  price: number;
  hold_days: number;
  created_at: string;
  status: WishlistStatus;

  // 구매 완료 당시 저장되는 기록
  purchased_at?: string | null;
  snapshot_salary?: number | null;
  snapshot_daily_hours?: number | null;
  snapshot_monthly_days?: number | null;
  snapshot_required_hours?: number | null;

  reminder_notification_id?: string | null;
};

export function getRemainingDays(item: WishlistItem, now = Date.now()) {
  const created = new Date(item.created_at).getTime();
  const deadline = created + item.hold_days * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((deadline - now) / (24 * 60 * 60 * 1000)));
}

export function getRequiredHours(
  price: number,
  monthlySalary: number,
  dailyHours: number,
  monthlyDays: number,
): number | null {
  if (
    price <= 0 ||
    monthlySalary <= 0 ||
    dailyHours <= 0 ||
    monthlyDays <= 0
  ) {
    return null;
  }

  const hourlyPay = monthlySalary / (dailyHours * monthlyDays);
  return price / hourlyPay;
}
