"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { Settings, Type, Moon, Sun, Trash2, Shield, LogOut, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function SettingsContent() {
  const router = useRouter();
  const { settings, updateSettings, user, logout, deleteAllData, setShowPrivacyModal } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleDeleteAll = () => {
    deleteAllData();
    setDeleted(true);
    setShowDeleteConfirm(false);
    setTimeout(() => router.push("/"), 1500);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500">Accessibility, privacy, and account preferences</p>
        </div>
      </div>

      {/* Accessibility */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Accessibility</h2>

        {/* Font Size */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-4 h-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700">Text Size</p>
            <span className="ml-auto text-xs text-slate-400 capitalize">{settings.fontSize}</span>
          </div>
          <div className="flex gap-2">
            {(["small", "normal", "large"] as const).map((size) => (
              <button
                key={size}
                onClick={() => updateSettings({ fontSize: size })}
                className={cn(
                  "flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all",
                  settings.fontSize === size
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                )}
                style={{ fontSize: size === "small" ? "12px" : size === "large" ? "16px" : "14px" }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Contrast Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.contrastMode ? <Moon className="w-4 h-4 text-slate-500" /> : <Sun className="w-4 h-4 text-slate-500" />}
            <div>
              <p className="text-sm font-semibold text-slate-700">High Contrast Mode</p>
              <p className="text-xs text-slate-500">Improves visibility for low-vision users</p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ contrastMode: !settings.contrastMode })}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors duration-200",
              settings.contrastMode ? "bg-blue-600" : "bg-slate-300"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                settings.contrastMode ? "translate-x-6" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Privacy & Consent</h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-slate-700">Privacy Consent</p>
              <p className="text-xs text-slate-500">
                {settings.privacyConsented ? "You have accepted the privacy policy" : "Privacy policy not yet accepted"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {settings.privacyConsented && <Check className="w-4 h-4 text-green-600" />}
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              {settings.privacyConsented ? "Review" : "Accept"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Privacy Policy</p>
            <p className="text-xs text-slate-500">View full privacy policy</p>
          </div>
          <a href="/privacy" className="text-xs text-blue-600 hover:underline font-medium">View →</a>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Terms & Conditions</p>
            <p className="text-xs text-slate-500">View terms of use</p>
          </div>
          <a href="/terms" className="text-xs text-blue-600 hover:underline font-medium">View →</a>
        </div>
      </div>

      {/* Account */}
      {user && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Account</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email} · {user.results.length} saved result(s)</p>
            </div>
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-600 font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Data Deletion */}
      <div className="bg-white border border-red-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-red-700 border-b border-red-100 pb-2">Data Management</h2>

        {deleted ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <Check className="w-4 h-4" />
            <p className="text-sm font-medium">All data deleted. Redirecting...</p>
          </div>
        ) : !showDeleteConfirm ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Delete All Data</p>
              <p className="text-xs text-slate-500">
                Permanently removes all saved results, account info, and settings from your device.
                This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-300 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>Are you sure?</strong> This will permanently delete all your assessment results,
                account information, and settings. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
