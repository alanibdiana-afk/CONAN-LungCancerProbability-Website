/**
 * CONAN — Clinical Multinomial Logistic Risk Model
 *
 * Direct TypeScript implementation of:
 * ml/clinical/conan_clinical_final.py
 *
 * 23 clinical variables
 * 3 risk classes:
 *   LOW
 *   MODERATE
 *   HIGH
 *
 * Mathematical model:
 *
 * z_k = beta_0k + sum(beta_jk * X_j)
 *
 * P(k|X) = exp(z_k) / sum(exp(z_c))
 */

export const CLINICAL_FEATURES = [
  "Age",
  "Gender",
  "Air Pollution",
  "Alcohol use",
  "Dust Allergy",
  "OccuPational Hazards",
  "Genetic Risk",
  "chronic Lung Disease",
  "Balanced Diet",
  "Obesity",
  "Smoking",
  "Passive Smoker",
  "Chest Pain",
  "Coughing of Blood",
  "Fatigue",
  "Weight Loss",
  "Shortness of Breath",
  "Wheezing",
  "Swallowing Difficulty",
  "Clubbing of Finger Nails",
  "Frequent Cold",
  "Dry Cough",
  "Snoring",
] as const;

export type ClinicalFeature = (typeof CLINICAL_FEATURES)[number];

export type RiskClass = "LOW" | "MODERATE" | "HIGH";

export type ClinicalPatient = Record<ClinicalFeature, number>;

export interface ClinicalRiskResult {
  risk: RiskClass;
  probability: number;

  p_low: number;
  p_moderate: number;
  p_high: number;

  z_low: number;
  z_moderate: number;
  z_high: number;
}

/**
 * Validated intercepts from the Python model.
 */
const INTERCEPTS: Record<RiskClass, number> = {
  HIGH: -15.943643818696,
  LOW: 15.694470494298,
  MODERATE: 0.249173324397,
};

/**
 * Validated coefficients from:
 *
 * ml/clinical/conan_clinical_final.py
 */
const BETAS: Record<RiskClass, Record<ClinicalFeature, number>> = {
  HIGH: {
    Age: -0.006398249261,
    Gender: 0.148553742755,
    "Air Pollution": 0.272946732855,
    "Alcohol use": 0.163753627962,
    "Dust Allergy": -0.020081395649,
    "OccuPational Hazards": 0.022517196763,
    "Genetic Risk": 0.110360966794,
    "chronic Lung Disease": 0.198493528697,
    "Balanced Diet": 0.195857586099,
    Obesity: 0.258139954952,
    Smoking: 0.098055482187,
    "Passive Smoker": 0.322972773528,
    "Chest Pain": 0.031999236535,
    "Coughing of Blood": 0.282658179532,
    Fatigue: 0.345120179969,
    "Weight Loss": 0.168610466516,
    "Shortness of Breath": 0.196627556902,
    Wheezing: 0.079368494033,
    "Swallowing Difficulty": 0.268216239114,
    "Clubbing of Finger Nails": 0.145535946081,
    "Frequent Cold": 0.186347371495,
    "Dry Cough": 0.213042521079,
    Snoring: 0.149888399818,
  },

  LOW: {
    Age: -0.02070434416,
    Gender: 0.158111096784,
    "Air Pollution": -0.049166531296,
    "Alcohol use": -0.097330833778,
    "Dust Allergy": -0.221586492197,
    "OccuPational Hazards": -0.057413783449,
    "Genetic Risk": -0.193175158818,
    "chronic Lung Disease": -0.137076703944,
    "Balanced Diet": -0.012894268672,
    Obesity: -0.387184697395,
    Smoking: 0.011616696186,
    "Passive Smoker": -0.265537229407,
    "Chest Pain": 0.029041989819,
    "Coughing of Blood": -0.256838316304,
    Fatigue: -0.266913998627,
    "Weight Loss": -0.055892939101,
    "Shortness of Breath": -0.110763425882,
    Wheezing: -0.379249223846,
    "Swallowing Difficulty": -0.286831086737,
    "Clubbing of Finger Nails": -0.308014150952,
    "Frequent Cold": -0.29584379068,
    "Dry Cough": -0.181174543221,
    Snoring: -0.400004491424,
  },

  MODERATE: {
    Age: 0.027102593421,
    Gender: -0.306664839539,
    "Air Pollution": -0.223780201559,
    "Alcohol use": -0.066422794184,
    "Dust Allergy": 0.241667887847,
    "OccuPational Hazards": 0.034896586686,
    "Genetic Risk": 0.082814192024,
    "chronic Lung Disease": -0.061416824753,
    "Balanced Diet": -0.182963317428,
    Obesity: 0.129044742443,
    Smoking: -0.109672178373,
    "Passive Smoker": -0.05743554412,
    "Chest Pain": -0.061041226355,
    "Coughing of Blood": -0.025819863228,
    Fatigue: -0.078206181343,
    "Weight Loss": -0.112717527415,
    "Shortness of Breath": -0.08586413102,
    Wheezing: 0.299880729813,
    "Swallowing Difficulty": 0.018614847623,
    "Clubbing of Finger Nails": 0.162478204871,
    "Frequent Cold": 0.109496419185,
    "Dry Cough": -0.031867977859,
    Snoring: 0.250116091606,
  },
};

/**
 * Calculate the three logits.
 */
export function calculateClinicalLogits(
  patient: ClinicalPatient,
): Record<RiskClass, number> {
  const logits: Record<RiskClass, number> = {
    LOW: INTERCEPTS.LOW,
    MODERATE: INTERCEPTS.MODERATE,
    HIGH: INTERCEPTS.HIGH,
  };

  for (const riskClass of ["LOW", "MODERATE", "HIGH"] as RiskClass[]) {
    let z = INTERCEPTS[riskClass];

    for (const feature of CLINICAL_FEATURES) {
      z += BETAS[riskClass][feature] * Number(patient[feature]);
    }

    logits[riskClass] = z;
  }

  return logits;
}

/**
 * Numerically stable softmax.
 */
export function clinicalSoftmax(
  logits: Record<RiskClass, number>,
): Record<RiskClass, number> {
  const values = [
    logits.LOW,
    logits.MODERATE,
    logits.HIGH,
  ];

  const maxValue = Math.max(...values);

  const expValues = values.map((value) =>
    Math.exp(value - maxValue),
  );

  const sum = expValues.reduce(
    (total, value) => total + value,
    0,
  );

  return {
    LOW: expValues[0] / sum,
    MODERATE: expValues[1] / sum,
    HIGH: expValues[2] / sum,
  };
}

/**
 * Final clinical risk prediction.
 */
export function predictClinicalRisk(
  patient: ClinicalPatient,
): ClinicalRiskResult {
  for (const feature of CLINICAL_FEATURES) {
    if (
      patient[feature] === undefined ||
      patient[feature] === null ||
      !Number.isFinite(Number(patient[feature]))
    ) {
      throw new Error(
        `Invalid or missing clinical variable: ${feature}`,
      );
    }
  }

  const logits = calculateClinicalLogits(patient);

  const probabilities = clinicalSoftmax(logits);

  const classes: RiskClass[] = [
    "LOW",
    "MODERATE",
    "HIGH",
  ];

  const risk = classes.reduce((best, current) =>
    probabilities[current] > probabilities[best]
      ? current
      : best,
  );

  return {
    risk,
    probability: probabilities[risk],

    p_low: probabilities.LOW,
    p_moderate: probabilities.MODERATE,
    p_high: probabilities.HIGH,

    z_low: logits.LOW,
    z_moderate: logits.MODERATE,
    z_high: logits.HIGH,
  };
}