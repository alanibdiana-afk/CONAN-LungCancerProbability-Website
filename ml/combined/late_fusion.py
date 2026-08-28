from pathlib import Path
import json

import numpy as np


# ============================================================
# CONAN LATE-FUSION ENGINE
# ============================================================
#
# INPUTS
#
# Clinical:
#   P_LOW
#   P_MODERATE
#   P_HIGH
#
# Imaging:
#   imaging_probability
#
# OUTPUTS
#
#   final_low_probability
#   final_moderate_probability
#   final_high_probability
#   final_risk
#
# ============================================================


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(
    r"D:\CONAN datasets\Conan-App"
)

CONFIG_FILE = (
    PROJECT_ROOT
    / "ml"
    / "combined"
    / "late_fusion_config.json"
)


# ============================================================
# RISK CLASSES
# ============================================================

RISK_NAMES = [
    "LOW",
    "MODERATE",
    "HIGH"
]


# ============================================================
# RISK THRESHOLDS
# ============================================================
#
# These are the CONAN presentation thresholds:
#
# LOW       < 5%
# MODERATE  5% to 65%
# HIGH      > 65%
#
# They are used to interpret the FINAL fused score.
#
# ============================================================

LOW_THRESHOLD = 0.05

HIGH_THRESHOLD = 0.65


# ============================================================
# DEFAULT FUSION WEIGHTS
# ============================================================
#
# IMPORTANT:
#
# These are configuration values for the fusion engine.
# They are NOT claimed to be statistically learned weights.
#
# Once paired multimodal training data are available, these
# weights should be replaced by learned fusion parameters.
#
# ============================================================

DEFAULT_CLINICAL_WEIGHT = 0.50

DEFAULT_IMAGING_WEIGHT = 0.50


# ============================================================
# CONFIGURATION
# ============================================================

