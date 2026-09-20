import { useState } from "react";

import "./App.css";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import DashboardPage from "./pages/DashboardPage";

import { useAuth } from "./context/AuthContext";

type Role = "graduate" | "artisan" | "employer";

type AuthView =
  | "landing"
  | "login"
  | "register"
  | "verify"
  | "forgot-password"
  | "reset-password"
  | "admin-login";

const featuredJobs = [
  {
    id: 1,
    title: "Frontend Developer (React / Next.js)",
    company: "Tech Solutions Ltd",
    location: "Lagos, Nigeria (Hybrid)",
    type: "Full-time",
    category: "Technology",
    salary: "₦350k – ₦600k",
  },
  {
    id: 2,
    title: "Backend Developer (Node.js & Python)",
    company: "PayWave Systems",
    location: "Abuja, Nigeria (Remote)",
    type: "Full-time",
    category: "Technology",
    salary: "₦400k – ₦750k",
  },
  {
    id: 3,
    title: "Cybersecurity Analyst",
    company: "SecureNet Africa",
    location: "Lagos, Nigeria",
    type: "Full-time",
    category: "Technology",
    salary: "₦500k – ₦850k",
  },
  {
    id: 4,
    title: "AI & Automation Engineer",
    company: "Cognitive Automations Lab",
    location: "Lagos, Nigeria (Remote)",
    type: "Full-time",
    category: "Technology",
    salary: "₦600k – ₦1.1M",
  },
  {
    id: 5,
    title: "Database Architect & Administrator",
    company: "CloudCore Infrastructure",
    location: "Port Harcourt, Nigeria",
    type: "Full-time",
    category: "Technology",
    salary: "₦450k – ₦700k",
  },
  {
    id: 6,
    title: "Cloud & DevOps Engineer",
    company: "DevCloud Systems",
    location: "Abuja, Nigeria (Remote)",
    type: "Full-time",
    category: "Technology",
    salary: "₦550k – ₦900k",
  },
  {
    id: 7,
    title: "Master Electrician & Solar Installer",
    company: "BuildRight Services",
    location: "Port Harcourt, Nigeria",
    type: "Contract",
    category: "Skilled Trades",
    salary: "₦180k – ₦300k",
  },
  {
    id: 8,
    title: "Bespoke Fashion Tailor & Clothier",
    company: "StyleCraft Atelier",
    location: "Abuja, Nigeria",
    type: "Full-time",
    category: "Fashion",
    salary: "₦120k – ₦220k",
  },
  {
    id: 9,
    title: "Automotive Diagnostics & Mechanic",
    company: "AutoCraft Technical Hub",
    location: "Benin City, Nigeria",
    type: "Full-time",
    category: "Skilled Trades",
    salary: "₦150k – ₦260k",
  },
  {
    id: 10,
    title: "Data Analyst & Business Intelligence",
    company: "Insight Analytics Africa",
    location: "Lagos, Nigeria",
    type: "Full-time",
    category: "Technology",
    salary: "₦350k – ₦550k",
  },
];

const categories = [
  {
    icon: "💻",
    title: "Technology",
    description:
      "Software, data, IT and digital careers",
    jobs: "120+ jobs",
  },
  {
    icon: "🎨",
    title: "Creative & Design",
    description:
      "Designers, photographers and creatives",
    jobs: "85+ jobs",
  },
  {
    icon: "🔧",
    title: "Skilled Trades",
    description:
      "Electricians, plumbers, mechanics and more",
    jobs: "150+ jobs",
  },
  {
    icon: "👗",
    title: "Fashion & Beauty",
    description:
      "Tailors, stylists, barbers and beauticians",
    jobs: "95+ jobs",
  },
  {
    icon: "🏗️",
    title: "Construction",
    description:
      "Builders, technicians and craftsmen",
    jobs: "70+ jobs",
  },
  {
    icon: "📊",
    title: "Business",
    description:
      "Administration, sales and professional services",
    jobs: "100+ jobs",
  },
];

const roleCards: {
  role: Role;
  icon: string;
  title: string;
  description: string;
  points: string[];
}[] = [
  {
    role: "graduate",
    icon: "🎓",
    title: "For Graduates",
    description:
      "Launch your career and connect with employers looking for fresh talent.",
    points: [
      "Discover relevant opportunities",
      "Create your professional profile",
      "Track your applications",
    ],
  },
  {
    role: "artisan",
    icon: "🛠️",
    title: "For Artisans",
    description:
      "Showcase your skills and find clients and employers who value your craft.",
    points: [
      "Showcase your skills",
      "Set your availability and rates",
      "Find work that fits your expertise",
    ],
  },
  {
    role: "employer",
    icon: "🏢",
    title: "For Employers",
    description:
      "Find qualified graduates and skilled professionals for your business.",
    points: [
      "Post jobs easily",
      "Review qualified applicants",
      "Hire the right talent",
    ],
  },
];

