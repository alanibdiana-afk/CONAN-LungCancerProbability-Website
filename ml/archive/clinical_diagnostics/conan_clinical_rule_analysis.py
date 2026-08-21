# =============================================================================
# CONAN — CLINICAL DATASET RULE / DETERMINISTIC STRUCTURE ANALYSIS
# =============================================================================
#
# Purpose:
#   Investigate why multinomial logistic regression achieves near-perfect/
#   perfect performance on the CONAN clinical dataset.
#
# IMPORTANT:
#   This script does NOT modify the clinical model.
#   It investigates the structure of the dataset itself.
#
# =============================================================================

import os
import warnings
import numpy as np
import pandas as pd

from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.tree import DecisionTreeClassifier, export_text

warnings.filterwarnings("ignore")

# =============================================================================
# CONFIGURATION
# =============================================================================

DATASET = "ml/data/cancer patient data sets.csv"
OUTPUT_DIR = "ml/clinical"

os.makedirs(OUTPUT_DIR, exist_ok=True)

RANDOM_STATE = 42

# =============================================================================
# LOAD DATA
# =============================================================================

print("=" * 90)
print("CONAN — CLINICAL DATASET RULE / DETERMINISTIC STRUCTURE ANALYSIS")
print("=" * 90)

df = pd.read_csv(DATASET)

print(f"\nDataset: {DATASET}")
print(f"Shape:   {df.shape}")

# =============================================================================
# DEFINE VARIABLES
# =============================================================================

EXCLUDED = [
    "index",
    "Patient Id",
    "Level"
]

FEATURES = [c for c in df.columns if c not in EXCLUDED]

TARGET = "Level"

X = df[FEATURES].copy()
y = df[TARGET].copy()

print(f"\nClinical feature count: {len(FEATURES)}")

for i, feature in enumerate(FEATURES, 1):
    print(f"{i:02d}. {feature}")

print("\nTarget distribution:")
print(y.value_counts())

# =============================================================================
# 1. BASIC DATASET STRUCTURE
# =============================================================================

print("\n" + "=" * 90)
print("1. BASIC DATASET STRUCTURE")
print("=" * 90)

print(f"\nTotal patients:           {len(df)}")
print(f"Clinical variables:       {len(FEATURES)}")
print(f"Unique clinical patterns: {X.drop_duplicates().shape[0]}")
print(f"Repeated rows:             {len(df) - X.drop_duplicates().shape[0]}")

# =============================================================================
# 2. CHECK WHETHER IDENTICAL CLINICAL PATTERNS HAVE DIFFERENT LABELS
# =============================================================================

print("\n" + "=" * 90)
print("2. CLINICAL PATTERN → TARGET CONSISTENCY")
print("=" * 90)

pattern_counts = (
    df.groupby(FEATURES, dropna=False)[TARGET]
    .nunique()
)

conflicting_patterns = pattern_counts[pattern_counts > 1]

print(f"\nUnique clinical patterns:       {len(pattern_counts)}")
print(f"Patterns with conflicting labels: {len(conflicting_patterns)}")

if len(conflicting_patterns) == 0:
    print("\nRESULT:")
    print("Every repeated clinical pattern maps to exactly ONE risk class.")
    print("This is strong evidence of deterministic structure.")
else:
    print("\nRESULT:")
    print("Some identical clinical patterns have different labels.")
    print("The dataset is not completely deterministic.")

# =============================================================================
# 3. ENTROPY OF TARGET GIVEN COMPLETE CLINICAL PATTERN
# =============================================================================

print("\n" + "=" * 90)
print("3. CONDITIONAL TARGET UNCERTAINTY")
print("=" * 90)

pattern_table = (
    df.groupby(FEATURES)[TARGET]
    .value_counts()
    .unstack(fill_value=0)
)

class_columns = sorted(y.unique())

# Ensure all classes exist as columns
for c in class_columns:
    if c not in pattern_table.columns:
        pattern_table[c] = 0

pattern_table = pattern_table[class_columns]

pattern_prob = pattern_table.div(
    pattern_table.sum(axis=1),
    axis=0
)

