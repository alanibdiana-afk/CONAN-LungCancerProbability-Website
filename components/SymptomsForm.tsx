"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import { useApp } from "@/lib/context";
import type { PredictionResult, RiskLevel } from "@/lib/types";
import {
  CLINICAL_FEATURES,
  type ClinicalFeature,
  type ClinicalPatient,
  type ClinicalRiskResult,
} from "@/lib/clinicalRisk";
import { cn } from "@/lib/utils";

/* ============================================================
   CLINICAL VARIABLE DEFINITIONS

   Based on:
   ml/data/cancer patient data sets.csv

   Total variables: 23
   ============================================================ */

type FieldConfig = {
  feature: ClinicalFeature;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  category: string;
};

const FIELD_CONFIG: FieldConfig[] = [
  /* ----------------------------------------------------------
     PERSONAL INFORMATION
     ---------------------------------------------------------- */

  {
    feature: "Age",
    label: "Age",
    description: "Your age in years.",
    min: 14,
    max: 73,
    step: 1,
    category: "Personal Information",
  },

  {
    feature: "Gender",
    label: "Sex",
    description: "Select your sex assigned on your birth certificate",
    min: 1,
    max: 2,
    step: 1,
    category: "Personal Information",
  },

  /* ----------------------------------------------------------
     ENVIRONMENTAL & GENETIC FACTORS
     ---------------------------------------------------------- */

  {
    feature: "Air Pollution",
    label: "Air Pollution Exposure",
    description:
      "How much you are exposed to polluted air, such as traffic fumes, smoke, or heavily polluted areas.",
    min: 1,
    max: 8,
    step: 1,
    category: "Environmental & Genetic Factors",
  },

  {
    feature: "Alcohol use",
    label: "Alcohol Consumption",
    description:
      "How frequently or heavily you consume alcoholic drinks.",
    min: 1,
    max: 8,
    step: 1,
    category: "Environmental & Genetic Factors",
  },

  {
    feature: "Dust Allergy",
    label: "Dust Allergy",
    description:
      "How strongly you experience allergy symptoms when exposed to dust.",
    min: 1,
    max: 8,
    step: 1,
    category: "Environmental & Genetic Factors",
  },

  {
    feature: "OccuPational Hazards",
    label: "Occupational Hazards",
    description:
      "How much your work exposes you to dust, chemicals, smoke, asbestos, or other potentially harmful substances.",
    min: 1,
    max: 8,
    step: 1,
    category: "Environmental & Genetic Factors",
  },

  {
    feature: "Genetic Risk",
    label: "Family/Genetic History",
    description:
      "Whether you may have an inherited or family-related tendency toward lung disease.",
    min: 1,
    max: 7,
    step: 1,
    category: "Environmental & Genetic Factors",
  },

  {
    feature: "chronic Lung Disease",
    label: "Chronic Lung Disease",
    description:
      "The level of long-term lung problems or disease you have experienced.",
    min: 1,
    max: 7,
    step: 1,
    category: "Environmental & Genetic Factors",
  },

  /* ----------------------------------------------------------
     LIFESTYLE & BODY FACTORS
     ---------------------------------------------------------- */

  {
    feature: "Balanced Diet",
    label: "Balanced Diet",
    description:
      "How consistently your diet includes a variety of nutritious foods such as vegetables, fruits, protein, and whole grains.",
    min: 1,
    max: 7,
    step: 1,
    category: "Lifestyle & Body Factors",
  },

  {
    feature: "Obesity",
    label: "Obesity",
    description:
      "The level of excess body weight represented by this model's scoring scale.",
    min: 1,
    max: 7,
    step: 1,
    category: "Lifestyle & Body Factors",
  },

  {
    feature: "Smoking",
    label: "Smoking History",
    description:
      "Your level of tobacco-smoking exposure based on the model's scoring scale.",
    min: 1,
    max: 8,
    step: 1,
    category: "Lifestyle & Body Factors",
  },

  {
    feature: "Passive Smoker",
    label: "Secondhand Smoke Exposure",
    description:
      "How much you are exposed to tobacco smoke from other people.",
    min: 1,
    max: 8,
    step: 1,
    category: "Lifestyle & Body Factors",
  },

  {
    feature: "Frequent Cold",
    label: "Frequent Colds",
    description:
      "How often you experience colds or repeated cold-like illnesses.",
    min: 1,
    max: 7,
    step: 1,
    category: "Lifestyle & Body Factors",
  },

  {
    feature: "Snoring",
    label: "Snoring",
    description:
      "How frequently or severely you snore while sleeping.",
    min: 1,
    max: 7,
    step: 1,
    category: "Lifestyle & Body Factors",
  },

  /* ----------------------------------------------------------
     CLINICAL SYMPTOMS
     ---------------------------------------------------------- */

  {
    feature: "Chest Pain",
    label: "Chest Pain",
    description:
      "How often or severely you experience pain or discomfort in your chest.",
    min: 1,
    max: 9,
    step: 1,
    category: "Clinical Symptoms",
  },

  {
    feature: "Coughing of Blood",
    label: "Coughing Up Blood",
    description:
      "Whether you have noticed blood when coughing. Use the scale provided by the model.",
    min: 1,
    max: 9,
    step: 1,
    category: "Clinical Symptoms",
  },

  {
    feature: "Fatigue",
    label: "Fatigue",
    description:
      "How often or severely you experience unusual tiredness or lack of energy.",
    min: 1,
    max: 9,
    step: 1,
    category: "Clinical Symptoms",
  },

  {
    feature: "Weight Loss",
    label: "Unexplained Weight Loss",
    description:
      "The level of unexpected weight loss that you have experienced.",
    min: 1,
    max: 8,
    step: 1,
    category: "Clinical Symptoms",
  },

  {
    feature: "Shortness of Breath",
    label: "Shortness of Breath",
    description:
      "How often or severely you have difficulty breathing or feel breathless.",
    min: 1,
    max: 9,
    step: 1,
    category: "Clinical Symptoms",
  },

  {
    feature: "Wheezing",
    label: "Wheezing",
    description:
      "How often you experience a high-pitched whistling sound when breathing.",
    min: 1,
    max: 8,
    step: 1,
    category: "Clinical Symptoms",
  },

  {
    feature: "Swallowing Difficulty",
    label: "Difficulty Swallowing",
    description:
      "How much difficulty you experience when swallowing food or liquids.",
    min: 1,
    max: 8,
    step: 1,
    category: "Clinical Symptoms",
  },

  {
    feature: "Clubbing of Finger Nails",
    label: "Fingernail Changes",
    description:
      "The degree of rounded or enlarged fingertips/fingernails represented by the model's scale.",
    min: 1,
    max: 9,
    step: 1,
    category: "Clinical Symptoms",
  },

  {
    feature: "Dry Cough",
    label: "Dry Cough",
    description:
      "How often you experience a cough that does not produce mucus or phlegm.",
    min: 1,
    max: 7,
    step: 1,
    category: "Clinical Symptoms",
  },
];