function App() {
  const {
    isLoading,
    isAuthenticated,
    user,
    logout,
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [activeCategory, setActiveCategory] =
    useState("All");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [location, setLocation] =
    useState("");

  /**
   * Detect the current frontend route.
   *
   * Dashboard routes:
   * /dashboard/graduate
   * /dashboard/artisan
   * /dashboard/employer
   * /dashboard/admin
   *
   * Verification route:
   * /verify-email?token=...
   */
  const pathname =
    window.location.pathname;

  const getInitialAuthView = (): AuthView => {
    const params = new URLSearchParams(
      window.location.search,
    );

    const verificationToken =
      params.get("token");

    if (
      (pathname === "/verify-email" ||
        pathname === "/verify-email/") &&
      verificationToken
    ) {
      return "verify";
    }

    if (
      (pathname === "/reset-password" ||
        pathname === "/reset-password/") &&
      verificationToken
    ) {
      return "reset-password";
    }

    if (
      pathname === "/admin" ||
      pathname === "/admin/" ||
      pathname === "/admin-login" ||
      pathname === "/admin-login/"
    ) {
      return "admin-login";
    }

    return "landing";
  };

  const [authView, setAuthView] =
    useState<AuthView>(
      getInitialAuthView,
    );

  const [verificationEmail, setVerificationEmail] =
    useState("");

  const [selectedLandingJob, setSelectedLandingJob] = useState<typeof featuredJobs[0] | null>(null);

  const filteredJobs = featuredJobs.filter(
    (job) => {
      const categoryMatch =
        activeCategory === "All" ||
        job.category === activeCategory;

      const searchMatch =
        searchTerm.trim() === "" ||
        job.title
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase(),
          ) ||
        job.company
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase(),
          ) ||
        job.category
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase(),
          );

      const locationMatch =
        location.trim() === "" ||
        job.location
          .toLowerCase()
          .includes(
            location.toLowerCase(),
          );

      return (
        categoryMatch &&
        searchMatch &&
        locationMatch
      );
    },
  );

  const scrollToJobs = () => {
    document
      .getElementById("jobs")
      ?.scrollIntoView({
        behavior: "smooth",
      });
  };

  const scrollToSection = (
    id: string,
  ) => {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
      });

    setMobileMenuOpen(false);
  };

  const openLogin = () => {
    setMobileMenuOpen(false);

    setAuthView("login");

    window.history.replaceState(
      {},
      document.title,
      "/",
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openRegister = () => {
    setMobileMenuOpen(false);

    setAuthView("register");

    window.history.replaceState(
      {},
      document.title,
      "/",
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openVerification = (
    email: string,
  ) => {
    setMobileMenuOpen(false);

    setVerificationEmail(email);

    setAuthView("verify");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const returnToLanding = () => {
    setAuthView("landing");

    setMobileMenuOpen(false);

    window.history.replaceState(
      {},
      document.title,
      "/",
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openForgotPassword = () => {
    setMobileMenuOpen(false);

    setAuthView("forgot-password");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /**
   * Authentication pages.
   */
  if (authView === "login") {
    return (
      <LoginPage
        onBack={returnToLanding}
        onRegister={openRegister}
        onForgotPassword={openForgotPassword}
        onSuccess={() => {
          /**
           * Login has succeeded.
           *
           * AuthContext has already populated:
           * - user
           * - token
           * - profile
           *
           * Changing the auth view allows App()
           * to continue to the authenticated
           * dashboard routing block below.
           */
          setAuthView("landing");
        }}
        onVerificationRequired={
          openVerification
        }
      />
    );
  }

  if (authView === "register") {
    return (
      <RegisterPage
        onBack={returnToLanding}
        onLogin={openLogin}
        onRegistered={openVerification}
      />
    );
  }

  if (authView === "verify") {
    return (
      <VerifyEmailPage
        email={verificationEmail}
        onBack={returnToLanding}
        onLogin={openLogin}
      />
    );
  }

  if (authView === "forgot-password") {
    return (
      <ForgotPasswordPage
        onBackToLogin={openLogin}
        onBackToLanding={returnToLanding}
      />
    );
  }

  if (authView === "reset-password") {
    return (
      <ResetPasswordPage
        onBackToLogin={openLogin}
        onBackToLanding={returnToLanding}
      />
    );
  }

  if (authView === "admin-login") {
    return (
      <AdminLoginPage
        onBack={returnToLanding}
        onSuccess={() => {
          setAuthView("landing");
        }}
      />
    );
  }

  /**
   * Prevent the landing page from briefly
   * rendering while authentication state
   * is being restored.
   */
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          background: "#f8fafc",
          color: "#0f172a",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            display: "grid",
            placeItems: "center",
            background:
              "linear-gradient(135deg, #2563eb, #0ea5e9)",
            color: "#ffffff",
            fontSize: "24px",
            fontWeight: 800,
            boxShadow:
              "0 10px 24px rgba(37, 99, 235, 0.2)",
          }}
        >
          S
        </div>

        <strong
          style={{
            fontSize: "18px",
          }}
        >
          SkillLoom
        </strong>

        <span
          style={{
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Loading your experience...
        </span>
      </div>
    );
  }

  /**
   * ROLE-BASED DASHBOARD ROUTING
   *
   * Authenticated users are routed according
   * to their backend role.
   *
   * GRADUATE -> /dashboard/graduate
   * ARTISAN  -> /dashboard/artisan
   * EMPLOYER -> /dashboard/employer
   * ADMIN    -> /dashboard/admin
   */
  if (isAuthenticated && user) {
    const rolePathMap: Record<
      string,
      string
    > = {
      GRADUATE:
        "/dashboard/graduate",

      ARTISAN:
        "/dashboard/artisan",

      EMPLOYER:
        "/dashboard/employer",

      ADMIN:
        "/dashboard/admin",
    };

    const expectedPath =
      rolePathMap[user.role];

    /**
     * If the authenticated user opened a
     * dashboard URL directly, keep that URL.
     *
     * Otherwise send them to the dashboard
     * matching their role.
     */
    if (
      expectedPath &&
      pathname !== expectedPath
    ) {
      window.history.replaceState(
        {},
        document.title,
        expectedPath,
      );
    }

    return (
      <DashboardPage
        onNavigateHome={returnToLanding}
        onLogout={() => {
          logout();

          window.history.replaceState(
            {},
            document.title,
            "/",
          );

          setAuthView("landing");
        }}
      />
    );
  }

  /**
   * Public landing page.
   */
  return (
    <div className="app">
      <header className="navbar">
        <div className="container navbar-inner">
          <button
            className="brand"
            type="button"
            onClick={() =>
              scrollToSection("home")
            }
            aria-label="Go to SkillLoom home"
          >
            <span className="brand-mark">
              S
            </span>

            <span>
              <strong>SkillLoom</strong>

              <small>
                Weaving Skills Into Opportunity
              </small>
            </span>
          </button>

          <nav
            className={`nav-links ${
              mobileMenuOpen
                ? "nav-open"
                : ""
            }`}
            aria-label="Main navigation"
          >
            <button
              type="button"
              onClick={() =>
                scrollToSection("home")
              }
            >
              Home
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection("jobs")
              }
            >
              Find Jobs
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "categories",
                )
              }
            >
              Categories
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "how-it-works",
                )
              }
            >
              How It Works
            </button>

            <div className="mobile-auth">
              <button
                className="nav-login"
                type="button"
                onClick={openLogin}
              >
                Log in
              </button>

              <button
                className="nav-signup"
                type="button"
                onClick={openRegister}
              >
                Get Started
              </button>
            </div>
          </nav>

          <div className="desktop-auth">
            <button
              className="nav-login"
              type="button"
              onClick={openLogin}
            >
              Log in
            </button>

            <button
              className="nav-signup"
              type="button"
              onClick={openRegister}
            >
              Get Started
            </button>
          </div>

          <button
            className={`menu-toggle ${
              mobileMenuOpen
                ? "active"
                : ""
            }`}
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={
              mobileMenuOpen
            }
            onClick={() =>
              setMobileMenuOpen(
                (current) => !current,
              )
            }
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main>
        <section
          className="hero"
          id="home"
        >
          <div className="hero-pattern" />

          <div className="container hero-content">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-dot" />

                Connecting talent with
                opportunity
              </div>

              <h1>
                Your skills.
                <br />

                <span>
                  Your opportunity.
                </span>
              </h1>

              <p>
                SkillLoom connects
                graduates, artisans and
                skilled professionals with
                employers searching for the
                talent they need.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-button large-button"
                  type="button"
                  onClick={scrollToJobs}
                >
                  Find Your Next
                  Opportunity
                  <span>→</span>
                </button>

                <button
                  className="secondary-button large-button"
                  type="button"
                  onClick={() =>
                    scrollToSection(
                      "how-it-works",
                    )
                  }
                >
                  How It Works
                </button>
              </div>

              <div className="hero-stats">
                <div>
                  <strong>
                    500+
                  </strong>

                  <span>
                    Opportunities
                  </span>
                </div>

                <div>
                  <strong>
                    300+
                  </strong>

                  <span>
                    Skilled
                    Professionals
                  </span>
                </div>

                <div>
                  <strong>
                    100+
                  </strong>

                  <span>
                    Employers
                  </span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-glow" />

              <div className="talent-card main-talent-card">
                <div className="talent-card-header">
                  <div className="avatar purple">
                    GDK
                  </div>

                  <div>
                    <strong>
                      Gbande Desmond Kator
                    </strong>

                    <span>
                      Software Developer
                    </span>
                  </div>

                  <span className="available-dot">
                    ●
                  </span>
                </div>

                <div className="skill-list">
                  <span>React</span>

                  <span>
                    TypeScript
                  </span>

                  <span>
                    Node.js
                  </span>

                  <span>
                    Express.js
                  </span>
                </div>

                <div className="talent-footer">
                  <span>
                    Available for work
                  </span>

                  <strong>
                    ★★★★★
                  </strong>
                </div>
              </div>

              <div className="floating-card floating-top">
                <span className="floating-icon">
                  ✓
                </span>

                <div>
                  <strong>
                    New Opportunity
                  </strong>

                  <span>
                    Software Developer
                  </span>
                </div>
              </div>

              <div className="floating-card floating-bottom">
                <span className="floating-icon orange">
                  ₦
                </span>

                <div>
                  <strong>
                    Great Match!
                  </strong>

                  <span>
                    94% skill match
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="search-section"
          aria-label="Search jobs"
        >
          <div className="container">
            <div className="search-box">
              <div className="search-field">
                <span className="field-icon">
                  ⌕
                </span>

                <div>
                  <label htmlFor="job-search">
                    What are you
                    looking for?
                  </label>

                  <input
                    id="job-search"
                    type="text"
                    placeholder="Job title, skill or keyword"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="search-divider" />

              <div className="search-field">
                <span className="field-icon">
                  ⌖
                </span>

                <div>
                  <label htmlFor="job-location">
                    Where?
                  </label>

                  <input
                    id="job-location"
                    type="text"
                    placeholder="City or location"
                    value={location}
                    onChange={(event) =>
                      setLocation(
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <button
                className="primary-button search-button"
                type="button"
                onClick={scrollToJobs}
              >
                Search Jobs
              </button>
            </div>
          </div>
        </section>

        <section
          className="section"
          id="categories"
        >
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="section-label">
                  EXPLORE OPPORTUNITIES
                </span>

                <h2>
                  Find work that
                  matches your skills
                </h2>
              </div>

              <button
                className="text-button"
                type="button"
                onClick={scrollToJobs}
              >
                View all jobs →
              </button>
            </div>

            <div className="category-grid">
              {categories.map(
                (category) => (
                  <button
                    className="category-card"
                    type="button"
                    key={category.title}
                    onClick={() => {
                      setActiveCategory(
                        category.title ===
                          "Creative & Design"
                          ? "Design"
                          : category.title,
                      );

                      scrollToJobs();
                    }}
                  >
                    <span className="category-icon">
                      {category.icon}
                    </span>

                    <strong>
                      {category.title}
                    </strong>

                    <p>
                      {
                        category.description
                      }
                    </p>

                    <span className="category-jobs">
                      {category.jobs} →
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        <section
          className="section jobs-section"
          id="jobs"
        >
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="section-label">
                  FEATURED
                  OPPORTUNITIES
                </span>

                <h2>
                  Latest jobs
                </h2>

                <p>
                  Discover
                  opportunities from
                  employers looking
                  for people with
                  your skills.
                </p>
              </div>

              <button
                className="outline-button"
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setLocation("");
                  setActiveCategory(
                    "All",
                  );
                }}
              >
                Clear filters
              </button>
            </div>

            <div className="job-filters">
              {[
                "All",
                "Technology",
                "Design",
                "Skilled Trades",
                "Fashion",
              ].map(
                (category) => (
                  <button
                    className={
                      activeCategory ===
                      category
                        ? "filter active"
                        : "filter"
                    }
                    type="button"
                    key={category}
                    onClick={() =>
                      setActiveCategory(
                        category,
                      )
                    }
                  >
                    {category}
                  </button>
                ),
              )}
            </div>

            <div className="job-grid">
              {filteredJobs.map(
                (job) => (
                  <article
                    className="job-card"
                    key={job.id}
                  >
                    <div className="job-card-top">
                      <div className="company-logo">
                        {job.company.charAt(
                          0,
                        )}
                      </div>

                      <button
                        className="save-button"
                        type="button"
                        aria-label={`Save ${job.title}`}
                      >
                        ♡
                      </button>
                    </div>

                    <span className="job-category">
                      {job.category}
                    </span>

                    <h3>
                      {job.title}
                    </h3>

                    <p className="company-name">
                      {job.company}
                    </p>

                    <div className="job-meta">
                      <span>
                        ⌖{" "}
                        {job.location}
                      </span>

                      <span>
                        ◷ {job.type}
                      </span>
                    </div>

                    <div className="job-card-bottom">
                      <strong>
                        {job.salary}
                      </strong>

                      <button
                        className="job-link"
                        type="button"
                        onClick={() => setSelectedLandingJob(job)}
                      >
                        View job →
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>

            {filteredJobs.length ===
              0 && (
              <div className="empty-state">
                <span>🔎</span>

                <h3>
                  No matching
                  opportunities
                </h3>

                <p>
                  Try another keyword,
                  location or category.
                </p>
              </div>
            )}

            <div className="center-action">
              <button
                className="primary-button"
                type="button"
                onClick={openLogin}
              >
                Explore All
                Opportunities →
              </button>
            </div>
          </div>

          {/* Interactive Job Details Modal for Landing Page */}
          {selectedLandingJob && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.65)",
                display: "grid",
                placeItems: "center",
                zIndex: 200,
                padding: "20px",
                backdropFilter: "blur(5px)",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "24px",
                  width: "100%",
                  maxWidth: "580px",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  padding: "32px",
                  boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        marginBottom: "10px",
                      }}
                    >
                      {selectedLandingJob.category} · {selectedLandingJob.type}
                    </span>
                    <h2
                      style={{
                        margin: "0 0 6px",
                        fontSize: "24px",
                        color: "#0f172a",
                        fontWeight: 800,
                      }}
                    >
                      {selectedLandingJob.title}
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        color: "#2563eb",
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    >
                      {selectedLandingJob.company}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedLandingJob(null)}
                    style={{
                      border: "none",
                      background: "#f1f5f9",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      display: "grid",
                      placeItems: "center",
                      color: "#475569",
                      fontSize: "18px",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                    padding: "16px",
                    borderRadius: "14px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    margin: "20px 0",
                  }}
                >
                  <div>
                    <span style={{ display: "block", color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>
                      Location
                    </span>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                      📍 {selectedLandingJob.location}
                    </strong>
                  </div>
                  <div>
                    <span style={{ display: "block", color: "#64748b", fontSize: "12px", marginBottom: "4px" }}>
                      Salary Range
                    </span>
                    <strong style={{ fontSize: "14px", color: "#16a34a" }}>
                      💰 {selectedLandingJob.salary}
                    </strong>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: "15px", color: "#0f172a" }}>
                    About This Opportunity
                  </h4>
                  <p style={{ margin: 0, color: "#475569", fontSize: "14px", lineHeight: 1.7 }}>
                    This position is posted by a verified SkillLoom employer. Create an account or sign in as a Graduate or Artisan to submit your application and track your review, shortlisting, and hiring status directly through your dashboard.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedLandingJob(null)}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLandingJob(null);
                      openRegister();
                    }}
                    style={{
                      padding: "12px 24px",
                      borderRadius: "10px",
                      border: "none",
                      background: "linear-gradient(135deg, #2563eb, #0ea5e9)",
                      color: "#ffffff",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
                    }}
                  >
                    Apply Now (Create Account / Sign In) →
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="section role-section">
          <div className="container">
            <div className="center-heading">
              <span className="section-label">
                BUILT FOR YOU
              </span>

              <h2>
                Whatever your role,
                SkillLoom has you
                covered
              </h2>

              <p>
                One platform
                connecting skilled
                people and the
                employers who need
                them.
              </p>
            </div>

            <div className="role-grid">
              {roleCards.map(
                (roleCard) => (
                  <article
                    className="role-card"
                    key={roleCard.role}
                  >
                    <div className="role-icon">
                      {
                        roleCard.icon
                      }
                    </div>

                    <h3>
                      {
                        roleCard.title
                      }
                    </h3>

                    <p>
                      {
                        roleCard.description
                      }
                    </p>

                    <ul>
                      {roleCard.points.map(
                        (point) => (
                          <li
                            key={point}
                          >
                            <span>
                              ✓
                            </span>

                            {point}
                          </li>
                        ),
                      )}
                    </ul>

                    <button
                      className="role-link"
                      type="button"
                      onClick={
                        openRegister
                      }
                    >
                      Get started →
                    </button>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section
          className="section how-section"
          id="how-it-works"
        >
          <div className="container">
            <div className="center-heading">
              <span className="section-label">
                SIMPLE & EFFECTIVE
              </span>

              <h2>
                How SkillLoom works
              </h2>

              <p>
                Getting started
                takes only a few
                simple steps.
              </p>
            </div>

            <div className="steps">
              <div className="step">
                <div className="step-number">
                  01
                </div>

                <div className="step-icon">
                  👤
                </div>

                <h3>
                  Create your profile
                </h3>

                <p>
                  Tell us about
                  your experience,
                  skills and what
                  kind of
                  opportunities you
                  are looking for.
                </p>
              </div>

              <div className="step-line" />

              <div className="step">
                <div className="step-number">
                  02
                </div>

                <div className="step-icon">
                  🔎
                </div>

                <h3>
                  Discover
                  opportunities
                </h3>

                <p>
                  Search jobs and
                  opportunities that
                  match your skills,
                  location and
                  career goals.
                </p>
              </div>

              <div className="step-line" />

              <div className="step">
                <div className="step-number">
                  03
                </div>

                <div className="step-icon">
                  🤝
                </div>

                <h3>
                  Connect & get
                  hired
                </h3>

                <p>
                  Apply to
                  opportunities,
                  connect with
                  employers and take
                  the next step in
                  your career.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <div className="cta-card">
              <div>
                <span className="section-label">
                  READY TO GET
                  STARTED?
                </span>

                <h2>
                  Your next
                  opportunity could
                  be one click away.
                </h2>

                <p>
                  Join SkillLoom and
                  become part of a
                  growing community
                  of skilled
                  professionals and
                  employers.
                </p>
              </div>

              <div className="cta-actions">
                <button
                  className="white-button"
                  type="button"
                  onClick={openRegister}
                >
                  Create an
                  Account →
                </button>

                <button
                  className="transparent-button"
                  type="button"
                  onClick={openRegister}
                >
                  Post a Job
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <button
                className="brand footer-brand-button"
                type="button"
                onClick={() =>
                  scrollToSection(
                    "home",
                  )
                }
              >
                <span className="brand-mark">
                  S
                </span>

                <span>
                  <strong>
                    SkillLoom
                  </strong>

                  <small>
                    Weaving Skills Into
                    Opportunity
                  </small>
                </span>
              </button>

              <p>
                Connecting skilled
                people with meaningful
                opportunities and
                helping employers
                discover the talent
                they need.
              </p>
            </div>

            <div className="footer-column">
              <h4>
                For Talent
              </h4>

              <button
                type="button"
                onClick={scrollToJobs}
              >
                Find Jobs
              </button>

              <button
                type="button"
                onClick={openRegister}
              >
                Create Profile
              </button>

              <button
                type="button"
                onClick={openLogin}
              >
                My Applications
              </button>
            </div>

            <div className="footer-column">
              <h4>
                For Employers
              </h4>

              <button
                type="button"
                onClick={openRegister}
              >
                Post a Job
              </button>

              <button
                type="button"
                onClick={openRegister}
              >
                Find Talent
              </button>

              <button
                type="button"
                onClick={openLogin}
              >
                Employer Dashboard
              </button>
            </div>

            <div className="footer-column">
              <h4>
                SkillLoom
              </h4>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "home",
                  )
                }
              >
                About Us
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection(
                    "how-it-works",
                  )
                }
              >
                How It Works
              </button>

              <button
                type="button"
                onClick={openRegister}
              >
                Contact
              </button>
            </div>
          </div>

          <div className="footer-bottom">
            <span>
              © 2026 SkillLoom. All
              rights reserved.
            </span>

            <span>
              Built to connect skills
              with opportunity.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;