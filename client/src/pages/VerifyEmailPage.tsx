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

  useEffect(() => {
    let cancelled = false;

    const verifyEmail = async () => {
      const params = new URLSearchParams(
        window.location.search,
      );

      const token = params.get("token");

      if (!token) {
        if (!cancelled) {
          // No token in the URL means the user was just sent here after
          // registration — show a friendly "check your inbox" waiting screen.
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

  const iconBg =
    state === "error"
      ? "#dc2626"
      : "linear-gradient(135deg, #2563eb, #0ea5e9)";

  const iconChar =
    state === "verifying"
      ? "..."
      : state === "pending"
        ? "\u2709"
        : state === "success"
          ? "\u2713"
          : "!";

  const heading =
    state === "verifying"
      ? "Verifying your email"
      : state === "pending"
        ? "Check your inbox"
        : state === "success"
          ? "Email verified successfully"
          : "Email verification failed";

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
        <div
          style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 24px",
            borderRadius: "18px",
            display: "grid",
            placeItems: "center",
            background: iconBg,
            color: "#ffffff",
            fontSize: "28px",
            fontWeight: 800,
          }}
        >
          {iconChar}
        </div>

        <h1
          style={{
            margin: "0 0 12px",
            color: "#0f172a",
            fontSize: "30px",
            lineHeight: 1.2,
          }}
        >
          {heading}
        </h1>

        {email && (
          <p
            style={{
              margin: "0 0 16px",
              color: "#475569",
              fontSize: "15px",
            }}
          >
            {email}
          </p>
        )}

        <p
          style={{
            margin: "0 auto",
            maxWidth: "420px",
            color: "#64748b",
            fontSize: "16px",
            lineHeight: 1.7,
          }}
        >
          {message}
        </p>

        {state === "verifying" && (
          <div
            style={{
              marginTop: "28px",
              color: "#2563eb",
              fontWeight: 600,
            }}
          >
            Please wait...
          </div>
        )}

        {state === "pending" && (
          <div
            style={{
              marginTop: "32px",
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
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
              }}
            >
              Back to SkillLoom
            </button>
          </div>
        )}

        {state === "success" && (
          <div
            style={{
              marginTop: "32px",
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
                padding: "13px 24px",
                background:
                  "linear-gradient(135deg, #2563eb, #0ea5e9)",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Continue to Sign In
            </button>
          </div>
        )}

        {state === "error" && (
          <div
            style={{
              marginTop: "32px",
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
                padding: "13px 24px",
                background:
                  "linear-gradient(135deg, #2563eb, #0ea5e9)",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
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
              }}
            >
              Back to SkillLoom
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default VerifyEmailPage;
