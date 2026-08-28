"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useApp } from "@/lib/context";
import type { PredictionResult } from "@/lib/types";

import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  Loader2,
  RotateCcw,
  Upload,
  X,
  Activity,
} from "lucide-react";

import { cn } from "@/lib/utils";


// ============================================================
// TYPES
// ============================================================

type RiskLevel =
  | "low"
  | "moderate"
  | "high";

type ClinicalRisk =
  | "LOW"
  | "MODERATE"
  | "HIGH";

type ClinicalFeature =
  | "Age"
  | "Gender"
  | "Air Pollution"
  | "Alcohol use"
  | "Dust Allergy"
  | "OccuPational Hazards"
  | "Genetic Risk"
  | "chronic Lung Disease"
  | "Balanced Diet"
  | "Obesity"
  | "Smoking"
  | "Passive Smoker"
  | "Frequent Cold"
  | "Snoring"
  | "Chest Pain"
  | "Coughing of Blood"
  | "Fatigue"
  | "Weight Loss"
  | "Shortness of Breath"
  | "Wheezing"
  | "Swallowing Difficulty"
  | "Clubbing of Finger Nails"
  | "Dry Cough";


type ClinicalPatient = Record<
  ClinicalFeature,
  number
>;


type ClinicalRiskResult = {
  success: boolean;

  model?: string;

  risk: ClinicalRisk;

  probability: number;

  probabilities?: {
    low?: number;
    moderate?: number;
    high?: number;
  };
};


type ImagingApiResponse = {
  success?: boolean;

  input_valid?: boolean;

  error?: string;

  detail?: string;

  message?: string;

  error_type?: string;

  probability?: number;

  probability_percent?: number;

  risk_level?: RiskLevel;

  model_finding?: {
    type?: string;
    label?: string;
    confidence?: number;
    description?: string;
    clinical_interpretation?: string;
  };

  explainability?: {
    method?: string;
    heatmap?: string;
    interpretation?: string;
    warning?: string;
  };
};


