"use client";

import Link from "next/link";
import { Activity, Image as ImageIcon, Layers, ArrowRight, Shield, BookOpen, Info, AlertTriangle } from "lucide-react";
import { useApp } from "@/lib/context";

const options = [
  {
    href: "/symptoms",
    icon: Activity,
    title: "Health Background Assessment",
    subtitle: "Option 1",
    description:
      "Answer questions about your symptoms and health history. Our model analyzes 13 key risk factors to estimate your lung cancer risk level.",
    color: "from-blue-500 to-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-600",
    tag: "Symptoms & History",
  },
  {
    href: "/imaging",
    icon: ImageIcon,
    title: "Chest X-Ray Analysis",
    subtitle: "Option 2",
    description:
      "Upload a chest X-ray image for AI-assisted analysis. Our imaging model preprocesses and evaluates the scan for potential abnormalities.",
    color: "from-purple-500 to-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconBg: "bg-purple-600",
    tag: "Imaging Only",
  },
  {
    href: "/combined",
    icon: Layers,
    title: "Combined Assessment",
    subtitle: "Option 3",
    description:
      "Combine symptom data with chest X-ray imaging for a more comprehensive integrated risk analysis and prediction.",
    color: "from-teal-500 to-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    iconBg: "bg-teal-600",
    tag: "Symptoms + Imaging",
  },
];

export default function HomeContent() {
  const { user } = useApp();

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white px-6 py-10 md:px-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full bg-blue-300 blur-2xl" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            AI-Assisted Screening Tool
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
            CONAN
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-2">
      An AI-assisted lung cancer
            risk screening tool for awareness and early detection guidance.
          </p>
          <p className="text-blue-200 text-xs mt-4">
            📍 Predictions are based on publicly available anonymized lung cancer patient datasets
            and validated machine learning models.
          </p>
          {user && (
            <p className="mt-4 text-sm text-blue-100">
              Welcome back, <strong className="text-white">{user.name}</strong>! You have{" "}
              <strong className="text-white">{user.results.length}</strong> saved result(s).
            </p>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Medical Disclaimer:</strong> CONAN is a screening and awareness tool only.
          Results are <strong>NOT a medical diagnosis</strong> and should not replace professional
          medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.
        </p>
      </div>

      {/* 3 Primary Options */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Choose Your Assessment Path</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {options.map(({ href, icon: Icon, title, subtitle, description, bg, border, iconBg, tag }) => (
            <Link
              key={href}
              href={href}
              className={`group relative flex flex-col rounded-2xl border ${border} ${bg} p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{subtitle}</p>
              <h3 className="text-base font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed flex-1">{description}</p>
              <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:gap-2.5 transition-all">
                Start Assessment <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/manual"
          className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <BookOpen className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">User Manual</p>
            <p className="text-xs text-slate-500">Step-by-step guidance</p>
          </div>
        </Link>
        <Link
          href="/about"
          className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-purple-300 hover:bg-purple-50 transition-colors"
        >
          <Info className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">About the Model</p>
            <p className="text-xs text-slate-500">Prediction methodology</p>
          </div>
        </Link>
        <Link
          href="/privacy"
          className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-green-300 hover:bg-green-50 transition-colors"
        >
          <Shield className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Privacy Policy</p>
            <p className="text-xs text-slate-500">Your data rights</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
