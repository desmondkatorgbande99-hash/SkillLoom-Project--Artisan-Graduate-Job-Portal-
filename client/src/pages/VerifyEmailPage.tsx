import { useEffect, useState } from "react";

type VerifyEmailPageProps = {
  email: string;
  onBack: () => void;
  onLogin: () => void;
};

type VerificationState =
  | "verifying"
  | "pending"
  | "success"
  | "error";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5550/api";

function VerifyEmailPage({
  email,
  onBack,
  onLogin,
}: VerifyEmailPageProps) {
  const [state, setState] =
    useState<VerificationState>("verifying");

  const [message, setMessage] = useState(
    "Verifying your email address...",
  );

  // Resend email state
  const [resendEmail, setResendEmail] = useState(email || "");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const [directVerifyToken, setDirectVerifyToken] = useState<string | null>(() => {
    try {
      const stored = sessionStorage.getItem("skillloom_pending_verification_url");
      if (stored) {
        const u = new URL(stored);
        return u.searchParams.get("token");
      }
    } catch {
      // ignore
    }
    return null;
  });

  const handleDirectActivate = async (tokenToUse: string) => {
    setState("verifying");
    setMessage("Activating and verifying your account...");
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(tokenToUse)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "We could not verify your email address.");
      }
      try {
        sessionStorage.removeItem("skillloom_pending_verification_url");
      } catch {
        // ignore
      }
      setState("success");
      setMessage(result.message || "Your email address has been verified successfully. You can now sign in.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Verification failed. Please request a new verification email.");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const verifyEmail = async () => {
      const params = new URLSearchParams(
        window.location.search,
      );

      const token = params.get("token");

      if (!token) {
        if (!cancelled) {
          // No token in the URL — user just registered and is waiting.
          setState("pending");
          setMessage(
            "We've sent a verification link to your email address. Please check your inbox (and spam folder) and click the link to activate your account.",
          );
        }
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          },
        );

        let result: {
          success?: boolean;
          message?: string;
        } = {};

        try {
          result = await response.json();
        } catch {
          result = {};
        }

        if (!response.ok) {
          throw new Error(
            result.message ||
              "We could not verify your email address.",
          );
        }

        if (!cancelled) {
          setState("success");
          setMessage(
            result.message ||
              "Your email address has been verified successfully.",
          );
        }
      } catch (error) {
        if (cancelled) return;

        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Email verification failed. Please request a new verification email.",
        );
      }
    };

    verifyEmail();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleResendEmail = async () => {
    if (!resendEmail.trim()) {
      setResendError("Please enter your email address.");
      return;
    }

    setIsResending(true);
    setResendMessage("");
    setResendError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
        },
      );

      let result: {
        success?: boolean;
        message?: string;
        data?: { verificationUrl?: string; emailSent?: boolean };
      } = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error(result.message || "Could not resend verification email.");
      }

      if (result.data?.verificationUrl) {
        try {
          const u = new URL(result.data.verificationUrl);
          const t = u.searchParams.get("token");
          if (t) setDirectVerifyToken(t);
        } catch {
          // ignore
        }
      }

      setResendMessage(
        result.message ||
          "Verification link generated! Check your inbox or click the instant activate button.",
      );
    } catch (err) {
      setResendError(
        err instanceof Error
          ? err.message
          : "Failed to resend email. Please try again.",
      );
    } finally {
      setIsResending(false);
    }
  };

  const iconBg =
    state === "error"
      ? "#dc2626"
      : state === "success"
        ? "#16a34a"
        : "linear-gradient(135deg, #2563eb, #0ea5e9)";

  const iconChar =
    state === "verifying"
      ? "⏳"
      : state === "pending"
        ? "✉"
        : state === "success"
          ? "✓"
          : "!";

  const heading =
    state === "verifying"
      ? "Verifying your email..."
      : state === "pending"
        ? "Account created successfully!"
        : state === "success"
          ? "Email verified! 🎉"
          : "Verification failed";

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.10)",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "72px",
            height: "72px",
            margin: "0 auto 24px",
            borderRadius: "20px",
            display: "grid",
            placeItems: "center",
            background: iconBg,
            color: "#ffffff",
            fontSize: "32px",
            fontWeight: 800,
          }}
        >
          {iconChar}
        </div>

        {/* Heading */}
        <h1
          style={{
            margin: "0 0 12px",
            color: "#0f172a",
            fontSize: "26px",
            lineHeight: 1.2,
            fontWeight: 700,
          }}
        >
          {heading}
        </h1>

        {email && state !== "error" && (
          <p
            style={{
              margin: "0 0 16px",
              color: "#2563eb",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            {email}
          </p>
        )}

        <p
          style={{
            margin: "0 auto 28px",
            maxWidth: "420px",
            color: "#64748b",
            fontSize: "16px",
            lineHeight: 1.7,
          }}
        >
          {message}
        </p>

        {/* PENDING STATE — just registered */}
        {state === "pending" && (
          <>
            {directVerifyToken && (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  marginBottom: "24px",
                  textAlign: "center",
                }}
              >
                <div style={{ color: "#166534", fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>
                  ⚡ Instant Account Activation
                </div>
                <div style={{ color: "#15803d", fontSize: "13px", marginBottom: "14px", lineHeight: 1.5 }}>
                  You can verify and activate your account immediately right here:
                </div>
                <button
                  type="button"
                  onClick={() => handleDirectActivate(directVerifyToken)}
                  style={{
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px 24px",
                    background: "linear-gradient(135deg, #16a34a, #15803d)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 6px 16px rgba(22, 163, 74, 0.25)",
                  }}
                >
                  ✓ Verify & Activate Account Now →
                </button>
              </div>
            )}

            {/* Primary action buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "32px",
              }}
            >
              <button
                type="button"
                onClick={onLogin}
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "13px 28px",
                  background:
                    "linear-gradient(135deg, #2563eb, #0ea5e9)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
                }}
              >
                Go to Login →
              </button>

              <button
                type="button"
                onClick={onBack}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "12px",
                  padding: "13px 20px",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                Back to SkillLoom
              </button>
            </div>

            {/* Resend email section */}
            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: "24px",
              }}
            >
              <p
                style={{
                  color: "#475569",
                  fontSize: "14px",
                  marginBottom: "14px",
                  fontWeight: 500,
                }}
              >
                Didn't receive the email? Enter your address below to resend.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  maxWidth: "400px",
                  margin: "0 auto",
                }}
              >
                <input
                  type="email"
                  placeholder="Your email address"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  style={{
                    flex: "1",
                    minWidth: "200px",
                    padding: "10px 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "10px",
                    background: isResending ? "#94a3b8" : "#1e40af",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: isResending ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isResending ? "Sending..." : "Resend Email"}
                </button>
              </div>

              {resendMessage && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 16px",
                    background: "#dcfce7",
                    color: "#15803d",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  ✓ {resendMessage}
                </div>
              )}

              {resendError && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 16px",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {resendError}
                </div>
              )}
            </div>
          </>
        )}

        {/* SUCCESS STATE */}
        {state === "success" && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={onLogin}
              style={{
                border: "none",
                borderRadius: "12px",
                padding: "14px 28px",
                background:
                  "linear-gradient(135deg, #16a34a, #15803d)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(22, 163, 74, 0.25)",
              }}
            >
              Sign In to SkillLoom →
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {state === "error" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "28px",
              }}
            >
              <button
                type="button"
                onClick={onLogin}
                style={{
                  border: "none",
                  borderRadius: "12px",
                  padding: "13px 24px",
                  background:
                    "linear-gradient(135deg, #2563eb, #0ea5e9)",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                Go to Sign In
              </button>

              <button
                type="button"
                onClick={onBack}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "12px",
                  padding: "13px 24px",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                Back to SkillLoom
              </button>
            </div>

            {/* Resend section for error state too */}
            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: "24px",
              }}
            >
              <p
                style={{
                  color: "#475569",
                  fontSize: "14px",
                  marginBottom: "14px",
                  fontWeight: 500,
                }}
              >
                Request a new verification email:
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  maxWidth: "400px",
                  margin: "0 auto",
                }}
              >
                <input
                  type="email"
                  placeholder="Your email address"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  style={{
                    flex: "1",
                    minWidth: "200px",
                    padding: "10px 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "10px",
                    background: isResending ? "#94a3b8" : "#1e40af",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: isResending ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isResending ? "Sending..." : "Resend Email"}
                </button>
              </div>

              {resendMessage && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 16px",
                    background: "#dcfce7",
                    color: "#15803d",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  ✓ {resendMessage}
                </div>
              )}

              {resendError && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 16px",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {resendError}
                </div>
              )}
            </div>
          </>
        )}

        {/* VERIFYING STATE */}
        {state === "verifying" && (
          <div
            style={{
              marginTop: "8px",
              color: "#2563eb",
              fontWeight: 600,
              fontSize: "15px",
            }}
          >
            Please wait...
          </div>
        )}
      </section>
    </main>
  );
}

export default VerifyEmailPage;
