"use client";

import { useApp } from "@/lib/context";
import { Menu, Activity, Sun, Moon, Type } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const { setSidebarOpen, settings, updateSettings } = useApp();

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-3">
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <Link href="/" className="flex items-center gap-2 mr-auto">
        <div className="w-8 h-8 rounded-lg overflow-hidden">
          <img src="/logo.png" alt="CONAN App Logo" className="w-full h-full object-cover" />
        </div>
        <span className="font-bold text-slate-800 text-sm hidden sm:block">CONAN</span>
      </Link>

      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            const sizes = ["small", "normal", "large"] as const;
            const idx = sizes.indexOf(settings.fontSize);
            updateSettings({ fontSize: sizes[(idx + 1) % 3] });
          }}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          title={`Font size: ${settings.fontSize}`}
          aria-label="Toggle font size"
        >
          <Type className="w-4 h-4" />
        </button>
        <button
          onClick={() => updateSettings({ contrastMode: !settings.contrastMode })}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          title="Toggle contrast mode"
          aria-label="Toggle contrast mode"
        >
          {settings.contrastMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="hidden sm:block text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full font-medium">
        ⚕️ Screening Tool Only – Not a Diagnosis
      </div>
    </header>
  );
}
