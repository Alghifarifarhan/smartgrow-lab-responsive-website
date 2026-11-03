"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Check lockout on mount and interval
  useEffect(() => {
    const checkLockout = () => {
      const lockoutUntil = parseInt(localStorage.getItem("admin_lockout_until") || "0", 10);
      const now = Date.now();
      if (lockoutUntil > now) {
        setLockoutRemaining(Math.ceil((lockoutUntil - now) / 1000));
      } else {
        setLockoutRemaining(0);
        if (lockoutUntil > 0) {
          localStorage.removeItem("admin_lockout_until");
          localStorage.setItem("admin_failed_attempts", "0");
        }
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check session expiration (2-day inactivity rule)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const lastLogin = parseInt(localStorage.getItem("admin_last_login") || "0", 10);
        const now = Date.now();

        if (lastLogin > 0 && now - lastLogin > TWO_DAYS_MS) {
          // More than 2 days without logging in -> force logout and reset session
          await signOut(auth);
          localStorage.removeItem("admin_last_login");
          setSessionExpiredMsg(
            "Sesi Anda telah kedaluwarsa karena lebih dari 2 hari tidak login. Silakan login kembali."
          );
        } else {
          // Active session: update sliding window timestamp
          localStorage.setItem("admin_last_login", now.toString());
          router.push("/admin");
        }
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    setSubmitting(true);
    setErrorMsg("");
    setSessionExpiredMsg("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Reset attempts on successful login
      localStorage.setItem("admin_failed_attempts", "0");
      localStorage.removeItem("admin_lockout_until");
      localStorage.setItem("admin_last_login", Date.now().toString());
      router.push("/admin");
    } catch (error: any) {
      console.error("Login Error:", error);
      const currentAttempts = parseInt(localStorage.getItem("admin_failed_attempts") || "0", 10) + 1;
      localStorage.setItem("admin_failed_attempts", currentAttempts.toString());

      if (currentAttempts >= MAX_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
        localStorage.setItem("admin_lockout_until", lockoutUntil.toString());
        setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
        setErrorMsg("Maksimal 3 kali percobaan gagal tercapai. Anda diblokir sementara selama 5 menit.");
      } else {
        const sisa = MAX_ATTEMPTS - currentAttempts;
        if (
          error.code === "auth/wrong-password" ||
          error.code === "auth/user-not-found" ||
          error.code === "auth/invalid-credential"
        ) {
          setErrorMsg(`Email atau password salah. Sisa kesempatan: ${sisa} kali lagi.`);
        } else {
          setErrorMsg(`Login gagal. Sisa kesempatan: ${sisa} kali lagi.`);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} menit ${secs < 10 ? "0" : ""}${secs} detik`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100 animate-scale-in">
        <div className="text-center">
          <img
            src="/assets/img/logo_full.png"
            alt="Smart Grow Lab Logo"
            className="w-48 mx-auto mb-4 hover:scale-105 transition-transform duration-300"
          />
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Admin Panel Login</h2>
          <p className="text-xs text-gray-500 mt-1">Smart Grow Laboratory Dashboard</p>
        </div>

        {sessionExpiredMsg && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg animate-fade-in">
            ⚠️ {sessionExpiredMsg}
          </div>
        )}

        {lockoutRemaining > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl animate-fade-in text-center">
            <p className="font-bold">Akun Dikunci Sementara</p>
            <p className="text-xs mt-1">
              Gagal login 3 kali berturut-turut. Silakan tunggu:
            </p>
            <p className="font-mono text-base font-bold text-red-600 mt-2">
              ⏳ {formatLockoutTime(lockoutRemaining)}
            </p>
          </div>
        )}

        <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-gray-700 block mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={lockoutRemaining > 0 || submitting}
              placeholder="Masukkan email admin terdaftar..."
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-semibold text-gray-700 block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={lockoutRemaining > 0 || submitting}
                placeholder="Masukkan kata sandi..."
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              />
              <button
                type="button"
                id="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting || lockoutRemaining > 0}
              className="w-full py-3.5 px-4 font-bold text-white bg-primary rounded-lg shadow-md shadow-primary/30 hover:bg-primary/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {submitting ? "Memproses Login..." : lockoutRemaining > 0 ? "Terkunci (5 Menit)" : "Masuk ke Panel Admin"}
            </button>
          </div>

          {errorMsg && (
            <p id="login-error" className="text-xs text-center text-red-500 font-medium animate-fade-in bg-red-50 py-2 px-3 rounded-lg border border-red-100">
              {errorMsg}
            </p>
          )}

          <div className="pt-2 text-center">
            <a
              href="/"
              className="text-xs text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-1"
            >
              ← Kembali ke Beranda Website
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
