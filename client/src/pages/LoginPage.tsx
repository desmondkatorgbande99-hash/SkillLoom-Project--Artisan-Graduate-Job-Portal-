import { useState } from "react";
import type { FormEvent } from "react";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

interface LoginPageProps {
  onBack: () => void;
  onRegister: () => void;
  onSuccess: () => void;
  onVerificationRequired: (
    email: string,
  ) => void;
  onForgotPassword: () => void;
}

export default function LoginPage({
  onBack,
  onRegister,
  onSuccess,
  onVerificationRequired,
  onForgotPassword,
}: LoginPageProps) {
  const { login } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loginSuccess, setLoginSuccess] =
    useState(false);

  const handleSubmit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Please enter your email and password.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await login({
        email: email.trim(),
        password,
      });

      setLoginSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 900);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to log in.";

      if (
        message
          .toLowerCase()
          .includes("verify your email")
      ) {
        onVerificationRequired(
          email.trim(),
        );
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <button
        type="button"
        className="auth-back-button"
        onClick={onBack}
      >
        <ArrowLeft size={18} />
        Back to SkillLoom
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            S
          </div>

          <span>SkillLoom</span>
        </div>

        <div className="auth-heading">
          <h1>Welcome back</h1>

          <p>
            Sign in to continue connecting
            skills with opportunity.
          </p>
        </div>

        {loginSuccess && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "12px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              fontWeight: 700,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <span>✓</span> Login successful! Taking you to your dashboard...
          </div>
        )}

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          <div className="auth-field">
            <label htmlFor="login-email">
              Email address
            </label>

            <div className="auth-input-wrapper">
              <Mail size={18} />

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label htmlFor="login-password">
                Password
              </label>

              <button
                type="button"
                onClick={onForgotPassword}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>

            <div className="auth-input-wrapper">
              <Lock size={18} />

              <input
                id="login-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (value) => !value,
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <p className="auth-switch">
          Don't have a SkillLoom account?{" "}
          <button
            type="button"
            onClick={onRegister}
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
