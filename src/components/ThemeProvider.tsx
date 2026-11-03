"use client";

import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { applyTheme, getStoredTheme, setStoredTheme } from "@/lib/theme";
import type { ThemeConfig } from "@/types";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Apply cached theme immediately to prevent any flicker
    const cached = getStoredTheme();
    if (cached) {
      applyTheme(cached);
    }

    // 2. Listen to real-time updates from Firestore
    try {
      const docRef = doc(db, "siteContent", "main");
      const unsubscribe = onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data?.theme) {
              setStoredTheme(data.theme as ThemeConfig);
            }
          }
        },
        (error) => {
          console.warn("Could not listen to theme updates:", error);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn("Error setting up theme listener:", e);
    }
  }, []);

  return <>{children}</>;
}

