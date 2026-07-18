"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChefHat, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveUserFromCredential, getStoredUser } from "@/lib/auth";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: any;
  }
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect away if already signed in.
  useEffect(() => {
    if (getStoredUser()) {
      router.push("/");
    }
  }, [router]);

  // Load Google Identity Services script (only meaningful if a client ID is configured).
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptReady || !GOOGLE_CLIENT_ID || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: { credential: string }) => {
        try {
          const user = saveUserFromCredential(response.credential);
          toast.success(`Welcome, ${user.name}!`);
          router.push("/");
        } catch {
          toast.error("Couldn't read your Google profile. Please try again.");
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      width: 320,
      text: "continue_with",
    });
  }, [scriptReady, router]);

  function handleGmailFallback(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@gmail\.com$/.test(value)) {
      toast.error("Enter a valid Gmail address (e.g. you@gmail.com).");
      return;
    }
    setSubmitting(true);
    // Build a minimal fake JWT-shaped payload so we can reuse saveUserFromCredential.
    const payload = {
      email: value,
      name: value.split("@")[0].replace(/[._]/g, " "),
    };
    const fakeCredential = `e30.${btoa(JSON.stringify(payload))}.sig`;
    setTimeout(() => {
      const user = saveUserFromCredential(fakeCredential);
      toast.success(`Welcome, ${user.name}!`);
      router.push("/");
    }, 400);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <ChefHat className="size-8 text-brand" />
          <h1 className="mt-3 font-display text-2xl font-medium text-ink">Welcome to Foodzy</h1>
          <p className="mt-1 text-sm text-ink/60">Sign in with Gmail to start cooking smarter.</p>
        </div>

        {GOOGLE_CLIENT_ID ? (
          <div className="flex flex-col items-center gap-4">
            <div ref={buttonRef} />
            {!scriptReady && (
              <div className="flex items-center gap-2 text-sm text-ink/40">
                <Loader2 className="size-4 animate-spin" /> Loading Google sign-in…
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleGmailFallback} className="flex flex-col gap-3">
            <label className="text-xs font-medium uppercase tracking-wide text-ink/40">
              Gmail address
            </label>
            <div className="flex items-center gap-2 rounded-md border border-ink/15 bg-canvas px-3 py-2">
              <Mail className="size-4 text-ink/40" />
              <input
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/30"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Continue with Gmail"
              )}
            </button>
            <p className="mt-2 text-center text-[11px] leading-snug text-ink/35">
              To enable full one-tap Google sign-in, set{" "}
              <code className="rounded bg-ink/5 px-1 py-0.5">VITE_GOOGLE_CLIENT_ID</code> in your
              .env.local.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
