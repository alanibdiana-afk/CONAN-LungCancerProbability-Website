// ============================================================
// CONAN LATE-FUSION MODEL
// ============================================================
//
// MODEL 3 — COMBINED MULTIMODAL RISK MODEL
//
// Clinical model:
//   Continuous clinical risk probability
//
// Imaging model:
//   Continuous imaging risk probability from ResNet-50
//
// Fusion:
//   P_COMBINED = wC * P_CLINICAL + wI * P_IMAGING
//
// Current baseline:
//   Clinical = 50%
//   Imaging  = 50%
//
// IMPORTANT:
//   The equal weights are a baseline and are not claimed to be
//   empirically optimized until paired multimodal validation
//   data are available.
//
// ============================================================


export type RiskLevel =
  | "low"
  | "moderate"
  | "high";


// ============================================================
// RESULT INTERFACE
// ============================================================

export interface LateFusionResult {

  clinicalProbability: number;

  imagingProbability: number;

  combinedProbability: number;

  combinedProbabilityPercent: number;

  imagingRiskLevel: RiskLevel;

  riskLevel: RiskLevel;

  weights: {
    clinical: number;
    imaging: number;
  };

  validationStatus: string;
}


// ============================================================
// RISK THRESHOLDS
// ============================================================

export const LOW_THRESHOLD = 0.05;

export const HIGH_THRESHOLD = 0.65;


// ============================================================
// FUSION WEIGHTS
// ============================================================
//
// Current baseline:
//
//   Clinical = 50%
//   Imaging  = 50%
//
// These weights should not be described as empirically
// optimized until they are learned/validated using paired
// multimodal validation data.
// ============================================================

export const CLINICAL_WEIGHT = 0.50;

export const IMAGING_WEIGHT = 0.50;


// ============================================================
// VALIDATE PROBABILITY
// ============================================================

function validateProbability(
  value: unknown,
  name: string,
): number {

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0 ||
    number > 1
  ) {

    throw new Error(
      `${name} must be a number between 0 and 1.`,
    );
  }

  return number;
}


// ============================================================
// VALIDATE FUSION WEIGHTS
// ============================================================

function validateFusionWeights(): void {

  const total =
    CLINICAL_WEIGHT +
    IMAGING_WEIGHT;

  if (
    !Number.isFinite(CLINICAL_WEIGHT) ||
    !Number.isFinite(IMAGING_WEIGHT)
  ) {

    throw new Error(
      "Fusion weights must be finite numbers.",
    );
  }

  if (
    CLINICAL_WEIGHT < 0 ||
    IMAGING_WEIGHT < 0
  ) {

    throw new Error(
      "Fusion weights cannot be negative.",
    );
  }

  if (
    Math.abs(total - 1) > 1e-12
  ) {

    throw new Error(
      "Fusion weights must sum to 1.",
    );
  }
}


// ============================================================
// CLASSIFY RISK
// ============================================================

export function classifyRisk(
  probability: number,
): RiskLevel {

  const p =
    validateProbability(
      probability,
      "Risk probability",
    );

  if (
    p < LOW_THRESHOLD
  ) {

    return "low";
  }

  if (
    p <= HIGH_THRESHOLD
  ) {

    return "moderate";
  }

  return "high";
}


// ============================================================
// CLASSIFY IMAGING RISK
// ============================================================

export function classifyImagingRisk(
  probability: number,
): RiskLevel {

  return classifyRisk(
    probability,
  );
}


// ============================================================
// CONTINUOUS LATE FUSION
// ============================================================
//
// The two models produce continuous probabilities:
//
//   P_CLINICAL
//   P_IMAGING
//
// These are combined directly:
//
//   P_COMBINED
//      = wC(P_CLINICAL)
//      + wI(P_IMAGING)
//
// No artificial LOW/MODERATE/HIGH distribution is created
// from the CNN probability.
// ============================================================

export function fuseClinicalAndImaging(
  clinicalProbability: number,
  imagingProbability: number,
): LateFusionResult {

  // ----------------------------------------------------------
  // Validate weights
  // ----------------------------------------------------------

  validateFusionWeights();


  // ----------------------------------------------------------
  // Validate clinical probability
  // ----------------------------------------------------------

  const clinical =
    validateProbability(
      clinicalProbability,
      "Clinical probability",
    );


  // ----------------------------------------------------------
  // Validate imaging probability
  // ----------------------------------------------------------

  const imaging =
    validateProbability(
      imagingProbability,
      "Imaging probability",
    );


  // ----------------------------------------------------------
  // Imaging risk category
  // ----------------------------------------------------------

  const imagingRiskLevel =
    classifyImagingRisk(
      imaging,
    );


  // ==========================================================
  // MODEL 3 — CONTINUOUS LATE FUSION
  // ==========================================================

  const combinedProbability =
    (
      CLINICAL_WEIGHT *
      clinical
    )
    +
    (
      IMAGING_WEIGHT *
      imaging
    );


  // ----------------------------------------------------------
  // Protect against floating-point drift
  // ----------------------------------------------------------

  const finalProbability =
    Math.max(
      0,
      Math.min(
        1,
        combinedProbability,
      ),
    );


  // ----------------------------------------------------------
  // Final combined risk category
  // ----------------------------------------------------------

  const riskLevel =
    classifyRisk(
      finalProbability,
    );


  // ----------------------------------------------------------
  // Percentage
  // ----------------------------------------------------------

  const combinedProbabilityPercent =
    Number(
      (
        finalProbability *
        100
      ).toFixed(2),
    );


  // ==========================================================
  // RETURN
  // ==========================================================

  return {

    clinicalProbability:
      clinical,

    imagingProbability:
      imaging,

    combinedProbability:
      finalProbability,

    combinedProbabilityPercent:
      combinedProbabilityPercent,

    imagingRiskLevel:
      imagingRiskLevel,

    riskLevel:
      riskLevel,

    weights: {

      clinical:
        CLINICAL_WEIGHT,

      imaging:
        IMAGING_WEIGHT,
    },

    validationStatus:
      "Equal-weight continuous late-fusion baseline; fusion weights are not empirically optimized on paired multimodal validation data.",
  };
}