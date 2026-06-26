"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./login.module.css";

/* ─── Inline SVG icons ─────────────────────────────────────── */

function EyeOpenIcon() {
  return (
    <svg
      className={styles.socialIcon}
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
      className={styles.socialIcon}
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

function ArrowLeftIcon() {
  return (
    <svg
      className={styles.backIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/* ─── Page component ───────────────────────────────────────── */

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const { signIn, signInWithProvider, isAdmin, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loginSuccess && user) {
      if (isAdmin) {
        router.push('/account');
      } else {
        router.push('/');
      }
    }
  }, [loginSuccess, user, isAdmin, router]);

  useEffect(() => {
    if (user && !loginSuccess) {
      if (isAdmin) {
        router.push('/account');
      } else {
        router.push('/');
      }
    }
  }, [user, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);

    const result = await signIn(email, password);

    if (result.error) {
      let friendlyError = result.error;
      const lowerErr = result.error.toLowerCase();
      if (lowerErr.includes("invalid login credentials") || lowerErr.includes("invalid credentials")) {
        friendlyError = "Invalid email or password. Please try again.";
      } else if (lowerErr.includes("email not confirmed") || lowerErr.includes("confirm your email") || lowerErr.includes("verify")) {
        friendlyError = "Email address has not been verified. Please check your inbox for the verification link.";
      }
      setError(friendlyError);
      setSubmitting(false);
    } else {
      setLoginSuccess(true);
    }
  };


  return (
    <main className={styles.loginPage}>
      {/* Back button to landing page */}
      <Link href="/" className={styles.backButton}>
        <ArrowLeftIcon />
        <span>Back</span>
      </Link>

      <div className={styles.card}>
        {/* Brand wordmark */}
        <div className={styles.brand}>STOKY</div>
        <h1 className={styles.heading}>Welcome back</h1>

        {/* Error message */}
        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Email */}
          <div className={styles.inputWrapper}>
            <input
              id="login-email"
              className={styles.input}
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className={styles.inputWrapper}>
            <input
              id="login-password"
              className={`${styles.input} ${styles.passwordInput}`}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {/* Forgot password */}
          <div className={styles.forgotRow}>
            <Link href="#" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            className={`${styles.submitButton} ${submitting ? styles.submitting : ""}`}
            disabled={submitting}
          >
            {submitting ? "" : "Sign in"}
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
            id="login-google"
            type="button"
            className={styles.socialButton}
            onClick={() => signInWithProvider("google")}
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            id="login-apple"
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
          Don&apos;t have an account?
          <Link href="/register" className={styles.footerLink}>
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