/* ============================================================
   CATEGORIES
   ============================================================ */

const CATEGORIES = [
  "Personal Information",
  "Environmental & Genetic Factors",
  "Lifestyle & Body Factors",
  "Clinical Symptoms",
];

/* ============================================================
   DEFAULT VALUES
   ============================================================ */

const DEFAULT_VALUES: ClinicalPatient = {
  Age: 25,
  Gender: 1,

  "Air Pollution": 1,
  "Alcohol use": 1,
  "Dust Allergy": 1,
  "OccuPational Hazards": 1,
  "Genetic Risk": 1,
  "chronic Lung Disease": 1,

  "Balanced Diet": 1,
  Obesity: 1,
  Smoking: 1,
  "Passive Smoker": 1,
  "Frequent Cold": 1,
  Snoring: 1,

  "Chest Pain": 1,
  "Coughing of Blood": 1,
  Fatigue: 1,
  "Weight Loss": 1,
  "Shortness of Breath": 1,
  Wheezing: 1,
  "Swallowing Difficulty": 1,
  "Clubbing of Finger Nails": 1,
  "Dry Cough": 1,
};

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

function convertRiskLevel(
  risk: ClinicalRiskResult["risk"],
): RiskLevel {
  switch (risk) {
    case "LOW":
      return "low";

    case "MODERATE":
      return "moderate";

    case "HIGH":
      return "high";
  }
}

function makeSummary(
  risk: ClinicalRiskResult["risk"],
  probability: number,
): string {
  const percentage = Math.round(probability * 100);

  if (risk === "HIGH") {
    return (
      `The clinical model estimated a high-risk category with ` +
      `${percentage}% model probability for the predicted class. ` +
      `This result is intended for screening and research purposes ` +
      `only and is not a diagnosis. Further evaluation by a qualified ` +
      `healthcare professional is recommended.`
    );
  }

  if (risk === "MODERATE") {
    return (
      `The clinical model estimated a moderate-risk category with ` +
      `${percentage}% model probability for the predicted class. ` +
      `This result is intended for screening and research purposes ` +
      `only and is not a diagnosis. Further clinical evaluation ` +
      `may be appropriate.`
    );
  }

  return (
    `The clinical model estimated a low-risk category with ` +
    `${percentage}% model probability for the predicted class. ` +
    `This result is intended for screening and research purposes ` +
    `only and is not a diagnosis. Continue appropriate health ` +
    `monitoring and consult a healthcare professional when needed.`
  );
}

