import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  apiRequest,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "../services/api";

import type {
  LoginResponse,
  Profile,
  RegisterResponse,
  User,
  UserRole,
} from "../types";

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  companyName?: string;
  trade?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    profile?: Profile;
  };
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  token: string | null;

  isLoading: boolean;
  isAuthenticated: boolean;

  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<string>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [token, setToken] =
    useState<string | null>(
      getAuthToken(),
    );

  const [isLoading, setIsLoading] =
    useState(true);

  /**
   * Restore the authenticated user's
   * profile from the backend.
   *
   * GET /api/profiles/me is expected to return:
   *
   * {
   *   success: true,
   *   data: {
   *     profile: {
   *       ...
   *     }
   *   }
   * }
   *
   * If the token is invalid, authentication
   * is cleared.
   */
  const refreshUser = useCallback(async () => {
    const currentToken = getAuthToken();

    if (!currentToken) {
      setUser(null);
      setProfile(null);
      setToken(null);
      return;
    }

    try {
      const response =
        await apiRequest<ProfileResponse>(
          "/profiles/me",
          {
            method: "GET",
            auth: true,
          },
        );

      if (
        !response.success ||
        !response.data?.profile
      ) {
        throw new Error(
          response.message ||
            "Unable to load your profile.",
        );
      }

      const currentProfile =
        response.data.profile;

      setProfile(currentProfile);

      /**
       * The profile contains the authenticated
       * user's role and account information.
       */
      setUser(currentProfile);
      setToken(currentToken);
    } catch (error) {
      /**
       * IMPORTANT:
       *
       * Do not silently destroy the authenticated
       * session here unless the backend explicitly
       * rejected the token.
       *
       * This prevents a successful login from
       * immediately sending the user back to the
       * landing page when profile loading has a
       * temporary/backend response problem.
       */
      console.error(
        "Unable to refresh authenticated user:",
        error,
      );

      /**
       * If we already have a valid user in state,
       * preserve that authenticated session.
       *
       * This is especially important immediately
       * after login.
       */
      setUser((prevUser) => {
        if (!prevUser) {
          clearAuthToken();
          setProfile(null);
          setToken(null);
        }
        return prevUser;
      });
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    };

    void initializeAuth();
  }, [refreshUser]);

  const login = async ({
    email,
    password,
  }: LoginData) => {
    const response =
      await apiRequest<LoginResponse>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

    /**
     * Establish authentication immediately from
     * the successful login response.
     */
    const authenticatedUser =
      response.data.user;

    const authenticatedToken =
      response.data.token;

    setAuthToken(authenticatedToken);

    setToken(authenticatedToken);
    setUser(authenticatedUser);

    if (response.data.profile) {
      setProfile(response.data.profile);
      setUser(response.data.profile);
    }

    /**
     * Refresh the complete profile in the background without blocking login.
     */
    apiRequest<ProfileResponse>("/profiles/me", {
      method: "GET",
      auth: true,
    })
      .then((profileResponse) => {
        if (profileResponse.success && profileResponse.data?.profile) {
          setProfile(profileResponse.data.profile);
          setUser(profileResponse.data.profile);
        }
      })
      .catch((error) => {
        console.error("Unable to load profile after login:", error);
      });

    return authenticatedUser;
  };

  const register = async (
    data: RegisterData,
  ) => {
    const response =
      await apiRequest<RegisterResponse>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );

    if (response.data?.verificationUrl) {
      try {
        sessionStorage.setItem("skillloom_pending_verification_url", response.data.verificationUrl);
      } catch {
        // ignore storage error
      }
    }

    return response.message;
  };

  const logout = () => {
    clearAuthToken();

    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      token,

      isLoading,

      isAuthenticated:
        Boolean(user && token),

      login,
      register,
      logout,
      refreshUser,
    }),
    [
      user,
      profile,
      token,
      isLoading,
      refreshUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider.",
    );
  }

  return context;
}