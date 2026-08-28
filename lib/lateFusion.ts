// ============================================================
// CONAN LATE-FUSION MODEL
// ============================================================
//
// MODEL 3 — COMBINED MULTIMODAL RISK MODEL
//
// Clinical model:
//   P_LOW
//   P_MODERATE
//   P_HIGH
//
// Imaging model:
//   Continuous P_IMAGING in [0, 1]
//
// Current fusion status:
//   EQUAL-WEIGHT BASELINE
//
//   Clinical = 50%
//   Imaging  = 50%
//
// IMPORTANT:
// These weights are NOT claimed to be empirically validated.
// They are the neutral baseline used until paired multimodal
// validation data is available.
//
// Imaging is represented continuously as:
//
//   LOW      = 1 - P_IMAGING
//   MODERATE = 0
//   HIGH     = P_IMAGING
//
// Final:
//
//   P_F_LOW      = wC * P_C_LOW
//                + wI * (1 - P_I)
//
//   P_F_MODERATE = wC * P_C_MODERATE
//
//   P_F_HIGH     = wC * P_C_HIGH
//                + wI * P_I
//
// Final risk = ARGMAX(P_F_LOW, P_F_MODERATE, P_F_HIGH)
//
// ============================================================


export type RiskLevel =
  | "low"
  | "moderate"
  | "high";


export interface ClinicalProbabilities {
  low: number;
  moderate: number;
  high: number;
}


export interface LateFusionResult {

  clinical: ClinicalProbabilities;

  imagingProbability: number;

  imagingRiskLevel: RiskLevel;

  imagingDistribution: ClinicalProbabilities;

  final: ClinicalProbabilities;

  finalProbability: number;

  finalProbabilityPercent: number;

  riskLevel: RiskLevel;

  weights: {
    clinical: number;
    imaging: number;
  };

  validationStatus: string;
}


// ============================================================
// IMAGING CATEGORY THRESHOLDS
// ============================================================
//
// These thresholds are for the displayed imaging risk category.
//
// LOW:
//     probability < 0.05
//
// MODERATE:
//     0.05 <= probability <= 0.65
//
// HIGH:
//     probability > 0.65
//
// IMPORTANT:
// The thresholds do NOT replace the continuous imaging
// probability during fusion.
//
// ============================================================

export const LOW_THRESHOLD = 0.05;

export const HIGH_THRESHOLD = 0.65;


// ============================================================
// FUSION WEIGHTS
// ============================================================
//
// Current status:
//
//   50% Clinical
//   50% Imaging
//
// This is an equal-weight baseline.
//
// Do NOT describe this as "validated" until the weights have
// been optimized on a paired multimodal validation dataset.
//
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

  const number =
    Number(value);


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
// NORMALIZE CLINICAL PROBABILITIES
// ============================================================

function normalizeClinical(
  clinical: ClinicalProbabilities,
): ClinicalProbabilities {

  const low =
    validateProbability(
      clinical.low,
      "Clinical LOW probability",
    );


  const moderate =
    validateProbability(
      clinical.moderate,
      "Clinical MODERATE probability",
    );


  const high =
    validateProbability(
      clinical.high,
      "Clinical HIGH probability",
    );


  const total =
    low +
    moderate +
    high;


  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {

    throw new Error(
      "Clinical probabilities must have a positive total.",
    );
  }


  return {

    low:
      low / total,

    moderate:
      moderate / total,

    high:
      high / total,

  };
}


// ============================================================
// VALIDATE FUSION WEIGHTS
// ============================================================

function validateFusionWeights(): void {

  const total =
    CLINICAL_WEIGHT +
    IMAGING_WEIGHT;


  if (
    !Number.isFinite(
      CLINICAL_WEIGHT,
    ) ||
    !Number.isFinite(
      IMAGING_WEIGHT,
    )
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
    Math.abs(
      total - 1,
    ) >
    1e-12
  ) {

    throw new Error(
      "Fusion weights must sum to 1.",
    );
  }
}


// ============================================================
// CLASSIFY IMAGING RISK
// ============================================================
//
// This classification is kept for the UI and result display.
//
// It does NOT convert the continuous imaging probability into
// a one-hot vector for fusion.
//
// ============================================================

export function classifyImagingRisk(
  probability: number,
): RiskLevel {

  const imaging =
    validateProbability(
      probability,
      "Imaging probability",
    );


  if (
    imaging <
    LOW_THRESHOLD
  ) {

    return "low";
  }


  if (
    imaging <=
    HIGH_THRESHOLD
  ) {

    return "moderate";
  }


  return "high";
}


