import { NextResponse } from "next/server";

import {
  CLINICAL_FEATURES,
  predictClinicalRisk,
  type ClinicalPatient,
} from "@/lib/clinicalRisk";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const patient = body as Partial<ClinicalPatient>;

    const missingFeatures = CLINICAL_FEATURES.filter(
      (feature) =>
        patient[feature] === undefined ||
        patient[feature] === null,
    );

    if (missingFeatures.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing clinical variables.",
          missingFeatures,
        },
        { status: 400 },
      );
    }

    const result = predictClinicalRisk(
      patient as ClinicalPatient,
    );

    return NextResponse.json({
      success: true,
      model: "CONAN Clinical Multinomial Logistic Risk Model",
      ...result,
    });
  } catch (error) {
    console.error(
      "Clinical risk prediction error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Clinical prediction failed.",
      },
      { status: 500 },
    );
  }
}