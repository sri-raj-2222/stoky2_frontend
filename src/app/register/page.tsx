"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./register.module.css";

/* ─── Types ────────────────────────────────────────────────── */

type FieldStatus = "idle" | "valid" | "invalid";

interface FieldState {
  value: string;
  status: FieldStatus;
  touched: boolean;
  error?: string;
}

/* ─── Password strength ───────────────────────────────────── */

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return 1;
  if (score <= 2) return 2;
  return 3;
}

const strengthLabels: Record<number, string> = {
  0: "",
  1: "Weak",
  2: "Fair",
  3: "Strong",
};

/* ─── Inline SVG icons ─────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="#4ade80"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none">
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="#f87171"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="#ffffff">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C3.79 16.17 4.36 9.53 8.7 9.28c1.23.07 2.08.72 2.8.75.99-.2 1.94-.78 3-.66 1.28.15 2.24.71 2.86 1.73-2.6 1.56-1.98 5 .37 5.96-.46 1.2-.99 2.39-1.68 3.22zM12.03 9.22c-.13-2.24 1.67-4.13 3.74-4.22.28 2.41-2.19 4.47-3.74 4.22z" />
    </svg>
  );
}

/* ─── Validation helpers ───────────────────────────────────── */

function validateName(v: string): { status: FieldStatus; error?: string } {
  if (!v.trim()) return { status: "invalid", error: "Name is required" };
  if (v.trim().length < 2) return { status: "invalid", error: "Too short" };
  return { status: "valid" };
}

