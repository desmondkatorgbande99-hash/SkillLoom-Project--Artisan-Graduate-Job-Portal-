import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { apiRequest } from "../services/api";

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
  onBackToLanding: () => void;
}

export default function ForgotPasswordPage({
  onBackToLogin,
  onBackToLanding,
}: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest<{ success: boolean; message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <button
        type="button"
        className="auth-back-button"
        onClick={onBackToLanding}
      >
        <ArrowLeft size={18} />
        Back to SkillLoom
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">S</div>
          <span>SkillLoom</span>
        </div>

        {submitted ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                margin: "0 auto 20px",
                borderRadius: "50%",
                background: "#ecfdf5",
                color: "#10b981",
                display: "grid",
                placeItems: "center",
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              Check your inbox
            </h1>

            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: "1.6", marginBottom: "28px" }}>
              If an account with <strong>{email}</strong> exists, we’ve sent a password reset link to your email. Please check your inbox and spam folder.
            </p>

            <button
              type="button"
              className="auth-submit"
              onClick={onBackToLogin}
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="auth-heading">
              <h1>Forgot password?</h1>
              <p>
                No worries. Enter the email address associated with your account and we’ll send you a link to reset your password.
              </p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="reset-email">Email address</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending reset link..." : "Send Reset Link"}
              </button>
            </form>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <p className="auth-switch">
              Remember your password?{" "}
              <button type="button" onClick={onBackToLogin}>
                Back to Sign In
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
