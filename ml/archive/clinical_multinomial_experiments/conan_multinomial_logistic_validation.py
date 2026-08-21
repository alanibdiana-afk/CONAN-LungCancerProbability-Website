import os
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    roc_auc_score,
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    log_loss,
    confusion_matrix,
    classification_report
)

# ============================================================
# CONAN — STRICT VALIDATION OF DATASET-DERIVED
# MULTINOMIAL LOGISTIC CLINICAL RISK MODEL
# ============================================================

DATASET = "ml/data/cancer patient data sets.csv"

print("=" * 90)
print("CONAN — STRICT MULTINOMIAL LOGISTIC VALIDATION")
print("=" * 90)

# ------------------------------------------------------------
# 1. LOAD DATA
# ------------------------------------------------------------

df = pd.read_csv(DATASET)

print(f"\nDataset: {DATASET}")
print(f"Shape:   {df.shape}")

# ------------------------------------------------------------
# 2. DEFINE ALL 23 CLINICAL VARIABLES
# ------------------------------------------------------------

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
    "Snoring"
]

TARGET = "Level"

print(f"\nClinical feature count: {len(FEATURES)}")

for i, feature in enumerate(FEATURES, 1):
    print(f"{i:02d}. {feature}")

# ------------------------------------------------------------
# 3. CLEAN DATA
# ------------------------------------------------------------

data = df[FEATURES + [TARGET]].copy()

data = data.dropna()

X = data[FEATURES]
y = data[TARGET]

print("\nTarget distribution:")
print(y.value_counts())

# ------------------------------------------------------------
# 4. STRATIFIED TRAIN / TEST SPLIT
# ------------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\n" + "=" * 90)
print("TRAIN / TEST SPLIT")
print("=" * 90)

print(f"Training samples: {len(X_train)}")
print(f"Testing samples:  {len(X_test)}")

print("\nTraining distribution:")
print(y_train.value_counts())

print("\nTesting distribution:")
print(y_test.value_counts())

# ------------------------------------------------------------
# 5. MULTINOMIAL LOGISTIC REGRESSION
# ------------------------------------------------------------

# Scaling is fitted ONLY on training data because it is inside
# the Pipeline.

model = Pipeline([
    (
        "scaler",
        StandardScaler()
    ),
    (
        "logistic",
        LogisticRegression(
            C=0.1,
            solver="lbfgs",
            max_iter=5000
        )
    )
])

# ------------------------------------------------------------
# 6. TRAIN
# ------------------------------------------------------------

print("\n" + "=" * 90)
print("TRAINING MULTINOMIAL LOGISTIC MODEL")
print("=" * 90)

model.fit(X_train, y_train)

print("Training complete.")

# ------------------------------------------------------------
# 7. TEST PREDICTIONS
# ------------------------------------------------------------

proba = model.predict_proba(X_test)
pred = model.predict(X_test)

classes = model.named_steps["logistic"].classes_

print("\nClasses:")
print(classes)

# ------------------------------------------------------------
# 8. PERFORMANCE
# ------------------------------------------------------------

auc = roc_auc_score(
    y_test,
    proba,
    multi_class="ovr",
    average="macro"
)

accuracy = accuracy_score(y_test, pred)

balanced = balanced_accuracy_score(
    y_test,
    pred
)

precision = precision_score(
    y_test,
    pred,
    average="macro",
    zero_division=0
)

recall = recall_score(
    y_test,
    pred,
    average="macro",
    zero_division=0
)

f1 = f1_score(
    y_test,
    pred,
    average="macro",
    zero_division=0
)

loss = log_loss(
    y_test,
    proba,
    labels=classes
)

print("\n" + "=" * 90)
print("UNTOUCHED TEST-SET PERFORMANCE")
print("=" * 90)

print(f"ROC-AUC:            {auc:.6f}")
print(f"Accuracy:           {accuracy:.6f}")
print(f"Balanced Accuracy:  {balanced:.6f}")
print(f"Precision:          {precision:.6f}")
print(f"Recall:             {recall:.6f}")
print(f"F1:                 {f1:.6f}")
print(f"Log Loss:           {loss:.6f}")

# ------------------------------------------------------------
# 9. CONFUSION MATRIX
# ------------------------------------------------------------

print("\nConfusion Matrix:")

cm = confusion_matrix(
    y_test,
    pred,
    labels=classes
)

print(
    pd.DataFrame(
        cm,
        index=[f"Actual {c}" for c in classes],
        columns=[f"Predicted {c}" for c in classes]
    )
)

# ------------------------------------------------------------
# 10. CLASSIFICATION REPORT
# ------------------------------------------------------------

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        pred,
        labels=classes,
        zero_division=0
    )
)

# ------------------------------------------------------------
# 11. β COEFFICIENTS
# ------------------------------------------------------------

logistic = model.named_steps["logistic"]
scaler = model.named_steps["scaler"]

coef_scaled = logistic.coef_
intercepts_scaled = logistic.intercept_

