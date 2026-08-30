import { NextResponse } from "next/server";


// ============================================================
// CONAN — IMAGING API PROXY
// ============================================================
//
// Browser:
//
//   /imaging
//       ↓
//   /api/imaging-risk
//       ↓
//   FastAPI :8000/predict
//       ↓
//   ResNet-50
//
// IMPORTANT:
// This route intentionally returns the COMPLETE FastAPI
// response so that the frontend receives:
//
//   probability
//   probability_percent
//   risk_level
//   model_finding
//   explainability
//
// Do NOT reconstruct the response manually here.
// ============================================================


// ============================================================
// FASTAPI URL
// ============================================================

const IMAGING_API_URL =
  process.env.IMAGING_API_URL ||
  "http://127.0.0.1:8000/predict";


// ============================================================
// POST
// ============================================================

export async function POST(
  request: Request,
) {

  try {

    // --------------------------------------------------------
    // RECEIVE FORM DATA FROM BROWSER
    // --------------------------------------------------------

    const incomingFormData =
      await request.formData();


    const incomingFile =
      incomingFormData.get(
        "file",
      );


    // --------------------------------------------------------
    // VERIFY FILE
    // --------------------------------------------------------

    if (
      !incomingFile ||
      !(incomingFile instanceof File)
    ) {

      return NextResponse.json(
        {
          success:
            false,

          error:
            "No image file was provided.",
        },
        {
          status:
            400,
        },
      );
    }


    if (
      incomingFile.size <= 0
    ) {

      return NextResponse.json(
        {
          success:
            false,

          error:
            "The uploaded image is empty.",
        },
        {
          status:
            400,
        },
      );
    }


    // --------------------------------------------------------
    // BUILD FORM DATA FOR FASTAPI
    // --------------------------------------------------------

    const outgoingFormData =
      new FormData();


    outgoingFormData.append(
      "file",
      incomingFile,
      incomingFile.name,
    );


    // --------------------------------------------------------
    // CALL FASTAPI MODEL 2
    // --------------------------------------------------------

    console.log(
      "[CONAN /api/imaging-risk] Sending image to:",
      IMAGING_API_URL,
    );


    const response =
      await fetch(
        IMAGING_API_URL,
        {
          method:
            "POST",

          body:
            outgoingFormData,

          cache:
            "no-store",
        },
      );


    // --------------------------------------------------------
    // READ FASTAPI RESPONSE
    // --------------------------------------------------------

    const responseText =
      await response.text();


    console.log(
      "[CONAN /api/imaging-risk] FastAPI status:",
      response.status,
    );


    console.log(
      "[CONAN /api/imaging-risk] FastAPI response:",
      responseText.substring(
        0,
        500,
      ),
    );


    // --------------------------------------------------------
    // INVALID RESPONSE
    // --------------------------------------------------------

    if (
      !responseText
    ) {

      return NextResponse.json(
        {
          success:
            false,

          error:
            "The imaging service returned an empty response.",
        },
        {
          status:
            502,
        },
      );
    }


    // --------------------------------------------------------
    // PARSE JSON
    // --------------------------------------------------------

    let data: Record<
      string,
      unknown
    >;


    try {

      data =
        JSON.parse(
          responseText,
        ) as Record<
          string,
          unknown
        >;

    } catch {

      return NextResponse.json(
        {
          success:
            false,

          error:
            "The imaging service returned invalid JSON.",

          raw:
            responseText.substring(
              0,
              500,
            ),
        },
        {
          status:
            502,
        },
      );
    }


    // --------------------------------------------------------
    // LOG IMPORTANT MODEL FIELDS
    // --------------------------------------------------------

    console.log(
      "[CONAN /api/imaging-risk] probability:",
      data.probability,
    );


    console.log(
      "[CONAN /api/imaging-risk] risk_level:",
      data.risk_level,
    );


    console.log(
      "[CONAN /api/imaging-risk] model_finding:",
      data.model_finding,
    );


    console.log(
      "[CONAN /api/imaging-risk] has_gradcam:",
      Boolean(
        (
          data.explainability as
            | {
                heatmap?: unknown;
              }
            | undefined
        )?.heatmap,
      ),
    );


    // --------------------------------------------------------
    // RETURN COMPLETE FASTAPI RESPONSE
    // --------------------------------------------------------
    //
    // IMPORTANT:
    //
    // We return ...data instead of selecting only:
    //
    //   probability
    //   risk_level
    //
    // This preserves:
    //
    //   model_finding
    //   explainability
    //   Grad-CAM
    //   attention region
    //
    // --------------------------------------------------------

    return NextResponse.json(
      data,
      {
        status:
          response.status,
      },
    );


  } catch (
    error
  ) {

    console.error(
      "[CONAN /api/imaging-risk] Proxy error:",
      error,
    );


    return NextResponse.json(
      {
        success:
          false,

        error:
          "Unable to connect to the CONAN imaging model.",

        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status:
          502,
      },
    );
  }
}