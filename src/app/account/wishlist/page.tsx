"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import layoutStyles from "../account.module.css";
import styles from "./wishlist.module.css";

/* ─── Types ────────────────────────────────────────────────── */

interface WishlistItem {
  id: string;
  product_name: string;
  product_slug: string;
  image_url: string | null;
  price: number; // in paise
  created_at: string;
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

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function HeartFilledIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function EmptyHeartIllustration() {
  return (
    <svg className={styles.illustrationPlaceholder} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      <path d="M12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23" strokeDasharray="2 2" />
    </svg>
  );
}

/* ─── Helpers ──────────────────────────────────────────────── */

function formatPrice(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN");
}

// Define out-of-stock items statically matching available catalog
const OUT_OF_STOCK_SLUGS = ["essential-olive", "essential-burgundy"];

/* ─── Main Component ──────────────────────────────────────── */

export default function WishlistPage() {
  const { user, loading, signOut } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Show auto-dismiss toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Fetch wishlist
  const fetchWishlist = useCallback(async () => {
    if (!user) return;

    setDataLoading(true);

    const { data, error } = await supabase
      .from("wishlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data as WishlistItem[]);
      
      // Initialize default selected sizes (M for all)
      const sizes: Record<string, string> = {};
      data.forEach((item: WishlistItem) => {
        sizes[item.id] = "M";
      });
      setSelectedSizes(sizes);
    }

    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user, fetchWishlist]);

  // Auto-seed database with demo items if wishlist is completely empty
  const handleAutoSeed = async () => {
    if (!user) return;
    setDataLoading(true);

    const demoItems = [
      {
        user_id: user.id,
        product_name: "Essential Tee — Black",
        product_slug: "essential-black",
        image_url: "/images/tshirt-black.png",
        price: 149900,
      },
      {
        user_id: user.id,
        product_name: "Essential Tee — Olive",
        product_slug: "essential-olive",
        image_url: "/images/tshirt-olive.png",
        price: 149900,
      },
      {
        user_id: user.id,
        product_name: "Essential Tee — Burgundy",
        product_slug: "essential-burgundy",
        image_url: "/images/tshirt-burgundy.png",
        price: 159900,
      },
      {
        user_id: user.id,
        product_name: "Essential Tee — White",
        product_slug: "essential-white",
        image_url: "/images/tshirt-white.png",
        price: 149900,
      }
    ];

    const { error } = await supabase
      .from("wishlist")
      .insert(demoItems);

    if (!error) {
      showToast("Demo wishlist seeded successfully!");
      fetchWishlist();
    } else {
      console.error("Failed to seed wishlist:", error);
      showToast("Failed to seed items to database.");
      setDataLoading(false);
    }
  };

  // Remove item from wishlist
  const handleRemove = async (itemId: string) => {
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("id", itemId);

    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      showToast("Item removed from wishlist");
    } else {
      showToast("Failed to remove item");
    }
  };