def load_config():

    if not CONFIG_FILE.exists():

        config = {
            "clinical_weight":
                DEFAULT_CLINICAL_WEIGHT,

            "imaging_weight":
                DEFAULT_IMAGING_WEIGHT,

            "low_threshold":
                LOW_THRESHOLD,

            "high_threshold":
                HIGH_THRESHOLD
        }

        with CONFIG_FILE.open(
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                config,
                file,
                indent=4
            )

        return config


    with CONFIG_FILE.open(
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(
            file
        )


# ============================================================
# NORMALIZE
# ============================================================

def normalize_three_class_probabilities(
    low,
    moderate,
    high
):

    values = np.array(
        [
            float(low),
            float(moderate),
            float(high)
        ],
        dtype=float
    )


    if np.any(
        ~np.isfinite(
            values
        )
    ):

        raise ValueError(
            "Clinical probabilities must be finite numbers."
        )


    if np.any(
        values < 0
    ):

        raise ValueError(
            "Clinical probabilities cannot be negative."
        )


    if np.any(
        values > 1
    ):

        raise ValueError(
            "Clinical probabilities cannot exceed 1."
        )


    total = float(
        values.sum()
    )


    if total <= 0:

        raise ValueError(
            "Clinical probabilities must have a positive sum."
        )


    values = (
        values
        /
        total
    )


    return values


# ============================================================
# NORMALIZE IMAGING SCORE
# ============================================================

def normalize_imaging_probability(
    probability
):

    value = float(
        probability
    )


    # Allow either:
    #
    #   0.82
    #
    # or:
    #
    #   82
    #

    if value > 1:

        value = (
            value
            /
            100.0
        )


    if not np.isfinite(
        value
    ):

        raise ValueError(
            "Imaging probability must be finite."
        )


    if (
        value < 0
        or
        value > 1
    ):

        raise ValueError(
            "Imaging probability must be between 0 and 1."
        )


    return value


# ============================================================
# CLINICAL THREE-CLASS PROBABILITIES
# ============================================================

def clinical_to_cancer_risk(
    low,
    moderate,
    high
):

    clinical = (
        normalize_three_class_probabilities(
            low,
            moderate,
            high
        )
    )


    return {
        "LOW":
            float(
                clinical[0]
            ),

        "MODERATE":
            float(
                clinical[1]
            ),

        "HIGH":
            float(
                clinical[2]
            )
    }


# ============================================================
# FUSION
# ============================================================

def fuse_predictions(
    clinical_low,
    clinical_moderate,
    clinical_high,
    imaging_probability
):

    config = load_config()


    clinical_weight = float(
        config.get(
            "clinical_weight",
            DEFAULT_CLINICAL_WEIGHT
        )
    )


    imaging_weight = float(
        config.get(
            "imaging_weight",
            DEFAULT_IMAGING_WEIGHT
        )
    )


    weight_total = (
        clinical_weight
        +
        imaging_weight
    )


    if weight_total <= 0:

        raise ValueError(
            "Fusion weights must have a positive sum."
        )


    clinical_weight = (
        clinical_weight
        /
        weight_total
    )


    imaging_weight = (
        imaging_weight
        /
        weight_total
    )


    clinical = (
        clinical_to_cancer_risk(
            clinical_low,
            clinical_moderate,
            clinical_high
        )
    )


    imaging = (
        normalize_imaging_probability(
            imaging_probability
        )
    )


    # --------------------------------------------------------
    # Convert imaging probability into a three-class
    # distribution.
    #
    # The imaging model itself produces one sigmoid cancer
    # probability.
    #
    # We therefore distribute that signal across the CONAN
    # risk categories:
    #
    #   LOW       -> below 5%
    #   MODERATE  -> 5% to 65%
    #   HIGH      -> above 65%
    #
    # --------------------------------------------------------

    if imaging < LOW_THRESHOLD:

        imaging_distribution = {
            "LOW": 1.0,
            "MODERATE": 0.0,
            "HIGH": 0.0
        }

    elif imaging <= HIGH_THRESHOLD:

        imaging_distribution = {
            "LOW": 0.0,
            "MODERATE": 1.0,
            "HIGH": 0.0
        }

    else:

        imaging_distribution = {
            "LOW": 0.0,
            "MODERATE": 0.0,
            "HIGH": 1.0
        }


    # --------------------------------------------------------
    # Weighted late fusion
    # --------------------------------------------------------

    final_low = (
        clinical_weight
        *
        clinical["LOW"]
        +
        imaging_weight
        *
        imaging_distribution["LOW"]
    )


    final_moderate = (
        clinical_weight
        *
        clinical["MODERATE"]
        +
        imaging_weight
        *
        imaging_distribution["MODERATE"]
    )


    final_high = (
        clinical_weight
        *
        clinical["HIGH"]
        +
        imaging_weight
        *
        imaging_distribution["HIGH"]
    )


    final_values = np.array(
        [
            final_low,
            final_moderate,
            final_high
        ],
        dtype=float
    )


    # --------------------------------------------------------
    # Re-normalize
    # --------------------------------------------------------

    total = float(
        final_values.sum()
    )


    if total <= 0:

        raise ValueError(
            "Fusion produced an invalid probability distribution."
        )


    final_values = (
        final_values
        /
        total
    )


    final_low = float(
        final_values[0]
    )


    final_moderate = float(
        final_values[1]
    )


    final_high = float(
        final_values[2]
    )


    # --------------------------------------------------------
    # Final class
    # --------------------------------------------------------

    final_index = int(
        np.argmax(
            final_values
        )
    )


    final_risk = (
        RISK_NAMES[
            final_index
        ]
    )


    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    return {

        "clinical_probability": {
            "LOW":
                clinical["LOW"],

            "MODERATE":
                clinical["MODERATE"],

            "HIGH":
                clinical["HIGH"]
        },

        "imaging_probability":
            imaging,

        "fusion_weights": {
            "clinical":
                clinical_weight,

            "imaging":
                imaging_weight
        },

        "final_low_probability":
            final_low,

        "final_moderate_probability":
            final_moderate,

        "final_high_probability":
            final_high,

        "final_probability_percent":
            final_high * 100.0,

        "final_risk":
            final_risk
    }


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 70)
    print("CONAN LATE-FUSION ENGINE TEST")
    print("=" * 70)
    print()


    result = fuse_predictions(
        clinical_low=0.05,
        clinical_moderate=0.20,
        clinical_high=0.75,
        imaging_probability=0.90
    )


    print(
        "Clinical LOW:",
        f"{result['clinical_probability']['LOW']:.4f}"
    )


    print(
        "Clinical MODERATE:",
        f"{result['clinical_probability']['MODERATE']:.4f}"
    )


    print(
        "Clinical HIGH:",
        f"{result['clinical_probability']['HIGH']:.4f}"
    )


    print()


    print(
        "Imaging probability:",
        f"{result['imaging_probability']:.4f}"
    )


    print()


    print(
        "Final LOW:",
        f"{result['final_low_probability']:.4f}"
    )


    print(
        "Final MODERATE:",
        f"{result['final_moderate_probability']:.4f}"
    )


    print(
        "Final HIGH:",
        f"{result['final_high_probability']:.4f}"
    )


    print()


    print(
        "Final CONAN risk:",
        result["final_risk"]
    )


    print(
        "Final HIGH score:",
        f"{result['final_probability_percent']:.2f}%"
    )


    print()