function validateEmail(v: string): { status: FieldStatus; error?: string } {
  if (!v.trim()) return { status: "invalid", error: "Email is required" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return { status: "invalid", error: "Enter a valid email" };
  return { status: "valid" };
}

function validatePassword(v: string): { status: FieldStatus; error?: string } {
  if (!v) return { status: "invalid", error: "Password is required" };
  if (v.length < 8)
    return { status: "invalid", error: "At least 8 characters" };
  return { status: "valid" };
}

function validateConfirm(
  v: string,
  pw: string
): { status: FieldStatus; error?: string } {
  if (!v) return { status: "invalid", error: "Please confirm password" };
  if (v !== pw) return { status: "invalid", error: "Passwords don't match" };
  return { status: "valid" };
}

/* ─── Page component ───────────────────────────────────────── */

export default function RegisterPage() {
  const [name, setName] = useState<FieldState>({
    value: "",
    status: "idle",
    touched: false,
  });
  const [email, setEmail] = useState<FieldState>({
    value: "",
    status: "idle",
    touched: false,
  });
  const [password, setPassword] = useState<FieldState>({
    value: "",
    status: "idle",
    touched: false,
  });
  const [confirm, setConfirm] = useState<FieldState>({
    value: "",
    status: "idle",
    touched: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signUp, signInWithProvider } = useAuth();
  const router = useRouter();
  const strength = getPasswordStrength(password.value);

  /* ── Blur handlers ─────────────────────── */

  const handleBlurName = useCallback(() => {
    setName((s) => {
      const v = validateName(s.value);
      return { ...s, touched: true, status: v.status, error: v.error };
    });
  }, []);

  const handleBlurEmail = useCallback(() => {
    setEmail((s) => {
      const v = validateEmail(s.value);
      return { ...s, touched: true, status: v.status, error: v.error };
    });
  }, []);

  const handleBlurPassword = useCallback(() => {
    setPassword((s) => {
      const v = validatePassword(s.value);
      return { ...s, touched: true, status: v.status, error: v.error };
    });
  }, []);

  const handleBlurConfirm = useCallback(() => {
    setConfirm((s) => {
      const v = validateConfirm(s.value, password.value);
      return { ...s, touched: true, status: v.status, error: v.error };
    });
  }, [password.value]);

  /* ── Submit handler ────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setServerError("");
    setSubmitting(true);

    const result = await signUp(email.value, password.value, name.value);

    if (result.error) {
      let friendlyError = result.error;
      const lowerErr = result.error.toLowerCase();
      if (lowerErr.includes("already registered") || lowerErr.includes("already exists") || lowerErr.includes("taken")) {
        friendlyError = "An account with this email address already exists. Please log in or try a different email.";
      }
      setServerError(friendlyError);
      setSubmitting(false);
    } else {
      // Redirect directly to the dashboard since confirmations are disabled and user is logged in
      router.push("/account");
    }
  };

  /* ── Input class helper ────────────────── */

  const inputClass = (status: FieldStatus, touched: boolean, extra = "") => {
    let cls = styles.input;
    if (extra) cls += ` ${extra}`;
    if (touched && status === "valid") cls += ` ${styles.inputValid}`;
    if (touched && status === "invalid") cls += ` ${styles.inputInvalid}`;
    return cls;
  };

  /* ── Validation icon ───────────────────── */

  const renderIcon = (status: FieldStatus, touched: boolean) => {
    if (!touched || status === "idle") return null;
    return (
      <span className={styles.validationIcon}>
        {status === "valid" ? <CheckIcon /> : <XIcon />}
      </span>
    );
  };

  /* ── Strength bar segments ─────────────── */

  const renderStrength = () => {
    if (!password.value) return null;

    const segmentClass = (i: number) => {
      let cls = styles.strengthSegment;
      if (i < strength) {
        if (strength === 1) cls += ` ${styles.strengthWeak}`;
        else if (strength === 2) cls += ` ${styles.strengthMedium}`;
        else cls += ` ${styles.strengthStrong}`;
      }
      return cls;
    };

    let labelCls = styles.strengthLabel;
    if (strength === 1) labelCls += ` ${styles.strengthLabelWeak}`;
    else if (strength === 2) labelCls += ` ${styles.strengthLabelMedium}`;
    else if (strength === 3) labelCls += ` ${styles.strengthLabelStrong}`;

    return (
      <>
        <div className={styles.strengthBar}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={segmentClass(i)} />
          ))}
        </div>
        <span className={labelCls}>{strengthLabels[strength]}</span>
      </>
    );
  };

  const allValid =
    name.status === "valid" &&
    email.status === "valid" &&
    password.status === "valid" &&
    confirm.status === "valid" &&
    agreeTerms;

  return (
    <main className={styles.registerPage}>
      <div className={styles.card}>
        {/* Brand wordmark */}
        <div className={styles.brand}>STOKY</div>
        <h1 className={styles.heading}>Create your account</h1>

        {/* Server error */}
        {serverError && (
          <div className={styles.errorBanner}>{serverError}</div>
        )}

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className={styles.fieldGroup}>
            <div className={styles.inputWrapper}>
              <input
                id="register-name"
                className={inputClass(name.status, name.touched)}
                type="text"
                placeholder="Full Name"
                autoComplete="name"
                value={name.value}
                onChange={(e) =>
                  setName((s) => ({ ...s, value: e.target.value }))
                }
                onBlur={handleBlurName}
                required
              />
              {renderIcon(name.status, name.touched)}
            </div>
            {name.touched && name.error && (
              <span className={styles.errorText}>{name.error}</span>
            )}
          </div>

          {/* Email */}
          <div className={styles.fieldGroup}>
            <div className={styles.inputWrapper}>
              <input
                id="register-email"
                className={inputClass(email.status, email.touched)}
                type="email"
                placeholder="Email Address"
                autoComplete="email"
                value={email.value}
                onChange={(e) =>
                  setEmail((s) => ({ ...s, value: e.target.value }))
                }
                onBlur={handleBlurEmail}
                required
              />
              {renderIcon(email.status, email.touched)}
            </div>
            {email.touched && email.error && (
              <span className={styles.errorText}>{email.error}</span>
            )}
          </div>

          {/* Password */}
          <div className={styles.fieldGroup}>
            <div className={styles.inputWrapper}>
              <input
                id="register-password"
                className={inputClass(
                  password.status,
                  password.touched,
                  styles.passwordInput
                )}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="new-password"
                value={password.value}
                onChange={(e) =>
                  setPassword((s) => ({ ...s, value: e.target.value }))
                }
                onBlur={handleBlurPassword}
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            </div>
            {renderStrength()}
            {password.touched && password.error && (
              <span className={styles.errorText}>{password.error}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.fieldGroup}>
            <div className={styles.inputWrapper}>
              <input
                id="register-confirm"
                className={inputClass(
                  confirm.status,
                  confirm.touched,
                  styles.passwordInput
                )}
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                autoComplete="new-password"
                value={confirm.value}
                onChange={(e) =>
                  setConfirm((s) => ({ ...s, value: e.target.value }))
                }
                onBlur={handleBlurConfirm}
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirm ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            </div>
            {confirm.touched && confirm.error && (
              <span className={styles.errorText}>{confirm.error}</span>
            )}
          </div>

          {/* Checkboxes */}
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                id="register-terms"
                type="checkbox"
                className={styles.checkbox}
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>
                I agree to the{" "}
                <Link href="#" className={styles.inlineLink}>
                  Terms
                </Link>{" "}
                &amp;{" "}
                <Link href="#" className={styles.inlineLink}>
                  Privacy Policy
                </Link>
              </span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                id="register-optin"
                type="checkbox"
                className={styles.checkbox}
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
              />
              <span>Get early access to new drops</span>
            </label>
          </div>

          {/* Submit */}
          <button
            id="register-submit"
            type="submit"
            className={`${styles.submitButton} ${submitting ? styles.submitting : ""}`}
            disabled={!allValid || submitting}
          >
            {submitting ? "" : "Create account"}
          </button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or</span>
          <span className={styles.dividerLine} />
        </div>

        {/* Social */}
        <div className={styles.socialButtons}>
          <button
            id="register-google"
            type="button"
            className={styles.socialButton}
            onClick={() => signInWithProvider("google")}
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            id="register-apple"
            type="button"
            className={styles.socialButton}
            onClick={() => signInWithProvider("apple")}
          >
            <AppleIcon />
            Continue with Apple
          </button>
        </div>

        {/* Footer */}
        <p className={styles.footer}>
          Already have an account?
          <Link href="/login" className={styles.footerLink}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