  // Move item to cart
  const handleMoveToCart = async (item: WishlistItem) => {
    const size = selectedSizes[item.id] || "M";
    
    // Add to cart drawer context
    addToCart({
      id: `${item.product_slug}-${size}`,
      slug: item.product_slug,
      name: item.product_name,
      price: formatPrice(item.price),
      color: "Default",
      size: size,
      image: item.image_url || "/images/tshirt-black.png",
    });

    // Delete from wishlist DB
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("id", item.id);

    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast("Added to bag!");
    } else {
      showToast("Added to bag (failed to update wishlist DB)");
    }
  };

  // Handle Notify Me (for out-of-stock items)
  const handleNotifyMe = (itemName: string) => {
    showToast(`You will be notified when ${itemName} is back in stock!`);
  };

  // Share Wishlist
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/account/wishlist?shared_by=${user?.id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        showToast("Wishlist link copied to clipboard!");
      })
      .catch(() => {
        showToast("Failed to copy link.");
      });
  };

  // Dropdown size changes
  const handleSizeChange = (itemId: string, size: string) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [itemId]: size,
    }));
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

  // Loading screen
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
    { icon: <OrdersIcon />, label: "My Orders", href: "/account/orders" },
    { icon: <WishlistIcon />, label: "Wishlist", href: "/account/wishlist", active: true },
    { icon: <AddressIcon />, label: "Addresses", href: "/account" },
    { icon: <PaymentIcon />, label: "Payment Methods", href: "/account" },
    { icon: <SettingsIcon />, label: "Settings", href: "/account/settings" },
  ];

  return (
    <>
      <Navbar />
      <main className={layoutStyles.dashboardPage}>
        {/* ── Sidebar ──────────────────────── */}
        <aside className={layoutStyles.sidebar}>
          <div className={layoutStyles.profileSection}>
            <div className={layoutStyles.avatar}>{initials}</div>
            <div>
              <div className={layoutStyles.profileName}>{fullName}</div>
              <div className={layoutStyles.profileEmail}>{email}</div>
            </div>
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
                {item.label}
              </Link>
            ))}

            <button
              className={`${layoutStyles.navLink} ${layoutStyles.signOutLink}`}
              onClick={signOut}
            >
              <SignOutIcon />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* ── Content Area (White background light theme) ───── */}
        <div className={styles.wishlistContainer}>
          {/* Header Row */}
          <div className={styles.headerRow}>
            <h1 className={styles.heading}>
              My Wishlist
              <span className={styles.headingSpan}>
                ({items.length} {items.length === 1 ? "item" : "items"})
              </span>
            </h1>
            
            <button
              onClick={handleShare}
              className={styles.shareBtn}
              title="Share Wishlist"
            >
              <ShareIcon className={styles.shareIcon} />
            </button>
          </div>

          {/* Body Loading state */}
          {dataLoading ? (
            <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
              <span style={{ color: "#767676", fontSize: 13 }}>Loading wishlist...</span>
            </div>
          ) : items.length > 0 ? (
            /* Product Grid */
            <div className={styles.productGrid}>
              {items.map((item) => {
                const isOutOfStock = OUT_OF_STOCK_SLUGS.includes(item.product_slug);
                return (
                  <div key={item.id} className={styles.card}>
                    {/* Image Wrapper */}
                    <div className={styles.imageWrapper}>
                      {/* Heart Icon button (Remove) */}
                      <button
                        onClick={() => handleRemove(item.id)}
                        className={styles.removeBtn}
                        title="Remove from wishlist"
                      >
                        <HeartFilledIcon className={styles.removeIcon} />
                      </button>

                      {/* Out of Stock Overlay */}
                      {isOutOfStock && (
                        <div className={styles.outOfStockOverlay}>
                          <span className={styles.outOfStockLabel}>Out of Stock</span>
                        </div>
                      )}

                      {/* Product Photo */}
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className={styles.productPhoto}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#eaeaea",
                            color: "#767676",
                            fontSize: 24,
                            fontWeight: 600,
                          }}
                        >
                          {item.product_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Info Section */}
                    <div className={styles.infoSection}>
                      <h3 className={styles.productName}>{item.product_name}</h3>
                      <p className={styles.productPrice}>{formatPrice(item.price)}</p>

                      {/* Size selector dropdown */}
                      <div className={styles.selectorsRow}>
                        <select
                          value={selectedSizes[item.id] || "M"}
                          onChange={(e) => handleSizeChange(item.id, e.target.value)}
                          className={styles.sizeDropdown}
                          disabled={isOutOfStock}
                        >
                          <option value="S">Size: S</option>
                          <option value="M">Size: M</option>
                          <option value="L">Size: L</option>
                          <option value="XL">Size: XL</option>
                          <option value="XXL">Size: XXL</option>
                        </select>
                      </div>

                      {/* Action buttons (CTA) */}
                      {isOutOfStock ? (
                        <button
                          onClick={() => handleNotifyMe(item.product_name)}
                          className={styles.btnNotifyMe}
                        >
                          Notify Me
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMoveToCart(item)}
                          className={styles.btnMoveToCart}
                        >
                          Move to Cart
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className={styles.emptyState}>
              <EmptyHeartIllustration />
              <h3 className={styles.emptyTitle}>Your wishlist is empty</h3>
              <p className={styles.emptyText}>
                Your wishlist is empty — start saving items you love
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                <Link href="/" className={styles.btnBrowse}>
                  Browse collection
                </Link>
                
                <button
                  onClick={handleAutoSeed}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#767676",
                    textDecoration: "underline",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: "4px 8px"
                  }}
                >
                  Seed Demo items (for testing)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Copy-to-clipboard Toast */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
    </>
  );
}