type FusionResponse = {
  success?: boolean;

  model?: string;

  clinical?: {
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

  final?: {
    low?: number;
    moderate?: number;
    high?: number;
  };

  finalProbability?: number;

  finalProbabilityPercent?: number;

  riskLevel?: RiskLevel;

  weights?: {
    clinical?: number;
    imaging?: number;
  };

  error?: string;
};


// ============================================================
// FIELD CONFIGURATION
// ============================================================

type FieldConfig = {
  feature: ClinicalFeature;

  label: string;

  description: string;

  min: number;

  max: number;

  category: string;
};


const FIELD_CONFIG: FieldConfig[] = [

  // ----------------------------------------------------------
  // PERSONAL
  // ----------------------------------------------------------

  {
    feature: "Age",
    label: "Age",
    description:
      "Your age in years.",
    min: 14,
    max: 73,
    category:
      "Personal Information",
  },

  {
    feature: "Gender",
    label: "Sex",
    description:
      "Select your sex assigned on your birth certificate.",
    min: 1,
    max: 2,
    category:
      "Personal Information",
  },


  // ----------------------------------------------------------
  // ENVIRONMENTAL / GENETIC
  // ----------------------------------------------------------

  {
    feature: "Air Pollution",
    label: "Air Pollution Exposure",
    description:
      "How much you are exposed to polluted air, such as traffic fumes, smoke, or heavily polluted areas.",
    min: 1,
    max: 8,
    category:
      "Environmental & Genetic Factors",
  },

  {
    feature: "Alcohol use",
    label: "Alcohol Consumption",
    description:
      "How frequently or heavily you consume alcoholic drinks.",
    min: 1,
    max: 8,
    category:
      "Environmental & Genetic Factors",
  },

  {
    feature: "Dust Allergy",
    label: "Dust Allergy",
    description:
      "How strongly you experience allergy symptoms when exposed to dust.",
    min: 1,
    max: 8,
    category:
      "Environmental & Genetic Factors",
  },

  {
    feature: "OccuPational Hazards",
    label: "Occupational Hazards",
    description:
      "How much your work exposes you to dust, chemicals, smoke, asbestos, or other potentially harmful substances.",
    min: 1,
    max: 8,
    category:
      "Environmental & Genetic Factors",
  },

  {
    feature: "Genetic Risk",
    label: "Family/Genetic History",
    description:
      "Whether you may have an inherited or family-related tendency toward lung disease.",
    min: 1,
    max: 7,
    category:
      "Environmental & Genetic Factors",
  },

  {
    feature: "chronic Lung Disease",
    label: "Chronic Lung Disease",
    description:
      "The level of long-term lung problems or disease you have experienced.",
    min: 1,
    max: 7,
    category:
      "Environmental & Genetic Factors",
  },


  // ----------------------------------------------------------
  // LIFESTYLE
  // ----------------------------------------------------------

  {
    feature: "Balanced Diet",
    label: "Balanced Diet",
    description:
      "How consistently your diet includes a variety of nutritious foods such as vegetables, fruits, protein, and whole grains.",
    min: 1,
    max: 7,
    category:
      "Lifestyle & Body Factors",
  },

  {
    feature: "Obesity",
    label: "Obesity",
    description:
      "The level of excess body weight represented by this model's scoring scale.",
    min: 1,
    max: 7,
    category:
      "Lifestyle & Body Factors",
  },

  {
    feature: "Smoking",
    label: "Smoking History",
    description:
      "Your level of tobacco-smoking exposure based on the model's scoring scale.",
    min: 1,
    max: 8,
    category:
      "Lifestyle & Body Factors",
  },

  {
    feature: "Passive Smoker",
    label: "Secondhand Smoke Exposure",
    description:
      "How much you are exposed to tobacco smoke from other people.",
    min: 1,
    max: 8,
    category:
      "Lifestyle & Body Factors",
  },

  {
    feature: "Frequent Cold",
    label: "Frequent Colds",
    description:
      "How often you experience colds or repeated cold-like illnesses.",
    min: 1,
    max: 7,
    category:
      "Lifestyle & Body Factors",
  },

  {
    feature: "Snoring",
    label: "Snoring",
    description:
      "How frequently or severely you snore while sleeping.",
    min: 1,
    max: 7,
    category:
      "Lifestyle & Body Factors",
  },


  // ----------------------------------------------------------
  // CLINICAL SYMPTOMS
  // ----------------------------------------------------------

  {
    feature: "Chest Pain",
    label: "Chest Pain",
    description:
      "How often or severely you experience pain or discomfort in your chest.",
    min: 1,
    max: 9,
    category:
      "Clinical Symptoms",
  },

  {
    feature: "Coughing of Blood",
    label: "Coughing Up Blood",
    description:
      "Whether you have noticed blood when coughing. Use the scale provided by the model.",
    min: 1,
    max: 9,
    category:
      "Clinical Symptoms",
  },

  {
    feature: "Fatigue",
    label: "Fatigue",
    description:
      "How often or severely you experience unusual tiredness or lack of energy.",
    min: 1,
    max: 9,
    category:
      "Clinical Symptoms",
  },

  {
    feature: "Weight Loss",
    label: "Unexplained Weight Loss",
    description:
      "The level of unexpected weight loss that you have experienced.",
    min: 1,
    max: 8,
    category:
      "Clinical Symptoms",
  },

  {
    feature: "Shortness of Breath",
    label: "Shortness of Breath",
    description:
      "How often or severely you have difficulty breathing or feel breathless.",
    min: 1,
    max: 9,
    category:
      "Clinical Symptoms",
  },

  {
    feature: "Wheezing",
    label: "Wheezing",
    description:
      "How often you experience a high-pitched whistling sound when breathing.",
    min: 1,
    max: 8,
    category:
      "Clinical Symptoms",
  },

  {
    feature: "Swallowing Difficulty",
    label: "Difficulty Swallowing",
    description:
      "How much difficulty you experience when swallowing food or liquids.",
    min: 1,
    max: 8,
    category:
      "Clinical Symptoms",
  },

  {
    feature: "Clubbing of Finger Nails",
    label: "Fingernail Changes",
    description:
      "The degree of rounded or enlarged fingertips/fingernails represented by the model's scale.",
    min: 1,
    max: 9,
    category:
      "Clinical Symptoms",
  },

  {
    feature: "Dry Cough",
    label: "Dry Cough",
    description:
      "How often you experience a cough that does not produce mucus or phlegm.",
    min: 1,
    max: 7,
    category:
      "Clinical Symptoms",
  },
];


// ============================================================
// CATEGORIES
// ============================================================

const CATEGORIES = [
  "Personal Information",
  "Environmental & Genetic Factors",
  "Lifestyle & Body Factors",
  "Clinical Symptoms",
];


// ============================================================
// DEFAULT CLINICAL VALUES
// ============================================================

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


// ============================================================
// HELPERS
// ============================================================

function convertRiskLevel(
  risk: ClinicalRisk,
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


// ============================================================
// BUILD CLINICAL FACTORS
// ============================================================

function buildClinicalFactors(
  patient: ClinicalPatient,
): PredictionResult["factors"] {

  return FIELD_CONFIG
    .filter(
      field =>
        field.category !==
        "Personal Information",
    )
    .map(field => {

      const value =
        patient[
          field.feature
        ];


      const normalized =
        (
          value -
          field.min
        ) /
        (
          field.max -
          field.min
        );


      let impact:
        "low" |
        "medium" |
        "high";


      if (
        normalized >=
        0.67
      ) {

        impact =
          "high";

      }
      else if (
        normalized >=
        0.34
      ) {

        impact =
          "medium";

      }
      else {

        impact =
          "low";
      }


      return {

        name:
          field.label,

        impact,

        present:
          normalized >=
          0.34,

      };

    })
    .filter(
      factor =>
        factor.present,
    )
    .sort(
      (a, b) => {

        const order = {
          high: 0,
          medium: 1,
          low: 2,
        };


        return (
          order[a.impact] -
          order[b.impact]
        );
      },
    );
}


// ============================================================
// API JSON HELPER
// ============================================================

async function readJson<T>(
  response: Response,
): Promise<T> {

  const text =
    await response.text();


  try {

    return JSON.parse(
      text,
    ) as T;

  }
  catch {

    throw new Error(
      text ||
        `Request failed with HTTP ${response.status}.`,
    );
  }
}


// ============================================================
// COMPONENT
// ============================================================

export default function CombinedForm() {

  const router =
    useRouter();


  const {
    saveResult,
    user,
  } =
    useApp();


  // ==========================================================
  // STEP
  // ==========================================================

  const [
    step,
    setStep,
  ] =
    useState<1 | 2>(
      1,
    );


  // ==========================================================
  // CLINICAL FORM
  // ==========================================================

  const [
    clinicalForm,
    setClinicalForm,
  ] =
    useState<ClinicalPatient>(
      DEFAULT_VALUES,
    );


  // ==========================================================
  // X-RAY
  // ==========================================================

  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null,
    );


  const [
    preview,
    setPreview,
  ] =
    useState<string | null>(
      null,
    );


  const [
    dragging,
    setDragging,
  ] =
    useState(
      false,
    );


  // ==========================================================
  // ANALYSIS
  // ==========================================================

  const [
    analyzing,
    setAnalyzing,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  // ==========================================================
  // CLINICAL UPDATE
  // ==========================================================

  const updateClinicalField = (
    feature: ClinicalFeature,
    value: number,
  ) => {

    setClinicalForm(
      previous => ({
        ...previous,

        [feature]:
          value,
      }),
    );

    setError("");
  };


  // ==========================================================
  // RESET
  // ==========================================================

  const handleReset = () => {

    setClinicalForm(
      {
        ...DEFAULT_VALUES,
      },
    );

    setFile(
      null,
    );

    setPreview(
      null,
    );

    setStep(
      1,
    );

    setError("");
  };


  // ==========================================================
  // VALIDATE CLINICAL FORM
  // ==========================================================

  const validateClinical =
    (): string | null => {

      for (
        const field
        of FIELD_CONFIG
      ) {

        const value =
          clinicalForm[
            field.feature
          ];


        if (
          !Number.isFinite(
            value,
          )
        ) {

          return (
            `${field.label} is required.`
          );
        }


        if (
          value <
            field.min ||
          value >
            field.max
        ) {

          return (
            `${field.label} must be between ` +
            `${field.min} and ${field.max}.`
          );
        }


        if (
          !Number.isInteger(
            value,
          )
        ) {

          return (
            `${field.label} must be a whole number.`
          );
        }
      }


      if (
        clinicalForm.Gender !==
          1 &&
        clinicalForm.Gender !==
          2
      ) {

        return (
          "Please select a valid sex."
        );
      }


      return null;
    };


  // ==========================================================
  // CONTINUE TO IMAGING
  // ==========================================================

  const handleContinue = () => {

    setError("");


    const validationError =
      validateClinical();


    if (
      validationError
    ) {

      setError(
        validationError,
      );

      return;
    }


    sessionStorage.setItem(
      "conan_combined_clinical",

      JSON.stringify({

        patient:
          clinicalForm,

      }),
    );


    setStep(
      2,
    );
  };


  // ==========================================================
  // FILE HANDLING
  // ==========================================================

  const handleFile = (
    selectedFile: File,
  ) => {

    setError("");


    if (
      !selectedFile.type ||
      !selectedFile.type.startsWith(
        "image/",
      )
    ) {

      setError(
        "Please upload a valid chest X-ray image.",
      );

      return;
    }


    if (
      selectedFile.size <=
      0
    ) {

      setError(
        "The uploaded image is empty.",
      );

      return;
    }


    setFile(
      selectedFile,
    );


    const reader =
      new FileReader();


    reader.onload =
      event => {

        const value =
          event.target?.result;


        setPreview(
          typeof value ===
            "string"
            ? value
            : null,
        );
      };


    reader.readAsDataURL(
      selectedFile,
    );
  };


  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {

    event.preventDefault();


    setDragging(
      false,
    );


    const droppedFile =
      event.dataTransfer.files?.[0];


    if (
      droppedFile
    ) {

      handleFile(
        droppedFile,
      );
    }
  };


  const clearFile = () => {

    setFile(
      null,
    );

    setPreview(
      null,
    );

    setError("");
  };


  // ==========================================================
  // ANALYZE COMBINED
  // ==========================================================

  const handleAnalyze =
    async () => {

      if (
        !file ||
        analyzing
      ) {

        return;
      }


      setError("");

      setAnalyzing(
        true,
      );


      try {

        // ====================================================
        // 1. CLINICAL MODEL
        // ====================================================

        const clinicalResponse =
          await fetch(
            "/api/clinical-risk",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  clinicalForm,
                ),

              cache:
                "no-store",
            },
          );


        const clinicalData =
          await readJson<
            ClinicalRiskResult
          >(
            clinicalResponse,
          );


        // ----------------------------------------------------
        // HTTP VALIDATION
        // ----------------------------------------------------

        if (
          !clinicalResponse.ok
        ) {

          throw new Error(
            clinicalData?.risk
              ? "Clinical analysis failed."
              : "Clinical risk analysis failed.",
          );
        }


        // ----------------------------------------------------
        // SUCCESS VALIDATION
        // ----------------------------------------------------

        if (
          clinicalData.success !==
          true
        ) {

          throw new Error(
            "The clinical model did not return a successful prediction.",
          );
        }


        // ----------------------------------------------------
        // RISK VALIDATION
        // ----------------------------------------------------

        if (
          clinicalData.risk !==
            "LOW" &&
          clinicalData.risk !==
            "MODERATE" &&
          clinicalData.risk !==
            "HIGH"
        ) {

          throw new Error(
            "The clinical model returned an invalid risk category.",
          );
        }


        const clinicalRiskLevel =
          convertRiskLevel(
            clinicalData.risk,
          );


        // ----------------------------------------------------
        // PRIMARY PROBABILITY
        // ----------------------------------------------------

        const clinicalProbability =
          Number(
            clinicalData.probability,
          );


        if (
          !Number.isFinite(
            clinicalProbability,
          ) ||
          clinicalProbability < 0 ||
          clinicalProbability > 1
        ) {

          throw new Error(
            "The clinical model returned an invalid probability.",
          );
        }


        // ====================================================
        // CLINICAL 3-CLASS DISTRIBUTION
        // ====================================================
        //
        // Preferred source:
        //
        //   clinicalData.probabilities.low
        //   clinicalData.probabilities.moderate
        //   clinicalData.probabilities.high
        //
        // Fallback:
        //
        // Current /api/clinical-risk may only return:
        //
        //   risk
        //   probability
        //
        // In that case the returned probability is assigned
        // to the predicted class and the remaining probability
        // mass is divided between the other two classes.
        //
        // This fallback allows the application to continue
        // functioning, but should NOT be used as validated
        // calibrated class probabilities for research metrics.
        // ====================================================

        let clinicalDistribution: {
          low: number;
          moderate: number;
          high: number;
        };


        const hasFullClinicalDistribution =
          clinicalData.probabilities &&
          clinicalData.probabilities.low !== undefined &&
          clinicalData.probabilities.moderate !== undefined &&
          clinicalData.probabilities.high !== undefined;


        if (
          hasFullClinicalDistribution
        ) {

          const low =
            Number(
              clinicalData.probabilities?.low,
            );

          const moderate =
            Number(
              clinicalData.probabilities?.moderate,
            );

          const high =
            Number(
              clinicalData.probabilities?.high,
            );


          if (
            !Number.isFinite(low) ||
            !Number.isFinite(moderate) ||
            !Number.isFinite(high) ||
            low < 0 ||
            moderate < 0 ||
            high < 0 ||
            low > 1 ||
            moderate > 1 ||
            high > 1
          ) {

            throw new Error(
              "The clinical model returned invalid LOW/MODERATE/HIGH probabilities.",
            );
          }


          const total =
            low +
            moderate +
            high;


          if (
            !Number.isFinite(total) ||
            total <= 0
          ) {

            throw new Error(
              "The clinical probability distribution is invalid.",
            );
          }


          clinicalDistribution = {

            low:
              low / total,

            moderate:
              moderate / total,

            high:
              high / total,

          };

        }
        else {

          // --------------------------------------------------
          // FALLBACK DISTRIBUTION
          // --------------------------------------------------

          const remainder =
            Math.max(
              0,
              1 -
                clinicalProbability,
            );


          if (
            clinicalRiskLevel ===
            "low"
          ) {

            clinicalDistribution = {

              low:
                clinicalProbability,

              moderate:
                remainder / 2,

              high:
                remainder / 2,

            };

          }
          else if (
            clinicalRiskLevel ===
            "moderate"
          ) {

            clinicalDistribution = {

              low:
                remainder / 2,

              moderate:
                clinicalProbability,

              high:
                remainder / 2,

            };

          }
          else {

            clinicalDistribution = {

              low:
                remainder / 2,

              moderate:
                remainder / 2,

              high:
                clinicalProbability,

            };

          }


          console.warn(
            "[CONAN Clinical] /api/clinical-risk did not return full LOW/MODERATE/HIGH probabilities. Using fallback distribution.",
          );
        }


        // ----------------------------------------------------
        // FINAL DISTRIBUTION CHECK
        // ----------------------------------------------------

        const clinicalDistributionTotal =
          clinicalDistribution.low +
          clinicalDistribution.moderate +
          clinicalDistribution.high;


        if (
          Math.abs(
            clinicalDistributionTotal -
              1,
          ) >
          1e-6
        ) {

          throw new Error(
            "The normalized clinical probability distribution is invalid.",
          );
        }


        // ----------------------------------------------------
        // DEBUG
        // ----------------------------------------------------

        console.log(
          "[CONAN Clinical] Validated output:",
          {
            risk:
              clinicalRiskLevel,

            probability:
              clinicalProbability,

            probabilities:
              clinicalDistribution,

            total:
              clinicalDistributionTotal,
          },
        );


        // ====================================================
        // 2. IMAGING MODEL
        // ====================================================

        const imagingFormData =
          new FormData();


        imagingFormData.append(
          "file",
          file,
          file.name,
        );


        const imagingResponse =
          await fetch(
            "/api/imaging-risk",
            {
              method:
                "POST",

              body:
                imagingFormData,

              cache:
                "no-store",
            },
          );


        const imagingData =
          await readJson<
            ImagingApiResponse
          >(
            imagingResponse,
          );


        // ----------------------------------------------------
        // HTTP ERROR
        // ----------------------------------------------------

        if (
          !imagingResponse.ok
        ) {

          throw new Error(
            imagingData.error ||
              imagingData.detail ||
              imagingData.message ||
              "Imaging analysis failed.",
          );
        }


        // ----------------------------------------------------
        // CHEST X-RAY VALIDATION
        // ----------------------------------------------------

        if (
          imagingData.error_type ===
            "non_chest_xray" ||
          imagingData.input_valid ===
            false
        ) {

          throw new Error(
            imagingData.message ||
              "The uploaded image does not appear to be a suitable chest X-ray.",
          );
        }


        // ----------------------------------------------------
        // SUCCESS VALIDATION
        // ----------------------------------------------------

        if (
          imagingData.success !==
          true
        ) {

          throw new Error(
            imagingData.error ||
              imagingData.message ||
              "The imaging model could not analyze the X-ray.",
          );
        }


        // ----------------------------------------------------
        // IMAGING PROBABILITY
        // ----------------------------------------------------

        const imagingProbability =
          Number(
            imagingData.probability,
          );


        if (
          !Number.isFinite(
            imagingProbability,
          ) ||
          imagingProbability < 0 ||
          imagingProbability > 1
        ) {

          throw new Error(
            "The imaging model returned an invalid probability.",
          );
        }


        // ----------------------------------------------------
        // IMAGING RISK LEVEL
        // ----------------------------------------------------

        const imagingRiskLevel =
          imagingData.risk_level ??
          (
            imagingProbability < 0.05

              ? "low"

              : imagingProbability <=
                  0.65

                ? "moderate"

                : "high"
          );


        // ====================================================
        // 3. SAVE CLINICAL RESULT
        // ====================================================

        const clinicalFactors =
          buildClinicalFactors(
            clinicalForm,
          );


        const clinicalResult:
          PredictionResult = {

          type:
            "symptoms",

          riskLevel:
            clinicalRiskLevel,

          confidence:
            Math.round(
              clinicalProbability *
                100,
            ),

          factors:
            clinicalFactors,

          summary:
            `The clinical model estimated a ${clinicalRiskLevel}-risk category based on the clinical information provided.`,

          timestamp:
            new Date(),
        };


        sessionStorage.setItem(
          "conan_clinical_result",

          JSON.stringify({

            patient:
              clinicalForm,

            prediction:
              clinicalData,

            distribution:
              clinicalDistribution,

          }),
        );


        // ====================================================
        // 4. SAVE IMAGING RESULT
        // ====================================================

        sessionStorage.setItem(
          "conan_imaging_result",

          JSON.stringify({

            probability:
              imagingProbability,

            probabilityPercent:
              Number(
                (
                  imagingProbability *
                  100
                ).toFixed(2),
              ),

            riskLevel:
              imagingRiskLevel,

            fileName:
              file.name,

            thresholds: {

              low:
                0.05,

              high:
                0.65,

            },

            modelFinding:
              imagingData.model_finding ??
              null,

            explainability:
              imagingData.explainability ??
              null,

          }),
        );


        // ====================================================
        // 5. LATE FUSION — MODEL 3
        // ====================================================
        //
        // IMPORTANT:
        //
        // The frontend does NOT perform the fusion itself.
        //
        // It sends:
        //
        //   clinicalDistribution
        //
        //   imagingProbability
        //
        // to:
        //
        //   /api/late-fusion
        //
        // The backend / lib/lateFusion.ts is responsible
        // for the configured fusion weights.
        // ====================================================

        console.log(
          "[CONAN Fusion] Sending:",
          {
            clinical:
              clinicalDistribution,

            imagingProbability:
              imagingProbability,
          },
        );


        const fusionResponse =
          await fetch(
            "/api/late-fusion",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({

                  clinical:
                    clinicalDistribution,

                  imagingProbability:
                    imagingProbability,

                }),

              cache:
                "no-store",
            },
          );


        const fusionData =
          await readJson<
            FusionResponse
          >(
            fusionResponse,
          );


        // ----------------------------------------------------
        // FUSION VALIDATION
        // ----------------------------------------------------

        if (
          !fusionResponse.ok ||
          fusionData.success !==
            true
        ) {

          throw new Error(
            fusionData.error ||
              "Combined late-fusion analysis failed.",
          );
        }


        if (
          !fusionData.riskLevel
        ) {

          throw new Error(
            "The late-fusion model did not return a final risk category.",
          );
        }


        const finalRiskLevel =
          fusionData.riskLevel;


        const finalProbability =
          Number(
            fusionData.finalProbability ??
              0,
          );


        if (
          !Number.isFinite(
            finalProbability,
          ) ||
          finalProbability < 0 ||
          finalProbability > 1
        ) {

          throw new Error(
            "The late-fusion model returned an invalid final probability.",
          );
        }


        // ====================================================
        // 6. COMBINED FACTORS
        // ====================================================

        const combinedFactors =
          clinicalFactors.length >
          0

            ? clinicalFactors

            : [

                {
                  name:
                    "Clinical assessment completed",

                  impact:
                    "low" as const,

                  present:
                    true,
                },

              ];


        // ====================================================
        // 7. FINAL COMBINED RESULT
        // ====================================================

        const finalProbabilityPercent =
          Number(
            (
              fusionData.finalProbabilityPercent ??
              finalProbability *
                100
            ).toFixed(2),
          );


        const combinedResult:
          PredictionResult = {

          type:
            "combined",

          riskLevel:
            finalRiskLevel,

          confidence:
            Math.round(
              finalProbabilityPercent,
            ),

          factors:
            combinedFactors,

          summary:
            `The CONAN late-fusion model combined the clinical and chest X-ray imaging results and estimated a ${finalRiskLevel}-risk category.`,

          timestamp:
            new Date(),
        };


        // ====================================================
        // 8. SAVE FUSION OUTPUT
        // ====================================================

        sessionStorage.setItem(
          "conan_fusion_result",

          JSON.stringify(
            fusionData,
          ),
        );


        // ====================================================
        // 9. SAVE COMPLETE COMBINED SESSION
        // ====================================================

        sessionStorage.setItem(
          "conan_combined_result",

          JSON.stringify({

            patient:
              clinicalForm,

            clinical:
              clinicalData,

            clinicalDistribution:
              clinicalDistribution,

            imaging: {

              probability:
                imagingProbability,

              riskLevel:
                imagingRiskLevel,

              modelFinding:
                imagingData.model_finding ??
                null,

              explainability:
                imagingData.explainability ??
                null,

            },

            fusion:
              fusionData,

          }),
        );


        // ====================================================
        // 10. SAVE SHARED RESULT
        // ====================================================

        sessionStorage.setItem(
          "conan_result",

          JSON.stringify(
            combinedResult,
          ),
        );


        if (
          user
        ) {

          saveResult(
            combinedResult,
          );
        }


        // ====================================================
        // 11. RESULTS PAGE
        // ====================================================

        router.push(
          "/results",
        );

      }
      catch (
        err
      ) {

        console.error(
          "[CONAN Combined] Analysis error:",
          err,
        );


        setError(
          err instanceof Error
            ? err.message
            : "Unable to complete the combined assessment.",
        );

      }
      finally {

        setAnalyzing(
          false,
        );
      }
    };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="space-y-6 animate-fadeIn">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex items-center gap-3">

        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">

          <Layers className="w-5 h-5 text-white" />

        </div>


        <div>

          <h1 className="text-xl font-bold text-slate-800">

            Combined Multimodal Assessment

          </h1>


          <p className="text-sm text-slate-500">

            Clinical assessment + chest X-ray imaging
            combined by the CONAN late-fusion model.

          </p>

        </div>

      </div>


      {/* ======================================================
          DISCLAIMER
          ====================================================== */}

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">

        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />

        <p className="text-xs text-amber-800 leading-relaxed">

          <strong>
            Screening tool only.
          </strong>{" "}

          This combined assessment is intended for
          screening and awareness and is not a medical
          diagnosis.

        </p>

      </div>


      {/* ======================================================
          STEP INDICATOR
          ====================================================== */}

      <div className="flex items-center gap-3">

        <div className="flex items-center gap-2 flex-1">

          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",

              step > 1 ||
                step === 1

                ? "bg-teal-600 text-white"

                : "bg-slate-200 text-slate-500",
            )}
          >

            {step > 1 ? (

              <CheckCircle className="w-4 h-4" />

            ) : (

              "1"

            )}

          </div>


          <span
            className={cn(
              "text-sm font-medium",

              step >= 1
                ? "text-teal-700"
                : "text-slate-400",
            )}
          >

            Clinical Assessment

          </span>


          <div className="flex-1 h-0.5 bg-slate-200 mx-2">

            <div
              className={cn(
                "h-full bg-teal-500 transition-all",

                step > 1
                  ? "w-full"
                  : "w-0",
              )}
            />

          </div>

        </div>


        <div className="flex items-center gap-2">

          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",

              step === 2
                ? "bg-teal-600 text-white"
                : "bg-slate-200 text-slate-500",
            )}
          >

            2

          </div>


          <span
            className={cn(
              "text-sm font-medium",

              step === 2
                ? "text-teal-700"
                : "text-slate-400",
            )}
          >

            Chest X-Ray

          </span>

        </div>

      </div>


      {/* ======================================================
          STEP 1
          ====================================================== */}

      {step === 1 && (

        <>

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">

            <p className="text-xs text-blue-800 leading-relaxed">

              <strong>
                Step 1 — Clinical Model:
              </strong>{" "}

              This section uses the same 23 clinical
              variables and scoring ranges as the individual
              Clinical Risk Assessment.

            </p>

          </div>


          {CATEGORIES.map(
            category => {

              const fields =
                FIELD_CONFIG.filter(
                  field =>
                    field.category ===
                    category,
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

                    {fields.map(
                      field => {

                        const value =
                          clinicalForm[
                            field.feature
                          ];


                        return (

                          <div
                            key={
                              field.feature
                            }
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >

                            <div className="flex items-start justify-between gap-3 mb-2">

                              <div>

                                <label
                                  htmlFor={
                                    `combined-${field.feature}`
                                  }
                                  className="block text-sm font-semibold text-slate-700"
                                >

                                  {
                                    field.label
                                  }

                                </label>


                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">

                                  {
                                    field.description
                                  }

                                </p>

                              </div>


                              <span className="min-w-10 text-center px-2 py-1 rounded-lg bg-teal-100 text-teal-700 text-sm font-bold">

                                {
                                  value
                                }

                              </span>

                            </div>


                            {field.feature ===
                            "Gender" ? (

                              <select
                                id={
                                  `combined-${field.feature}`
                                }
                                value={
                                  value
                                }
                                onChange={
                                  event =>
                                    updateClinicalField(
                                      field.feature,
                                      Number(
                                        event.target.value,
                                      ),
                                    )
                                }
                                className="w-full px-3 py-2 text-sm text-slate-700 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                              >

                                <option
                                  value={1}
                                >
                                  Male
                                </option>

                                <option
                                  value={2}
                                >
                                  Female
                                </option>

                              </select>

                            ) : (

                              <>

                                <input
                                  id={
                                    `combined-${field.feature}`
                                  }
                                  type="range"
                                  min={
                                    field.min
                                  }
                                  max={
                                    field.max
                                  }
                                  step={1}
                                  value={
                                    value
                                  }
                                  onChange={
                                    event =>
                                      updateClinicalField(
                                        field.feature,
                                        Number(
                                          event.target.value,
                                        ),
                                      )
                                  }
                                  className="w-full accent-teal-600 cursor-pointer"
                                  aria-label={
                                    field.label
                                  }
                                />


                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">

                                  <span>
                                    {
                                      field.min
                                    }
                                  </span>

                                  <span>
                                    {
                                      field.max
                                    }
                                  </span>

                                </div>

                              </>

                            )}

                          </div>

                        );

                      },
                    )}

                  </div>

                </div>

              );

            },
          )}


          {error && (

            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">

              <p className="text-sm text-red-700">

                <strong>
                  Error:
                </strong>{" "}

                {error}

              </p>

            </div>

          )}


          <div className="bg-white border border-slate-200 rounded-2xl p-5">

            <div className="flex items-center justify-between mb-4">

              <div>

                <p className="text-sm font-semibold text-slate-700">

                  Step 1 Complete

                </p>


                <p className="text-xs text-slate-500 mt-1">

                  Your clinical data will be retained and
                  combined with the imaging result.

                </p>

              </div>


              <button
                type="button"
                onClick={
                  handleReset
                }
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
              >

                <RotateCcw className="w-3.5 h-3.5" />

                Reset

              </button>

            </div>


            <button
              type="button"
              onClick={
                handleContinue
              }
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >

              Continue to Chest X-Ray

              <ChevronRight className="w-4 h-4" />

            </button>

          </div>

        </>

      )}


      {/* ======================================================
          STEP 2
          ====================================================== */}

      {step === 2 && (

        <>

          <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">

            <p className="text-xs text-teal-800 leading-relaxed">

              <strong>
                Step 2 — Imaging Model:
              </strong>{" "}

              Your uploaded chest X-ray will be analyzed
              using the same imaging model used by the
              individual Imaging Assessment.

            </p>

          </div>


          {/* UPLOAD */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5">

            <div className="flex items-center gap-2 mb-4">

              <ImageIcon className="w-4 h-4 text-purple-600" />

              <h2 className="text-sm font-semibold text-slate-700">

                Upload Chest X-Ray

              </h2>

            </div>


            {!preview ? (

              <div
                onDrop={
                  handleDrop
                }
                onDragOver={
                  event => {

                    event.preventDefault();

                    setDragging(
                      true,
                    );
                  }
                }
                onDragLeave={() =>
                  setDragging(
                    false,
                  )
                }
                onClick={() =>
                  document
                    .getElementById(
                      "combined-xray",
                    )
                    ?.click()
                }
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",

                  dragging

                    ? "border-purple-500 bg-purple-50"

                    : "border-slate-300 hover:border-purple-400 hover:bg-purple-50/50",
                )}
              >

                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />


                <p className="text-sm font-semibold text-slate-700">

                  Drop your chest X-ray here

                </p>


                <p className="text-xs text-slate-500 mt-1 mb-4">

                  JPG or PNG

                </p>


                <button
                  type="button"
                  onClick={
                    event => {

                      event.stopPropagation();

                      document
                        .getElementById(
                          "combined-xray",
                        )
                        ?.click();

                    }
                  }
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg"
                >

                  Browse Files

                </button>


                <input
                  id="combined-xray"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={
                    event => {

                      const selectedFile =
                        event.target.files?.[0];


                      if (
                        selectedFile
                      ) {

                        handleFile(
                          selectedFile,
                        );
                      }

                    }
                  }
                />

              </div>

            ) : (

              <div className="space-y-4">

                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">

                  <img
                    src={preview}
                    alt="Uploaded chest X-ray"
                    className="w-full max-h-96 object-contain mx-auto"
                  />


                  <button
                    type="button"
                    onClick={
                      clearFile
                    }
                    className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                  >

                    <X className="w-4 h-4" />

                  </button>

                </div>


                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">

                  <ImageIcon className="w-5 h-5 text-purple-600" />


                  <div className="flex-1 min-w-0">

                    <p className="text-sm font-medium text-slate-700 truncate">

                      {
                        file?.name
                      }

                    </p>


                    <p className="text-xs text-slate-500">

                      {
                        file
                          ? `${(
                              file.size /
                              1024
                            ).toFixed(1)} KB`
                          : ""
                      }

                    </p>

                  </div>


                  <span className="text-xs text-green-600 font-semibold">

                    Ready

                  </span>

                </div>

              </div>

            )}

          </div>


          {/* CLINICAL SUMMARY */}

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">

            <div className="flex items-center gap-2">

              <Activity className="w-4 h-4 text-blue-600" />

              <p className="text-xs text-blue-800">

                <strong>
                  Clinical assessment captured.
                </strong>{" "}

                All 23 clinical variables from Step 1
                will be passed to the Clinical Model
                before late fusion.

              </p>

            </div>

          </div>


          {/* ERROR */}

          {error && (

            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">

              <p className="text-sm text-red-700">

                <strong>
                  Error:
                </strong>{" "}

                {error}

              </p>

            </div>

          )}


          {/* ACTIONS */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5">

            <div className="flex gap-3">

              <button
                type="button"
                onClick={() =>
                  setStep(1)
                }
                disabled={
                  analyzing
                }
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >

                <ChevronLeft className="w-4 h-4" />

                Back to Clinical

              </button>


              <button
                type="button"
                onClick={
                  handleAnalyze
                }
                disabled={
                  !file ||
                  analyzing
                }
                className={cn(
                  "flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors",

                  file &&
                  !analyzing

                    ? "bg-teal-600 hover:bg-teal-700 text-white"

                    : "bg-slate-200 text-slate-400 cursor-not-allowed",
                )}
              >

                {analyzing ? (

                  <>

                    <Loader2 className="w-4 h-4 animate-spin" />

                    Analyzing Clinical + Imaging...

                  </>

                ) : (

                  <>

                    Analyze Combined Risk

                    <ChevronRight className="w-4 h-4" />

                  </>

                )}

              </button>

            </div>

          </div>

        </>

      )}

    </div>

  );
}