"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import styles from "./account.module.css";

/* ─── Types ────────────────────────────────────────────────── */

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  order_items: { product_name: string; quantity: number }[];
}

interface AddressRow {
  id: string;
  label: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface DashboardData {
  totalOrders: number;
  loyaltyPoints: number;
  savedItems: number;
  recentOrders: OrderRow[];
  addresses: AddressRow[];
}

/* ─── Sidebar nav icons (inline SVGs) ──────────────────────── */

function OverviewIcon() {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function AddressIcon() {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */

const statusDisplayMap: Record<string, string> = {
  pending: "Processing",
  processing: "Processing",
  shipped: "Processing",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const badgeClassMap: Record<string, string> = {
  Delivered: "badgeDelivered",
  Processing: "badgeProcessing",
  Cancelled: "badgeCancelled",
};

function formatPrice(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ─── Page component ───────────────────────────────────────── */

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DashboardData>({
    totalOrders: 0,
    loyaltyPoints: 0,
    savedItems: 0,
    recentOrders: [],
    addresses: [],
  });
  const [dataLoading, setDataLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Fetch dashboard data from Supabase
  const fetchDashboard = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);

    const [ordersRes, addressesRes, wishlistRes, pointsRes] =
      await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, status, total, created_at, order_items(product_name, quantity)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("addresses")
          .select("id, label, address_line1, address_line2, city, state, postal_code, country, is_default")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false }),
        supabase
          .from("wishlist")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("user_loyalty_summary")
          .select("total_points")
          .eq("user_id", user.id)
          .single(),
      ]);

    // Count total orders (separate count query)
    const orderCountRes = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    setData({
      totalOrders: orderCountRes.count ?? 0,
      loyaltyPoints: pointsRes.data?.total_points ?? 0,
      savedItems: wishlistRes.count ?? 0,
      recentOrders: (ordersRes.data as OrderRow[]) ?? [],
      addresses: (addressesRes.data as AddressRow[]) ?? [],
    });

    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user, fetchDashboard]);

  const fullName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2);
  const email = user?.email || "";

  if (loading) {
    return (
      <>
        <Navbar />
        <main className={styles.dashboardPage}>
          <div className={styles.content} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Loading...</span>
          </div>
        </main>
      </>
    );
  }

  if (!user) return null;

  const navItems = [
    { icon: <OverviewIcon />, label: "Overview", href: "/account", active: true },
    { icon: <OrdersIcon />, label: "My Orders", href: "/account/orders", active: false },
    { icon: <WishlistIcon />, label: "Wishlist", href: "/account/wishlist", active: false },
    { icon: <AddressIcon />, label: "Addresses", href: "/account", active: false },
    { icon: <PaymentIcon />, label: "Payment Methods", href: "/account", active: false },
    { icon: <SettingsIcon />, label: "Settings", href: "/account/settings", active: false },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.dashboardPage}>
        {/* ── Sidebar ──────────────────────── */}
        <aside className={styles.sidebar}>
          <div className={styles.profileSection}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <div className={styles.profileName}>{fullName}</div>
              <div className={styles.profileEmail}>{email}</div>
            </div>
          </div>

          <nav className={styles.navLinks}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`${styles.navLink} ${item.active ? styles.navLinkActive : ""}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            <button
              className={`${styles.navLink} ${styles.signOutLink}`}
              onClick={signOut}
            >
              <SignOutIcon />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* ── Content ──────────────────────── */}
        <div className={styles.content}>
          {/* Greeting */}
          <h1 className={styles.greeting}>Hello, {fullName.split(" ")[0]}</h1>
          <p className={styles.greetingSub}>
            Welcome to your account dashboard.
          </p>

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {dataLoading ? "—" : data.totalOrders}
              </div>
              <div className={styles.statLabel}>Total Orders</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {dataLoading ? "—" : data.loyaltyPoints}
              </div>
              <div className={styles.statLabel}>Loyalty Points</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {dataLoading ? "—" : data.savedItems}
              </div>
              <div className={styles.statLabel}>Saved Items</div>
            </div>
          </div>

          {/* Recent Orders */}
          <h2 className={styles.sectionHeading}>Recent Orders</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 && !dataLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", padding: "32px 16px" }}>
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => {
                    const displayStatus =
                      statusDisplayMap[order.status] ?? "Processing";
                    const itemsSummary = order.order_items
                      ?.map((i) => `${i.product_name} × ${i.quantity}`)
                      .join(", ") || "—";

                    return (
                      <tr key={order.id}>
                        <td className={styles.orderNumber}>
                          {order.order_number}
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>{itemsSummary}</td>
                        <td>{formatPrice(order.total)}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              styles[badgeClassMap[displayStatus] ?? "badgeProcessing"]
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </td>
                        <td>
                          <Link href="/account/orders" className={styles.viewButton}>View</Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Saved Addresses */}
          <h2 className={styles.sectionHeading}>Saved Addresses</h2>
          <div className={styles.addressGrid}>
            {data.addresses.map((addr) => (
              <div key={addr.id} className={styles.addressCard}>
                <div className={styles.addressLabel}>{addr.label}</div>
                <div className={styles.addressText}>
                  {addr.address_line1}
                  {addr.address_line2 && <><br />{addr.address_line2}</>}
                  <br />
                  {addr.city}, {addr.state} {addr.postal_code}
                  <br />
                  {addr.country}
                </div>
                {addr.is_default && (
                  <span className={styles.addressDefault}>Default</span>
                )}
              </div>
            ))}
            <button className={styles.addCard}>
              <div className={styles.addIcon}>+</div>
              <span className={styles.addLabel}>Add new address</span>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
