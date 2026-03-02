"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context";
import { cn } from "@/lib/utils";
import {
  Home,
  Activity,
  Image,
  Layers,
  BarChart2,
  BookOpen,
  Info,
  Shield,
  FileText,
  Settings,
  LogIn,
  LogOut,
  X,
  Wifi,
  WifiOff,
  User,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/symptoms", label: "Health Background Assessment", icon: Activity },
  { href: "/imaging", label: "Chest X-Ray Analysis", icon: Image },
  { href: "/combined", label: "Combined Assessment", icon: Layers },
  { href: "/dashboard", label: "Results Dashboard", icon: BarChart2 },
];

const infoItems = [
  { href: "/manual", label: "User Manual", icon: BookOpen },
  { href: "/about", label: "About the Model", icon: Info },
  { href: "/privacy", label: "Privacy Policy", icon: Shield },
  { href: "/terms", label: "Terms & Conditions", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, user, logout, isOnline } = useApp();
  const pathname = usePathname();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-40 flex flex-col transition-transform duration-300",
          "w-72 bg-[#0f172a] text-slate-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden">
              <img src="/logo.png" alt="CONAN App Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">CONAN</h1>
              <p className="text-xs text-slate-400">Lung Cancer Risk Detection</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-slate-700 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 py-2 border-b border-slate-700">
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium",
              isOnline ? "text-green-400" : "text-amber-400"
            )}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOnline ? "Online" : "Offline – Limited features"}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
            Assessment
          </p>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}

          <div className="pt-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
              Information
            </p>
            {infoItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-slate-700">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); setSidebarOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In to Save Results
            </Link>
          )}
        </div>

        {/* Footer with developer credit */}
        <div className="border-t border-slate-700 px-4 py-3 mt-auto">
          <p className="text-xs text-slate-400 text-center">
            Developed by Crisvin Habitsuela
          </p>
        </div>
      </aside>
    </>
  );
}