# Convert coefficients back to original feature scale:
#
# z = intercept_scaled + sum(coef_scaled * standardized_x)
#
# standardized_x = (x - mean) / std
#
# Therefore:
#
# beta_original = beta_scaled / std
#
# intercept_original =
# intercept_scaled - sum(beta_original * mean)

coef_original = coef_scaled / scaler.scale_

intercepts_original = (
    intercepts_scaled
    - np.sum(
        coef_original * scaler.mean_,
        axis=1
    )
)

coef_table = pd.DataFrame(
    coef_original,
    columns=FEATURES,
    index=classes
)

print("\n" + "=" * 90)
print("CONAN β COEFFICIENTS — ORIGINAL FEATURE SCALE")
print("=" * 90)

print("\nIntercepts:")

for cls, intercept in zip(
    classes,
    intercepts_original
):
    print(
        f"β0_{str(cls).upper():<10} = "
        f"{intercept:.12f}"
    )

print("\nFeature coefficients:")

print(
    coef_table.T.to_string(
        float_format=lambda x: f"{x:.12f}"
    )
)

# ------------------------------------------------------------
# 12. PRINT THE THREE EQUATIONS
# ------------------------------------------------------------

print("\n" + "=" * 90)
print("CONAN MULTINOMIAL LOGISTIC EQUATIONS")
print("=" * 90)

for class_index, cls in enumerate(classes):

    equation = (
        f"\nz_{str(cls).upper()} = "
        f"({intercepts_original[class_index]:.12f})"
    )

    for feature_index, feature in enumerate(FEATURES):

        beta = coef_original[
            class_index,
            feature_index
        ]

        if beta >= 0:
            equation += (
                f" + ({beta:.12f})*[{feature}]"
            )
        else:
            equation += (
                f" - ({abs(beta):.12f})*[{feature}]"
            )

    print(equation)

# ------------------------------------------------------------
# 13. SOFTMAX FORMULA
# ------------------------------------------------------------

print("\n" + "=" * 90)
print("CONAN THREE-CLASS PROBABILITY EQUATIONS")
print("=" * 90)

print("""
For each patient:

P(LOW) =
exp(z_LOW) /
[
    exp(z_LOW)
    + exp(z_MODERATE)
    + exp(z_HIGH)
]

P(MODERATE) =
exp(z_MODERATE) /
[
    exp(z_LOW)
    + exp(z_MODERATE)
    + exp(z_HIGH)
]

P(HIGH) =
exp(z_HIGH) /
[
    exp(z_LOW)
    + exp(z_MODERATE)
    + exp(z_HIGH)
]

Final clinical risk =
class with the highest probability.
""")

# ------------------------------------------------------------
# 14. EXAMPLE PREDICTIONS
# ------------------------------------------------------------

results = X_test.copy()

results["Actual"] = y_test.values
results["Predicted"] = pred

for i, cls in enumerate(classes):
    results[f"P_{str(cls).upper()}"] = proba[:, i]

results = results.reset_index(drop=True)

print("\n" + "=" * 90)
print("FIRST 10 TEST PATIENT PREDICTIONS")
print("=" * 90)

print(
    results[
        ["Actual", "Predicted"] +
        [f"P_{str(c).upper()}" for c in classes]
    ].head(10).to_string(index=False)
)

# ------------------------------------------------------------
# 15. SAVE RESULTS
# ------------------------------------------------------------

os.makedirs(
    "ml/clinical",
    exist_ok=True
)

metrics = pd.DataFrame({
    "Metric": [
        "ROC_AUC",
        "Accuracy",
        "Balanced_Accuracy",
        "Precision",
        "Recall",
        "F1",
        "LogLoss"
    ],
    "Value": [
        auc,
        accuracy,
        balanced,
        precision,
        recall,
        f1,
        loss
    ]
})

metrics.to_csv(
    "ml/clinical/conan_multinomial_validation_metrics.csv",
    index=False
)

coef_output = coef_table.T.copy()

coef_output.to_csv(
    "ml/clinical/conan_multinomial_validation_coefficients.csv"
)

results.to_csv(
    "ml/clinical/conan_multinomial_validation_predictions.csv",
    index=False
)

# ------------------------------------------------------------
# 16. FINAL
# ------------------------------------------------------------

print("\n" + "=" * 90)
print("FILES SAVED")
print("=" * 90)

print(
    "ml/clinical/"
    "conan_multinomial_validation_metrics.csv"
)

print(
    "ml/clinical/"
    "conan_multinomial_validation_coefficients.csv"
)

print(
    "ml/clinical/"
    "conan_multinomial_validation_predictions.csv"
)

print("\n" + "=" * 90)
print("VALIDATION COMPLETE")
print("=" * 90)

print("""
IMPORTANT:

The β coefficients were learned using TRAINING DATA ONLY.

The test set was not used during coefficient estimation.

The model contains all 23 CONAN clinical variables.

The model directly predicts:

LOW
MODERATE
HIGH

using multinomial logistic regression and the softmax probability equation.
""")