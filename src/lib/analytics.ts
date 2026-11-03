import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, increment, serverTimestamp } from "firebase/firestore";
import type { AnalyticsStats } from "@/types";

const ANALYTICS_DOC = "traffic";

export async function recordVisit(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const hasVisitedSession = sessionStorage.getItem("sgl_visited_session");
    const hasVisitorId = localStorage.getItem("sgl_visitor_id");

    const updates: Record<string, any> = {
      lastUpdated: serverTimestamp(),
    };

    let shouldUpdate = false;

    if (!hasVisitedSession) {
      sessionStorage.setItem("sgl_visited_session", "true");
      updates.totalVisits = increment(1);
      shouldUpdate = true;
    }

    if (!hasVisitorId) {
      const newVisitorId = "v_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem("sgl_visitor_id", newVisitorId);
      updates.uniqueVisitors = increment(1);
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      await setDoc(doc(db, "analytics", ANALYTICS_DOC), updates, { merge: true });
    }
  } catch (error) {
    // Non-blocking error handling for client analytics
    console.warn("Analytics recording note:", error);
  }
}

export async function recordUpload(count = 1): Promise<void> {
  try {
    await setDoc(
      doc(db, "analytics", ANALYTICS_DOC),
      {
        totalUploads: increment(count),
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Upload recording error:", error);
  }
}

export async function recordDownload(count = 1): Promise<void> {
  try {
    await setDoc(
      doc(db, "analytics", ANALYTICS_DOC),
      {
        totalDownloads: increment(count),
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Download recording error:", error);
  }
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  try {
    const snap = await getDoc(doc(db, "analytics", ANALYTICS_DOC));
    if (snap.exists()) {
      const data = snap.data();
      return {
        totalVisits: Number(data.totalVisits) || 0,
        uniqueVisitors: Number(data.uniqueVisitors) || 0,
        totalUploads: Number(data.totalUploads) || 0,
        totalDownloads: Number(data.totalDownloads) || 0,
        lastUpdated: data.lastUpdated,
      };
    }
  } catch (error) {
    console.warn("Get analytics error:", error);
  }

  return {
    totalVisits: 0,
    uniqueVisitors: 0,
    totalUploads: 0,
    totalDownloads: 0,
  };
}

