"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { PredictionResult } from "@/lib/types";

import RiskBadge from "./RiskBadge";
import ConfidenceBar from "./ConfidenceBar";

import { cn } from "@/lib/utils";

import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  CheckCircle,
  ExternalLink,
  Heart,
  Cigarette,
  Stethoscope,
  TrendingUp,
  RefreshCw,
  Home,
  FlaskConical,
  Image as ImageIcon,
  ScanLine,
} from "lucide-react";


// ============================================================
// TYPES
// ============================================================

type RiskLevel =
  | "low"
  | "moderate"
  | "high";


type ModelFinding = {
  type?: string;
  label?: string;
  confidence?: number;
  attention_region?: string;
  attention_concentration?: number;
  attention_concentration_percent?: number;
  description?: string;
  clinical_interpretation?: string;
};


type Explainability = {
  method?: string;

  /*
   * IMPORTANT:
   * heatmap is now primarily loaded from IndexedDB.
   * This property remains for backward compatibility with
   * older sessionStorage results.
   */
  heatmap?: string;

  interpretation?: string;
  warning?: string;

  attention_region?: {
    region_name?: string;
    concentration?: number;
    centroid_x?: number;
    centroid_y?: number;

    bounding_box?: {
      x_min?: number;
      y_min?: number;
      x_max?: number;
      y_max?: number;
    };
  };
};


type ExtendedPredictionResult =
  PredictionResult & {
    clinicalInput?: Record<string, unknown>;

    clinicalProbabilities?: {
      low?: number;
      moderate?: number;
      high?: number;
    };

    imagingProbability?: number;

    imagingRiskLevel?: RiskLevel;

    imagingDistribution?: {
      low?: number;
      moderate?: number;
      high?: number;
    };

    finalProbabilities?: {
      low?: number;
      moderate?: number;
      high?: number;
    };

    fusionWeights?: {
      clinical?: number;
      imaging?: number;
    };

    finalProbability?: number;
    finalProbabilityPercent?: number;

    fileName?: string;

    explainability?: Explainability;

    modelFinding?: ModelFinding;
  };


type ClinicalStoredResult = {
  patient?: Record<string, unknown>;

  prediction?: {
    risk?: string;
    probability?: number;
    p_low?: number;
    p_moderate?: number;
    p_high?: number;
  };
};


type ImagingStoredResult = {
  probability?: number;
  probabilityPercent?: number;
  riskLevel?: RiskLevel;
  fileName?: string;

  thresholds?: {
    low?: number;
    high?: number;
  };

  modelFinding?: ModelFinding;

  explainability?: Explainability;
};


type CombinedStoredResult = {
  patient?: Record<string, unknown>;

  clinical?: unknown;

  clinicalDistribution?: {
    low?: number;
    moderate?: number;
    high?: number;
  };

  imaging?: {
    probability?: number;
    riskLevel?: RiskLevel;
    modelFinding?: ModelFinding;
    explainability?: Explainability;
    fileName?: string;
  };

  fusion?: FusionStoredResult;
};


type FusionStoredResult = {
  clinicalProbability?: number;
  imagingProbability?: number;
  combinedProbability?: number;
  combinedProbabilityPercent?: number;

  clinical?: {
    low?: number;
    moderate?: number;
    high?: number;
  };

  imagingRiskLevel?: RiskLevel;

  imagingDistribution?: {
    low?: number;
    moderate?: number;
    high?: number;
  };

  final?: {
    low?: number;
    moderate?: number;
    high?: number;
  };

  riskLevel?: RiskLevel;

  finalProbability?: number;
  finalProbabilityPercent?: number;

  weights?: {
    clinical?: number;
    imaging?: number;
  };

  validationStatus?: string;
};


// ============================================================
// INDEXEDDB GRAD-CAM STORAGE
// ============================================================

const GRADCAM_DB_NAME = "conan-storage";
const GRADCAM_STORE_NAME = "imaging";
const GRADCAM_KEY = "latest-gradcam";


function openGradCamDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {

    if (
      typeof window === "undefined" ||
      !("indexedDB" in window)
    ) {
      reject(
        new Error(
          "IndexedDB is not available."
        )
      );

      return;
    }

    const request = window.indexedDB.open(
      GRADCAM_DB_NAME,
      1
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (
        !db.objectStoreNames.contains(
          GRADCAM_STORE_NAME
        )
      ) {
        db.createObjectStore(
          GRADCAM_STORE_NAME
        );
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      /*
       * If the database already exists but the store was not
       * created correctly, fail clearly instead of silently
       * returning nothing.
       */
      if (
        !db.objectStoreNames.contains(
          GRADCAM_STORE_NAME
        )
      ) {
        db.close();

        reject(
          new Error(
            `IndexedDB store "${GRADCAM_STORE_NAME}" does not exist.`
          )
        );

        return;
      }

      resolve(db);
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error(
            "Unable to open Grad-CAM storage."
          )
      );
    };
  });
}


