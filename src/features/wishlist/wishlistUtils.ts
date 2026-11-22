export type WishlistStatus = 'pending' | 'purchased';

export type WishlistItem = {
  id: number;
  name: string;
  price: number;
  hold_days: number;
  created_at: string;
  status: WishlistStatus;
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
) {
  if (price <= 0 || monthlySalary <= 0 || dailyHours <= 0 || monthlyDays <= 0) {
    return null;
  }
  const hourlyPay = monthlySalary / (dailyHours * monthlyDays);
  return price / hourlyPay;
}
