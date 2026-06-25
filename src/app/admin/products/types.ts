export interface Product {
  id: number;
  name: string;
  price: number; // Price in Rupees
  color: string; // Primary hex color (fallback)
  image: string; // Primary image URL (fallback)
  slug: string;
  created_at?: string;

  // Clothing specific extended fields
  description?: string;
  compare_at_price?: number;
  category?: string; // 'Classic Fit' | 'Oversized Fit' | 'Heavyweight Tee' | 'Graphic Tee' | 'Polo Tee' | 'Henley Tee' | 'V-Neck Tee' | 'Long Sleeve'
  status?: string; // 'Active' | 'Draft' | 'Archived'
  stock?: number;
  sku?: string;
  tags?: string[];
  sizes?: string[]; // e.g. ['S', 'M', 'L']
  colors?: string[]; // Array of hex colors for swatches
  images?: string[]; // Array of image URLs
}

export type CategoryType = 'Classic Fit' | 'Oversized Fit' | 'Heavyweight Tee' | 'Graphic Tee' | 'Polo Tee' | 'Henley Tee' | 'V-Neck Tee' | 'Long Sleeve';
export type StatusType = 'Active' | 'Draft' | 'Archived';
export type SortOption = 'Newest' | 'Price' | 'Stock';
