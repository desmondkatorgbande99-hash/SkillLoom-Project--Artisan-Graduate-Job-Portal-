import { useState } from "react";
import type { FormEvent } from "react";

import {
  ArrowLeft,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Wrench,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import type { UserRole } from "../types";

interface RegisterPageProps {
  onBack: () => void;
  onLogin: () => void;
  onRegistered: (
    email: string,
  ) => void;
}

export default function RegisterPage({
  onBack,
  onLogin,
  onRegistered,
}: RegisterPageProps) {
  const { register } = useAuth();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [role, setRole] =
    useState<UserRole>("GRADUATE");

  const [companyName, setCompanyName] =
    useState("");

  const [trade, setTrade] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleSubmit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setError("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Please complete all required fields.",
      );
      return;
    }

    if (fullName.trim().length < 2) {
      setError(
        "Full name must contain at least 2 characters.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match.",
      );
      return;
    }

    if (
      role === "EMPLOYER" &&
      companyName.trim().length < 2
    ) {
      setError(
        "Please enter your company name.",
      );
      return;
    }

    if (
      role === "ARTISAN" &&
      trade.trim().length < 2
    ) {
      setError(
        "Please enter your trade.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
        ...(role === "EMPLOYER"
          ? {
              companyName:
                companyName.trim(),
            }
          : {}),
        ...(role === "ARTISAN"
          ? {
              trade: trade.trim(),
            }
          : {}),
      });

      onRegistered(
        email.trim().toLowerCase(),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account.",
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
        Back to SkillLoom
      </button>

      <div className="auth-card auth-card-register">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            S
          </div>

          <span>SkillLoom</span>
        </div>

        <div className="auth-heading">
          <h1>Create your account</h1>

          <p>
            Join SkillLoom and turn skills
            into opportunity.
          </p>
        </div>

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
            <label htmlFor="register-name">
              Full name
            </label>

            <div className="auth-input-wrapper">
              <User size={18} />

              <input
                id="register-name"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value,
                  )
                }
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">
              Email address
            </label>

            <div className="auth-input-wrapper">
              <Mail size={18} />

              <input
                id="register-email"
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
            <label>
              I am joining as
            </label>

            <div className="role-options">
              <button
                type="button"
                className={`role-option ${
                  role === "GRADUATE"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setRole("GRADUATE")
                }
              >
                <User size={19} />

                <span>
                  <strong>
                    Graduate
                  </strong>

                  <small>
                    Find opportunities
                  </small>
                </span>
              </button>

              <button
                type="button"
                className={`role-option ${
                  role === "ARTISAN"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setRole("ARTISAN")
                }
              >
                <Wrench size={19} />

                <span>
                  <strong>
                    Artisan
                  </strong>

                  <small>
                    Showcase your trade
                  </small>
                </span>
              </button>

              <button
                type="button"
                className={`role-option ${
                  role === "EMPLOYER"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setRole("EMPLOYER")
                }
              >
                <BriefcaseBusiness
                  size={19}
                />

                <span>
                  <strong>
                    Employer
                  </strong>

                  <small>
                    Hire skilled people
                  </small>
                </span>
              </button>
            </div>
          </div>

          {role === "EMPLOYER" && (
            <div className="auth-field">
              <label htmlFor="company-name">
                Company name
              </label>

              <div className="auth-input-wrapper">
                <BriefcaseBusiness
                  size={18}
                />

                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(event) =>
                    setCompanyName(
                      event.target.value,
                    )
                  }
                  placeholder="Your company name"
                  autoComplete="organization"
                />
              </div>
            </div>
          )}

          {role === "ARTISAN" && (
            <div className="auth-field">
              <label htmlFor="artisan-trade">
                Trade
              </label>

              <div className="auth-input-wrapper">
                <Wrench size={18} />

                <input
                  id="artisan-trade"
                  type="text"
                  value={trade}
                  onChange={(event) =>
                    setTrade(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Electrician, Tailor, Plumber"
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="register-password">
              Password
            </label>

            <div className="auth-input-wrapper">
              <Lock size={18} />

              <input
                id="register-password"
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
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword(
                    (value) => !value,
                  )
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

          <div className="auth-field">
            <label htmlFor="confirm-password">
              Confirm password
            </label>

            <div className="auth-input-wrapper">
              <Lock size={18} />

              <input
                id="confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value,
                  )
                }
                placeholder="Repeat your password"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    (value) => !value,
                  )
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <p className="auth-terms">
            By creating an account, you agree
            to use SkillLoom responsibly and
            provide accurate information.
          </p>

          <button
            type="submit"
            className="auth-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <p className="auth-switch">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onLogin}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}