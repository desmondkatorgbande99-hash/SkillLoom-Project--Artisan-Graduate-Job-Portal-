const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5550/api";

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { auth = false, headers, ...fetchOptions } = options;

  const token = localStorage.getItem("skillloom_token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(auth && token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Something went wrong. Please try again.",
    );
  }

  return data as T;
}

export function setAuthToken(token: string) {
  localStorage.setItem("skillloom_token", token);
}

export function getAuthToken() {
  return localStorage.getItem("skillloom_token");
}

export function clearAuthToken() {
  localStorage.removeItem("skillloom_token");
}