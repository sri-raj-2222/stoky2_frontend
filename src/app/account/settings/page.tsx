"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import styles from "./settings.module.css";

/* ─── SVG Icons (inline) ──────────────────────────────────── */

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckIconMini({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ─── Password Strength Evaluator ─────────────────────────── */

interface StrengthScore {
  score: number; // 0 to 5
  label: string;
  color: string;
}

function getPasswordStrength(password: string): StrengthScore {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { score, label: "Weak", color: "#ef4444" };
  } else if (score <= 4) {
    return { score, label: "Medium", color: "#f59e0b" };
  } else {
    return { score, label: "Strong", color: "#10b981" };
  }
}

/* ─── Main Component ──────────────────────────────────────── */

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Profile fields state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("prefer_not_to_say");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification toggles state
  const [notifEmailOrders, setNotifEmailOrders] = useState(true);
  const [notifSmsAlerts, setNotifSmsAlerts] = useState(true);
  const [notifNewsletter, setNotifNewsletter] = useState(false);
  const [notifPromotions, setNotifPromotions] = useState(false);

  // UI state
  const [profileLoading, setProfileLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);

    try {
      // 1. Load profiles table data via backend API
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch("https://stoky2-backend.onrender.com/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile from server");
      }

      const profile = await response.json();

      if (profile) {
        // Split full name into first and last
        const parts = (profile.full_name || "").trim().split(/\s+/);
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setPhone(profile.phone || "");
        setGender(profile.gender || "prefer_not_to_say");
        setDateOfBirth(profile.date_of_birth || "");
      }

      // 2. Load notifications from localStorage
      const savedNotifs = localStorage.getItem(`stoky_notifs_${user.id}`);
      if (savedNotifs) {
        const parsed = JSON.parse(savedNotifs);
        setNotifEmailOrders(!!parsed.emailOrders);
        setNotifSmsAlerts(!!parsed.smsAlerts);
        setNotifNewsletter(!!parsed.newsletter);
        setNotifPromotions(!!parsed.promotions);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user, loadProfile]);

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      // Save profile data via backend API
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch("https://stoky2-backend.onrender.com/api/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone.trim(),
          gender: gender,
          date_of_birth: dateOfBirth || null,
        }),
      });

      if (response.ok) {
        showToast("Profile settings saved successfully");
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Profile save error:", error.message || error);
      showToast(error.message || "Failed to save profile changes");
    }
  };

  // Save Notification toggles helper
  const handleToggleChange = (toggle: string, value: boolean) => {
    if (!user) return;

    let updated = {
      emailOrders: notifEmailOrders,
      smsAlerts: notifSmsAlerts,
      newsletter: notifNewsletter,
      promotions: notifPromotions,
    };

    switch (toggle) {
      case "emailOrders":
        setNotifEmailOrders(value);
        updated.emailOrders = value;
        break;
      case "smsAlerts":
        setNotifSmsAlerts(value);
        updated.smsAlerts = value;
        break;
      case "newsletter":
        setNotifNewsletter(value);
        updated.newsletter = value;
        break;
      case "promotions":
        setNotifPromotions(value);
        updated.promotions = value;
        break;
    }

    localStorage.setItem(`stoky_notifs_${user.id}`, JSON.stringify(updated));
    showToast("Notification preferences updated");
  };

  // Save Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      showToast("Please enter a new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (!error) {
      showToast("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      showToast(error.message || "Failed to update password");
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // Call backend API to delete user account using admin client
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch("https://stoky2-backend.onrender.com/api/profile", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        showToast("Account deleted. Signing out...");
        setDeleteModalOpen(false);
        setTimeout(() => {
          signOut();
          router.push("/");
        }, 1500);
      } else {
        const errData = await response.json();
        showToast(errData.error || "Failed to delete account");
      }
    } catch (err) {
      console.error("Account deletion error:", err);
      showToast("Failed to communicate with server");
    }
  };

  if (loading || profileLoading) {
    return (
      <>
        <Navbar />
        <main className={styles.settingsPage}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Loading settings...</span>
          </div>
        </main>
      </>
    );
  }

  if (!user) return null;

  const strength = getPasswordStrength(newPassword);

  return (
    <>
      <Navbar />
      <main className={styles.settingsPage}>
        <div className={styles.container}>
          {/* Back Navigation */}
          <Link href="/account" className={styles.backLink}>
            <ArrowLeftIcon className={styles.backIcon} />
            Back to Dashboard
          </Link>

          <h1 className={styles.pageTitle}>Account Settings</h1>

          {/* 1. Profile Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile Information</h2>
            <form onSubmit={handleSaveProfile}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={styles.input}
                    placeholder="Enter first name"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={styles.input}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user.email || ""}
                  className={styles.input}
                />
                <span className={styles.verifiedBadge}>
                  <CheckIconMini className={styles.checkIconMini} />
                  Verified
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={styles.input}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={styles.select}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <button type="submit" className={styles.btnSubmit}>
                Save Changes
              </button>
            </form>
          </section>

          <hr className={styles.divider} />

          {/* 2. Change Password Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Change Password</h2>
            <form onSubmit={handleUpdatePassword}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={styles.input}
                  placeholder="••••••••"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Minimum 8 characters"
                />
                
                {/* Strength Meter Bar */}
                {newPassword && (
                  <>
                    <div className={styles.strengthMeter}>
                      <div
                        className={styles.strengthBar}
                        style={{
                          width: `${(strength.score / 5) * 100}%`,
                          backgroundColor: strength.color,
                        }}
                      />
                    </div>
                    <span
                      className={styles.strengthText}
                      style={{ color: strength.color }}
                    >
                      Password Strength: {strength.label}
                    </span>
                  </>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.input}
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className={styles.btnSubmit}>
                Update Password
              </button>
            </form>
          </section>

          <hr className={styles.divider} />

          {/* 3. Notifications Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Notification Preferences</h2>
            
            <div className={styles.toggleGroup}>
              <div className={styles.toggleLabelArea}>
                <span className={styles.toggleTitle}>Order Updates</span>
                <span className={styles.toggleDesc}>Receive shipping updates and invoices via email</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={notifEmailOrders}
                  onChange={(e) => handleToggleChange("emailOrders", e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>

            <div className={styles.toggleGroup}>
              <div className={styles.toggleLabelArea}>
                <span className={styles.toggleTitle}>SMS Alerts</span>
                <span className={styles.toggleDesc}>Text messages for delivery tracking notifications</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={notifSmsAlerts}
                  onChange={(e) => handleToggleChange("smsAlerts", e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>

            <div className={styles.toggleGroup}>
              <div className={styles.toggleLabelArea}>
                <span className={styles.toggleTitle}>New Arrivals</span>
                <span className={styles.toggleDesc}>Hear about seasonal collections and product restocks</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={notifNewsletter}
                  onChange={(e) => handleToggleChange("newsletter", e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>

            <div className={styles.toggleGroup}>
              <div className={styles.toggleLabelArea}>
                <span className={styles.toggleTitle}>Promotional Offers</span>
                <span className={styles.toggleDesc}>Member-only discounts and early access sales</span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={notifPromotions}
                  onChange={(e) => handleToggleChange("promotions", e.target.checked)}
                />
                <span className={styles.slider} />
              </label>
            </div>
          </section>

          <hr className={styles.divider} />

          {/* 4. Danger Zone */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle} style={{ color: "#ef4444" }}>Danger Zone</h2>
            <div className={styles.warningBlock}>
              This will permanently remove your data and order history.
            </div>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className={styles.btnDelete}
            >
              Delete Account
            </button>
          </section>
        </div>
      </main>

      {/* Confirmation Modal */}
      {deleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delete Account?</h3>
            <p className={styles.modalText}>
              Are you sure you want to delete your account? This action is permanent and cannot be undone. All your order history and profile information will be removed from our database.
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className={styles.btnCancel}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className={styles.btnConfirmDelete}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast alert */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
    </>
  );
}
