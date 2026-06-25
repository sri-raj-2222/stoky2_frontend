export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded';

export interface OrderItem {
  id: string | number;
  product_name: string;
  product_slug: string;
  variant: string; // e.g., "M / Black"
  quantity: number;
  unit_price: number; // in paise
  image_url: string;
}

export interface TimelineStep {
  status: string;
  date: string;
  description: string;
  completed: boolean;
}

export interface Order {
  id: string | number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  map_pin_url: string;
  created_at: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number; // in paise
  shipping: number; // in paise
  discount: number; // in paise
  total: number; // in paise
  items: OrderItem[];
  timeline: TimelineStep[];
  notes: string;
  tracking_number?: string;
}
