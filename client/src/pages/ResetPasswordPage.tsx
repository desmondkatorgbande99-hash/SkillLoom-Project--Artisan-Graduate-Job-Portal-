import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest } from "../services/api";

interface ResetPasswordPageProps {
  onBackToLogin: () => void;
  onBackToLanding: () => void;
}

export default function ResetPasswordPage({
  onBackToLogin,
  onBackToLanding,
}: ResetPasswordPageProps) {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!tokenFromUrl) {
      setError("This reset link is missing its security token or is invalid.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest<{ success: boolean; message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: tokenFromUrl,
          newPassword: password,
        }),
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset password. The link may have expired."
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

        {success ? (
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
              Password updated!
            </h1>

            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: "1.6", marginBottom: "28px" }}>
              Your password has been successfully reset. You can now sign in with your new credentials.
            </p>

            <button
              type="button"
              className="auth-submit"
              onClick={onBackToLogin}
            >
              Continue to Sign In
            </button>
          </div>
        ) : !tokenFromUrl ? (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                margin: "0 auto 20px",
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#ef4444",
                display: "grid",
                placeItems: "center",
              }}
            >
              <AlertCircle size={32} />
            </div>

            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              Invalid Reset Link
            </h1>

            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: "1.6", marginBottom: "24px" }}>
              This password reset link is missing its security token or has already been used.
            </p>

            <button
              type="button"
              className="auth-submit"
              onClick={onBackToLogin}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="auth-heading">
              <h1>Set new password</h1>
              <p>
                Enter your new password below to regain access to your SkillLoom account.
              </p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="new-password">New Password (min 8 characters)</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} />
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="confirm-password">Confirm New Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting password..." : "Reset Password"}
              </button>
            </form>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <p className="auth-switch">
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
