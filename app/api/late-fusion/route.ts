import { NextResponse } from "next/server";

import {
  fuseClinicalAndImaging,
} from "@/lib/lateFusion";


// ============================================================
// CONAN LATE-FUSION API
// ============================================================

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

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

    const clinical =
      body.clinical;

    if (
      !clinical ||
      typeof clinical !== "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Clinical probabilities are required.",
        },
        {
          status: 400,
        }
      );
    }

    const clinicalLow = Number(
      clinical.low ??
      clinical.P_LOW ??
      clinical.p_low
    );

    const clinicalModerate = Number(
      clinical.moderate ??
      clinical.P_MODERATE ??
      clinical.p_moderate
    );

    const clinicalHigh = Number(
      clinical.high ??
      clinical.P_HIGH ??
      clinical.p_high
    );

    const imagingProbability =
      Number(
        body.imagingProbability ??
        body.imaging_probability ??
        body.probability
      );

    if (
      !Number.isFinite(
        clinicalLow
      ) ||
      !Number.isFinite(
        clinicalModerate
      ) ||
      !Number.isFinite(
        clinicalHigh
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid clinical probabilities.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        imagingProbability
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid imaging probability.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      fuseClinicalAndImaging(
        {
          low: clinicalLow,
          moderate: clinicalModerate,
          high: clinicalHigh,
        },
        imagingProbability
      );

    return NextResponse.json(
      {
        success: true,

        model:
          "CONAN Late-Fusion Multimodal Risk Model",

        ...result,
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