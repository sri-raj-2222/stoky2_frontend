export type DiscountType = 'percentage' | 'fixed';
export type ApplicableTo = 'all' | 'categories' | 'products';
export type DiscountStatus = 'Active' | 'Expired';

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number; // In percentage (e.g., 10 for 10%) or in paise (e.g., 50000 for ₹500.00)
  min_order_value: number; // In paise (e.g., 150000 for ₹1,500.00)
  usage_limit: number | null;
  usage_count: number;
  start_date: string;
  expiry_date: string | null;
  applicable_to: ApplicableTo;
  applicable_items: string[]; // Category names or Product IDs
  first_time_only: boolean;
  status: DiscountStatus;
  created_at?: string;
}
