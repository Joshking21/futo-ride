import { auth } from "./firebaseConfig";
import Constants from "expo-constants";

// Resolve the LAN IP if running in development (so real devices can connect to Metro host),
// otherwise use the EXPO_PUBLIC_API_URL or fallback to localhost
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Extract dynamic IP if running via Expo Go local bundler
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    return `http://${ip}:3001`;
  }
  return "http://localhost:3001";
};

export const BASE_URL = getBaseUrl();

/**
 * Perform a type-safe HTTP request to the backend Fastify server.
 * Automatically resolves Firebase Auth token and formats request/response envelopes.
 */
export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: any
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const url = `${BASE_URL}${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json: any;

  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON response from backend: ${text}`);
  }

  if (response.status === 401) {
    throw new Error("Unauthorized. Please check your credentials or log in again.");
  }

  if (!json.ok) {
    throw new Error(json.error || `Request failed with status ${response.status}`);
  }

  return json.data as T;
}