entropy_values = []

for _, row in pattern_prob.iterrows():
    probs = row.values
    probs = probs[probs > 0]

    entropy = -np.sum(probs * np.log2(probs))
    entropy_values.append(entropy)

mean_entropy = np.mean(entropy_values)
max_entropy = np.log2(len(class_columns))

print(f"\nNumber of classes:          {len(class_columns)}")
print(f"Maximum possible entropy:  {max_entropy:.6f}")
print(f"Mean pattern entropy:       {mean_entropy:.6f}")

if mean_entropy == 0:
    print("\nEvery clinical pattern has zero target uncertainty.")

# =============================================================================
# 4. SINGLE-FEATURE DETERMINISM TEST
# =============================================================================

print("\n" + "=" * 90)
print("4. SINGLE-FEATURE TARGET DETERMINISM")
print("=" * 90)

single_feature_results = []

for feature in FEATURES:

    grouped = (
        df.groupby(feature)[TARGET]
        .nunique()
    )

    deterministic_values = int((grouped == 1).sum())
    total_values = len(grouped)

    single_feature_results.append({
        "Feature": feature,
        "Unique_values": total_values,
        "Deterministic_values": deterministic_values,
        "Deterministic_fraction": (
            deterministic_values / total_values
            if total_values > 0 else np.nan
        )
    })

single_feature_df = (
    pd.DataFrame(single_feature_results)
    .sort_values(
        "Deterministic_fraction",
        ascending=False
    )
)

print(single_feature_df.to_string(index=False))

single_feature_df.to_csv(
    os.path.join(
        OUTPUT_DIR,
        "conan_clinical_single_feature_determinism.csv"
    ),
    index=False
)

# =============================================================================
# 5. ONE-FEATURE LOGISTIC BASELINES
# =============================================================================

print("\n" + "=" * 90)
print("5. SINGLE-FEATURE MULTINOMIAL LOGISTIC PERFORMANCE")
print("=" * 90)

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=RANDOM_STATE
)

single_results = []

for feature in FEATURES:

    X_single = df[[feature]]

    model = LogisticRegression(
        max_iter=5000,
        random_state=RANDOM_STATE
    )

    scores = cross_val_score(
        model,
        X_single,
        y,
        cv=cv,
        scoring="accuracy"
    )

    single_results.append({
        "Feature": feature,
        "Mean_CV_Accuracy": scores.mean(),
        "Std_CV_Accuracy": scores.std()
    })

single_results_df = (
    pd.DataFrame(single_results)
    .sort_values(
        "Mean_CV_Accuracy",
        ascending=False
    )
)

print(
    single_results_df.to_string(
        index=False,
        float_format=lambda x: f"{x:.6f}"
    )
)

single_results_df.to_csv(
    os.path.join(
        OUTPUT_DIR,
        "conan_clinical_single_feature_rule_accuracy.csv"
    ),
    index=False
)

# =============================================================================
# 6. DECISION TREE RULE COMPLEXITY
# =============================================================================

print("\n" + "=" * 90)
print("6. DECISION TREE RULE COMPLEXITY")
print("=" * 90)

tree_results = []

for depth in [1, 2, 3, 4, 5, 6, 8, 10, None]:

    tree = DecisionTreeClassifier(
        max_depth=depth,
        random_state=RANDOM_STATE
    )

    scores = cross_val_score(
        tree,
        X,
        y,
        cv=cv,
        scoring="accuracy"
    )

    tree_results.append({
        "Depth": depth if depth is not None else "None",
        "Mean_CV_Accuracy": scores.mean(),
        "Std_CV_Accuracy": scores.std()
    })

tree_results_df = pd.DataFrame(tree_results)

print(
    tree_results_df.to_string(
        index=False,
        float_format=lambda x: f"{x:.6f}"
    )
)

tree_results_df.to_csv(
    os.path.join(
        OUTPUT_DIR,
        "conan_clinical_rule_tree_complexity.csv"
    ),
    index=False
)

# =============================================================================
# 7. FIT SHALLOW TREE TO REVEAL POSSIBLE RULES
# =============================================================================