function getStoredGradCam(): Promise<string | null> {
  return new Promise(async (resolve, reject) => {

    let db: IDBDatabase | null = null;

    try {

      db = await openGradCamDatabase();

      const transaction = db.transaction(
        GRADCAM_STORE_NAME,
        "readonly"
      );

      const store = transaction.objectStore(
        GRADCAM_STORE_NAME
      );

      const request = store.get(
        GRADCAM_KEY
      );

      request.onsuccess = () => {

        const value = request.result;

        if (
          typeof value === "string" &&
          value.length > 0
        ) {
          resolve(value);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(
          request.error ||
            new Error(
              "Unable to retrieve Grad-CAM."
            )
        );
      };

      transaction.oncomplete = () => {
        if (db) {
          db.close();
          db = null;
        }
      };

      transaction.onerror = () => {
        if (db) {
          db.close();
          db = null;
        }
      };

      transaction.onabort = () => {
        if (db) {
          db.close();
          db = null;
        }
      };

    } catch (error) {

      if (db) {
        db.close();
      }

      reject(error);
    }
  });
}


// ============================================================
// RISK CONFIG
// ============================================================

const riskConfig: Record<
  RiskLevel,
  {
    gradient: string;
    bg: string;
    border: string;
    text: string;
    icon: string;
    title: string;
  }
> = {

  low: {
    gradient:
      "from-green-500 to-emerald-600",
    bg:
      "bg-green-50",
    border:
      "border-green-200",
    text:
      "text-green-700",
    icon:
      "✅",
    title:
      "Low Risk Detected",
  },

  moderate: {
    gradient:
      "from-amber-500 to-orange-500",
    bg:
      "bg-amber-50",
    border:
      "border-amber-200",
    text:
      "text-amber-700",
    icon:
      "⚠️",
    title:
      "Moderate Risk Detected",
  },

  high: {
    gradient:
      "from-red-500 to-rose-600",
    bg:
      "bg-red-50",
    border:
      "border-red-200",
    text:
      "text-red-700",
    icon:
      "🚨",
    title:
      "High Risk Detected",
  },
};


// ============================================================
// IMPACT COLORS
// ============================================================

const impactColors: Record<
  "low" | "medium" | "high",
  string
> = {

  high:
    "bg-red-100 text-red-700 border-red-200",

  medium:
    "bg-amber-100 text-amber-700 border-amber-200",

  low:
    "bg-slate-100 text-slate-600 border-slate-200",
};


// ============================================================
// CLINICAL FIELD INFORMATION
// ============================================================

const clinicalFieldInfo: Record<
  string,
  {
    feature: string;
    max: number;
  }
> = {

  "Air Pollution Exposure": {
    feature:
      "Air Pollution",
    max:
      8,
  },

  "Alcohol Consumption": {
    feature:
      "Alcohol use",
    max:
      8,
  },

  "Dust Allergy": {
    feature:
      "Dust Allergy",
    max:
      8,
  },

  "Occupational Hazards": {
    feature:
      "OccuPational Hazards",
    max:
      8,
  },

  "Family/Genetic History": {
    feature:
      "Genetic Risk",
    max:
      7,
  },

  "Chronic Lung Disease": {
    feature:
      "chronic Lung Disease",
    max:
      7,
  },

  "Balanced Diet": {
    feature:
      "Balanced Diet",
    max:
      7,
  },

  Obesity: {
    feature:
      "Obesity",
    max:
      7,
  },

  "Smoking History": {
    feature:
      "Smoking",
    max:
      8,
  },

  "Secondhand Smoke Exposure": {
    feature:
      "Passive Smoker",
    max:
      8,
  },

  "Frequent Colds": {
    feature:
      "Frequent Cold",
    max:
      7,
  },

  Snoring: {
    feature:
      "Snoring",
    max:
      7,
  },

  "Chest Pain": {
    feature:
      "Chest Pain",
    max:
      9,
  },

  "Coughing Up Blood": {
    feature:
      "Coughing of Blood",
    max:
      9,
  },

  Fatigue: {
    feature:
      "Fatigue",
    max:
      9,
  },

  "Unexplained Weight Loss": {
    feature:
      "Weight Loss",
    max:
      8,
  },

  "Shortness of Breath": {
    feature:
      "Shortness of Breath",
    max:
      9,
  },

  Wheezing: {
    feature:
      "Wheezing",
    max:
      8,
  },

  "Difficulty Swallowing": {
    feature:
      "Swallowing Difficulty",
    max:
      8,
  },

  "Fingernail Changes": {
    feature:
      "Clubbing of Finger Nails",
    max:
      9,
  },

  "Dry Cough": {
    feature:
      "Dry Cough",
    max:
      7,
  },
};


// ============================================================
// CLINICAL FACTOR INTERPRETATION
// ============================================================

function factorInterpretation(
  impact:
    | "low"
    | "medium"
    | "high"
): string {

  if (
    impact ===
    "high"
  ) {

    return (
      "Your reported level was elevated on the CONAN input scale."
    );
  }

  if (
    impact ===
    "medium"
  ) {

    return (
      "Your reported level was in an intermediate range on the CONAN input scale."
    );
  }

  return (
    "Your reported level was in a lower range on the CONAN input scale."
  );
}


// ============================================================
// RISK-SPECIFIC FOLLOW-UP
// ============================================================

function getRiskGuidance(
  risk: RiskLevel,
  type:
    | "clinical"
    | "imaging"
    | "combined"
) {

  if (
    risk ===
    "low"
  ) {

    return {

      primary:
        type ===
        "clinical"

          ? "Your clinical assessment falls within the low-risk category. Continue appropriate routine healthcare and discuss persistent or concerning symptoms with a healthcare professional."

          : type ===
              "imaging"

            ? "Your imaging assessment falls within the low-risk category. This result does not completely rule out disease, so seek professional evaluation if symptoms or other concerns are present."

            : "Your combined assessment falls within the low-risk category. Continue appropriate health monitoring and seek professional evaluation if concerning symptoms or other issues arise.",

      steps: [

        "Continue routine health monitoring and preventive care.",

        "Discuss persistent, worsening, or concerning respiratory symptoms with a healthcare professional.",

        "Continue reducing avoidable tobacco smoke and environmental exposure when relevant.",
      ],
    };
  }


  if (
    risk ===
    "moderate"
  ) {

    return {

      primary:
        type ===
        "clinical"

          ? "Your clinical assessment falls within the moderate-risk category. Arrange a clinical consultation to review your reported symptoms, health history, and risk factors."

          : type ===
              "imaging"

            ? "Your imaging assessment falls within the moderate-risk category. Discuss the original chest X-ray and this screening result with a qualified healthcare professional or radiologist."

            : "Your combined assessment falls within the moderate-risk category. Arrange a clinical review of the combined findings so they can be interpreted in context.",

      steps: [

        "Arrange a healthcare professional consultation for review.",

        "Review the relevant clinical information and, when applicable, the original chest X-ray.",

        "Additional imaging or testing should be determined from the complete clinical and radiographic picture.",
      ],
    };
  }


  return {

    primary:
      type ===
      "clinical"

        ? "Your clinical assessment falls within the high-risk category. Arrange timely consultation with a qualified healthcare professional for further assessment."

        : type ===
            "imaging"

          ? "Your imaging assessment falls within the high-risk category. Arrange timely professional review of the original chest X-ray and discuss whether additional evaluation is appropriate."

          : "Your combined assessment falls within the high-risk category. Arrange timely clinical and radiologic review of the combined findings.",

    steps: [

      "Arrange timely evaluation by a qualified healthcare professional.",

      "Have the original chest X-ray professionally reviewed when imaging is part of the assessment.",

      "Additional imaging such as diagnostic CT may be considered when clinically indicated.",

      "Further diagnostic procedures should be determined by the treating clinician based on the actual findings.",
    ],
  };
}


// ============================================================
// COMPONENT
// ============================================================

export default function ResultsContent() {

  const router =
    useRouter();


  const [
    result,
    setResult,
  ] =
    useState<
      ExtendedPredictionResult |
      null
    >(null);


  const [
    clinicalStored,
    setClinicalStored,
  ] =
    useState<
      ClinicalStoredResult |
      null
    >(null);


  const [
    imagingStored,
    setImagingStored,
  ] =
    useState<
      ImagingStoredResult |
      null
    >(null);


  const [
    fusionStored,
    setFusionStored,
  ] =
    useState<
      FusionStoredResult |
      null
    >(null);


  const [
    combinedStored,
    setCombinedStored,
  ] =
    useState<
      CombinedStoredResult |
      null
    >(null);


  // ==========================================================
  // GRAD-CAM FROM INDEXEDDB
  // ==========================================================

  const [
    gradCamHeatmap,
    setGradCamHeatmap,
  ] =
    useState<
      string |
      null
    >(null);


  // ==========================================================
  // LOAD ALL RESULT DATA
  // ==========================================================

  useEffect(() => {

    let mounted =
      true;


    const loadResults =
      async () => {

        try {

          // ----------------------------------------------------
          // MAIN RESULT
          // ----------------------------------------------------

          const storedResult =
            sessionStorage.getItem(
              "conan_result",
            );


          let parsedResult:
            ExtendedPredictionResult |
            null =
            null;


          if (
            storedResult
          ) {

            parsedResult =
              JSON.parse(
                storedResult,
              ) as ExtendedPredictionResult;


            if (
              parsedResult.timestamp
            ) {

              parsedResult.timestamp =
                new Date(
                  parsedResult.timestamp,
                );
            }


            if (
              mounted
            ) {

              setResult(
                parsedResult,
              );
            }
          }


          // ----------------------------------------------------
          // CLINICAL
          // ----------------------------------------------------

          const clinical =
            sessionStorage.getItem(
              "conan_clinical_result",
            );


          let parsedClinical:
            ClinicalStoredResult |
            null =
            null;


          if (
            clinical
          ) {

            parsedClinical =
              JSON.parse(
                clinical,
              ) as ClinicalStoredResult;


            if (
              mounted
            ) {

              setClinicalStored(
                parsedClinical,
              );
            }
          }


          // ----------------------------------------------------
          // IMAGING
          // ----------------------------------------------------

          const imaging =
            sessionStorage.getItem(
              "conan_imaging_result",
            );


          let parsedImaging:
            ImagingStoredResult |
            null =
            null;


          if (
            imaging
          ) {

            parsedImaging =
              JSON.parse(
                imaging,
              ) as ImagingStoredResult;


            if (
              mounted
            ) {

              setImagingStored(
                parsedImaging,
              );
            }
          }


          // ----------------------------------------------------
          // FUSION
          // ----------------------------------------------------

          const fusion =
            sessionStorage.getItem(
              "conan_fusion_result",
            );


          let parsedFusion:
            FusionStoredResult |
            null =
            null;


          if (
            fusion
          ) {

            parsedFusion =
              JSON.parse(
                fusion,
              ) as FusionStoredResult;


            if (
              mounted
            ) {

              setFusionStored(
                parsedFusion,
              );
            }
          }


          // ----------------------------------------------------
          // COMBINED
          // ----------------------------------------------------

          const combined =
            sessionStorage.getItem(
              "conan_combined_result",
            );


          let parsedCombined:
            CombinedStoredResult |
            null =
            null;


          if (
            combined
          ) {

            parsedCombined =
              JSON.parse(
                combined,
              ) as CombinedStoredResult;


            if (
              mounted
            ) {

              setCombinedStored(
                parsedCombined,
              );
            }
          }


          // ----------------------------------------------------
          // GRAD-CAM FALLBACK FROM OLD SESSION STORAGE
          // ----------------------------------------------------
          //
          // This is important for results generated BEFORE the
          // IndexedDB storage change.
          //
          // ----------------------------------------------------

          const fallbackHeatmap =
            parsedImaging?.explainability?.heatmap ??
            parsedCombined?.imaging?.explainability?.heatmap ??
            parsedResult?.explainability?.heatmap ??
            null;


          if (
            mounted &&
            fallbackHeatmap
          ) {

            setGradCamHeatmap(
              fallbackHeatmap,
            );
          }


          // ----------------------------------------------------
          // GRAD-CAM FROM INDEXEDDB
          // ----------------------------------------------------
          //
          // This is the PRIMARY source for new results.
          //
          // ----------------------------------------------------

          try {

            const storedHeatmap =
              await getStoredGradCam();


            if (
              mounted &&
              storedHeatmap
            ) {

              setGradCamHeatmap(
                storedHeatmap,
              );
            }

          } catch (
            gradCamError
          ) {

            console.warn(
              "[CONAN Results] Could not load Grad-CAM from IndexedDB:",
              gradCamError,
            );
          }

        } catch (
          error
        ) {

          console.error(
            "[CONAN Results] Failed to load result:",
            error,
          );
        }
      };


    void loadResults();


    return () => {

      mounted =
        false;
    };

  }, []);


  // ============================================================
  // NO RESULT
  // ============================================================

  if (
    !result
  ) {

    return (

      <div className="flex flex-col items-center justify-center py-20 space-y-4">

        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">

          <BarChart2 className="w-8 h-8 text-slate-400" />

        </div>


        <p className="text-slate-600 font-medium">

          No results found

        </p>


        <p className="text-sm text-slate-500">

          Complete an assessment to see your results here.

        </p>


        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >

          <Home className="w-4 h-4" />

          Go to Home

        </Link>

      </div>
    );
  }


  // ============================================================
  // RESULT TYPE
  // ============================================================

  const isClinical =
    result.type ===
    "symptoms";


  const isImaging =
    result.type ===
    "imaging";


  const isCombined =
    result.type ===
    "combined";


  const typeLabel =
    isClinical

      ? "Clinical Risk Assessment"

      : isImaging

        ? "Chest X-Ray Imaging Analysis"

        : "Combined Multimodal Assessment";


  const cfg =
    riskConfig[
      result.riskLevel
    ];


  const guidance =
    getRiskGuidance(
      result.riskLevel,
      isClinical
        ? "clinical"
        : isImaging
          ? "imaging"
          : "combined",
    );


  // ============================================================
  // CLINICAL DATA
  // ============================================================

  const clinicalPatient =
    result.clinicalInput ??
    clinicalStored?.patient ??
    null;


  // ============================================================
  // COMBINED IMAGING SOURCE
  // ============================================================

  const combinedImaging =
    isCombined
      ? combinedStored?.imaging
      : undefined;


  // ============================================================
  // IMAGING PROBABILITY
  // ============================================================

  const imagingProbability =
    combinedImaging?.probability ??
    result.imagingProbability ??
    imagingStored?.probability ??
    fusionStored?.imagingProbability;


  // ============================================================
  // IMAGING RISK
  // ============================================================

  const imagingRiskLevel =
    combinedImaging?.riskLevel ??
    result.imagingRiskLevel ??
    imagingStored?.riskLevel ??
    fusionStored?.imagingRiskLevel;


  // ============================================================
  // MODEL FINDING
  // ============================================================

  const imagingFinding =
    combinedImaging?.modelFinding ??
    result.modelFinding ??
    imagingStored?.modelFinding;


  // ============================================================
  // EXPLAINABILITY METADATA
  // ============================================================

  const explainability =
    combinedImaging?.explainability ??
    result.explainability ??
    imagingStored?.explainability;


  // ============================================================
  // GRAD-CAM DISPLAY SOURCE
  // ============================================================
  //
  // New results:
  //     IndexedDB
  //
  // Older results:
  //     sessionStorage heatmap
  //
  // ============================================================

  const displayHeatmap =
    gradCamHeatmap ??
    explainability?.heatmap ??
    null;


  // ============================================================
  // CLINICAL FACTORS
  // ============================================================

  const presentFactors =
    result.factors.filter(
      factor =>
        factor.present,
    );


  const absentFactors =
    result.factors.filter(
      factor =>
        !factor.present,
    );


  // ============================================================
  // TIMESTAMP
  // ============================================================

  const timestamp =
    result.timestamp instanceof
    Date

      ? result.timestamp

      : new Date(
          result.timestamp,
        );


  // ============================================================
  // PAGE
  // ============================================================

  return (

    <div className="space-y-6 animate-fadeIn">

      {/* ======================================================
          NAVIGATION
          ====================================================== */}

      <div className="flex items-center gap-3">

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >

          <ArrowLeft className="w-4 h-4" />

          Back

        </button>


        <span className="text-slate-300">
          |
        </span>


        <span className="text-sm text-slate-500">

          {typeLabel}

        </span>


        <span className="ml-auto text-xs text-slate-400">

          {timestamp.toLocaleDateString()}{" "}

          {timestamp.toLocaleTimeString()}

        </span>

      </div>


      {/* ======================================================
          RESULT HERO
          ====================================================== */}

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br text-white p-6",
          cfg.gradient,
        )}
      >

        <div className="absolute inset-0 opacity-10">

          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white blur-3xl" />

        </div>


        <div className="relative z-10">

          <div className="flex items-start justify-between mb-4">

            <div>

              <p className="text-white/70 text-sm font-medium mb-1">

                {typeLabel}

              </p>


              <h1 className="text-2xl font-bold">

                {cfg.icon}{" "}

                {isCombined
                  ? "Final CONAN Risk"
                  : cfg.title}

              </h1>

            </div>


            <RiskBadge
              level={
                result.riskLevel
              }
              size="lg"
            />

          </div>


          {isCombined ? (

            <div className="bg-white/10 border border-white/20 rounded-xl p-5">

              <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">

                FINAL CONAN RISK

              </p>


              <p className="text-4xl font-bold mt-2">

                {result.riskLevel ===
                "high"

                  ? "HIGH RISK"

                  : result.riskLevel ===
                      "moderate"

                    ? "MODERATE RISK"

                    : "LOW RISK"}

              </p>


              {typeof result.finalProbabilityPercent ===
                "number" && (

                <p className="text-white/80 text-sm mt-2">

                  Final fused probability:{" "}

                  <strong>

                    {result.finalProbabilityPercent.toFixed(
                      2,
                    )}
                    %

                  </strong>

                </p>

              )}

            </div>

          ) : (

            <>

              <p className="text-white/90 text-sm leading-relaxed mb-4">

                {result.summary}

              </p>


              <div className="bg-white/10 border border-white/20 rounded-xl p-4">

                <ConfidenceBar
                  confidence={
                    result.confidence
                  }
                  riskLevel={
                    result.riskLevel
                  }
                />

              </div>

            </>

          )}

        </div>

      </div>


      {/* ======================================================
          DISCLAIMER
          ====================================================== */}

      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">

        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />


        <p className="text-xs text-amber-800 leading-relaxed">

          <strong>
            Medical Disclaimer:
          </strong>{" "}

          These results are for{" "}

          <strong>
            screening and awareness purposes only.
          </strong>{" "}

          They do not constitute a medical diagnosis.
          Always consult a qualified healthcare professional
          for clinical evaluation.

        </p>

      </div>


      {/* ======================================================
          CLINICAL BREAKDOWN
          ====================================================== */}

      {(isClinical ||
        isCombined) && (

        <div className="bg-white border border-slate-200 rounded-2xl p-5">

          <div className="flex items-center gap-2 mb-4">

            <Stethoscope className="w-5 h-5 text-blue-600" />


            <div>

              <h2 className="text-base font-bold text-slate-800">

                Risk Factor Breakdown

              </h2>


              <p className="text-xs text-slate-500 mt-0.5">

                Clinical factors identified from the
                information you provided

              </p>

            </div>

          </div>


          {presentFactors.length >
          0 ? (

            <div className="space-y-3">

              {presentFactors.map(
                factor => {

                  const info =
                    clinicalFieldInfo[
                      factor.name
                    ];


                  const rawValue =
                    clinicalPatient &&
                    info

                      ? clinicalPatient[
                          info.feature
                        ]

                      : undefined;


                  const numericValue =
                    typeof rawValue ===
                    "number"

                      ? rawValue

                      : typeof rawValue ===
                          "string"

                        ? Number(
                            rawValue,
                          )

                        : NaN;


                  const hasValue =
                    Number.isFinite(
                      numericValue,
                    );


                  return (

                    <div
                      key={
                        factor.name
                      }
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <p className="text-sm font-semibold text-slate-800">

                            {factor.name}

                          </p>


                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">

                            {factorInterpretation(
                              factor.impact,
                            )}

                          </p>


                          {hasValue &&
                            info && (

                              <p className="text-xs text-slate-500 mt-1">

                                Reported level:{" "}

                                <strong className="text-slate-700">

                                  {numericValue}
                                  /
                                  {info.max}

                                </strong>

                              </p>

                            )}

                        </div>


                        <span
                          className={cn(
                            "inline-flex flex-shrink-0 items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border",
                            impactColors[
                              factor.impact
                            ],
                          )}
                        >

                          <span className="w-1.5 h-1.5 rounded-full bg-current" />

                          {factor.impact ===
                          "high"

                            ? "Elevated"

                            : factor.impact ===
                                "medium"

                              ? "Intermediate"

                              : "Lower"}

                        </span>

                      </div>

                    </div>

                  );
                },
              )}

            </div>

          ) : (

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

              <p className="text-sm text-slate-600">

                No specific clinical factors were
                flagged by the current breakdown.

              </p>

            </div>

          )}


          {absentFactors.length >
            0 && (

            <div className="mt-5">

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">

                Factors not flagged

              </p>


              <div className="flex flex-wrap gap-2">

                {absentFactors.map(
                  factor => (

                    <span
                      key={
                        factor.name
                      }
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full"
                    >

                      <CheckCircle className="w-3 h-3 text-green-500" />

                      {factor.name}

                    </span>

                  ),
                )}

              </div>

            </div>

          )}

        </div>

      )}


      {/* ======================================================
          IMAGING BREAKDOWN
          ====================================================== */}

      {(isImaging ||
        isCombined) && (

        <div className="bg-white border border-slate-200 rounded-2xl p-5">

          <div className="flex items-center gap-2 mb-4">

            <ImageIcon className="w-5 h-5 text-purple-600" />


            <div>

              <h2 className="text-base font-bold text-slate-800">

                Imaging Risk Factor Breakdown

              </h2>


              <p className="text-xs text-slate-500 mt-0.5">

                The same Model 2 imaging result used by
                CONAN, including its model explanation

              </p>

            </div>

          </div>


          {/* ==================================================
              IMAGING SCORE + RISK
              ================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div
              className={cn(
                "rounded-xl border p-5",

                imagingRiskLevel ===
                  "high"

                  ? "bg-red-50 border-red-200"

                  : imagingRiskLevel ===
                      "moderate"

                    ? "bg-amber-50 border-amber-200"

                    : "bg-green-50 border-green-200",
              )}
            >

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">

                Imaging Risk Category

              </p>


              <p
                className={cn(
                  "text-2xl font-bold mt-2",

                  imagingRiskLevel ===
                    "high"

                    ? "text-red-700"

                    : imagingRiskLevel ===
                        "moderate"

                      ? "text-amber-700"

                      : "text-green-700",
                )}
              >

                {imagingRiskLevel ===
                "high"

                  ? "HIGH RISK"

                  : imagingRiskLevel ===
                      "moderate"

                    ? "MODERATE RISK"

                    : imagingRiskLevel ===
                        "low"

                      ? "LOW RISK"

                      : "NOT AVAILABLE"}

              </p>

            </div>


            {typeof imagingProbability ===
              "number" && (

              <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">

                <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">

                  Imaging Model Score

                </p>


                <p className="text-2xl font-bold mt-2 text-purple-700">

                  {(
                    imagingProbability *
                    100
                  ).toFixed(2)}

                  %

                </p>

              </div>

            )}

          </div>


          {/* ==================================================
              MODEL FINDING
              ================================================== */}

          <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-5">

            <div className="flex items-center gap-2 mb-3">

              <ScanLine className="w-5 h-5 text-purple-700" />


              <div>

                <p className="text-sm font-semibold text-slate-800">

                  Model-Highlighted Finding

                </p>


                <p className="text-xs text-slate-500">

                  What contributed to the imaging model prediction

                </p>

              </div>

            </div>


            {imagingFinding ? (

              <>

                <div className="rounded-xl bg-white border border-slate-200 p-4">

                  <p className="text-sm font-bold text-slate-800">

                    {
                      imagingFinding.label ||
                      "Model-highlighted visual region"
                    }

                  </p>


                  {imagingFinding.attention_region && (

                    <p className="text-xs text-purple-700 mt-2">

                      Attention region:{" "}

                      <strong>

                        {
                          imagingFinding.attention_region
                        }

                      </strong>

                    </p>

                  )}


                  {typeof imagingFinding.confidence ===
                    "number" && (

                    <p className="text-xs text-slate-500 mt-1">

                      Imaging model score:{" "}

                      <strong className="text-slate-700">

                        {(
                          imagingFinding.confidence *
                          100
                        ).toFixed(2)}
                        %

                      </strong>

                    </p>

                  )}


                  {imagingFinding.description && (

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">

                      {
                        imagingFinding.description
                      }

                    </p>

                  )}

                </div>


                <div className="mt-3 rounded-lg border border-purple-200 bg-white px-3 py-3">

                  <p className="text-xs text-purple-800 leading-relaxed">

                    <strong>
                      Interpretation:
                    </strong>{" "}

                    {imagingFinding.clinical_interpretation ||
                      "This is a model-attention finding and does not independently confirm a radiologic abnormality."}

                  </p>

                </div>

              </>

            ) : (

              <p className="text-sm text-slate-500">

                No additional model finding information
                was returned.

              </p>

            )}

          </div>


          {/* ==================================================
              WHY THIS RESULT
              ================================================== */}

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">

            <p className="text-sm font-semibold text-slate-700 mb-2">

              Why did you receive this imaging result?

            </p>


            <p className="text-xs text-slate-600 leading-relaxed">

              The CONAN imaging model analyzed the uploaded
              chest X-ray and generated an imaging probability.
              That probability was then classified as LOW,
              MODERATE, or HIGH using the configured CONAN
              imaging thresholds.

              {imagingFinding?.description
                ? ` ${imagingFinding.description}`
                : ""}

            </p>

          </div>


          {/* ==================================================
              THRESHOLDS
              ================================================== */}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">

            <div
              className={cn(
                "rounded-xl border p-4",

                imagingRiskLevel ===
                  "low"

                  ? "bg-green-50 border-green-200"

                  : "bg-slate-50 border-slate-200",
              )}
            >

              <p className="text-xs font-bold text-green-700">

                LOW

              </p>


              <p className="text-xs text-slate-500 mt-1">

                Below 5%

              </p>

            </div>


            <div
              className={cn(
                "rounded-xl border p-4",

                imagingRiskLevel ===
                  "moderate"

                  ? "bg-amber-50 border-amber-200"

                  : "bg-slate-50 border-slate-200",
              )}
            >

              <p className="text-xs font-bold text-amber-700">

                MODERATE

              </p>


              <p className="text-xs text-slate-500 mt-1">

                5% through 65%

              </p>

            </div>


            <div
              className={cn(
                "rounded-xl border p-4",

                imagingRiskLevel ===
                  "high"

                  ? "bg-red-50 border-red-200"

                  : "bg-slate-50 border-slate-200",
              )}
            >

              <p className="text-xs font-bold text-red-700">

                HIGH

              </p>


              <p className="text-xs text-slate-500 mt-1">

                Above 65%

              </p>

            </div>

          </div>


          {/* ==================================================
              GRAD-CAM
              ================================================== */}

          {displayHeatmap ? (

            <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4">

              <div className="flex items-center gap-2 mb-3">

                <ScanLine className="w-5 h-5 text-purple-700" />


                <div>

                  <p className="text-sm font-semibold text-purple-800">

                    Visual Model Explanation

                  </p>


                  <p className="text-xs text-purple-600">

                    {
                      explainability?.method ||
                      "Grad-CAM"
                    }

                  </p>

                </div>

              </div>


              <div className="rounded-xl overflow-hidden border border-slate-200 bg-black">

                <img
                  src={
                    displayHeatmap
                  }
                  alt="Grad-CAM visual explanation of the chest X-ray prediction"
                  className="w-full object-contain"
                />

              </div>


              <p className="text-xs text-slate-600 leading-relaxed mt-3">

                {
                  explainability?.interpretation ||
                  "Highlighted regions indicate areas that contributed more strongly to the model prediction."
                }

              </p>


              <div className="mt-3 rounded-lg bg-white border border-purple-200 px-3 py-2">

                <p className="text-[11px] text-slate-500 leading-relaxed">

                  <strong className="text-slate-700">

                    Important:

                  </strong>{" "}

                  {explainability?.warning ||
                    "The highlighted regions represent model attention. They do not independently confirm a nodule, mass, opacity, lesion, or cancerous abnormality."}

                </p>

              </div>

            </div>

          ) : (

            <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-4">

              <div className="flex items-center gap-2">

                <ScanLine className="w-5 h-5 text-purple-700" />

                <div>

                  <p className="text-sm font-semibold text-purple-800">

                    Visual Model Explanation

                  </p>

                  <p className="text-xs text-purple-600">

                    Grad-CAM visualization unavailable

                  </p>

                </div>

              </div>

              <p className="text-xs text-slate-600 leading-relaxed mt-3">

                The imaging prediction was generated successfully,
                but the Grad-CAM visualization could not be retrieved
                from browser storage.

              </p>

            </div>

          )}

        </div>

      )}


      {/* ======================================================
          COMBINED FUSION
          ====================================================== */}

      {isCombined && (

        <div className="bg-white border border-slate-200 rounded-2xl p-5">

          <div className="flex items-center gap-2 mb-4">

            <BarChart2 className="w-5 h-5 text-teal-600" />


            <div>

              <h2 className="text-base font-bold text-slate-800">

                Combined Multimodal Assessment

              </h2>


              <p className="text-xs text-slate-500">

                Clinical Model + Model 2 Imaging + Late Fusion

              </p>

            </div>

          </div>


          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">

            <p className="text-sm font-semibold text-teal-800 mb-2">

              How the final risk was calculated

            </p>


            <p className="text-xs text-teal-700 leading-relaxed">

              The Clinical Model and the same Chest X-Ray
              Imaging Model shown above were evaluated
              separately. Their outputs were then combined
              using the CONAN late-fusion model.

            </p>


            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">

              <div className="bg-white border border-teal-200 rounded-lg p-3 text-center">

                <p className="text-[11px] text-slate-500">

                  Clinical Contribution

                </p>


                <p className="text-xl font-bold text-teal-700">

                  {
                    fusionStored?.weights?.clinical !==
                    undefined

                      ? `${(
                          fusionStored.weights.clinical *
                          100
                        ).toFixed(0)}%`

                      : "50%"
                  }

                </p>

              </div>


              <div className="bg-white border border-teal-200 rounded-lg p-3 text-center">

                <p className="text-[11px] text-slate-500">

                  Imaging Contribution

                </p>


                <p className="text-xl font-bold text-teal-700">

                  {
                    fusionStored?.weights?.imaging !==
                    undefined

                      ? `${(
                          fusionStored.weights.imaging *
                          100
                        ).toFixed(0)}%`

                      : "50%"
                  }

                </p>

              </div>


              <div className="bg-white border border-teal-200 rounded-lg p-3 text-center">

                <p className="text-[11px] text-slate-500">

                  Final Risk

                </p>


                <p className="text-xl font-bold text-teal-700">

                  {
                    result.riskLevel
                      .toUpperCase()
                  }

                </p>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          ACTIONABLE INSIGHTS
          ====================================================== */}

      <div className="bg-white border border-slate-200 rounded-2xl p-5">

        <h2 className="text-base font-bold text-slate-800 mb-4">

          Actionable Insights & Recommendations

        </h2>


        <div className="space-y-4">

          <div
            className={cn(
              "rounded-xl border p-4",
              cfg.bg,
              cfg.border,
            )}
          >

            <p
              className={cn(
                "text-sm font-semibold mb-1",
                cfg.text,
              )}
            >

              Primary Recommendation

            </p>


            <p className="text-sm text-slate-700 leading-relaxed">

              {
                guidance.primary
              }

            </p>

          </div>


          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

            <div className="flex items-center gap-2 mb-3">

              <Stethoscope className="w-4 h-4 text-blue-600" />

              <p className="text-sm font-semibold text-blue-700">

                Follow-up Guidance

              </p>

            </div>


            <div className="space-y-2">

              {
                guidance.steps.map(
                  (step, index) => (

                    <div
                      key={
                        step
                      }
                      className="flex items-start gap-2"
                    >

                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">

                        {index + 1}

                      </span>


                      <p className="text-xs text-slate-700 leading-relaxed">

                        {step}

                      </p>

                    </div>

                  ),
                )
              }

            </div>

          </div>


          {result.riskLevel ===
            "high" && (

            <div className="rounded-xl border border-red-200 bg-red-50 p-5">

              <div className="flex items-center gap-2 mb-3">

                <FlaskConical className="w-4 h-4 text-red-600" />

                <p className="text-sm font-bold text-red-700">

                  Possible Further Evaluation

                </p>

              </div>


              <p className="text-xs text-red-700 leading-relaxed mb-4">

                A high CONAN result is not itself a diagnosis
                and does not automatically prescribe an
                invasive procedure. Appropriate follow-up
                should be determined by a qualified healthcare
                professional.

              </p>


              {(isImaging ||
                isCombined) && (

                <div className="space-y-3">

                  <div className="bg-white border border-red-100 rounded-lg p-3">

                    <p className="text-sm font-semibold text-slate-800">

                      Professional X-ray review

                    </p>


                    <p className="text-xs text-slate-600 mt-1">

                      The original chest X-ray should be
                      professionally reviewed.

                    </p>

                  </div>


                  <div className="bg-white border border-red-100 rounded-lg p-3">

                    <p className="text-sm font-semibold text-slate-800">

                      Additional chest imaging

                    </p>


                    <p className="text-xs text-slate-600 mt-1">

                      Diagnostic chest CT may be considered
                      when clinically indicated.

                    </p>

                  </div>

                </div>

              )}

            </div>

          )}


          {result.riskLevel ===
            "moderate" && (

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

              <div className="flex items-center gap-2 mb-2">

                <AlertTriangle className="w-4 h-4 text-amber-700" />

                <p className="text-sm font-semibold text-amber-800">

                  Moderate-risk interpretation

                </p>

              </div>


              <p className="text-xs text-slate-700 leading-relaxed">

                A moderate result does not establish the
                presence of cancer or a specific abnormality.
                It should be interpreted together with the
                relevant clinical and imaging information.

              </p>

            </div>

          )}


          <div className="rounded-xl border border-green-200 bg-green-50 p-4">

            <div className="flex items-center gap-2 mb-2">

              <Heart className="w-4 h-4 text-green-600" />

              <p className="text-sm font-semibold text-green-700">

                Healthy Lung Practices

              </p>

            </div>


            <ul className="text-sm text-slate-700 space-y-1">

              <li>
                • Avoid tobacco smoke and secondhand smoke.
              </li>

              <li>
                • Reduce exposure to occupational dust,
                chemicals, asbestos, and other inhaled hazards.
              </li>

              <li>
                • Discuss persistent respiratory symptoms
                with a healthcare professional.
              </li>

            </ul>

          </div>


          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">

            <div className="flex items-center gap-2 mb-2">

              <Cigarette className="w-4 h-4 text-orange-600" />

              <p className="text-sm font-semibold text-orange-700">

                Smoking Cessation Guidance

              </p>

            </div>


            <p className="text-sm text-slate-700 leading-relaxed">

              If you smoke, discuss quitting with a
              healthcare professional. Evidence-based
              cessation support can help you stop smoking
              and reduce health risks.

            </p>

          </div>


          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">

            <div className="flex items-center gap-2 mb-2">

              <TrendingUp className="w-4 h-4 text-purple-600" />

              <p className="text-sm font-semibold text-purple-700">

                Early Detection Information

              </p>

            </div>


            <p className="text-sm text-slate-700 leading-relaxed">

              Seek professional medical advice for persistent
              or concerning respiratory symptoms, including
              persistent cough, coughing up blood, unexplained
              weight loss, or worsening shortness of breath.

            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
          TRUSTED RESOURCES
          ====================================================== */}

      <div className="bg-white border border-slate-200 rounded-2xl p-5">

        <h2 className="text-base font-bold text-slate-800 mb-4">

          Expert Guidance & Trusted Resources

        </h2>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {[

            {
              name:
                "World Health Organization",

              url:
                "https://www.who.int/news-room/fact-sheets/detail/cancer",

              desc:
                "Cancer information and health guidance",
            },

            {
              name:
                "American Cancer Society",

              url:
                "https://www.cancer.org/cancer/types/lung-cancer.html",

              desc:
                "Lung cancer information and resources",
            },

            {
              name:
                "National Cancer Institute",

              url:
                "https://www.cancer.gov/types/lung",

              desc:
                "Evidence-based lung cancer information",
            },

            {
              name:
                "Lung Cancer Research Foundation",

              url:
                "https://www.lungcancerresearchfoundation.org",

              desc:
                "Research and support resources",
            },

          ].map(
            resource => (

              <a
                key={
                  resource.name
                }
                href={
                  resource.url
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >

                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">

                  <ExternalLink className="w-4 h-4 text-blue-600" />

                </div>


                <div>

                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700">

                    {
                      resource.name
                    }

                  </p>


                  <p className="text-xs text-slate-500">

                    {
                      resource.desc
                    }

                  </p>

                </div>

              </a>

            ),
          )}

        </div>

      </div>


      {/* ======================================================
          ACTIONS
          ====================================================== */}

      <div className="flex gap-3">

        <Link
          href="/dashboard"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >

          <BarChart2 className="w-4 h-4" />

          View Dashboard

        </Link>


        <Link
          href="/"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
        >

          <RefreshCw className="w-4 h-4" />

          New Assessment

        </Link>

      </div>

    </div>
  );
}