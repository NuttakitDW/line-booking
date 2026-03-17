"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { initLiff, liff } from "@/lib/liff";

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface LiffContextType {
  profile: LiffProfile | null;
  loading: boolean;
  error: string | null;
}

const LiffContext = createContext<LiffContextType>({
  profile: null,
  loading: true,
  error: null,
});

export function useLiff() {
  return useContext(LiffContext);
}

export function LiffProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Start LIFF init and prefetch services in parallel
        const servicesPromise = fetch("/api/services").then((r) => r.ok ? r.json() : []).catch(() => []);

        await initLiff();
        if (liff.isLoggedIn()) {
          const [p] = await Promise.all([
            liff.getProfile(),
            servicesPromise, // ensure services are cached by browser
          ]);
          setProfile({
            userId: p.userId,
            displayName: p.displayName,
            pictureUrl: p.pictureUrl,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "LIFF initialization failed");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <LiffContext.Provider value={{ profile, loading, error }}>
      {children}
    </LiffContext.Provider>
  );
}
