"""
CONAN — FINAL CLINICAL MULTINOMIAL LOGISTIC RISK MODEL

23 clinical variables
3 risk classes:
    LOW
    MODERATE
    HIGH

The coefficients below were learned from the TRAINING DATA ONLY
during the strict validation experiment.

Mathematical model:

z_k = beta_0k + sum(beta_jk * X_j)

P(k|X) = exp(z_k) / sum(exp(z_c))

Final risk = class with highest probability
"""

import numpy as np
import pandas as pd


# ============================================================
# CONAN CLINICAL VARIABLES
# ============================================================

FEATURES = [
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
]


# ============================================================
# VALIDATED TRAINING-SET β COEFFICIENTS
# ============================================================

INTERCEPTS = {
    "HIGH": -15.943643818696,
    "LOW": 15.694470494298,
    "MODERATE": 0.249173324397,
}


BETAS = {

    "HIGH": {
        "Age": -0.006398249261,
        "Gender": 0.148553742755,
        "Air Pollution": 0.272946732855,
        "Alcohol use": 0.163753627962,
        "Dust Allergy": -0.020081395649,
        "OccuPational Hazards": 0.022517196763,
        "Genetic Risk": 0.110360966794,
        "chronic Lung Disease": 0.198493528697,
        "Balanced Diet": 0.195857586099,
        "Obesity": 0.258139954952,
        "Smoking": 0.098055482187,
        "Passive Smoker": 0.322972773528,
        "Chest Pain": 0.031999236535,
        "Coughing of Blood": 0.282658179532,
        "Fatigue": 0.345120179969,
        "Weight Loss": 0.168610466516,
        "Shortness of Breath": 0.196627556902,
        "Wheezing": 0.079368494033,
        "Swallowing Difficulty": 0.268216239114,
        "Clubbing of Finger Nails": 0.145535946081,
        "Frequent Cold": 0.186347371495,
        "Dry Cough": 0.213042521079,
        "Snoring": 0.149888399818,
    },

    "LOW": {
        "Age": -0.020704344160,
        "Gender": 0.158111096784,
        "Air Pollution": -0.049166531296,
        "Alcohol use": -0.097330833778,
        "Dust Allergy": -0.221586492197,
        "OccuPational Hazards": -0.057413783449,
        "Genetic Risk": -0.193175158818,
        "chronic Lung Disease": -0.137076703944,
        "Balanced Diet": -0.012894268672,
        "Obesity": -0.387184697395,
        "Smoking": 0.011616696186,
        "Passive Smoker": -0.265537229407,
        "Chest Pain": 0.029041989819,
        "Coughing of Blood": -0.256838316304,
        "Fatigue": -0.266913998627,
        "Weight Loss": -0.055892939101,
        "Shortness of Breath": -0.110763425882,
        "Wheezing": -0.379249223846,
        "Swallowing Difficulty": -0.286831086737,
        "Clubbing of Finger Nails": -0.308014150952,
        "Frequent Cold": -0.295843790680,
        "Dry Cough": -0.181174543221,
        "Snoring": -0.400004491424,
    },

    "MODERATE": {
        "Age": 0.027102593421,
        "Gender": -0.306664839539,
        "Air Pollution": -0.223780201559,
        "Alcohol use": -0.066422794184,
        "Dust Allergy": 0.241667887847,
        "OccuPational Hazards": 0.034896586686,
        "Genetic Risk": 0.082814192024,
        "chronic Lung Disease": -0.061416824753,
        "Balanced Diet": -0.182963317428,
        "Obesity": 0.129044742443,
        "Smoking": -0.109672178373,
        "Passive Smoker": -0.057435544120,
        "Chest Pain": -0.061041226355,
        "Coughing of Blood": -0.025819863228,
        "Fatigue": -0.078206181343,
        "Weight Loss": -0.112717527415,
        "Shortness of Breath": -0.085864131020,
        "Wheezing": 0.299880729813,
        "Swallowing Difficulty": 0.018614847623,
        "Clubbing of Finger Nails": 0.162478204871,
        "Frequent Cold": 0.109496419185,
        "Dry Cough": -0.031867977859,
        "Snoring": 0.250116091606,
    },
}


