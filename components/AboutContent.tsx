"use client";

import { Info, Database, Brain, BarChart2, Shield, ExternalLink } from "lucide-react";

const modelSteps = [
  {
    icon: Database,
    title: "Data Source",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    desc: "Predictions are based on publicly available, anonymized lung cancer patient datasets. The primary dataset includes clinical records with symptom profiles and confirmed diagnoses from peer-reviewed medical research repositories.",
  },
  {
    icon: Brain,
    title: "Symptom Model",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    desc: "A weighted scoring model assigns risk weights to each of the 13 symptom/lifestyle factors based on their statistical correlation with lung cancer incidence in the training dataset. Weights are normalized and calibrated against clinical literature.",
  },
  {
    icon: BarChart2,
    title: "Imaging Analysis",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    desc: "The imaging pathway applies automated preprocessing (normalization, contrast enhancement) followed by feature extraction targeting lung field clarity, nodule presence, pleural effusion indicators, mediastinal widening, and hilar prominence.",
  },
  {
    icon: Shield,
    title: "Combined Integration",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    desc: "The combined assessment integrates symptom and imaging scores using a 50/50 weighted fusion model. This approach reduces single-modality bias and provides a more comprehensive risk estimate than either input alone.",
  },
];

const riskLevels = [
  { level: "Low Risk", range: "< 25% normalized score", color: "text-green-700", bg: "bg-green-50", border: "border-green-200", desc: "Minimal risk indicators present. Routine health maintenance recommended." },
  { level: "Moderate Risk", range: "25% – 55% normalized score", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", desc: "Several risk factors identified. Clinical evaluation advised." },
  { level: "High Risk", range: "> 55% normalized score", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", desc: "Multiple significant risk factors present. Prompt specialist consultation strongly recommended." },
];

const limitations = [
  "This tool is not a substitute for professional medical diagnosis or clinical imaging interpretation.",
  "The symptom model is based on population-level statistics and may not reflect individual clinical presentations.",
  "Imaging analysis is a screening aid only; it cannot replace radiologist interpretation.",
  "Confidence scores reflect model certainty based on input data, not clinical certainty.",
  "The app does not account for all possible risk factors (e.g., occupational exposures, genetic markers).",
  "Results may vary based on image quality, lighting, and X-ray positioning.",
];

export default function AboutContent() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Info className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">About the Model</h1>
          <p className="text-sm text-slate-500">Prediction methodology, data sources, and technical details</p>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl p-6">
        <p className="text-blue-100 text-sm leading-relaxed mb-3">
          CONAN uses validated mathematical and machine learning models to estimate lung cancer risk
          based on symptom profiles and/or chest X-ray imaging. It is designed as a screening and
          awareness tool to support early detection and informed healthcare decisions.
        </p>
        <div className="flex flex-wrap gap-2">
          {["Symptom-Based Model", "Imaging Analysis", "Combined Assessment", "Risk Classification"].map((tag) => (
            <span key={tag} className="text-xs bg-white/15 border border-white/20 px-3 py-1 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Methodology */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-base font-bold text-slate-800 mb-4">Prediction Methodology</h2>
        <div className="space-y-3">
          {modelSteps.map(({ icon: Icon, title, color, bg, border, desc }) => (
            <div key={title} className={`rounded-xl border ${border} ${bg} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <p className={`text-sm font-semibold ${color}`}>{title}</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Level Thresholds */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-base font-bold text-slate-800 mb-4">Risk Level Classification</h2>
        <div className="space-y-3">
          {riskLevels.map(({ level, range, color, bg, border, desc }) => (
            <div key={level} className={`rounded-xl border ${border} ${bg} p-4`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-bold ${color}`}>{level}</p>
                <span className={`text-xs font-medium ${color} opacity-70`}>{range}</span>
              </div>
              <p className="text-sm text-slate-700">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Symptom Weights */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-base font-bold text-slate-800 mb-4">Symptom Risk Weights</h2>
        <p className="text-sm text-slate-500 mb-4">
          Each symptom is assigned a weight reflecting its statistical association with lung cancer risk.
          Higher weights indicate stronger predictive value based on clinical literature.
        </p>
        <div className="space-y-2">
          {[
            { name: "Smoking History", weight: 3.5, impact: "High" },
            { name: "Persistent Coughing", weight: 2.8, impact: "High" },
            { name: "Chest Pain", weight: 2.5, impact: "High" },
            { name: "Shortness of Breath", weight: 2.3, impact: "High" },
            { name: "Wheezing", weight: 2.2, impact: "High" },
            { name: "Yellow Fingers", weight: 2.0, impact: "High" },
            { name: "Swallowing Difficulty", weight: 1.8, impact: "Medium" },
            { name: "Fatigue", weight: 1.5, impact: "Medium" },
            { name: "Chronic Disease", weight: 1.5, impact: "Medium" },
            { name: "Alcohol Consumption", weight: 1.2, impact: "Low" },
            { name: "Peer Pressure", weight: 1.0, impact: "Low" },
            { name: "Allergy", weight: 0.8, impact: "Low" },
            { name: "Anxiety", weight: 0.7, impact: "Low" },
          ].map(({ name, weight, impact }) => {
            const maxWeight = 3.5;
            const pct = (weight / maxWeight) * 100;
            const barColor = impact === "High" ? "bg-red-500" : impact === "Medium" ? "bg-amber-500" : "bg-slate-400";
            return (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-44 flex-shrink-0">{name}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-500 w-8 text-right">{weight}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Limitations */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-base font-bold text-slate-800 mb-4">Known Limitations</h2>
        <ul className="space-y-2">
          {limitations.map((lim, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
              {lim}
            </li>
          ))}
        </ul>
      </div>

      {/* References */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-base font-bold text-slate-800 mb-4">Data Sources & References</h2>
        <div className="space-y-2">
          {[
            { name: "UCI Machine Learning Repository – Lung Cancer Dataset", url: "https://archive.ics.uci.edu/dataset/62/lung+cancer" },
            { name: "WHO Global Cancer Observatory", url: "https://gco.iarc.fr/" },
            { name: "American Cancer Society – Lung Cancer Statistics", url: "https://www.cancer.org/cancer/types/lung-cancer/about/key-statistics.html" },
            { name: "National Cancer Institute – Lung Cancer Screening", url: "https://www.cancer.gov/types/lung/screening" },
          ].map(({ name, url }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              {name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
