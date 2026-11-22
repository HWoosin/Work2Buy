import { WishlistItem } from "../features/wishlist/wishlistUtils";

export function addWishlistItem(
  name: string,
  price: number,
  holdDays: number
): Promise<void>;

export function deleteWishlistItem(id: number): Promise<void>;

export function getWishlistItems(): Promise<WishlistItem[]>;

export function updateWishlistStatus(
  id: number,
  status: "pending" | "purchased",
  snapshot?: {
    salary: number;
    dailyHours: number;
    monthlyDays: number;
    requiredHours: number;
    purchasedAt: string;
  } | null
): Promise<void>;