# ============================================================
# CALCULATE LOGITS
# ============================================================

def calculate_logits(patient):
    """
    Calculate z_LOW, z_MODERATE and z_HIGH.
    """

    missing = [f for f in FEATURES if f not in patient]

    if missing:
        raise ValueError(
            "Missing clinical variables: "
            + ", ".join(missing)
        )

    logits = {}

    for risk_class in ["LOW", "MODERATE", "HIGH"]:

        z = INTERCEPTS[risk_class]

        for feature in FEATURES:
            z += BETAS[risk_class][feature] * float(patient[feature])

        logits[risk_class] = z

    return logits


# ============================================================
# SOFTMAX PROBABILITY
# ============================================================

def softmax(logits):

    values = np.array([
        logits["LOW"],
        logits["MODERATE"],
        logits["HIGH"],
    ])

    # Numerical stability
    values = values - np.max(values)

    exp_values = np.exp(values)

    probabilities = exp_values / np.sum(exp_values)

    return {
        "LOW": float(probabilities[0]),
        "MODERATE": float(probabilities[1]),
        "HIGH": float(probabilities[2]),
    }


# ============================================================
# FINAL CLINICAL RISK PREDICTION
# ============================================================

def predict_clinical_risk(patient):

    logits = calculate_logits(patient)

    probabilities = softmax(logits)

    predicted_class = max(
        probabilities,
        key=probabilities.get
    )

    return {
        "risk": predicted_class,
        "probability": probabilities[predicted_class],

        "p_low": probabilities["LOW"],
        "p_moderate": probabilities["MODERATE"],
        "p_high": probabilities["HIGH"],

        "z_low": logits["LOW"],
        "z_moderate": logits["MODERATE"],
        "z_high": logits["HIGH"],
    }


# ============================================================
# TEST WITH ONE PATIENT
# ============================================================

if __name__ == "__main__":

    print("=" * 80)
    print("CONAN — FINAL CLINICAL MULTINOMIAL LOGISTIC MODEL")
    print("=" * 80)

    print("\nClinical variables:", len(FEATURES))

    print("\nRisk classes:")
    print("  LOW")
    print("  MODERATE")
    print("  HIGH")

    # --------------------------------------------------------
    # Example patient
    # --------------------------------------------------------

    example_patient = {
        "Age": 50,
        "Gender": 1,
        "Air Pollution": 2,
        "Alcohol use": 2,
        "Dust Allergy": 2,
        "OccuPational Hazards": 2,
        "Genetic Risk": 1,
        "chronic Lung Disease": 1,
        "Balanced Diet": 2,
        "Obesity": 2,
        "Smoking": 2,
        "Passive Smoker": 2,
        "Chest Pain": 2,
        "Coughing of Blood": 1,
        "Fatigue": 2,
        "Weight Loss": 1,
        "Shortness of Breath": 2,
        "Wheezing": 2,
        "Swallowing Difficulty": 1,
        "Clubbing of Finger Nails": 1,
        "Frequent Cold": 2,
        "Dry Cough": 2,
        "Snoring": 2,
    }

    result = predict_clinical_risk(example_patient)

    print("\n" + "=" * 80)
    print("EXAMPLE PREDICTION")
    print("=" * 80)

    print(f"\nRisk classification: {result['risk']}")

    print(
        f"Clinical probability: "
        f"{result['probability']:.6f}"
    )

    print("\nClass probabilities:")

    print(f"  LOW:      {result['p_low']:.6f}")
    print(f"  MODERATE: {result['p_moderate']:.6f}")
    print(f"  HIGH:     {result['p_high']:.6f}")

    print("\nLogits:")

    print(f"  z_LOW:      {result['z_low']:.6f}")
    print(f"  z_MODERATE: {result['z_moderate']:.6f}")
    print(f"  z_HIGH:     {result['z_high']:.6f}")

    print("\n" + "=" * 80)
    print("MODEL READY")
    print("=" * 80)