print("\n" + "=" * 90)
print("7. SHALLOW DECISION TREE RULE EXTRACTION")
print("=" * 90)

tree = DecisionTreeClassifier(
    max_depth=4,
    random_state=RANDOM_STATE
)

tree.fit(X, y)

rules = export_text(
    tree,
    feature_names=FEATURES
)

print("\nExtracted rules:\n")
print(rules)

with open(
    os.path.join(
        OUTPUT_DIR,
        "conan_clinical_extracted_rules.txt"
    ),
    "w",
    encoding="utf-8"
) as f:
    f.write(rules)

# =============================================================================
# 8. FEATURE IMPORTANCE FROM SHALLOW TREE
# =============================================================================

print("\n" + "=" * 90)
print("8. SHALLOW TREE FEATURE IMPORTANCE")
print("=" * 90)

tree_importance = pd.DataFrame({
    "Feature": FEATURES,
    "Importance": tree.feature_importances_
})

tree_importance = (
    tree_importance
    .sort_values(
        "Importance",
        ascending=False
    )
)

print(
    tree_importance.to_string(
        index=False,
        float_format=lambda x: f"{x:.6f}"
    )
)

tree_importance.to_csv(
    os.path.join(
        OUTPUT_DIR,
        "conan_clinical_tree_feature_importance.csv"
    ),
    index=False
)

# =============================================================================
# 9. TEST REMOVING TOP FEATURES
# =============================================================================

print("\n" + "=" * 90)
print("9. FEATURE REMOVAL TEST")
print("=" * 90)

# Use association ranking from simple ANOVA-like eta squared
eta_results = []

numeric_y = y.map({
    "Low": 0,
    "Medium": 1,
    "High": 2
})

grand_mean = numeric_y.mean()

for feature in FEATURES:

    groups = []

    for _, group in df.groupby(TARGET):
        values = group[feature].values
        groups.append(values)

    between = 0.0
    total = 0.0

    for group in groups:
        n = len(group)

        if n == 0:
            continue

        mean_group = np.mean(group)

        between += n * (mean_group - np.mean(df[feature])) ** 2
        total += np.sum(
            (group - np.mean(df[feature])) ** 2
        )

    eta_squared = (
        between / total
        if total > 0 else 0
    )

    eta_results.append({
        "Feature": feature,
        "Eta_squared": eta_squared
    })

eta_df = (
    pd.DataFrame(eta_results)
    .sort_values(
        "Eta_squared",
        ascending=False
    )
)

print(
    eta_df.to_string(
        index=False,
        float_format=lambda x: f"{x:.6f}"
    )
)

# =============================================================================
# 10. TOP FEATURE REMOVAL EXPERIMENT
# =============================================================================

print("\n" + "=" * 90)
print("10. TOP FEATURE REMOVAL EXPERIMENT")
print("=" * 90)

removal_results = []

for n_remove in [1, 3, 5, 10]:

    remove_features = (
        eta_df
        .head(n_remove)["Feature"]
        .tolist()
    )

    remaining = [
        f for f in FEATURES
        if f not in remove_features
    ]

    model = LogisticRegression(
        max_iter=5000,
        random_state=RANDOM_STATE
    )

    scores = cross_val_score(
        model,
        df[remaining],
        y,
        cv=cv,
        scoring="accuracy"
    )

    removal_results.append({
        "Removed_top_n": n_remove,
        "Removed_features": ", ".join(remove_features),
        "Remaining_features": len(remaining),
        "Mean_CV_Accuracy": scores.mean(),
        "Std_CV_Accuracy": scores.std()
    })

removal_df = pd.DataFrame(removal_results)

print(
    removal_df.to_string(
        index=False,
        float_format=lambda x: f"{x:.6f}"
    )
)

removal_df.to_csv(
    os.path.join(
        OUTPUT_DIR,
        "conan_clinical_feature_removal.csv"
    ),
    index=False
)

# =============================================================================
# 11. RANDOM LABEL CONTROL
# =============================================================================

