"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import layoutStyles from "../account.module.css";
import styles from "./orders.module.css";

/* ─── Types ────────────────────────────────────────────────── */

interface OrderItem {
  id: string;
  product_name: string;
  product_slug: string | null;
  variant: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string | null;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

/* ─── SVG Icons (inline) ──────────────────────────────────── */

function OverviewIcon() {
  return (
    <svg className={layoutStyles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg className={layoutStyles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg className={layoutStyles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function AddressIcon() {
  return (
    <svg className={layoutStyles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg className={layoutStyles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className={layoutStyles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg className={layoutStyles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */

const TRACKING_STEPS = ["Order Placed", "Processing", "Shipped", "Delivered"];

function getCompletedSteps(status: string): number {
  switch (status) {
    case "pending":
      return 1;
    case "processing":
      return 2;
    case "shipped":
      return 3;
    case "delivered":
      return 4;
    case "cancelled":
      return -1; // special
    default:
      return 1;
  }
}

const statusDisplayMap: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function getBadgeClass(status: string): string {
  switch (status) {
    case "delivered":
      return styles.badgeDelivered;
    case "processing":
      return styles.badgeProcessing;
    case "pending":
      return styles.badgePending;
    case "shipped":
      return styles.badgeShipped;
    case "cancelled":
      return styles.badgeCancelled;
    default:
      return styles.badgeProcessing;
  }
}

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

function formatDateShort(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

/* ─── Tracking Timeline Component ─────────────────────────── */

function TrackingTimeline({ order }: { order: Order }) {
  const completedSteps = getCompletedSteps(order.status);
  const isCancelled = order.status === "cancelled";

  const stepDates: (string | null)[] = [
    order.created_at,
    completedSteps >= 2 ? order.updated_at : null,
    order.shipped_at,
    order.delivered_at,
  ];

  return (
    <div className={styles.timelineSection}>
      <div className={styles.timelineLabel}>Order Tracking</div>
      <div className={styles.timeline}>
        {TRACKING_STEPS.map((stepName, i) => {
          const stepNum = i + 1;
          const isCompleted = !isCancelled && completedSteps >= stepNum;
          const isCurrent = !isCancelled && completedSteps === stepNum;
          const isLast = i === TRACKING_STEPS.length - 1;

          return (
            <div key={stepName} className={styles.timelineStep}>
              {/* Circle */}
              <div
                className={`${styles.stepCircle} ${
                  isCancelled && stepNum === 1
                    ? styles.stepCircleCancelled
                    : isCompleted
                    ? styles.stepCircleCompleted
                    : isCurrent
                    ? styles.stepCircleCurrent
                    : ""
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <CheckIcon className={styles.checkIcon} />
                ) : isCurrent ? (
                  <span className={styles.stepDot} />
                ) : null}
              </div>

              {/* Label */}
              <span
                className={`${styles.stepName} ${
                  isCompleted
                    ? styles.stepNameCompleted
                    : isCurrent
                    ? styles.stepNameCurrent
                    : ""
                }`}
              >
                {isCancelled && stepNum === 1 ? "Cancelled" : stepName}
              </span>

              {/* Date */}
              {stepDates[i] && (isCompleted || isCurrent) && (
                <span className={styles.stepDate}>
                  {formatDateShort(stepDates[i])}
                </span>
              )}

              {/* Connector line */}
              {!isLast && (
                <div className={styles.timelineConnectorWrap}>
                  <div className={styles.connectorBg} />
                  {isCompleted && !isCancelled && (
                    <div
                      className={styles.connectorFill}
                      style={{ width: "100%" }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Order Detail (expanded) ─────────────────────────────── */

function OrderDetail({ order }: { order: Order }) {
  const tax = Math.max(0, order.total - order.subtotal - order.shipping + order.discount);

  return (
    <div className={styles.expandedDetail}>
      {/* Tracking Timeline */}
      <TrackingTimeline order={order} />

      {/* Products */}
      <div className={styles.productsSection}>
        <div className={styles.sectionLabel}>Items</div>
        <div className={styles.productList}>
          {order.order_items.map((item) => (
            <div key={item.id} className={styles.productRow}>
              <div className={styles.productThumb}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_name} />
                ) : (
                  getInitial(item.product_name)
                )}
              </div>
              <div className={styles.productInfo}>
                <div className={styles.productName}>{item.product_name}</div>
                {item.variant && (
                  <div className={styles.productVariant}>{item.variant}</div>
                )}
              </div>
              <div className={styles.productQty}>×{item.quantity}</div>
              <div className={styles.productPrice}>
                {formatPrice(item.total_price)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className={styles.summarySection}>
        <div className={styles.sectionLabel}>Order Summary</div>
        <div className={styles.summaryTable}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
          </div>
          {order.discount > 0 && (
            <div className={styles.summaryRow}>
              <span>Discount</span>
              <span className={styles.discountValue}>
                −{formatPrice(order.discount)}
              </span>
            </div>
          )}
          {tax > 0 && (
            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>{formatPrice(tax)}</span>
            </div>
          )}
          <div className={`${styles.summaryRow} ${styles.summaryRowTotal}`}>
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {order.status !== "cancelled" && (
        <div className={styles.actionButtons}>
          {(order.status === "shipped" || order.tracking_number) && (
            <button className={styles.btnPrimary}>Track Shipment</button>
          )}
          {order.status === "delivered" && (
            <button className={styles.btnOutlined}>Return Items</button>
          )}
          {order.status === "delivered" && (
            <button className={styles.btnText}>Write a Review</button>
          )}
          {order.status === "pending" && (
            <button className={styles.btnPrimary}>Pay Now</button>
          )}
          {order.status === "processing" && (
            <button className={styles.btnOutlined}>Cancel Order</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page Component ─────────────────────────────────── */

export default function OrdersPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, subtotal, shipping, discount, total, tracking_number, shipped_at, delivered_at, created_at, updated_at, order_items(id, product_name, product_slug, variant, quantity, unit_price, total_price, image_url)"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }

    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  // Toggle expand/collapse
  const toggleOrder = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Derived user info
  const fullName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2);
  const email = user?.email || "";

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <main className={layoutStyles.dashboardPage}>
          <div
            className={layoutStyles.content}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
              Loading...
            </span>
          </div>
        </main>
      </>
    );
  }

  if (!user) return null;

  // Sidebar nav items
  const navItems = [
    { icon: <OverviewIcon />, label: "Overview", href: "/account" },
    { icon: <OrdersIcon />, label: "My Orders", href: "/account/orders", active: true },
    { icon: <WishlistIcon />, label: "Wishlist", href: "/account/wishlist" },
    { icon: <AddressIcon />, label: "Addresses", href: "/account" },
    { icon: <PaymentIcon />, label: "Payment Methods", href: "/account" },
    { icon: <SettingsIcon />, label: "Settings", href: "/account/settings" },
  ];

  return (
    <>
      <Navbar />
      <main className={layoutStyles.dashboardPage}>
        {/* ── Sidebar ──────────────────── */}
        <aside className={layoutStyles.sidebar}>
          <div className={layoutStyles.profileSection}>
            <div className={layoutStyles.avatar}>{initials}</div>
            <p className={layoutStyles.profileName}>{fullName}</p>
            <p className={layoutStyles.profileEmail}>{email}</p>
          </div>

          <nav className={layoutStyles.navLinks}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`${layoutStyles.navLink} ${
                  item.active ? layoutStyles.navLinkActive : ""
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}

            <button
              className={`${layoutStyles.navLink} ${layoutStyles.signOutLink}`}
              onClick={signOut}
            >
              <SignOutIcon />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* ── Content ──────────────────── */}
        <section className={layoutStyles.content}>
          {/* Page header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>My Orders</h1>
              {!dataLoading && (
                <span className={styles.orderCount}>
                  {orders.length} order{orders.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <Link href="/account" className={styles.backLink}>
              <span className={styles.backArrow}>←</span>
              Dashboard
            </Link>
          </div>

          {/* Orders list */}
          {dataLoading ? (
            <p className={styles.loadingText}>Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>
              <svg
                className={styles.emptyIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <h3 className={styles.emptyTitle}>No orders yet</h3>
              <p className={styles.emptyText}>
                When you place an order, it will appear here.
              </p>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {orders.map((order) => {
                const isExpanded = expandedId === order.id;
                const displayStatus =
                  statusDisplayMap[order.status] ?? order.status;
                const thumbnails = order.order_items.slice(0, 3);
                const remaining = order.order_items.length - 3;
                const itemNames = order.order_items
                  .map((i) => i.product_name)
                  .join(", ");

                return (
                  <div
                    key={order.id}
                    className={`${styles.orderCard} ${
                      isExpanded ? styles.orderCardExpanded : ""
                    }`}
                  >
                    {/* Card summary — always visible */}
                    <div
                      className={styles.cardSummary}
                      onClick={() => toggleOrder(order.id)}
                    >
                      {/* Top row: order info + badge */}
                      <div className={styles.cardTopRow}>
                        <div className={styles.orderMeta}>
                          <span className={styles.orderNumber}>
                            {order.order_number}
                          </span>
                          <span className={styles.orderDate}>
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                        <span
                          className={`${styles.badge} ${getBadgeClass(
                            order.status
                          )}`}
                        >
                          {displayStatus}
                        </span>
                      </div>

                      {/* Thumbnail row */}
                      <div className={styles.thumbnailRow}>
                        {thumbnails.map((item) => (
                          <div key={item.id} className={styles.thumbnail}>
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                              />
                            ) : (
                              getInitial(item.product_name)
                            )}
                          </div>
                        ))}
                        {remaining > 0 && (
                          <div
                            className={`${styles.thumbnail} ${styles.thumbnailMore}`}
                          >
                            +{remaining}
                          </div>
                        )}
                        <span className={styles.itemNames}>{itemNames}</span>
                      </div>

                      {/* Bottom row: price + view */}
                      <div className={styles.cardBottomRow}>
                        <span className={styles.orderTotal}>
                          {formatPrice(order.total)}
                        </span>
                        <button
                          className={styles.viewOrderLink}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrder(order.id);
                          }}
                        >
                          {isExpanded ? "Hide Details" : "View Order"}
                          <span
                            className={`${styles.viewArrow} ${
                              isExpanded ? styles.viewArrowRotated : ""
                            }`}
                          >
                            ›
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && <OrderDetail order={order} />}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
