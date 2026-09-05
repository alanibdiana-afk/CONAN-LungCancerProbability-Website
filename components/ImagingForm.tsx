"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useApp } from "@/lib/context";
import type { PredictionResult } from "@/lib/types";

import {
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  Shield,
  Upload,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

// ============================================================
// CONAN IMAGING MODEL 2
// ============================================================
//
// ResNet-50 imaging model
//
// Risk thresholds:
//
//   < 5%          LOW
//   5% - 65%      MODERATE
//   > 65%         HIGH
//
// The imaging model is hosted on Render through the
// Next.js /api/imaging-risk route.
//
// IMPORTANT:
// The Grad-CAM heatmap can be several MB when returned as
// Base64. It MUST NOT be stored in sessionStorage because
// browser sessionStorage has a small storage quota.
//
// Therefore:
//
//   Small result data -> sessionStorage
//   Large Grad-CAM   -> IndexedDB
//
// This keeps the Render connection and Combined Assessment
// unchanged.
// ============================================================

const LOW_THRESHOLD = 0.05;
const HIGH_THRESHOLD = 0.65;

// ============================================================
// INDEXEDDB CONFIGURATION
// ============================================================

const CONAN_DB_NAME = "conan-storage";
const CONAN_DB_VERSION = 1;
const CONAN_STORE_NAME = "imaging-results";
const CONAN_GRADCAM_KEY = "latest-gradcam";

// ============================================================
// TYPES
// ============================================================

type ImagingRiskLevel =
  | "low"
  | "moderate"
  | "high";

type ImagingModelFinding = {
  type?: string;
  label?: string;
  confidence?: number;
  attention_region?: string;
  attention_concentration?: number;
  attention_concentration_percent?: number;
  description?: string;
  clinical_interpretation?: string;
};

type ImagingAttentionRegion = {
  region_name?: string;
  concentration?: number;
  centroid_x?: number;
  centroid_y?: number;

  bounding_box?: {
    x_min?: number;
    y_min?: number;
    x_max?: number;
    y_max?: number;
  };
};

type ImagingExplainability = {
  method?: string;

  // This is the large Base64 image returned by Render.
  heatmap?: string;

  attention_region?: ImagingAttentionRegion;

  interpretation?: string;

  warning?: string;
};

type ImagingApiResponse = {
  success?: boolean;

  input_valid?: boolean;

  error_type?: string;

  message?: string;

  error?: string;

  detail?: string;

  probability?: number;

  probability_percent?: number;

  risk_level?: ImagingRiskLevel;

  model_finding?: ImagingModelFinding;

  explainability?: ImagingExplainability;
};

// ============================================================
// INDEXEDDB — OPEN DATABASE
// ============================================================

function openConanDatabase(): Promise<IDBDatabase> {

  return new Promise(
    (
      resolve,
      reject,
    ) => {

      if (
        typeof window ===
        "undefined"
      ) {

        reject(
          new Error(
            "IndexedDB is unavailable during server rendering.",
          ),
        );

        return;
      }


      if (
        !("indexedDB" in window)
      ) {

        reject(
          new Error(
            "IndexedDB is not supported by this browser.",
          ),
        );

        return;
      }


      const request =
        window.indexedDB.open(
          CONAN_DB_NAME,
          CONAN_DB_VERSION,
        );


      request.onupgradeneeded =
        () => {

          const db =
            request.result;


          if (
            !db.objectStoreNames.contains(
              CONAN_STORE_NAME,
            )
          ) {

            db.createObjectStore(
              CONAN_STORE_NAME,
            );
          }
        };


      request.onsuccess =
        () => {

          resolve(
            request.result,
          );
        };


      request.onerror =
        () => {

          reject(
            request.error ??
              new Error(
                "Unable to open CONAN browser storage.",
              ),
          );
        };
    },
  );
}

// ============================================================
// INDEXEDDB — SAVE GRAD-CAM
// ============================================================

async function saveGradCam(
  heatmap: string,
): Promise<void> {

  if (
    !heatmap
  ) {

    return;
  }


  const db =
    await openConanDatabase();


  return new Promise(
    (
      resolve,
      reject,
    ) => {

      const transaction =
        db.transaction(
          CONAN_STORE_NAME,
          "readwrite",
        );


      const store =
        transaction.objectStore(
          CONAN_STORE_NAME,
        );


      store.put(
        heatmap,
        CONAN_GRADCAM_KEY,
      );


      transaction.oncomplete =
        () => {

          db.close();

          resolve();
        };


      transaction.onerror =
        () => {

          db.close();

          reject(
            transaction.error ??
              new Error(
                "Unable to save Grad-CAM explanation.",
              ),
          );
        };


      transaction.onabort =
        () => {

          db.close();

          reject(
            transaction.error ??
              new Error(
                "Grad-CAM storage transaction was aborted.",
              ),
          );
        };
    },
  );
}

// ============================================================
// INDEXEDDB — REMOVE PREVIOUS GRAD-CAM
// ============================================================

async function clearStoredGradCam(): Promise<void> {

  try {

    const db =
      await openConanDatabase();


    await new Promise<void>(
      (
        resolve,
        reject,
      ) => {

        const transaction =
          db.transaction(
            CONAN_STORE_NAME,
            "readwrite",
          );


        const store =
          transaction.objectStore(
            CONAN_STORE_NAME,
          );


        store.delete(
          CONAN_GRADCAM_KEY,
        );


        transaction.oncomplete =
          () => {

            db.close();

            resolve();
          };


        transaction.onerror =
          () => {

            db.close();

            reject(
              transaction.error,
            );
          };


        transaction.onabort =
          () => {

            db.close();

            reject(
              transaction.error,
            );
          };
      },
    );

  } catch (
    error
  ) {

    console.warn(
      "[CONAN imaging] Could not clear stored Grad-CAM:",
      error,
    );
  }
}

// ============================================================
// HELPER — RISK CATEGORY
// ============================================================

function classifyImagingRisk(
  probability: number,
): ImagingRiskLevel {

  if (
    probability <
    LOW_THRESHOLD
  ) {

    return "low";
  }


  if (
    probability <=
    HIGH_THRESHOLD
  ) {

    return "moderate";
  }


  return "high";
}

// ============================================================
// HELPER — SAFE JSON RESPONSE
// ============================================================

async function readJson<T>(
  response: Response,
): Promise<T> {

  const text =
    await response.text();


  const contentType =
    response.headers.get(
      "content-type",
    ) || "";


  if (
    !contentType.includes(
      "application/json",
    )
  ) {

    throw new Error(
      text ||
        `Imaging service returned HTTP ${response.status}.`,
    );
  }


  try {

    return JSON.parse(
      text,
    ) as T;

  } catch {

    throw new Error(
      "The imaging service returned invalid JSON.",
    );
  }
}

// ============================================================
// COMPONENT
// ============================================================

export default function ImagingForm() {

  const router =
    useRouter();


  const {
    saveResult,
    user,
  } =
    useApp();

  // ==========================================================
  // FILE
  // ==========================================================

  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null,
    );

  // ==========================================================
  // IMAGE PREVIEW
  // ==========================================================

  const [
    preview,
    setPreview,
  ] =
    useState<string | null>(
      null,
    );

  // ==========================================================
  // DRAG STATE
  // ==========================================================

  const [
    dragging,
    setDragging,
  ] =
    useState(false);

  // ==========================================================
  // ANALYSIS STATE
  // ==========================================================

  const [
    analyzing,
    setAnalyzing,
  ] =
    useState(false);

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  const [
    error,
    setError,
  ] =
    useState("");

  // ==========================================================
  // HANDLE FILE
  // ==========================================================

  const handleFile = (
    selectedFile: File,
  ) => {

    setError("");


    if (
      !selectedFile.type ||
      !selectedFile.type.startsWith(
        "image/",
      )
    ) {

      setError(
        "Please upload a valid chest X-ray image.",
      );

      return;
    }


    if (
      selectedFile.size <= 0
    ) {

      setError(
        "The uploaded image is empty.",
      );

      return;
    }


    setFile(
      selectedFile,
    );


    const reader =
      new FileReader();


    reader.onload =
      event => {

        const value =
          event.target?.result;


        setPreview(
          typeof value ===
            "string"
            ? value
            : null,
        );
      };


    reader.readAsDataURL(
      selectedFile,
    );
  };

  // ==========================================================
  // HANDLE DROP
  // ==========================================================

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {

    event.preventDefault();


    setDragging(
      false,
    );


    const droppedFile =
      event.dataTransfer.files?.[0];


    if (
      droppedFile
    ) {

      handleFile(
        droppedFile,
      );
    }
  };

  // ==========================================================
  // CLEAR FILE
  // ==========================================================

  const clearFile = () => {

    setFile(
      null,
    );


    setPreview(
      null,
    );


    setError("");


    const input =
      document.getElementById(
        "xray-input",
      ) as HTMLInputElement | null;


    if (
      input
    ) {

      input.value = "";
    }
  };

  // ==========================================================
  // ANALYZE CHEST X-RAY
  // ==========================================================

  const handleAnalyze = async () => {

    if (
      !file ||
      analyzing
    ) {

      return;
    }


    setError("");


    setAnalyzing(
      true,
    );


    try {

      // ======================================================
      // 1. PREPARE FILE
      // ======================================================

      const formData =
        new FormData();


      formData.append(
        "file",
        file,
        file.name,
      );


      console.log(
        "[CONAN imaging] Sending X-ray:",
        file.name,
        file.type,
        file.size,
      );

      // ======================================================
      // 2. CALL NEXT.JS IMAGING API
      // ======================================================
      //
      // This remains unchanged.
      //
      // Next.js /api/imaging-risk is still connected to
      // the Render FastAPI imaging model.
      // ======================================================

      const response =
        await fetch(
          "/api/imaging-risk",
          {
            method:
              "POST",

            body:
              formData,

            cache:
              "no-store",
          },
        );


      console.log(
        "[CONAN imaging] API status:",
        response.status,
      );

      // ======================================================
      // 3. READ RESPONSE
      // ======================================================

      const data =
        await readJson<
          ImagingApiResponse
        >(
          response,
        );


      console.log(
        "[CONAN imaging] API response:",
        data,
      );

      // ======================================================
      // 4. HTTP ERROR
      // ======================================================

      if (
        !response.ok
      ) {

        throw new Error(
          data.error ||
            data.detail ||
            data.message ||
            `Imaging request failed with HTTP ${response.status}.`,
        );
      }

      // ======================================================
      // 5. INPUT VALIDATION
      // ======================================================

      if (
        data.error_type ===
          "non_chest_xray" ||
        data.input_valid ===
          false
      ) {

        throw new Error(
          data.message ||
            "The uploaded image does not appear to be a suitable chest X-ray.",
        );
      }

      // ======================================================
      // 6. SUCCESS VALIDATION
      // ======================================================

      if (
        data.success !==
        true
      ) {

        throw new Error(
          data.error ||
            data.message ||
            "The imaging model could not analyze the X-ray.",
        );
      }

      // ======================================================
      // 7. PROBABILITY
      // ======================================================

      const probability =
        Number(
          data.probability,
        );


      if (
        !Number.isFinite(
          probability,
        ) ||
        probability <
          0 ||
        probability >
          1
      ) {

        throw new Error(
          "The imaging model returned an invalid probability.",
        );
      }

      // ======================================================
      // 8. RISK CATEGORY
      // ======================================================

      const riskLevel =
        data.risk_level ??
        classifyImagingRisk(
          probability,
        );

      // ======================================================
      // 9. PERCENTAGE
      // ======================================================

      const probabilityPercent =
        Number(
          (
            probability *
            100
          ).toFixed(2),
        );

      // ======================================================
      // 10. MODEL FINDING
      // ======================================================

      const modelFinding =
        data.model_finding ??
        null;

      // ======================================================
      // 11. EXPLAINABILITY
      // ======================================================

      const explainability =
        data.explainability ??
        null;

      // ======================================================
      // 12. HUMAN-READABLE SUMMARY
      // ======================================================

      let summary =
        riskLevel ===
        "high"

          ? `The chest X-ray imaging model produced a high-risk category with a ${probabilityPercent.toFixed(2)}% model score.`

          : riskLevel ===
              "moderate"

            ? `The chest X-ray imaging model produced a moderate-risk category with a ${probabilityPercent.toFixed(2)}% model score.`

            : `The chest X-ray imaging model produced a low-risk category with a ${probabilityPercent.toFixed(2)}% model score.`;


      if (
        modelFinding?.label
      ) {

        summary +=
          ` ${modelFinding.label}.`;
      }

      // ======================================================
      // 13. IMPACT
      // ======================================================

      const impact:
        | "low"
        | "medium"
        | "high" =

        riskLevel ===
        "high"

          ? "high"

          : riskLevel ===
              "moderate"

            ? "medium"

            : "low";

      // ======================================================
      // 14. SHARED PREDICTION RESULT
      // ======================================================

      const imagingResult:
        PredictionResult = {

        type:
          "imaging",

        riskLevel:
          riskLevel,

        confidence:
          Math.round(
            probabilityPercent,
          ),

        factors: [

          {

            name:
              modelFinding?.label ||
              "Chest X-Ray Imaging Model",

            impact,

            present:
              true,

          },

        ],

        summary:

          summary,

        timestamp:
          new Date(),

      };

      // ======================================================
      // 15. STORE GRAD-CAM IN INDEXEDDB
      // ======================================================
      //
      // THIS IS THE FIX.
      //
      // The heatmap can be several MB as Base64 and therefore
      // must NOT be put inside sessionStorage.
      // ======================================================

      const heatmap =
        explainability?.heatmap;


      await clearStoredGradCam();


      if (
        heatmap
      ) {

        try {

          await saveGradCam(
            heatmap,
          );


          console.log(
            "[CONAN imaging] Grad-CAM saved to IndexedDB.",
          );

        } catch (
          storageError
        ) {

          console.warn(
            "[CONAN imaging] Grad-CAM could not be stored in IndexedDB:",
            storageError,
          );

          // Do NOT fail the complete prediction merely
          // because the optional visualization could not
          // be stored.
        }
      }

      // ======================================================
      // 16. SAVE SMALL IMAGING RESULT TO SESSION STORAGE
      // ======================================================
      //
      // IMPORTANT:
      //
      // Do NOT put explainability.heatmap here.
      //
      // Only the small metadata is stored.
      // ======================================================

      const explainabilityMetadata =
        explainability
          ? {

              method:
                explainability.method,

              attention_region:
                explainability.attention_region,

              interpretation:
                explainability.interpretation,

              warning:
                explainability.warning,

              hasHeatmap:
                Boolean(
                  heatmap,
                ),

            }
          : null;


      const completeImagingResult = {

        probability:
          probability,

        probabilityPercent:
          probabilityPercent,

        riskLevel:
          riskLevel,

        thresholds: {

          low:
            LOW_THRESHOLD,

          high:
            HIGH_THRESHOLD,

        },

        fileName:
          file.name,

        modelFinding:
          modelFinding,

        explainability:
          explainabilityMetadata,

      };


      sessionStorage.setItem(
        "conan_imaging_result",

        JSON.stringify(
          completeImagingResult,
        ),
      );

      // ======================================================
      // 17. SAVE RAW MODEL OUTPUT
      // ======================================================
      //
      // Again, the large heatmap is excluded.
      // ======================================================

      sessionStorage.setItem(
        "conan_imaging_model_output",

        JSON.stringify({

          probability:
            probability,

          probability_percent:
            data.probability_percent ??
            probabilityPercent,

          risk_level:
            riskLevel,

          model_finding:
            modelFinding,

          explainability:
            explainabilityMetadata,

        }),
      );

      // ======================================================
      // 18. SAVE SHARED RESULT
      // ======================================================

      sessionStorage.setItem(
        "conan_result",

        JSON.stringify(
          imagingResult,
        ),
      );

      // ======================================================
      // 19. SAVE TO APP CONTEXT
      // ======================================================

      if (
        user
      ) {

        saveResult(
          imagingResult,
        );
      }

      // ======================================================
      // 20. DEBUG CONFIRMATION
      // ======================================================

      console.log(
        "[CONAN imaging] Saved result:",
        {

          probability,

          probabilityPercent,

          riskLevel,

          modelFinding,

          hasGradCam:
            Boolean(
              heatmap,
            ),

          gradCamStorage:
            heatmap
              ? "IndexedDB"
              : "None",

        },
      );

      // ======================================================
      // 21. GO TO RESULTS
      // ======================================================

      router.push(
        "/results",
      );

    } catch (
      err
    ) {

      console.error(
        "[CONAN imaging] Analysis error:",
        err,
      );


      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze the chest X-ray.",
      );

    } finally {

      setAnalyzing(
        false,
      );
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="space-y-6 animate-fadeIn">

      {/* HEADER */}

      <div className="flex items-center gap-3">

        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">

          <ImageIcon className="w-5 h-5 text-white" />

        </div>


        <div>

          <h1 className="text-xl font-bold text-slate-800">

            Chest X-Ray Analysis

          </h1>


          <p className="text-sm text-slate-500">

            Upload a chest X-ray for AI-assisted
            imaging risk analysis.

          </p>

        </div>

      </div>

      {/* DISCLAIMER */}

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">

        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />


        <p className="text-xs text-amber-800 leading-relaxed">

          <strong>
            Screening tool only.
          </strong>{" "}

          This analysis does not constitute a medical
          diagnosis. Always consult a qualified healthcare
          professional for clinical interpretation.

        </p>

      </div>

      {/* MODEL INFO */}

      <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">

        <p className="text-xs text-purple-800 leading-relaxed">

          <strong>
            CONAN Imaging Model:
          </strong>{" "}

          The chest X-ray is analyzed by the trained
          ResNet-50 imaging model. The model produces an
          imaging probability, a risk category, and a
          visual explanation using Grad-CAM.

        </p>

      </div>

      {/* THRESHOLDS */}

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">

        <p className="text-xs text-slate-600 leading-relaxed">

          <strong className="text-slate-700">

            Imaging risk categories:

          </strong>{" "}

          below 5% = LOW;

          {" "}

          5% through 65% = MODERATE;

          {" "}

          above 65% = HIGH.

        </p>

      </div>

      {/* UPLOAD */}

      <div className="bg-white border border-slate-200 rounded-2xl p-5">

        <div className="flex items-center gap-2 mb-4">

          <Shield className="w-4 h-4 text-green-600" />


          <h2 className="text-sm font-semibold text-slate-700">

            Secure Image Upload

          </h2>


          <span className="ml-auto text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">

            Ready

          </span>

        </div>


        {!preview ? (

          <div

            onDrop={
              handleDrop
            }

            onDragOver={
              event => {

                event.preventDefault();

                setDragging(
                  true,
                );

              }
            }

            onDragLeave={() =>
              setDragging(
                false,
              )
            }

            onClick={() =>
              document
                .getElementById(
                  "xray-input",
                )
                ?.click()
            }

            className={cn(

              "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",

              dragging

                ? "border-purple-500 bg-purple-50"

                : "border-slate-300 hover:border-purple-400 hover:bg-purple-50/50",

            )}
          >

            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />


            <p className="text-sm font-semibold text-slate-700">

              Drop your chest X-ray here

            </p>


            <p className="text-xs text-slate-500 mt-1 mb-4">

              Supports JPG and PNG images

            </p>


            <button

              type="button"

              onClick={
                event => {

                  event.stopPropagation();

                  document
                    .getElementById(
                      "xray-input",
                    )
                    ?.click();

                }
              }

              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"

            >

              Browse Files

            </button>


            <input

              id="xray-input"

              type="file"

              accept="image/*"

              className="hidden"

              onChange={
                event => {

                  const selectedFile =
                    event.target.files?.[0];


                  if (
                    selectedFile
                  ) {

                    handleFile(
                      selectedFile,
                    );

                  }

                }
              }

            />

          </div>

        ) : (

          <div className="space-y-4">

            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900">

              <img

                src={
                  preview
                }

                alt="Uploaded chest X-ray"

                className="w-full max-h-96 object-contain mx-auto"

              />


              <button

                type="button"

                onClick={
                  clearFile
                }

                className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"

                aria-label="Remove X-ray"

              >

                <X className="w-4 h-4" />

              </button>

            </div>


            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">

              <ImageIcon className="w-5 h-5 text-purple-600" />


              <div className="flex-1 min-w-0">

                <p className="text-sm font-medium text-slate-700 truncate">

                  {
                    file?.name
                  }

                </p>


                <p className="text-xs text-slate-500">

                  {
                    file
                      ? `${(
                          file.size /
                          1024
                        ).toFixed(1)} KB`

                      : ""
                  }

                </p>

              </div>


              <span className="text-xs text-green-600 font-semibold">

                Ready

              </span>

            </div>

          </div>

        )}

      </div>

      {/* ERROR */}

      {error && (

        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">

          <p className="text-sm text-red-700">

            <strong>
              Error:
            </strong>{" "}

            {
              error
            }

          </p>

        </div>

      )}

      {/* ANALYZE */}

      <button

        type="button"

        onClick={
          handleAnalyze
        }

        disabled={
          !file ||
          analyzing
        }

        className={cn(

          "w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-colors",

          file &&
          !analyzing

            ? "bg-purple-600 hover:bg-purple-700 text-white"

            : "bg-slate-200 text-slate-400 cursor-not-allowed",

        )}

      >

        {analyzing ? (

          <>

            <Loader2 className="w-4 h-4 animate-spin" />

            Analyzing Chest X-Ray...

          </>

        ) : (

          <>

            Analyze Chest X-Ray

            <ChevronRight className="w-4 h-4" />

          </>

        )}

      </button>

      {/* RESULT INFORMATION */}

      <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">

        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />


        <p className="text-xs text-green-800 leading-relaxed">

          After analysis, CONAN will take you to the Results
          page where the imaging probability, risk category,
          model-highlighted finding, and Grad-CAM visual
          explanation are shown.

        </p>

      </div>

    </div>
  );
}