print("\n" + "=" * 90)
print("11. RANDOM-LABEL CONTROL")
print("=" * 90)

rng = np.random.RandomState(RANDOM_STATE)

y_random = y.sample(
    frac=1,
    random_state=RANDOM_STATE
).reset_index(drop=True)

X_reset = X.reset_index(drop=True)

random_model = LogisticRegression(
    max_iter=5000,
    random_state=RANDOM_STATE
)

random_scores = cross_val_score(
    random_model,
    X_reset,
    y_random,
    cv=cv,
    scoring="accuracy"
)

print(
    f"\nRandom-label CV accuracy: "
    f"{random_scores.mean():.6f} "
    f"+/- {random_scores.std():.6f}"
)

# =============================================================================
# 12. FINAL DIAGNOSTIC SUMMARY
# =============================================================================

print("\n" + "=" * 90)
print("12. FINAL DIAGNOSTIC SUMMARY")
print("=" * 90)

print(f"""
Dataset:
  Patients:                  {len(df)}
  Clinical variables:        {len(FEATURES)}
  Unique clinical patterns:  {X.drop_duplicates().shape[0]}
  Conflicting patterns:      {len(conflicting_patterns)}

Pattern determinism:
  Mean pattern entropy:      {mean_entropy:.6f}

Logistic model:
  Full-feature CV accuracy:  {cross_val_score(
      LogisticRegression(max_iter=5000, random_state=RANDOM_STATE),
      X,
      y,
      cv=cv,
      scoring="accuracy"
  ).mean():.6f}

Decision tree:
  Depth-1:                    {tree_results_df.iloc[0]["Mean_CV_Accuracy"]:.6f}
  Depth-2:                    {tree_results_df.iloc[1]["Mean_CV_Accuracy"]:.6f}
  Depth-3:                    {tree_results_df.iloc[2]["Mean_CV_Accuracy"]:.6f}
  Depth-4:                    {tree_results_df.iloc[3]["Mean_CV_Accuracy"]:.6f}
""")

if len(conflicting_patterns) == 0:

    print("""
IMPORTANT INTERPRETATION:

The dataset contains deterministic structure.

Repeated clinical patterns consistently correspond to the same
risk category. Therefore, the perfect multinomial logistic
performance should NOT automatically be interpreted as evidence
of real-world clinical generalizability.

The model can still be mathematically valid, but external
validation on an independent clinical dataset is necessary
before claiming general clinical performance.
""")

else:

    print("""
INTERPRETATION:

The dataset contains some variation between identical clinical
patterns and target classes. The observed model performance
therefore requires less concern about complete deterministic
mapping, although external validation is still recommended.
""")

# =============================================================================
# SAVE SUMMARY
# =============================================================================

summary = pd.DataFrame({
    "Metric": [
        "Patients",
        "Clinical_variables",
        "Unique_clinical_patterns",
        "Repeated_pattern_rows",
        "Conflicting_patterns",
        "Mean_pattern_entropy",
        "Random_label_CV_accuracy"
    ],
    "Value": [
        len(df),
        len(FEATURES),
        X.drop_duplicates().shape[0],
        len(df) - X.drop_duplicates().shape[0],
        len(conflicting_patterns),
        mean_entropy,
        random_scores.mean()
    ]
})

summary.to_csv(
    os.path.join(
        OUTPUT_DIR,
        "conan_clinical_rule_analysis_summary.csv"
    ),
    index=False
)

print("\n" + "=" * 90)
print("FILES SAVED")
print("=" * 90)

files = [
    "conan_clinical_single_feature_determinism.csv",
    "conan_clinical_single_feature_rule_accuracy.csv",
    "conan_clinical_rule_tree_complexity.csv",
    "conan_clinical_extracted_rules.txt",
    "conan_clinical_tree_feature_importance.csv",
    "conan_clinical_feature_removal.csv",
    "conan_clinical_rule_analysis_summary.csv"
]

for file in files:
    print(os.path.join(OUTPUT_DIR, file))

print("\n" + "=" * 90)
print("RULE ANALYSIS COMPLETE")
print("=" * 90)