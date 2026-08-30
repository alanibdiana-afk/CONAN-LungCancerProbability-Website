"use client";

import Link from "next/link";
import {
  Activity,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  Shield,
  BookOpen,
  Info,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/lib/context";

const options = [
  {
    href: "/symptoms",
    icon: Activity,
    title: "Clinical Data Risk Assessment",
    subtitle: "Option 1",
    description:
      "Answer questions about your symptoms and health history. Our model analyzes 23 key risk factors to estimate your lung cancer risk level.",
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
      "Upload a chest X-ray image for risk analysis. Our imaging model preprocesses and evaluates the scan for potential abnormalities.",
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
      "Combine clinical data with chest X-ray imaging for a more comprehensive integrated risk analysis and prediction.",
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

      {/* ========================================================= */}
      {/* HERO */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-br from-indigo-700/65 via-blue-700/55 to-indigo-950/70 text-white shadow-xl">

        {/* ===================================================== */}
        {/* BACKGROUND ATMOSPHERE */}
        {/* ===================================================== */}

        <div className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-300/[0.08] blur-[150px]" />

        <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[420px] w-[420px] rounded-full bg-indigo-300/[0.08] blur-[160px]" />

        <div className="relative grid min-h-[400px] grid-cols-1 items-center md:grid-cols-[1.05fr_0.95fr]">

          {/* =================================================== */}
          {/* LEFT SIDE - HIGH CONTRAST TEXT */}
          {/* =================================================== */}

          <div className="relative z-10 px-7 py-10 md:px-10 lg:px-12">

            {/* Status badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md">

              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]" />

              AI-Assisted Screening Tool

            </div>

            {/* Main title */}
            <h1 className="text-4xl font-extrabold leading-none tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] md:text-5xl">
              CONAN
            </h1>

            {/* Main subtitle */}
            <p className="mt-4 max-w-xl text-sm font-semibold leading-relaxed text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.4)] md:text-base">
              An AI-assisted lung cancer risk screening tool for awareness
              and early detection guidance.
            </p>

            {/* Supporting description */}
            <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-blue-50 drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
              CONAN evaluates clinical information and chest X-ray images to
              provide screening risk estimates that can help users better
              understand their results.
            </p>

            {/* Data note */}
            <div className="mt-5 flex max-w-xl items-start gap-3 rounded-xl border border-white/25 bg-black/15 px-4 py-3 shadow-md backdrop-blur-md">

              <span className="mt-0.5 text-base">
                📍
              </span>

              <p className="text-xs font-medium leading-relaxed text-white">
                Predictions are based on publicly available anonymized lung
                cancer patient datasets and validated machine learning models.
              </p>

            </div>

            {/* User greeting */}
            {user && (
              <div className="mt-5 rounded-xl border border-white/30 bg-white/10 px-4 py-3 shadow-md backdrop-blur-md">

                <p className="text-sm font-medium text-white">
                  Welcome back,{" "}
                  <strong className="font-bold text-white">
                    {user.name}
                  </strong>
                  !
                </p>

                <p className="mt-1 text-xs font-medium text-blue-50">
                  You have{" "}
                  <strong className="font-bold text-white">
                    {user.results.length}
                  </strong>{" "}
                  saved result(s).
                </p>

              </div>
            )}

          </div>

          {/* =================================================== */}
          {/* RIGHT SIDE - SMOOTH GLOWING LOGO */}
          {/* =================================================== */}

          <div className="relative flex min-h-[360px] items-center justify-center overflow-visible px-6 py-10 md:min-h-[400px] md:px-10">

            {/* Very large soft ambient yellow glow */}
            <div
              className="
                pointer-events-none
                absolute
                h-[520px]
                w-[520px]
                rounded-full
                bg-yellow-300/[0.07]
                blur-[170px]
                md:h-[680px]
                md:w-[680px]
              "
            />

            {/* Large smooth yellow gradient glow */}
            <div
              className="
                pointer-events-none
                absolute
                h-[410px]
                w-[410px]
                rounded-full
                bg-yellow-300/[0.13]
                blur-[135px]
                md:h-[520px]
                md:w-[520px]
              "
            />

            {/* Soft concentrated yellow glow */}
            <div
              className="
                pointer-events-none
                absolute
                h-[290px]
                w-[290px]
                rounded-full
                bg-yellow-200/[0.22]
                blur-[95px]
                md:h-[370px]
                md:w-[370px]
              "
            />

            {/* Subtle transparent blue outlined circle */}
            <div
              className="
                pointer-events-none
                absolute
                h-[320px]
                w-[320px]
                rounded-full
                border
                border-blue-100/30
                bg-blue-400/[0.015]
                shadow-[0_0_35px_rgba(147,197,253,0.10)]
                md:h-[420px]
                md:w-[420px]
              "
            />

            {/* Inner subtle outline */}
            <div
              className="
                pointer-events-none
                absolute
                h-[250px]
                w-[250px]
                rounded-full
                border
                border-blue-50/15
                md:h-[330px]
                md:w-[330px]
              "
            />

            {/* ================================================= */}
            {/* LOGO */}
            {/* ================================================= */}

            <img
              src="/logo.png"
              alt="CONAN logo"
              width={540}
              height={540}
              className="
                relative
                z-10
                h-80
                w-80
                object-contain

                drop-shadow-[0_0_10px_rgba(255,255,255,0.95)]
                drop-shadow-[0_0_25px_rgba(250,204,21,0.80)]
                drop-shadow-[0_0_55px_rgba(250,204,21,0.60)]
                drop-shadow-[0_0_90px_rgba(250,204,21,0.45)]
                drop-shadow-[0_0_130px_rgba(234,179,8,0.30)]

                md:h-[27rem]
                md:w-[27rem]
              "
            />

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* DISCLAIMER */}
      {/* ========================================================= */}

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />

        <p className="text-sm text-amber-800">
          <strong>Medical Disclaimer:</strong>{" "}
          CONAN is a screening and awareness tool only. Results are{" "}
          <strong>NOT a medical diagnosis</strong> and should not replace
          professional medical advice, diagnosis, or treatment. Always
          consult a qualified healthcare professional.
        </p>

      </div>

      {/* ========================================================= */}
      {/* ASSESSMENT OPTIONS */}
      {/* ========================================================= */}

      <div>

        <h2 className="mb-4 text-lg font-bold text-slate-800">
          Choose Your Assessment Path
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {options.map(
            ({
              href,
              icon: Icon,
              title,
              subtitle,
              description,
              bg,
              border,
              iconBg,
              tag,
            }) => (
              <Link
                key={href}
                href={href}
                className={`group relative flex flex-col rounded-2xl border ${border} ${bg} p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
              >

                <div className="mb-4 flex items-start justify-between">

                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} shadow-sm`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                    {tag}
                  </span>

                </div>

                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {subtitle}
                </p>

                <h3 className="mb-2 text-base font-bold text-slate-800">
                  {title}
                </h3>

                <p className="flex-1 text-sm leading-relaxed text-slate-600">
                  {description}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-all group-hover:gap-2.5">
                  Start Assessment
                  <ArrowRight className="h-4 w-4" />
                </div>

              </Link>
            ),
          )}

        </div>
      </div>

      {/* ========================================================= */}
      {/* QUICK LINKS */}
      {/* ========================================================= */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        {/* User Manual */}
        <Link
          href="/manual"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
        >

          <BookOpen className="h-5 w-5 text-blue-600" />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              User Manual
            </p>

            <p className="text-xs text-slate-500">
              Step-by-step guidance
            </p>
          </div>

        </Link>

        {/* About */}
        <Link
          href="/about"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-purple-300 hover:bg-purple-50"
        >

          <Info className="h-5 w-5 text-purple-600" />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              About the Model
            </p>

            <p className="text-xs text-slate-500">
              Prediction methodology
            </p>
          </div>

        </Link>

        {/* Privacy */}
        <Link
          href="/privacy"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-green-300 hover:bg-green-50"
        >

          <Shield className="h-5 w-5 text-green-600" />

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Privacy Policy
            </p>

            <p className="text-xs text-slate-500">
              Your data rights
            </p>
          </div>

        </Link>

      </div>

    </div>
  );
}