import { useEffect, useState, useCallback } from "react";

export type FoodzyUser = {
  email: string;
  name: string;
  picture?: string;
};

const STORAGE_KEY = "foodzy.user";

function decodeJwt(token: string): Record<string, unknown> {
  const payload = token.split(".")[1];
  const json = decodeURIComponent(
    atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
  return JSON.parse(json);
}

export function saveUserFromCredential(credential: string): FoodzyUser {
  const payload = decodeJwt(credential);
  const user: FoodzyUser = {
    email: String(payload.email ?? ""),
    name: String(payload.name ?? payload.email ?? "Friend"),
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function getStoredUser(): FoodzyUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FoodzyUser) : null;
  } catch {
    return null;
  }
}

export function signOut() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Hook that exposes the current signed-in user (client-only, reactive). */
export function useFoodzyUser() {
  const [user, setUser] = useState<FoodzyUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setReady(true);
  }, []);

  const logout = useCallback(() => {
    signOut();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return { user, ready, logout };
}
