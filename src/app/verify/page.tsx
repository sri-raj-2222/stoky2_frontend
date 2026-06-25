"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type ClipboardEvent,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import styles from "./verify.module.css";
import { supabase } from "@/lib/supabase";

const OTP_LENGTH = 6;
const TIMER_SECONDS = 45;

/* ─── Page component ───────────────────────────────────────── */

export default function VerifyPage() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);
  const [serverError, setServerError] = useState("");
  const [email, setEmail] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load registered email on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailQuery = params.get("email");
      if (emailQuery) {
        setEmail(emailQuery);
      } else {
        const stored = sessionStorage.getItem("stoky_verify_email");
        if (stored) setEmail(stored);
      }
    }
  }, []);

  /* ── Countdown timer ───────────────────── */

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const formattedTime = `0:${timer.toString().padStart(2, "0")}`;

  /* ── Auto-submit when filled ───────────── */

  const handleSubmit = useCallback(
    async (digits: string[]) => {
      if (verifying || verified) return;
      const code = digits.join("");
      if (code.length !== OTP_LENGTH) return;

      setVerifying(true);
      setError(false);
      setServerError("");

      try {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: "signup",
        });

        if (otpError) {
          setError(true);
          setServerError(otpError.message);
          setVerifying(false);
        } else {
          setVerifying(false);
          setVerified(true);
        }
      } catch (err: any) {
        setError(true);
        setServerError(err.message || "Verification failed");
        setVerifying(false);
      }
    },
    [verifying, verified, email]
  );

  /* ── Input change ──────────────────────── */

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Accept only single digit
    if (val && !/^\d$/.test(val)) return;

    setError(false);
    const next = [...otp];
    next[index] = val;
    setOtp(next);

    // Auto-advance
    if (val && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit on last digit
    if (val && index === OTP_LENGTH - 1) {
      handleSubmit(next);
    }
  };

  /* ── Key handling ──────────────────────── */

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move back if current is empty
        const next = [...otp];
        next[index - 1] = "";
        setOtp(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...otp];
        next[index] = "";
        setOtp(next);
      }
      setError(false);
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /* ── Paste support ─────────────────────── */

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = [...otp];
    for (let i = 0; i < OTP_LENGTH; i++) {
      next[i] = pasted[i] || "";
    }
    setOtp(next);
    setError(false);

    // Focus last filled or last box
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === OTP_LENGTH) {
      handleSubmit(next);
    }
  };

  /* ── Resend ────────────────────────────── */

  const handleResend = () => {
    setTimer(TIMER_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(""));
    setError(false);
    inputRefs.current[0]?.focus();
  };

  /* ── Manual verify button ──────────────── */

  const handleVerifyClick = () => {
    const code = otp.join("");
    if (code.length === OTP_LENGTH) {
      handleSubmit(otp);
    }
  };

  const isFilled = otp.every((d) => d !== "");

  /* ── Render ────────────────────────────── */

  if (verified) {
    return (
      <main className={styles.verifyPage}>
        <div className={styles.card}>
          <div className={styles.successIcon}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className={styles.successHeading}>Email verified</h1>
          <p className={styles.successSubtext}>
            Your account has been verified successfully.
          </p>
          <Link href="/account" className={styles.submitButton} style={{ textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Go to My Account
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.verifyPage}>
      <div className={styles.card}>
        {/* Email icon */}
        <div className={styles.emailIcon}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <path d="M22 7l-10 6L2 7" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className={styles.heading}>Verify your email</h1>
        <p className={styles.subtext}>
          We sent a 6-digit code to{" "}
          <span className={styles.emailHighlight}>{email}</span>
        </p>

        {/* Error message */}
        {serverError && (
          <div className={styles.errorBanner}>{serverError}</div>
        )}

        {/* OTP boxes */}
        <div className={styles.otpRow}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              autoComplete="one-time-code"
              className={[
                styles.otpInput,
                digit ? styles.otpInputFilled : "",
                error ? styles.otpInputError : "",
              ]
                .filter(Boolean)
                .join(" ")}
              value={digit}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              onFocus={(e) => e.target.select()}
              disabled={verifying}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {/* Timer / Resend */}
        <div className={styles.timerRow}>
          {timer > 0 ? (
            <span className={styles.timerText}>
              Resend code in {formattedTime}
            </span>
          ) : (
            <button
              type="button"
              className={styles.resendButton}
              onClick={handleResend}
            >
              Resend code
            </button>
          )}
        </div>

        {/* Verify button */}
        <button
          id="verify-submit"
          type="button"
          className={`${styles.submitButton} ${verifying ? styles.verifying : ""}`}
          disabled={!isFilled || verifying}
          onClick={handleVerifyClick}
        >
          Verify
        </button>

        {/* Footer */}
        <p className={styles.footer}>
          Wrong email?
          <Link href="/register" className={styles.footerLink}>
            Go back
          </Link>
        </p>
      </div>
    </main>
  );
}
