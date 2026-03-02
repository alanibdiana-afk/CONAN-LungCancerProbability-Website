"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppSettings, PredictionResult, User } from "./types";

interface AppContextType {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  user: User | null;
  login: (name: string, email: string) => void;
  logout: () => void;
  saveResult: (result: PredictionResult) => void;
  deleteAllData: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  showPrivacyModal: boolean;
  setShowPrivacyModal: (v: boolean) => void;
  showDisclaimerModal: boolean;
  setShowDisclaimerModal: (v: boolean) => void;
  isOnline: boolean;
}

const defaultSettings: AppSettings = {
  fontSize: "normal",
  contrastMode: false,
  privacyConsented: false,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("conan_settings");
    if (stored) setSettings(JSON.parse(stored));
    const storedUser = localStorage.getItem("conan_user");
    if (storedUser) setUser(JSON.parse(storedUser));

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!settings.privacyConsented) {
      setShowPrivacyModal(true);
    }
  }, [settings.privacyConsented]);

  useEffect(() => {
    const root = document.documentElement;
    const sizes = { small: "14px", normal: "16px", large: "18px" };
    root.style.fontSize = sizes[settings.fontSize];

    // Remove existing injected style
    const existing = document.getElementById("conan-contrast-style");
    if (existing) existing.remove();

    if (settings.contrastMode) {
      root.classList.add("high-contrast");
      // Inject a style tag so contrast overrides are always applied
      // regardless of Tailwind class purging
      const style = document.createElement("style");
      style.id = "conan-contrast-style";
      style.textContent = `
        body, .app-shell-bg { background-color: #000000 !important; color: #ffffff !important; }
        header { background-color: #000000 !important; border-color: #555 !important; }
        main { background-color: #000000 !important; }

        /* ── All light-colored card backgrounds ── */
        .bg-white,
        .bg-slate-50, .bg-slate-100,
        .bg-blue-50, .bg-purple-50, .bg-teal-50,
        .bg-green-50, .bg-yellow-50, .bg-red-50,
        .bg-indigo-50, .bg-pink-50, .bg-orange-50,
        .bg-cyan-50, .bg-emerald-50, .bg-violet-50 {
          background-color: #111111 !important;
        }

        /* ── Tag badges (white bg with border) ── */
        .bg-white.border { background-color: #222222 !important; border-color: #666666 !important; }

        /* ── All text ── */
        .text-slate-800, .text-slate-700, .text-slate-600 { color: #ffffff !important; }
        .text-slate-500, .text-slate-400 { color: #cccccc !important; }
        .text-slate-300 { color: #aaaaaa !important; }

        /* ── Colored text ── */
        .text-blue-600, .text-blue-700, .text-blue-800 { color: #93c5fd !important; }
        .text-purple-600, .text-purple-700, .text-purple-800 { color: #c4b5fd !important; }
        .text-teal-600, .text-teal-700, .text-teal-800 { color: #5eead4 !important; }
        .text-green-600, .text-green-700 { color: #6ee7b7 !important; }
        .text-yellow-600, .text-yellow-700 { color: #fde68a !important; }
        .text-red-600, .text-red-700 { color: #fca5a5 !important; }
        .text-indigo-600, .text-indigo-700 { color: #a5b4fc !important; }

        /* ── Borders ── */
        .border-slate-200, .border-slate-100, .border-slate-300 { border-color: #444444 !important; }
        .border-blue-200, .border-blue-300 { border-color: #3b82f6 !important; }
        .border-purple-200, .border-purple-300 { border-color: #8b5cf6 !important; }
        .border-teal-200, .border-teal-300 { border-color: #14b8a6 !important; }

        /* ── Inputs ── */
        input, select, textarea {
          background-color: #222222 !important;
          color: #ffffff !important;
          border-color: #888888 !important;
        }
        input::placeholder { color: #aaaaaa !important; }
        select option { background-color: #222222 !important; color: #ffffff !important; }

        /* ── Buttons (non-solid) ── */
        button { color: #ffffff !important; }

        /* ── Amber / warning banners ── */
        .bg-amber-50 { background-color: #2a1f00 !important; }
        .text-amber-600, .text-amber-800 { color: #fcd34d !important; }
        .border-amber-200 { border-color: #fcd34d !important; }

        /* ── Gradient banners → solid dark ── */
        .bg-gradient-to-br, .bg-gradient-to-r { background: #0f1f3d !important; color: #ffffff !important; }
        .text-blue-100, .text-blue-200 { color: #bfdbfe !important; }

        /* ── Hover states override ── */
        a:hover .bg-blue-50, a:hover .bg-purple-50, a:hover .bg-teal-50 { background-color: #1a1a2e !important; }
      `;
      document.head.appendChild(style);
    } else {
      root.classList.remove("high-contrast");
    }
  }, [settings.fontSize, settings.contrastMode]);

  const updateSettings = (s: Partial<AppSettings>) => {
    const updated = { ...settings, ...s };
    setSettings(updated);
    localStorage.setItem("conan_settings", JSON.stringify(updated));
  };

  const login = (name: string, email: string) => {
    const newUser: User = { id: Date.now().toString(), name, email, results: [] };
    setUser(newUser);
    localStorage.setItem("conan_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("conan_user");
  };

  const saveResult = (result: PredictionResult) => {
    if (!user) return;
    const updated = { ...user, results: [result, ...user.results].slice(0, 20) };
    setUser(updated);
    localStorage.setItem("conan_user", JSON.stringify(updated));
  };

  const deleteAllData = () => {
    setUser(null);
    setSettings(defaultSettings);
    localStorage.removeItem("conan_user");
    localStorage.removeItem("conan_settings");
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        user,
        login,
        logout,
        saveResult,
        deleteAllData,
        sidebarOpen,
        setSidebarOpen,
        showPrivacyModal,
        setShowPrivacyModal,
        showDisclaimerModal,
        setShowDisclaimerModal,
        isOnline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
