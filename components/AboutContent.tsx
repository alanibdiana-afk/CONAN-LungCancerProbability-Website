"use client";

import {
  Info,
  Database,
  Brain,
  BarChart2,
  Shield,
  ExternalLink,
  Activity,
  Layers3,
  Calculator,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

const modelSteps = [
  {
    icon: Database,
    title: "Your Information",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    desc: "CONAN uses the information you provide, including age, lifestyle factors, health history, and symptoms. The clinical model evaluates 23 different pieces of information.",
  },
  {
    icon: Brain,
    title: "Clinical Assessment",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    desc: "The clinical model looks for patterns in the information you provide and estimates whether your current profile is more consistent with Low, Moderate, or High risk.",
  },
  {
    icon: BarChart2,
    title: "Chest X-Ray Assessment",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    desc: "The imaging model analyzes the chest X-ray you upload and produces a separate imaging risk score.",
  },
  {
    icon: Layers3,
    title: "Combined Assessment",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    desc: "The combined model brings the clinical assessment and chest X-ray assessment together. Both are given equal importance when producing the final combined result.",
  },
];

const clinicalDetails = [
  "Uses 23 pieces of clinical information.",
  "Looks at patterns in your health information and symptoms.",
  "Produces three possible risk results: Low, Moderate, or High.",
  "The category with the strongest model probability becomes the clinical result.",
  "The displayed percentage is the probability of the selected clinical category.",
];

const imagingDetails = [
  "Analyzes the chest X-ray you upload.",
  "Produces an imaging probability from 0% to 100%.",
  "Below 5% is classified as Low Risk.",
  "5% through 65% is classified as Moderate Risk.",
  "Above 65% is classified as High Risk.",
];

const combinedDetails = [
  "Uses both the clinical assessment and imaging assessment.",
  "The clinical assessment contributes 50% of the final calculation.",
  "The imaging assessment contributes 50% of the final calculation.",
  "The three possible combined results are Low, Moderate, and High.",
  "The final category is the one with the strongest combined probability.",
];

const limitations = [
  "CONAN is a screening and awareness tool and is not a substitute for professional medical diagnosis.",
  "A risk result does not mean that a person has or does not have lung cancer.",
  "The clinical result is based on the information entered by the user.",
  "The imaging result is intended to assist screening and cannot replace interpretation by a qualified radiologist.",
  "The combined model uses equal weighting between the clinical and imaging results.",
  "Model probabilities describe the model's output and should not be treated as medical certainty.",
];

export default function AboutContent() {
  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ========================================================= */}
      {/* ABOUT HERO */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden rounded-3xl border border-blue-300/30 bg-gradient-to-br from-indigo-700/45 via-blue-700/35 to-indigo-900/45 text-white backdrop-blur-md">

        {/* Background atmosphere */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-400/10 blur-[120px]" />

        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-indigo-300/10 blur-[140px]" />

        <div className="relative grid min-h-[380px] grid-cols-1 items-center md:grid-cols-[1.05fr_0.95fr]">

          {/* ===================================================== */}
          {/* LEFT SIDE */}
          {/* ===================================================== */}

          <div className="relative z-10 p-8 md:p-10 lg:p-12">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm">
                <Info className="h-5 w-5 text-white" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                  CONAN
                </p>

                <h1 className="text-2xl font-bold md:text-3xl">
                  About the Model
                </h1>
              </div>

            </div>

            <p className="max-w-xl text-sm leading-relaxed text-blue-100 md:text-base">
              Learn how CONAN uses your health information and chest X-ray
              information to provide a lung cancer risk screening estimate.
            </p>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/90">
              CONAN has three main parts: a Clinical Risk Model, an Imaging
              Risk Model, and a Combined Risk Model. Each part has a different
              job and the combined model brings the two individual assessments
              together.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">

              {[
                "Clinical Risk",
                "Imaging Risk",
                "Combined Risk",
                "Screening Support",
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}

            </div>

          </div>

          {/* ===================================================== */}
          {/* RIGHT SIDE - LARGE YELLOW GLOWING LOGO */}
          {/* ===================================================== */}

          <div className="relative flex min-h-[360px] items-center justify-center overflow-visible px-6 py-10 md:min-h-[380px] md:px-10">

            {/* Large yellow outer glow */}
            <div
              className="
                pointer-events-none
                absolute
                h-[460px]
                w-[460px]
                rounded-full
                bg-yellow-400/15
                blur-[130px]
                md:h-[580px]
                md:w-[580px]
              "
            />

            {/* Strong yellow glow */}
            <div
              className="
                pointer-events-none
                absolute
                h-[350px]
                w-[350px]
                rounded-full
                bg-yellow-300/25
                blur-[95px]
                md:h-[450px]
                md:w-[450px]
              "
            />

            {/* Bright inner yellow glow */}
            <div
              className="
                pointer-events-none
                absolute
                h-[240px]
                w-[240px]
                rounded-full
                bg-yellow-200/40
                blur-[55px]
                md:h-[320px]
                md:w-[320px]
              "
            />

            {/* Transparent blue outlined circle */}
            <div
              className="
                pointer-events-none
                absolute
                h-[300px]
                w-[300px]
                rounded-full
                border
                border-blue-200/40
                bg-blue-400/[0.02]
                shadow-[0_0_35px_rgba(147,197,253,0.12)]
                md:h-[390px]
                md:w-[390px]
              "
            />

            {/* Inner outline */}
            <div
              className="
                pointer-events-none
                absolute
                h-[240px]
                w-[240px]
                rounded-full
                border
                border-blue-100/20
                md:h-[320px]
                md:w-[320px]
              "
            />

            {/* Logo */}
            <img
              src="/logo.png"
              alt="CONAN logo"
              width={500}
              height={500}
              className="
                relative
                z-10
                h-80
                w-80
                object-contain
                drop-shadow-[0_0_12px_rgba(255,255,255,1)]
                drop-shadow-[0_0_30px_rgba(250,204,21,1)]
                drop-shadow-[0_0_60px_rgba(250,204,21,0.95)]
                drop-shadow-[0_0_100px_rgba(250,204,21,0.80)]
                drop-shadow-[0_0_150px_rgba(234,179,8,0.60)]
                md:h-[26rem]
                md:w-[26rem]
              "
            />

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* HOW CONAN WORKS */}
      {/* ========================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">

        <div className="mb-5 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <Activity className="h-5 w-5 text-indigo-600" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800">
              How CONAN Works
            </h2>

            <p className="text-sm text-slate-500">
              A simple overview of the three-part system
            </p>
          </div>

        </div>

        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">

            <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
              STEP 1
            </p>

            <h3 className="mt-1 text-sm font-bold text-slate-800">
              Clinical Risk
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You provide information about your health, lifestyle, and
              symptoms. CONAN evaluates that information and produces a
              clinical risk estimate.
            </p>

          </div>

          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">

            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
              STEP 2
            </p>

            <h3 className="mt-1 text-sm font-bold text-slate-800">
              Imaging Risk
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You upload a chest X-ray. CONAN analyzes the image and produces
              a separate imaging risk estimate.
            </p>

          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">

            <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
              STEP 3
            </p>

            <h3 className="mt-1 text-sm font-bold text-slate-800">
              Combined Risk
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              CONAN combines the clinical and imaging assessments to produce
              a final combined screening estimate.
            </p>

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* PREDICTION METHODOLOGY */}
      {/* ========================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">

        <h2 className="mb-4 text-base font-bold text-slate-800">
          What Each Part Does
        </h2>

        <div className="space-y-3">

          {modelSteps.map(
            ({ icon: Icon, title, color, bg, border, desc }) => (
              <div
                key={title}
                className={`rounded-xl border ${border} ${bg} p-4`}
              >

                <div className="mb-2 flex items-center gap-2">

                  <Icon className={`h-4 w-4 ${color}`} />

                  <p className={`text-sm font-semibold ${color}`}>
                    {title}
                  </p>

                </div>

                <p className="text-sm leading-relaxed text-slate-700">
                  {desc}
                </p>

              </div>
            ),
          )}

        </div>

      </section>

      {/* ========================================================= */}
      {/* CLINICAL RISK CLASSIFICATION */}
      {/* ========================================================= */}

      <section className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5">

        <div className="mb-5 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Brain className="h-5 w-5 text-purple-700" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800">
              Clinical Risk Classification
            </h2>

            <p className="text-sm text-slate-500">
              Your health and symptom information
            </p>
          </div>

        </div>

        <div className="rounded-xl border border-purple-200 bg-white p-5">

          <div className="flex items-start gap-3">

            <Calculator className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />

            <div>

              <p className="text-sm font-semibold text-slate-800">
                How your clinical result is chosen
              </p>

              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                CONAN looks at the information you entered and calculates how
                likely each risk category is. The category with the strongest
                probability becomes your clinical risk result.
              </p>

            </div>

          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                LOW RISK
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                Low has the strongest probability
              </p>

              <p className="mt-1 text-xs text-slate-600">
                The displayed percentage is the model's Low Risk probability.
              </p>

            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                MODERATE RISK
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                Moderate has the strongest probability
              </p>

              <p className="mt-1 text-xs text-slate-600">
                The displayed percentage is the model's Moderate Risk probability.
              </p>

            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                HIGH RISK
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                High has the strongest probability
              </p>

              <p className="mt-1 text-xs text-slate-600">
                The displayed percentage is the model's High Risk probability.
              </p>

            </div>

          </div>

        </div>

        <div className="mt-4 space-y-2">

          {clinicalDetails.map((detail) => (
            <div
              key={detail}
              className="flex items-start gap-2 text-sm text-slate-600"
            >

              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />

              <span>{detail}</span>

            </div>
          ))}

        </div>

      </section>

      {/* ========================================================= */}
      {/* IMAGING RISK CLASSIFICATION */}
      {/* ========================================================= */}

      <section className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5">

        <div className="mb-5 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
            <BarChart2 className="h-5 w-5 text-teal-700" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800">
              Imaging Risk Classification
            </h2>

            <p className="text-sm text-slate-500">
              Your chest X-ray assessment
            </p>
          </div>

        </div>

        <div className="rounded-xl border border-teal-200 bg-white p-5">

          <div className="mb-5 rounded-lg border border-teal-100 bg-teal-50 px-4 py-3">

            <p className="text-sm leading-relaxed text-teal-900">
              CONAN converts the chest X-ray model's score into one of three
              easy-to-understand risk categories.
            </p>

          </div>

          <div className="grid gap-3 md:grid-cols-3">

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                LOW RISK
              </p>

              <p className="mt-2 text-2xl font-bold text-green-700">
                Below 5%
              </p>

              <p className="mt-1 text-xs text-slate-600">
                The imaging score is below 5%.
              </p>

            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                MODERATE RISK
              </p>

              <p className="mt-2 text-2xl font-bold text-amber-700">
                5% – 65%
              </p>

              <p className="mt-1 text-xs text-slate-600">
                The imaging score is between 5% and 65%.
              </p>

            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                HIGH RISK
              </p>

              <p className="mt-2 text-2xl font-bold text-red-700">
                Above 65%
              </p>

              <p className="mt-1 text-xs text-slate-600">
                The imaging score is above 65%.
              </p>

            </div>

          </div>

        </div>

        <div className="mt-4 space-y-2">

          {imagingDetails.map((detail) => (
            <div
              key={detail}
              className="flex items-start gap-2 text-sm text-slate-600"
            >

              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />

              <span>{detail}</span>

            </div>
          ))}

        </div>

      </section>

      {/* ========================================================= */}
      {/* COMBINED RISK CLASSIFICATION */}
      {/* ========================================================= */}

      <section className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">

        <div className="mb-5 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <Layers3 className="h-5 w-5 text-indigo-700" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800">
              Combined Risk Classification
            </h2>

            <p className="text-sm text-slate-500">
              Your clinical and chest X-ray results together
            </p>
          </div>

        </div>

        <div className="rounded-xl border border-indigo-200 bg-white p-5">

          <div className="mb-5 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">

            <p className="text-sm leading-relaxed text-indigo-900">
              The combined assessment gives equal importance to the clinical
              result and the chest X-ray result. Each contributes 50% to the
              final calculation.
            </p>

          </div>

          {/* Simple calculation explanation */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Simple explanation
            </p>

            <div className="grid gap-3 md:grid-cols-2">

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">

                <p className="text-xs font-bold uppercase tracking-wide text-purple-700">
                  Clinical result
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-800">
                  50% of the final calculation
                </p>

              </div>

              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">

                <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                  Imaging result
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-800">
                  50% of the final calculation
                </p>

              </div>

            </div>

          </div>

          {/* Combined categories */}
          <div className="mt-5 grid gap-3 md:grid-cols-3">

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                LOW RISK
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                Low has the strongest combined probability
              </p>

              <p className="mt-1 text-xs text-slate-600">
                The displayed percentage is the final Low Risk probability.
              </p>

            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                MODERATE RISK
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                Moderate has the strongest combined probability
              </p>

              <p className="mt-1 text-xs text-slate-600">
                The displayed percentage is the final Moderate Risk probability.
              </p>

            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                HIGH RISK
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                High has the strongest combined probability
              </p>

              <p className="mt-1 text-xs text-slate-600">
                The displayed percentage is the final High Risk probability.
              </p>

            </div>

          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3">

            <Calculator className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />

            <p className="text-xs leading-relaxed text-indigo-800">
              In simple terms, CONAN looks at both assessments, gives them
              equal importance, and selects the final category with the
              strongest combined result.
            </p>

          </div>

        </div>

        <div className="mt-4 space-y-2">

          {combinedDetails.map((detail) => (
            <div
              key={detail}
              className="flex items-start gap-2 text-sm text-slate-600"
            >

              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />

              <span>{detail}</span>

            </div>
          ))}

        </div>

      </section>

      {/* ========================================================= */}
      {/* WHAT THE RESULTS MEAN */}
      {/* ========================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">

        <div className="mb-5 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Shield className="h-5 w-5 text-slate-700" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800">
              What Your Result Means
            </h2>

            <p className="text-sm text-slate-500">
              Understanding the three risk categories
            </p>
          </div>

        </div>

        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-green-200 bg-green-50 p-5">

            <div className="mb-2 h-3 w-3 rounded-full bg-green-500" />

            <h3 className="text-sm font-bold text-green-800">
              Low Risk
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The model found fewer indicators associated with higher risk
              based on the information provided.
            </p>

          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">

            <div className="mb-2 h-3 w-3 rounded-full bg-amber-500" />

            <h3 className="text-sm font-bold text-amber-800">
              Moderate Risk
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The model found a number of indicators associated with increased
              risk and the result may warrant additional attention.
            </p>

          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-5">

            <div className="mb-2 h-3 w-3 rounded-full bg-red-500" />

            <h3 className="text-sm font-bold text-red-800">
              High Risk
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The model found stronger indicators associated with higher risk.
              Professional medical evaluation is especially important for
              interpreting this result.
            </p>

          </div>

        </div>

      </section>

      {/* ========================================================= */}
      {/* LIMITATIONS */}
      {/* ========================================================= */}

      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">

        <div className="mb-4 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800">
              Important Information
            </h2>

            <p className="text-sm text-slate-500">
              Please read before interpreting a result
            </p>
          </div>

        </div>

        <ul className="space-y-3">

          {limitations.map((lim, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-slate-700"
            >

              <span className="mt-0.5 flex-shrink-0 text-amber-600">
                ⚠
              </span>

              <span>{lim}</span>

            </li>
          ))}

        </ul>

      </section>

      {/* ========================================================= */}
      {/* REFERENCES */}
      {/* ========================================================= */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">

        <h2 className="mb-4 text-base font-bold text-slate-800">
          Data Sources & References
        </h2>

        <p className="mb-4 text-sm leading-relaxed text-slate-500">
          CONAN's methodology and supporting information are based on the
          project's documented datasets, statistical modeling process, and
          referenced medical and cancer information sources.
        </p>

        <div className="space-y-2">

          {[
            {
              name: "UCI Machine Learning Repository – Lung Cancer Dataset",
              url: "https://archive.ics.uci.edu/dataset/62/lung+cancer",
            },
            {
              name: "WHO Global Cancer Observatory",
              url: "https://gco.iarc.fr/",
            },
            {
              name: "American Cancer Society – Lung Cancer Statistics",
              url: "https://www.cancer.org/cancer/types/lung-cancer/about/key-statistics.html",
            },
            {
              name: "National Cancer Institute – Lung Cancer Screening",
              url: "https://www.cancer.gov/types/lung/screening",
            },
          ].map(({ name, url }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
              {name}
            </a>
          ))}

        </div>

      </section>

    </div>
  );
}