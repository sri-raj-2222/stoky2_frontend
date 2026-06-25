export type CustomerRole = 'Customer' | 'VIP' | 'Admin';

export type CustomerStatus = 'Active' | 'Suspended';

export interface CustomerActivity {
  id: string | number;
  timestamp: string;
  action: string;
  ip: string;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  date: string;
  items_count: number;
  total: number; // in paise
  status: string;
}

export interface CustomerAddress {
  id: string;
  label: string;
  address: string;
  is_default: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  join_date: string;
  total_orders: number;
  lifetime_spend: number; // in paise
  last_active: string;
  role: CustomerRole;
  status: CustomerStatus;
  orders: CustomerOrder[];
  addresses: CustomerAddress[];
  activityLog: CustomerActivity[];
}
