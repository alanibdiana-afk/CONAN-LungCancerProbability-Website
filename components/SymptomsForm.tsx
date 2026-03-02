"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { SymptomFormData } from "@/lib/types";
import { predictFromSymptoms } from "@/lib/prediction";
import { Activity, ChevronRight, RotateCcw, User, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const symptoms: { key: keyof SymptomFormData; label: string; description: string; category: string }[] = [
  { key: "smokingHistory", label: "Smoking History", description: "Current or past tobacco smoking", category: "Primary Risk Factors" },
  { key: "coughing", label: "Persistent Coughing", description: "Chronic or worsening cough", category: "Primary Risk Factors" },
  { key: "chestPain", label: "Chest Pain", description: "Pain or discomfort in the chest area", category: "Primary Risk Factors" },
  { key: "shortnessOfBreath", label: "Shortness of Breath", description: "Difficulty breathing or breathlessness", category: "Primary Risk Factors" },
  { key: "wheezing", label: "Wheezing", description: "High-pitched whistling sound when breathing", category: "Primary Risk Factors" },
  { key: "yellowFingers", label: "Yellow Fingers", description: "Yellowing of fingertips (nicotine staining)", category: "Primary Risk Factors" },
  { key: "swallowingDifficulty", label: "Swallowing Difficulty", description: "Trouble swallowing food or liquids", category: "Secondary Factors" },
  { key: "fatigue", label: "Fatigue", description: "Persistent tiredness or lack of energy", category: "Secondary Factors" },
  { key: "chronicDisease", label: "Chronic Disease", description: "Pre-existing chronic health conditions", category: "Secondary Factors" },
  { key: "alcoholConsuming", label: "Alcohol Consumption", description: "Regular alcohol use", category: "Lifestyle Factors" },
  { key: "peerPressure", label: "Peer Pressure", description: "Smoking-related social risk behavior", category: "Lifestyle Factors" },
  { key: "allergy", label: "Allergy", description: "Known allergies (respiratory or other)", category: "Lifestyle Factors" },
  { key: "anxiety", label: "Anxiety", description: "Chronic anxiety or stress", category: "Lifestyle Factors" },
];

const defaultForm: SymptomFormData = {
  coughing: false, shortnessOfBreath: false, swallowingDifficulty: false,
  chestPain: false, wheezing: false, fatigue: false, allergy: false,
  smokingHistory: false, yellowFingers: false, anxiety: false,
  peerPressure: false, chronicDisease: false, alcoholConsuming: false,
};

const categories = ["Primary Risk Factors", "Secondary Factors", "Lifestyle Factors"];

export default function SymptomsForm() {
  const router = useRouter();
  const { saveResult, user } = useApp();
  const [form, setForm] = useState<SymptomFormData>(defaultForm);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [submitted, setSubmitted] = useState(false);

  const toggle = (key: keyof SymptomFormData) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedCount = Object.values(form).filter(Boolean).length;

  const handleSubmit = () => {
    if (!age || !gender) {
      alert("Please fill in all personal information fields");
      return;
    }
    if (selectedCount === 0) {
      alert("Please select at least one symptom");
      return;
    }
    setSubmitted(true);
    const result = predictFromSymptoms(form);
    if (user) saveResult(result);
    sessionStorage.setItem("conan_result", JSON.stringify(result));
    router.push("/results");
  };

  const handleReset = () => {
    setAge("");
    setGender("");
    setSubmitted(false);
    Object.keys(form).forEach((key) => {
      setForm((prev) => ({ ...prev, [key]: false }));
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Health Background Assessment</h1>
          <p className="text-sm text-slate-500">Answer YES/NO for each health background and lifestyle risk factor</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          This assessment is for <strong>screening and awareness purposes only</strong>. It is not a
          medical diagnosis. Consult a healthcare professional for clinical evaluation.
        </p>
      </div>

      {/* Personal Information */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Age</label>
            <input
              type="text"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g., 25"
              className="w-full px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female")}
              className="w-full px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select sex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Symptoms by Category */}
      {categories.map((cat) => (
        <div key={cat} className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {symptoms
              .filter((s) => s.category === cat)
              .map(({ key, label, description }) => {
                const isYes = form[key];
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-xl border-2 p-4 cursor-pointer transition-all duration-150 select-none",
                      isYes
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                    )}
                    onClick={() => toggle(key)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className={cn("text-sm font-semibold", isYes ? "text-blue-800" : "text-slate-700")}>
                          {label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); if (!isYes) toggle(key); }}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                            isYes
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                          )}
                        >
                          YES
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (isYes) toggle(key); }}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                            !isYes
                              ? "bg-slate-600 text-white"
                              : "bg-white border border-slate-300 text-slate-500 hover:border-slate-400"
                          )}
                        >
                          NO
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {/* Progress & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-600">
            <strong className="text-slate-800">{selectedCount}</strong> of {symptoms.length} factors marked as YES
          </p>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${(selectedCount / symptoms.length) * 100}%` }}
          />
        </div>
        {!user && (
          <p className="text-xs text-slate-500 mb-3">
            💡 <a href="/login" className="text-blue-600 underline">Sign in</a> to save and track your results over time.
          </p>
        )}
        <button
          onClick={handleSubmit}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          Analyze Risk <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