function buildFactors(
  patient: ClinicalPatient,
): PredictionResult["factors"] {
  const configs = FIELD_CONFIG.filter(
    (field) => field.category !== "Personal Information",
  );

  return configs
    .map((field) => {
      const value = patient[field.feature];

      const normalized =
        (value - field.min) /
        (field.max - field.min);

      let impact: "high" | "medium" | "low";

      if (normalized >= 0.67) {
        impact = "high";
      } else if (normalized >= 0.34) {
        impact = "medium";
      } else {
        impact = "low";
      }

      return {
        name: field.label,
        impact,
        present: normalized >= 0.34,
      };
    })
    .filter((factor) => factor.present)
    .sort((a, b) => {
      const order = {
        high: 0,
        medium: 1,
        low: 2,
      };

      return order[a.impact] - order[b.impact];
    })
    .slice(0, 8);
}

/* ============================================================
   COMPONENT

   IMPORTANT:
   AppShell is NOT used here.

   app/symptoms/page.tsx already wraps this component with
   <AppShell>. Keeping AppShell here would create two headers.
   ============================================================ */

export default function SymptomsForm() {
  const router = useRouter();
  const { saveResult, user } = useApp();

  const [form, setForm] =
    useState<ClinicalPatient>(DEFAULT_VALUES);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ----------------------------------------------------------
     UPDATE FIELD
     ---------------------------------------------------------- */

  const updateField = (
    feature: ClinicalFeature,
    value: number,
  ) => {
    setForm((previous) => ({
      ...previous,
      [feature]: value,
    }));

    setError("");
  };

  /* ----------------------------------------------------------
     RESET
     ---------------------------------------------------------- */

  const handleReset = () => {
    setForm({ ...DEFAULT_VALUES });
    setError("");
  };

  /* ----------------------------------------------------------
     VALIDATE
     ---------------------------------------------------------- */

  const validateForm = (): string | null => {
    for (const feature of CLINICAL_FEATURES) {
      const value = form[feature];

      if (
        value === undefined ||
        value === null ||
        !Number.isFinite(value)
      ) {
        return `${feature} is required.`;
      }

      const config = FIELD_CONFIG.find(
        (field) => field.feature === feature,
      );

      if (!config) {
        return `Configuration missing for ${feature}.`;
      }

      if (
        value < config.min ||
        value > config.max
      ) {
        return (
          `${config.label} must be between ` +
          `${config.min} and ${config.max}.`
        );
      }

      if (
        !Number.isInteger(value)
      ) {
        return `${config.label} must be a whole number.`;
      }
    }

    if (form.Gender !== 1 && form.Gender !== 2) {
      return "Please select a valid sex.";
    }

    return null;
  };

  /* ----------------------------------------------------------
     SUBMIT TO API
     ---------------------------------------------------------- */

  const handleSubmit = async () => {
    if (loading) {
      return;
    }

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "/API/clinical-risk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      let data: unknown;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The clinical risk API returned an invalid response.",
        );
      }

      if (!response.ok) {
        const apiError =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Clinical risk prediction failed.";

        throw new Error(apiError);
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("success" in data) ||
        data.success !== true
      ) {
        const apiError =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Clinical risk prediction failed.";

        throw new Error(apiError);
      }

      const clinicalResult =
        data as ClinicalRiskResult & {
          success: boolean;
          model: string;
        };

      /* --------------------------------------------------------
         CONVERT API RESULT TO APP RESULT FORMAT
         -------------------------------------------------------- */

      const riskLevel = convertRiskLevel(
        clinicalResult.risk,
      );

      const result: PredictionResult = {
        riskLevel,

        confidence: Math.round(
          clinicalResult.probability * 100,
        ),

        factors: buildFactors(form),

        summary: makeSummary(
          clinicalResult.risk,
          clinicalResult.probability,
        ),

        timestamp: new Date(),

        type: "symptoms",
      };

      /* --------------------------------------------------------
         SAVE TO APP CONTEXT
         -------------------------------------------------------- */

      if (user) {
        saveResult(result);
      }

      /* --------------------------------------------------------
         SAVE RESULT FOR /results
         -------------------------------------------------------- */

      sessionStorage.setItem(
        "conan_result",
        JSON.stringify(result),
      );

      /* --------------------------------------------------------
         SAVE RAW CLINICAL MODEL RESULT

         This can later be used by the combined model.
         -------------------------------------------------------- */

      sessionStorage.setItem(
        "conan_clinical_result",
        JSON.stringify({
          patient: form,
          prediction: clinicalResult,
        }),
      );

      /* --------------------------------------------------------
         GO TO RESULTS
         -------------------------------------------------------- */

      router.push("/results");
    } catch (err) {
      console.error(
        "Clinical risk prediction error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to calculate clinical risk.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* --------------------------------------------------------
          HEADER
          -------------------------------------------------------- */}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-800">
           Clinical Data Risk Assessment
          </h1>

          <p className="text-sm text-slate-500">
            Answer the questions below about your health,
            lifestyle, environment, and symptoms to calculate the probability of lung cancer.
          </p>
        </div>
      </div>

      {/* --------------------------------------------------------
          DISCLAIMER
          -------------------------------------------------------- */}

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />

        <p className="text-xs text-amber-800">
          This assessment is for{" "}
          <strong>
            screening and awareness only.
          </strong>
          . It is not a medical diagnosis. A healthcare
          professional should further interpret clinical findings.
        </p>
      </div>

      {/* --------------------------------------------------------
          MODEL INFORMATION
          -------------------------------------------------------- */}

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <p className="text-xs text-blue-800">
          <strong>CONAN Clinical Model:</strong>{" "}
          This assessment uses 23 clinical and
          clinical variables to estimate a
          Low, Moderate, or High risk category.
        </p>
      </div>

      {/* --------------------------------------------------------
          SCALE EXPLANATION
          -------------------------------------------------------- */}

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <p className="text-xs text-slate-600">
          <strong className="text-slate-700">
            How to use the scale:
          </strong>{" "}
          Move each slider to the value that best
          matches your health background or experience.
          The numbers correspond to the scoring system
          used by the CONAN clinical model and are{" "}
          <strong>not percentages</strong> or direct
          cancer probabilities.
        </p>
      </div>

      {/* --------------------------------------------------------
          CATEGORIES
          -------------------------------------------------------- */}

      {CATEGORIES.map((category) => {
        const fields = FIELD_CONFIG.filter(
          (field) => field.category === category,
        );

        return (
          <div
            key={category}
            className="bg-white border border-slate-200 rounded-2xl p-5"
          >
            <h2 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
              {category}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {fields.map((field) => {
                const value =
                  form[field.feature];

                return (
                  <div
                    key={field.feature}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    {/* LABEL */}

                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <label
                          htmlFor={`clinical-${field.feature}`}
                          className="block text-sm font-semibold text-slate-700"
                        >
                          {field.label}
                        </label>

                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {field.description}
                        </p>
                      </div>

                      <span className="min-w-10 text-center px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-sm font-bold">
                        {value}
                      </span>
                    </div>

                    {/* GENDER */}

                    {field.feature === "Gender" ? (
                      <select
                        id={`clinical-${field.feature}`}
                        value={value}
                        onChange={(event) =>
                          updateField(
                            field.feature,
                            Number(
                              event.target.value,
                            ),
                          )
                        }
                        className="w-full px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={1}>
                          Male
                        </option>

                        <option value={2}>
                          Female
                        </option>
                      </select>
                    ) : (
                      <>
                        {/* SLIDER */}

                        <input
                          id={`clinical-${field.feature}`}
                          type="range"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={value}
                          onChange={(event) =>
                            updateField(
                              field.feature,
                              Number(
                                event.target.value,
                              ),
                            )
                          }
                          className="w-full accent-blue-600 cursor-pointer"
                          aria-label={field.label}
                        />

                        {/* RANGE */}

                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                          <span>
                            {field.min}
                          </span>

                          <span>
                            {field.max}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* --------------------------------------------------------
          ERROR
          -------------------------------------------------------- */}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* --------------------------------------------------------
          ACTIONS
          -------------------------------------------------------- */}

      <div className="bg-white border border-slate-200 rounded-2xl p-5">

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Assessment Complete
            </p>

            <p className="text-xs text-slate-500 mt-1">
              All 23 clinical variables are included
              in the prediction.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {!user && (
          <p className="text-xs text-slate-500 mb-3">
            💡{" "}
            <a
              href="/login"
              className="text-blue-600 underline"
            >
              Sign in
            </a>{" "}
            to save and track your results over time.
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl transition-colors text-sm",
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Clinical Risk...
            </>
          ) : (
            <>
              Analyze Clinical Risk
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}