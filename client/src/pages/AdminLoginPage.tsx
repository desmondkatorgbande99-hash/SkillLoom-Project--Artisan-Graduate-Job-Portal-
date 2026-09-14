import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AdminLoginPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AdminLoginPage({
  onBack,
  onSuccess,
}: AdminLoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your administrator credentials.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login({
        email: email.trim(),
        password,
      });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid administrator credentials."
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
        onClick={onBack}
      >
        <ArrowLeft size={18} />
        Back to SkillLoom Home
      </button>

      <div className="auth-card" style={{ borderColor: "#cbd5e1" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              margin: "0 auto 12px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.2)",
            }}
          >
            <ShieldAlert size={28} color="#38bdf8" />
          </div>

          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "999px",
              background: "#f1f5f9",
              color: "#475569",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Restricted Staff Access
          </div>

          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
            Admin Portal
          </h1>

          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
            Sign in to access platform moderation, user oversight, and job analytics.
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="admin-email">Admin Email</label>
            <div className="auth-input-wrapper">
              <Mail size={18} />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@skillloom.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="admin-password">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} />
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
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

          <button
            type="submit"
            className="auth-submit"
            style={{
              background: "linear-gradient(135deg, #0f172a, #334155)",
              marginTop: "8px",
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Authenticating..." : "Access Admin Console"}
          </button>
        </form>

        <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            This portal is strictly for authorized SkillLoom administrators.
          </span>
        </div>
      </div>
    </div>
  );
}
