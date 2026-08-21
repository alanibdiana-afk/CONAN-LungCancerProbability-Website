import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd

from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    roc_auc_score,
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    log_loss
)

# ============================================================
# CONFIGURATION
# ============================================================

DATA_PATH = "ml/data/cancer patient data sets.csv"

LEVEL_MAP = {
    "Low": 0,
    "Medium": 1,
    "High": 2
}

DISPLAY_NAMES = ["LOW", "MODERATE", "HIGH"]

C_VALUES = [0.01, 0.03, 0.1, 0.3, 1.0, 3.0, 10.0]

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

# ============================================================
# LOAD DATA
# ============================================================

df = pd.read_csv(DATA_PATH)

print("=" * 90)
print("CONAN — CLEAN PLCOm2012-INSPIRED EXPERIMENT")
print("=" * 90)

print(f"\nDataset: {DATA_PATH}")
print(f"Shape:   {df.shape}")

df["target"] = df["Level"].map(LEVEL_MAP)

y = df["target"].values

print("\nTarget distribution:")
print(
    df["Level"]
    .value_counts()
    .reindex(["High", "Medium", "Low"])
)

# ============================================================
# ORIGINAL CLINICAL FEATURES
# ============================================================

FEATURES = [
    "Age",
    "Gender",
    "Smoking",
    "Passive Smoker",
    "chronic Lung Disease",
    "Genetic Risk",
    "OccuPational Hazards",
    "Air Pollution",
    "Dust Allergy",
    "Alcohol use",
    "Obesity",
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
    "Balanced Diet"
]

X_original = df[FEATURES].copy()

# ============================================================
# PLCO-INSPIRED FEATURES
# ============================================================

X = X_original.copy()

# Nonlinear age
X["Age_sq"] = X["Age"] ** 2

# Smoking interactions
X["Smoking_x_Age"] = X["Smoking"] * X["Age"]

X["Smoking_x_Chronic_Lung_Disease"] = (
    X["Smoking"] *
    X["chronic Lung Disease"]
)

X["Smoking_x_Genetic_Risk"] = (
    X["Smoking"] *
    X["Genetic Risk"]
)

X["Smoking_x_Passive_Smoker"] = (
    X["Smoking"] *
    X["Passive Smoker"]
)

# Exposure burden
X["Exposure_Burden"] = (
    X["Air Pollution"]
    + X["Dust Allergy"]
    + X["OccuPational Hazards"]
    + X["Passive Smoker"]
)

# Respiratory symptoms
X["Respiratory_Symptom_Burden"] = (
    X["Shortness of Breath"]
    + X["Wheezing"]
    + X["Dry Cough"]
    + X["Coughing of Blood"]
    + X["Chest Pain"]
)

# Systemic symptoms
X["Systemic_Symptom_Burden"] = (
    X["Fatigue"]
    + X["Weight Loss"]
    + X["Clubbing of Finger Nails"]
)

print("\nOriginal feature count:", X_original.shape[1])
print("PLCO-inspired feature count:", X.shape[1])

# ============================================================
# MODEL
# ============================================================

def make_model(C):
    return Pipeline([
        ("scaler", StandardScaler()),
        (
            "model",
            LogisticRegression(
                C=C,
                max_iter=5000,
                random_state=42
            )
        )
    ])

# ============================================================
# EVALUATION
# ============================================================

def evaluate(X_data, C):

    model = make_model(C)

    proba = cross_val_predict(
        model,
        X_data,
        y,
        cv=cv,
        method="predict_proba",
        n_jobs=-1
    )

    pred = np.argmax(proba, axis=1)

    auc = roc_auc_score(
        y,
        proba,
        multi_class="ovr",
        average="macro"
    )

    accuracy = accuracy_score(y, pred)

    balanced = balanced_accuracy_score(y, pred)

    precision = precision_score(
        y,
        pred,
        average="macro",
        zero_division=0
    )

    recall = recall_score(
        y,
        pred,
        average="macro",
        zero_division=0
    )

    f1 = f1_score(
        y,
        pred,
        average="macro",
        zero_division=0
    )

    ll = log_loss(y, proba)

    return {
        "AUC": auc,
        "Accuracy": accuracy,
        "Balanced": balanced,
        "Precision": precision,
        "Recall": recall,
        "F1": f1,
        "LogLoss": ll,
        "proba": proba,
        "pred": pred
    }

# ============================================================
# TEST PLCO REGULARIZATION
# ============================================================

print("\n" + "=" * 90)
print("TESTING PLCO-INSPIRED REGULARIZATION")
print("=" * 90)

plco_results = []

for C in C_VALUES:

    result = evaluate(X, C)

    plco_results.append({
        "C": C,
        "ROC_AUC": result["AUC"],
        "Accuracy": result["Accuracy"],
        "Balanced_Accuracy": result["Balanced"],
        "F1": result["F1"]
    })

    print(
        f"C={C:<5} | "
        f"AUC={result['AUC']:.4f} | "
        f"Accuracy={result['Accuracy']:.4f} | "
        f"Balanced={result['Balanced']:.4f} | "
        f"F1={result['F1']:.4f}"
    )

