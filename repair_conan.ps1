$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================"
Write-Host "CONAN CLEAN REPAIR"
Write-Host "============================================================"
Write-Host ""

# ------------------------------------------------------------
# BACKUP
# ------------------------------------------------------------

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = ".\backup_before_repair_$stamp"

New-Item -ItemType Directory -Path $backup -Force | Out-Null

$filesToBackup = @(
    ".\components\SymptomsForm.tsx",
    ".\components\ImagingForm.tsx",
    ".\components\CombinedForm.tsx",
    ".\components\ResultsContent.tsx",
    ".\lib\lateFusion.ts",
    ".\lib\prediction.ts",
    ".\ml\combined\late_fusion.py",
    ".\ml\combined\late_fusion_config.json",
    ".\ml\imaging\predict_imaging.py"
)

foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        Copy-Item $file $backup -Force
    }
}

Write-Host "Backup created: $backup"
Write-Host ""

# ------------------------------------------------------------
# 1. FIX CLINICAL API PATH
# ------------------------------------------------------------

$symptoms = ".\components\SymptomsForm.tsx"

if (Test-Path $symptoms) {
    $text = Get-Content $symptoms -Raw

    $text = $text.Replace(
        '"/API/clinical-risk"',
        '"/api/clinical-risk"'
    )

    Set-Content $symptoms $text -Encoding UTF8

    Write-Host "Fixed SymptomsForm API path."
}

# ------------------------------------------------------------
# 2. FIX LATE FUSION
# ------------------------------------------------------------

$lateFusion = ".\lib\lateFusion.ts"

@'
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
}

export const LOW_THRESHOLD = 0.05;
export const HIGH_THRESHOLD = 0.65;

export const CLINICAL_WEIGHT = 0.35;
export const IMAGING_WEIGHT = 0.65;

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
      `${name} must be between 0 and 1.`,
    );
  }

  return number;
}

function normalizeClinical(
  clinical: ClinicalProbabilities,
): ClinicalProbabilities {
  const low = validateProbability(
    clinical.low,
    "Clinical LOW probability",
  );

  const moderate = validateProbability(
    clinical.moderate,
    "Clinical MODERATE probability",
  );

  const high = validateProbability(
    clinical.high,
    "Clinical HIGH probability",
  );

  const total =
    low +
    moderate +
    high;

  if (total <= 0) {
    throw new Error(
      "Clinical probabilities must have a positive total.",
    );
  }

  return {
    low: low / total,
    moderate: moderate / total,
    high: high / total,
  };
}

function classifyImaging(
  probability: number,
): RiskLevel {
  if (probability < LOW_THRESHOLD) {
    return "low";
  }

  if (probability <= HIGH_THRESHOLD) {
    return "moderate";
  }

  return "high";
}

/*
 * Imaging remains a binary sigmoid model.
 *
 * The continuous probability is retained for fusion:
 *
 * LOW      = 1 - probability
 * MODERATE = 0
 * HIGH     = probability
 *
 * The LOW/MODERATE/HIGH label is a presentation category,
 * not a claim that the ResNet was trained as a 3-class model.
 */
function imagingToFusionDistribution(
  probability: number,
): ClinicalProbabilities {
  return {
    low: 1 - probability,
    moderate: 0,
    high: probability,
  };
}

export function fuseClinicalAndImaging(
  clinical: ClinicalProbabilities,
  imagingProbability: number,
): LateFusionResult {
  const normalizedClinical =
    normalizeClinical(clinical);

  const imaging =
    validateProbability(
      imagingProbability,
      "Imaging probability",
    );

  const imagingRiskLevel =
    classifyImaging(imaging);

  const imagingDistribution =
    imagingToFusionDistribution(imaging);

  const finalLow =
    (
      CLINICAL_WEIGHT *
      normalizedClinical.low
    ) +
    (
      IMAGING_WEIGHT *
      imagingDistribution.low
    );

  const finalModerate =
    (
      CLINICAL_WEIGHT *
      normalizedClinical.moderate
    ) +
    (
      IMAGING_WEIGHT *
      imagingDistribution.moderate
    );

  const finalHigh =
    (
      CLINICAL_WEIGHT *
      normalizedClinical.high
    ) +
    (
      IMAGING_WEIGHT *
      imagingDistribution.high
    );

  const total =
    finalLow +
    finalModerate +
    finalHigh;

  if (total <= 0) {
    throw new Error(
      "Fusion produced an invalid probability distribution.",
    );
  }

  const final: ClinicalProbabilities = {
    low: finalLow / total,
    moderate: finalModerate / total,
    high: finalHigh / total,
  };

  let riskLevel: RiskLevel;

  if (
    final.high >= final.moderate &&
    final.high >= final.low
  ) {
    riskLevel = "high";
  } else if (
    final.moderate >= final.low
  ) {
    riskLevel = "moderate";
  } else {
    riskLevel = "low";
  }

  const finalProbability =
    riskLevel === "high"
      ? final.high
      : riskLevel === "moderate"
        ? final.moderate
        : final.low;

  return {
    clinical: normalizedClinical,

    imagingProbability: imaging,

    imagingRiskLevel,

    imagingDistribution,

    final,

    finalProbability,

    finalProbabilityPercent:
      Number(
        (
          finalProbability * 100
        ).toFixed(2),
      ),

    riskLevel,

    weights: {
      clinical: CLINICAL_WEIGHT,
      imaging: IMAGING_WEIGHT,
    },
  };
}
'@ | Set-Content $lateFusion -Encoding UTF8

Write-Host "Rebuilt lib/lateFusion.ts with 35:65 fusion."

# ------------------------------------------------------------
# 3. FIX FUSION CONFIG
# ------------------------------------------------------------

$config = ".\ml\combined\late_fusion_config.json"

@'
{
  "clinical_weight": 0.35,
  "imaging_weight": 0.65,
  "low_threshold": 0.05,
  "high_threshold": 0.65
}
'@ | Set-Content $config -Encoding UTF8

Write-Host "Updated late-fusion configuration."

# ------------------------------------------------------------
# 4. REMOVE TEMPORARY THRESHOLD EXPERIMENT FILES
# ------------------------------------------------------------

$tempFiles = @(
    ".\ml\imaging\evaluation\find_imaging_thresholds.py",
    ".\ml\imaging\evaluation\imaging_risk_thresholds.json"
)

foreach ($file in $tempFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removed temporary file: $file"
    }
}

# ------------------------------------------------------------
# 5. VERIFY API ROUTES EXIST
# ------------------------------------------------------------

$apiFiles = @(
    ".\app\api\clinical-risk\route.ts",
    ".\app\api\imaging-risk\route.ts",
    ".\app\api\late-fusion\route.ts"
)

foreach ($file in $apiFiles) {
    if (Test-Path $file) {
        Write-Host "API exists: $file"
    } else {
        Write-Warning "API missing: $file"
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host "REPAIR COMPLETE"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backup:"
Write-Host $backup
Write-Host ""
Write-Host "Now run:"
Write-Host "  npx tsc --noEmit"
Write-Host ""