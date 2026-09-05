import { NextResponse } from "next/server";

import {
  fuseClinicalAndImaging,
} from "@/lib/lateFusion";


// ============================================================
// CONAN LATE-FUSION API
// ============================================================
//
// MODEL 3 — COMBINED MULTIMODAL RISK MODEL
//
// Inputs:
//   1. Continuous clinical risk probability
//   2. Continuous imaging risk probability
//
// Fusion:
//   P_COMBINED
//      = wC(P_CLINICAL)
//      + wI(P_IMAGING)
//
// Current baseline weights:
//   Clinical = 50%
//   Imaging  = 50%
//
// ============================================================


export async function POST(
  request: Request
) {

  try {

    // ========================================================
    // READ REQUEST BODY
    // ========================================================

    const body =
      await request.json();


    // ========================================================
    // VALIDATE REQUEST BODY
    // ========================================================

    if (
      !body ||
      typeof body !== "object"
    ) {

      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid late-fusion request body.",
        },
        {
          status: 400,
        }
      );
    }


    // ========================================================
    // GET CLINICAL PROBABILITY
    // ========================================================
    //
    // The clinical model must provide a continuous probability
    // between 0 and 1.
    //
    // Accepted formats:
    //
    //   clinicalProbability
    //   clinical_probability
    //   clinical.probability
    //
    // ========================================================

    const clinicalProbability =
      Number(
        body.clinicalProbability ??
        body.clinical_probability ??
        (
          body.clinical &&
          typeof body.clinical === "object"
            ? body.clinical.probability
            : undefined
        )
      );


    // ========================================================
    // GET IMAGING PROBABILITY
    // ========================================================
    //
    // The imaging probability comes directly from the
    // ResNet-50 imaging API.
    //
    // Accepted formats:
    //
    //   imagingProbability
    //   imaging_probability
    //   imaging.probability
    //   probability
    //
    // ========================================================

    const imagingProbability =
      Number(
        body.imagingProbability ??
        body.imaging_probability ??
        (
          body.imaging &&
          typeof body.imaging === "object"
            ? body.imaging.probability
            : undefined
        ) ??
        body.probability
      );


    // ========================================================
    // VALIDATE CLINICAL PROBABILITY
    // ========================================================

    if (
      !Number.isFinite(
        clinicalProbability
      ) ||
      clinicalProbability < 0 ||
      clinicalProbability > 1
    ) {

      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid clinical probability. " +
            "Clinical probability must be between 0 and 1.",
        },
        {
          status: 400,
        }
      );
    }


    // ========================================================
    // VALIDATE IMAGING PROBABILITY
    // ========================================================

    if (
      !Number.isFinite(
        imagingProbability
      ) ||
      imagingProbability < 0 ||
      imagingProbability > 1
    ) {

      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid imaging probability. " +
            "Imaging probability must be between 0 and 1.",
        },
        {
          status: 400,
        }
      );
    }


    // ========================================================
    // PERFORM CONTINUOUS LATE FUSION
    // ========================================================

    const result =
      fuseClinicalAndImaging(
        clinicalProbability,
        imagingProbability
      );


    // ========================================================
    // RETURN RESULT
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        model:
          "CONAN Late-Fusion Multimodal Risk Model",

        clinicalProbability:
          result.clinicalProbability,

        imagingProbability:
          result.imagingProbability,

        combinedProbability:
          result.combinedProbability,

        combinedProbabilityPercent:
          result.combinedProbabilityPercent,

        imagingRiskLevel:
          result.imagingRiskLevel,

        riskLevel:
          result.riskLevel,

        weights:
          result.weights,

        validationStatus:
          result.validationStatus,
      },
      {
        status: 200,
      }
    );
  }

  catch (error) {

    console.error(
      "[CONAN late fusion] Error:",
      error
    );


    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Late-fusion prediction failed.",
      },
      {
        status: 500,
      }
    );
  }
}