plco_results = pd.DataFrame(plco_results)

# ============================================================
# BEST PLCO MODEL
# ============================================================

best = plco_results.sort_values(
    ["ROC_AUC", "F1"],
    ascending=False
).iloc[0]

BEST_C = float(best["C"])

print("\n" + "=" * 90)
print("BEST PLCO-INSPIRED MODEL")
print("=" * 90)

print(f"Best C:              {BEST_C}")
print(f"ROC-AUC:             {best['ROC_AUC']:.4f}")
print(f"Accuracy:            {best['Accuracy']:.4f}")
print(f"Balanced Accuracy:   {best['Balanced_Accuracy']:.4f}")
print(f"F1:                  {best['F1']:.4f}")

# ============================================================
# FINAL PLCO EVALUATION
# ============================================================

plco = evaluate(X, BEST_C)

print("\n" + "=" * 90)
print("PLCO-INSPIRED OOF EVALUATION")
print("=" * 90)

print(f"ROC-AUC:             {plco['AUC']:.4f}")
print(f"Accuracy:            {plco['Accuracy']:.4f}")
print(f"Balanced Accuracy:   {plco['Balanced']:.4f}")
print(f"Precision:           {plco['Precision']:.4f}")
print(f"Recall:              {plco['Recall']:.4f}")
print(f"F1:                  {plco['F1']:.4f}")
print(f"Log Loss:            {plco['LogLoss']:.6f}")

print("\nConfusion Matrix:")
print(confusion_matrix(y, plco["pred"]))

print("\nClassification Report:")
print(
    classification_report(
        y,
        plco["pred"],
        target_names=DISPLAY_NAMES,
        digits=4,
        zero_division=0
    )
)

# ============================================================
# ORIGINAL MODEL
# ============================================================

original = evaluate(X_original, 1.0)

print("\n" + "=" * 90)
print("ORIGINAL CONAN CLINICAL MODEL")
print("=" * 90)

print(f"ROC-AUC:             {original['AUC']:.4f}")
print(f"Accuracy:            {original['Accuracy']:.4f}")
print(f"Balanced Accuracy:   {original['Balanced']:.4f}")
print(f"Precision:           {original['Precision']:.4f}")
print(f"Recall:              {original['Recall']:.4f}")
print(f"F1:                  {original['F1']:.4f}")
print(f"Log Loss:            {original['LogLoss']:.6f}")

print("\nConfusion Matrix:")
print(confusion_matrix(y, original["pred"]))

# ============================================================
# FAIR COMPARISON
# ============================================================

comparison = pd.DataFrame([
    {
        "Model": "Original CONAN",
        "ROC_AUC": original["AUC"],
        "Accuracy": original["Accuracy"],
        "Balanced_Accuracy": original["Balanced"],
        "F1": original["F1"],
        "LogLoss": original["LogLoss"]
    },
    {
        "Model": "PLCO-inspired",
        "ROC_AUC": plco["AUC"],
        "Accuracy": plco["Accuracy"],
        "Balanced_Accuracy": plco["Balanced"],
        "F1": plco["F1"],
        "LogLoss": plco["LogLoss"]
    }
])

print("\n" + "=" * 90)
print("FINAL COMPARISON")
print("=" * 90)

print(comparison.to_string(index=False))

# ============================================================
# DIFFERENCES
# ============================================================

auc_diff = plco["AUC"] - original["AUC"]
acc_diff = plco["Accuracy"] - original["Accuracy"]
f1_diff = plco["F1"] - original["F1"]

print("\n" + "=" * 90)
print("PLCO EFFECT")
print("=" * 90)

print(f"ROC-AUC difference:  {auc_diff:+.6f}")
print(f"Accuracy difference: {acc_diff:+.6f}")
print(f"F1 difference:       {f1_diff:+.6f}")

# ============================================================
# DECISION
# ============================================================

print("\n" + "=" * 90)
print("MODEL DECISION")
print("=" * 90)

if auc_diff >= 0.005:

    print("PLCO-INSPIRED MODEL SHOWED A MEANINGFUL IMPROVEMENT.")
    print()
    print("However, this does NOT mean we immediately adopt it.")
    print("It must still pass leakage, calibration, and external validation checks.")

else:

    print("PLCO-INSPIRED MODEL DID NOT MEANINGFULLY IMPROVE PERFORMANCE.")
    print()
    print("DECISION: RETURN TO THE ORIGINAL CONAN CLINICAL MODEL.")
    print("Do not force PLCOm2012-inspired engineering into CONAN.")

# ============================================================
# SAVE
# ============================================================

comparison.to_csv(
    "ml/clinical/plco_experiment_comparison.csv",
    index=False
)

plco_results.to_csv(
    "ml/clinical/plco_regularization_results.csv",
    index=False
)

print("\nSaved:")
print("ml/clinical/plco_experiment_comparison.csv")
print("ml/clinical/plco_regularization_results.csv")

print("\n" + "=" * 90)
print("EXPERIMENT COMPLETE")
print("=" * 90)