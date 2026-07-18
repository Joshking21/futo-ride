import { auth } from "./firebaseConfig";
import { Alert } from "react-native";

// Use EXPO_PUBLIC_API_URL from environment (set in .env.local),
// falling back to local LAN IP for development
const getBaseUrl = (): string => {
  return process.env.EXPO_PUBLIC_API_URL || "http://10.77.240.190:3001";
};

export const BASE_URL = getBaseUrl();

/**
 * Perform a type-safe HTTP request to the backend Fastify server.
 * Automatically resolves Firebase Auth token and formats request/response envelopes.
 */
export async function apiRequest<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: any,
): Promise<T> {
  console.log(`[apiRequest] starting request for ${path}`);
  let token: string | undefined;
  try {
    token = await auth.currentUser?.getIdToken();
    // console.log(`[apiRequest] resolved token successfully: ${token ? "exists" : "none"}`);
  } catch (tokenErr) {
    // console.error(`[apiRequest] failed to get token:`, tokenErr);
  }

  const url = `${BASE_URL}${path}`;
  // console.log(`[apiRequest] fetching URL: ${url} (method: ${method})`);

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    // console.log(`[apiRequest] fetch response status: ${response.status}`);
  } catch (fetchErr) {
    Alert.alert(
      "Connection Failed",
      "Unable to connect to the server. Please check your internet connection and try again."
    );
    throw fetchErr;
  }

  const text = await response.text();
  let json: any;

  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON response from backend: ${text}`);
  }

  if (response.status === 401) {
    throw new Error(
      "Unauthorized. Please check your credentials or log in again.",
    );
  }

  if (!json.ok) {
    throw new Error(
      json.error || `Request failed with status ${response.status}`,
    );
  }

  return json.data as T;
}