// ============================================================
// CONVERT CONTINUOUS IMAGING PROBABILITY
// ============================================================
//
// The imaging model is binary and produces:
//
//     P_IMAGING
//
// We therefore preserve that continuous probability rather than
// throwing it away through threshold-based one-hot encoding.
//
// Representation:
//
//     LOW      = 1 - P_IMAGING
//     MODERATE = 0
//     HIGH     = P_IMAGING
//
// This distribution always sums to 1.
//
// ============================================================

export function imagingProbabilityToDistribution(
  probability: number,
): ClinicalProbabilities {

  const imaging =
    validateProbability(
      probability,
      "Imaging probability",
    );


  return {

    low:
      1 - imaging,

    moderate:
      0,

    high:
      imaging,

  };
}


// ============================================================
// FUSE CLINICAL + IMAGING
// ============================================================

export function fuseClinicalAndImaging(
  clinical: ClinicalProbabilities,
  imagingProbability: number,
): LateFusionResult {

  // ----------------------------------------------------------
  // Validate configured fusion weights
  // ----------------------------------------------------------

  validateFusionWeights();


  // ----------------------------------------------------------
  // MODEL 1 — Clinical
  // ----------------------------------------------------------

  const normalizedClinical =
    normalizeClinical(
      clinical,
    );


  // ----------------------------------------------------------
  // MODEL 2 — Imaging
  // ----------------------------------------------------------

  const imaging =
    validateProbability(
      imagingProbability,
      "Imaging probability",
    );


  // ----------------------------------------------------------
  // Imaging category
  // ----------------------------------------------------------

  const imagingRiskLevel =
    classifyImagingRisk(
      imaging,
    );


  // ----------------------------------------------------------
  // Continuous imaging representation
  // ----------------------------------------------------------

  const imagingDistribution =
    imagingProbabilityToDistribution(
      imaging,
    );


  // ==========================================================
  // MODEL 3 — LATE FUSION
  // ==========================================================

  const finalLow =
    (
      CLINICAL_WEIGHT *
      normalizedClinical.low
    )
    +
    (
      IMAGING_WEIGHT *
      imagingDistribution.low
    );


  const finalModerate =
    (
      CLINICAL_WEIGHT *
      normalizedClinical.moderate
    )
    +
    (
      IMAGING_WEIGHT *
      imagingDistribution.moderate
    );


  const finalHigh =
    (
      CLINICAL_WEIGHT *
      normalizedClinical.high
    )
    +
    (
      IMAGING_WEIGHT *
      imagingDistribution.high
    );


  // ----------------------------------------------------------
  // Validate fused distribution
  // ----------------------------------------------------------

  const total =
    finalLow +
    finalModerate +
    finalHigh;


  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {

    throw new Error(
      "Fusion produced an invalid probability distribution.",
    );
  }


  // ----------------------------------------------------------
  // Normalize final distribution
  // ----------------------------------------------------------

  const final: ClinicalProbabilities = {

    low:
      finalLow / total,

    moderate:
      finalModerate / total,

    high:
      finalHigh / total,

  };


  // ----------------------------------------------------------
  // Final distribution validation
  // ----------------------------------------------------------

  const finalTotal =
    final.low +
    final.moderate +
    final.high;


  if (
    !Number.isFinite(finalTotal) ||
    Math.abs(
      finalTotal - 1,
    ) >
    1e-6
  ) {

    throw new Error(
      "Final fusion probabilities must sum to 1.",
    );
  }


  // ==========================================================
  // SELECT FINAL RISK CATEGORY
  // ==========================================================

  let riskLevel: RiskLevel;


  if (
    final.high >= final.moderate &&
    final.high >= final.low
  ) {

    riskLevel =
      "high";

  }
  else if (
    final.moderate >= final.low
  ) {

    riskLevel =
      "moderate";

  }
  else {

    riskLevel =
      "low";
  }


  // ==========================================================
  // PROBABILITY OF SELECTED CATEGORY
  // ==========================================================

  const finalProbability =
    riskLevel === "high"
      ? final.high
      : riskLevel === "moderate"
        ? final.moderate
        : final.low;


  // ==========================================================
  // RETURN
  // ==========================================================

  return {

    clinical:
      normalizedClinical,

    imagingProbability:
      imaging,

    imagingRiskLevel,

    imagingDistribution,

    final,

    finalProbability,

    finalProbabilityPercent:
      Number(
        (
          finalProbability *
          100
        ).toFixed(2),
      ),

    riskLevel,

    weights: {

      clinical:
        CLINICAL_WEIGHT,

      imaging:
        IMAGING_WEIGHT,

    },

    validationStatus:
      "Equal-weight baseline; fusion weights are not empirically validated on paired multimodal validation data.",

  };
}