from pathlib import Path
import base64
import io

import cv2
import numpy as np
import torch
import torch.nn as nn

from PIL import Image
from torchvision import models, transforms

from fastapi import FastAPI, File, HTTPException, UploadFile


# ============================================================
# CONAN CHEST X-RAY IMAGING RISK API
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = (
    BASE_DIR
    / "models"
    / "conan_resnet50_lung_cancer.pt"
)

DEVICE = torch.device("cpu")

IMAGE_SIZE = 224

MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]

LOW_THRESHOLD = 0.05
HIGH_THRESHOLD = 0.65


# ============================================================
# RISK CLASSIFICATION
# ============================================================

def probability_to_risk(
    probability: float,
) -> str:

    if probability < LOW_THRESHOLD:
        return "low"

    if probability <= HIGH_THRESHOLD:
        return "moderate"

    return "high"


# ============================================================
# MODEL
# ============================================================

def create_model():

    model = models.resnet50(
        weights=None,
    )

    num_features = model.fc.in_features

    model.fc = nn.Sequential(
        nn.Dropout(
            p=0.40,
        ),
        nn.Linear(
            num_features,
            1,
        ),
    )

    return model


# ============================================================
# VERIFY CHECKPOINT
# ============================================================

if not MODEL_PATH.exists():

    raise FileNotFoundError(
        "Trained imaging model not found.\n"
        f"Expected location:\n{MODEL_PATH}"
    )


# ============================================================
# LOAD CHECKPOINT
# ============================================================

checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE,
    weights_only=False,
)

model = create_model()

model.load_state_dict(
    checkpoint["model_state_dict"]
)

model = model.to(
    DEVICE
)

model.eval()


# ============================================================
# TRANSFORM
# ============================================================

transform = transforms.Compose(
    [
        transforms.Resize(
            (
                IMAGE_SIZE,
                IMAGE_SIZE,
            )
        ),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=MEAN,
            std=STD,
        ),
    ]
)


# ============================================================
# GRAD-CAM
# ============================================================

class GradCAM:

    def __init__(
        self,
        model: nn.Module,
    ):

        self.model = model

        self.activations = None

        self.gradients = None

        self.target_layer = (
            self.model.layer4[-1]
        )

        self.forward_handle = (
            self.target_layer.register_forward_hook(
                self._forward_hook
            )
        )

        self.backward_handle = (
            self.target_layer.register_full_backward_hook(
                self._backward_hook
            )
        )


    def _forward_hook(
        self,
        module,
        inputs,
        output,
    ):

        self.activations = (
            output.detach()
        )


    def _backward_hook(
        self,
        module,
        grad_input,
        grad_output,
    ):

        if (
            grad_output
            and grad_output[0] is not None
        ):

            self.gradients = (
                grad_output[0].detach()
            )


    def generate(
        self,
        tensor: torch.Tensor,
    ):

        self.activations = None

        self.gradients = None

        self.model.zero_grad(
            set_to_none=True
        )

        logits = self.model(
            tensor
        )

        score = logits[
            0,
            0
        ]

        score.backward()

        if (
            self.activations is None
            or self.gradients is None
        ):

            return None

        activations = self.activations

        gradients = self.gradients

        weights = gradients.mean(
            dim=(2, 3),
            keepdim=True,
        )

        cam = (
            weights
            * activations
        ).sum(
            dim=1
        )

        cam = torch.relu(
            cam
        )

        cam = cam[
            0
        ].cpu().numpy()

        cam_min = float(
            cam.min()
        )

        cam_max = float(
            cam.max()
        )

        if (
            cam_max - cam_min
        ) <= 1e-8:

            return None

        cam = (
            cam - cam_min
        ) / (
            cam_max - cam_min
        )

        return cam


    def close(self):

        self.forward_handle.remove()

        self.backward_handle.remove()


# ============================================================
# DETERMINE ATTENTION REGION
# ============================================================

def determine_attention_region(
    cam,
):

    if (
        cam is None
        or cam.size == 0
    ):

        return {
            "region_name":
                "No distinct image region",

            "concentration":
                0.0,

            "centroid_x":
                None,

            "centroid_y":
                None,

            "bounding_box":
                None,
        }


    cam = np.asarray(
        cam,
        dtype=np.float32,
    )


    cam_min = float(
        cam.min()
    )

    cam_max = float(
        cam.max()
    )


    if (
        cam_max - cam_min
    ) <= 1e-8:

        return {
            "region_name":
                "No distinct image region",

            "concentration":
                0.0,

            "centroid_x":
                None,

            "centroid_y":
                None,

            "bounding_box":
                None,
        }


    cam = (
        cam - cam_min
    ) / (
        cam_max - cam_min
    )


    # --------------------------------------------------------
    # Keep the stronger activation areas.
    # --------------------------------------------------------

    threshold = float(
        np.percentile(
            cam,
            60,
        )
    )


    mask = (
        cam >= threshold
    )


    ys, xs = np.where(
        mask
    )


    if len(xs) == 0:

        return {
            "region_name":
                "No distinct image region",

            "concentration":
                0.0,

            "centroid_x":
                None,

            "centroid_y":
                None,

            "bounding_box":
                None,
        }


    # --------------------------------------------------------
    # Weighted centroid.
    # --------------------------------------------------------

    weights = cam[
        mask
    ]


    weight_sum = float(
        weights.sum()
    )


    if weight_sum > 1e-8:

        centroid_x = float(
            (
                xs *
                weights
            ).sum()
            /
            weight_sum
        )

        centroid_y = float(
            (
                ys *
                weights
            ).sum()
            /
            weight_sum
        )

    else:

        centroid_x = float(
            xs.mean()
        )

        centroid_y = float(
            ys.mean()
        )


    height, width = cam.shape


    normalized_x = (
        centroid_x
        /
        max(
            width - 1,
            1,
        )
    )


    normalized_y = (
        centroid_y
        /
        max(
            height - 1,
            1,
        )
    )


    # --------------------------------------------------------
    # Horizontal location.
    # --------------------------------------------------------

    if normalized_x < 0.33:

        horizontal = "left"

    elif normalized_x > 0.67:

        horizontal = "right"

    else:

        horizontal = "central"


    # --------------------------------------------------------
    # Vertical location.
    # --------------------------------------------------------

    if normalized_y < 0.33:

        vertical = "upper"

    elif normalized_y > 0.67:

        vertical = "lower"

    else:

        vertical = "middle"


    # --------------------------------------------------------
    # Human-readable image region.
    # --------------------------------------------------------

    if horizontal == "central":

        if vertical == "upper":

            region_name = (
                "upper-central image region"
            )

        elif vertical == "middle":

            region_name = (
                "central image region"
            )

        else:

            region_name = (
                "lower-central image region"
            )

    else:

        region_name = (
            f"{vertical}-{horizontal} "
            "image region"
        )


    # --------------------------------------------------------
    # Bounding box.
    # --------------------------------------------------------

    x_min = int(
        xs.min()
    )

    x_max = int(
        xs.max()
    )

    y_min = int(
        ys.min()
    )

    y_max = int(
        ys.max()
    )


    # --------------------------------------------------------
    # Concentration of strongest activation.
    # --------------------------------------------------------

    high_activation_mask = (
        cam >= 0.75
    )


    total_activation = float(
        cam.sum()
    )


    focused_activation = float(
        cam[
            high_activation_mask
        ].sum()
    )


    if total_activation > 1e-8:

        concentration = (
            focused_activation
            /
            total_activation
        )

    else:

        concentration = 0.0


    return {

        "region_name":
            region_name,

        "concentration":
            round(
                concentration,
                4,
            ),

        "centroid_x":
            round(
                normalized_x,
                4,
            ),

        "centroid_y":
            round(
                normalized_y,
                4,
            ),

        "bounding_box": {

            "x_min":
                x_min,

            "y_min":
                y_min,

            "x_max":
                x_max,

            "y_max":
                y_max,
        },
    }


# ============================================================
# GENERATE GRAD-CAM
# ============================================================

def generate_gradcam(
    original_image: Image.Image,
    tensor: torch.Tensor,
):

    cam_engine = GradCAM(
        model
    )

    try:

        cam = (
            cam_engine.generate(
                tensor
            )
        )


        attention = (
            determine_attention_region(
                cam
            )
        )


        if cam is None:

            return {

                "heatmap":
                    None,

                "attention":
                    attention,
            }


        original_rgb = (
            original_image.convert(
                "RGB"
            )
        )


        original_array = np.asarray(
            original_rgb
        )


        height, width = (
            original_array.shape[:2]
        )


        cam_resized = cv2.resize(
            cam,
            (
                width,
                height,
            ),
            interpolation=cv2.INTER_LINEAR,
        )


        cam_uint8 = (
            np.clip(
                cam_resized * 255.0,
                0,
                255,
            )
            .astype(
                np.uint8
            )
        )


        heatmap = cv2.applyColorMap(
            cam_uint8,
            cv2.COLORMAP_JET,
        )


        heatmap = cv2.cvtColor(
            heatmap,
            cv2.COLOR_BGR2RGB,
        )


        original_float = (
            original_array.astype(
                np.float32
            )
        )


        heatmap_float = (
            heatmap.astype(
                np.float32
            )
        )


        overlay = (
            0.55 *
            original_float
            +
            0.45 *
            heatmap_float
        )


        overlay = (
            np.clip(
                overlay,
                0,
                255,
            )
            .astype(
                np.uint8
            )
        )


        combined = np.concatenate(
            [
                original_array,
                overlay,
            ],
            axis=1,
        )


        output_image = Image.fromarray(
            combined
        )


        buffer = io.BytesIO()


        output_image.save(
            buffer,
            format="PNG",
        )


        encoded = base64.b64encode(
            buffer.getvalue()
        ).decode(
            "utf-8"
        )


        return {

            "heatmap":
                (
                    "data:image/png;base64,"
                    + encoded
                ),

            "attention":
                attention,
        }


    except Exception as exc:

        print(
            "[CONAN Grad-CAM] Generation failed:",
            exc,
        )


        return {

            "heatmap":
                None,

            "attention":
                determine_attention_region(
                    None
                ),
        }


    finally:

        cam_engine.close()


# ============================================================
# BUILD DYNAMIC MODEL FINDING
# ============================================================

def build_model_finding(
    probability: float,
    risk_level: str,
    attention: dict,
):

    region_name = (
        attention.get(
            "region_name"
        )
        or
        "image region"
    )


    concentration = float(
        attention.get(
            "concentration",
            0.0,
        )
        or
        0.0
    )


    concentration_percent = (
        concentration *
        100.0
    )


    # --------------------------------------------------------
    # LOW
    # --------------------------------------------------------

    if risk_level == "low":

        label = (
            "No strong focal model-attention region"
        )


        description = (
            "The model did not show a strongly "
            "concentrated visual attention pattern. "
            "The imaging probability remained below "
            "the CONAN low-risk threshold."
        )


    # --------------------------------------------------------
    # MODERATE
    # --------------------------------------------------------

    elif risk_level == "moderate":

        label = (
            "Model attention concentrated in "
            f"the {region_name}"
        )


        description = (
            "The model placed increased attention on "
            f"the {region_name} while generating the "
            f"{probability * 100.0:.2f}% imaging probability."
        )


    # --------------------------------------------------------
    # HIGH
    # --------------------------------------------------------

    else:

        label = (
            "Strong model attention in "
            f"the {region_name}"
        )


        description = (
            "The strongest model attention was "
            f"concentrated in the {region_name}. "
            "These visual features contributed to the "
            f"{probability * 100.0:.2f}% imaging probability "
            "and the resulting CONAN high-risk category."
        )


    return {

        "type":
            "model_attention",

        "label":
            label,

        "confidence":
            round(
                probability,
                4,
            ),

        "attention_region":
            region_name,

        "attention_concentration":
            round(
                concentration,
                4,
            ),

        "attention_concentration_percent":
            round(
                concentration_percent,
                2,
            ),

        "description":
            description,

        "clinical_interpretation":
            (
                "This is a model-attention finding. "
                "It indicates where the classifier focused "
                "when generating its prediction. It does "
                "not independently establish a nodule, "
                "mass, opacity, lesion, or cancer."
            ),
    }


# ============================================================
# MAIN IMAGE PREDICTION
# ============================================================

def predict_image(
    image_bytes: bytes,
) -> dict:

    # --------------------------------------------------------
    # OPEN
    # --------------------------------------------------------

    try:

        image = Image.open(
            io.BytesIO(
                image_bytes
            )
        ).convert(
            "RGB"
        )

    except Exception as exc:

        raise ValueError(
            "The uploaded file is not a valid readable image."
        ) from exc


    # --------------------------------------------------------
    # PREPROCESS
    # --------------------------------------------------------

    tensor = transform(
        image
    ).unsqueeze(
        0
    ).to(
        DEVICE
    )


    # --------------------------------------------------------
    # CLASSIFICATION
    # --------------------------------------------------------

    model.zero_grad(
        set_to_none=True
    )


    logits = model(
        tensor
    )


    probability = (
        torch.sigmoid(
            logits
        )
        .item()
    )


    probability = max(
        0.0,
        min(
            1.0,
            float(
                probability
            ),
        ),
    )


    # --------------------------------------------------------
    # RISK
    # --------------------------------------------------------

    risk_level = (
        probability_to_risk(
            probability
        )
    )


    probability_percent = (
        probability * 100.0
    )


    # --------------------------------------------------------
    # GRAD-CAM
    # --------------------------------------------------------

    gradcam_result = (
        generate_gradcam(
            image,
            tensor,
        )
    )


    heatmap = (
        gradcam_result.get(
            "heatmap"
        )
    )


    attention = (
        gradcam_result.get(
            "attention",
            {},
        )
    )


    # --------------------------------------------------------
    # DYNAMIC FINDING
    # --------------------------------------------------------

    model_finding = (
        build_model_finding(
            probability=
                probability,

            risk_level=
                risk_level,

            attention=
                attention,
        )
    )


    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {

        "success":
            True,

        "input_valid":
            True,

        "probability":
            probability,

        "probability_percent":
            round(
                probability_percent,
                2,
            ),

        "risk_level":
            risk_level,

        "risk_thresholds": {

            "low":
                LOW_THRESHOLD,

            "high":
                HIGH_THRESHOLD,
        },

        "model_finding":
            model_finding,

        "explainability": {

            "method":
                "Grad-CAM",

            "heatmap":
                heatmap,

            "attention_region":
                attention,

            "interpretation":
                (
                    "Highlighted regions indicate image "
                    "areas that contributed more strongly "
                    "to the model prediction."
                ),

            "warning":
                (
                    "Grad-CAM is a model explanation. "
                    "It does not independently confirm a "
                    "nodule, mass, opacity, lesion, or cancer."
                ),
        },

        "message":
            "Image processed successfully.",
    }


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="CONAN Imaging Risk API",

    description=(
        "CONAN imaging risk service using "
        "a fine-tuned ResNet-50 with "
        "Grad-CAM visual explanation."
    ),
)


# ============================================================
# HEALTH
# ============================================================

@app.get(
    "/health"
)
def health():

    return {

        "status":
            "ok",

        "model":
            "ResNet-50",

        "task":
            "lung cancer imaging risk",

        "input_gate":
            "disabled",

        "explainability":
            "Grad-CAM",

        "finding_detector":
            (
                "not available; "
                "dynamic model-attention explanation used"
            ),

        "risk_thresholds": {

            "low":
                "< 5%",

            "moderate":
                "5% to 65%",

            "high":
                "> 65%",
        },
    }


# ============================================================
# PREDICTION ENDPOINT
# ============================================================

@app.post(
    "/predict"
)
async def predict(
    file: UploadFile = File(...),
):

    # --------------------------------------------------------
    # MIME CHECK
    # --------------------------------------------------------

    if not file.content_type:

        raise HTTPException(
            status_code=400,
            detail="Missing file type.",
        )


    if not file.content_type.startswith(
        "image/"
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload an image file.",
        )


    # --------------------------------------------------------
    # READ
    # --------------------------------------------------------

    image_bytes = await file.read()


    if not image_bytes:

        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty.",
        )


    # --------------------------------------------------------
    # PREDICT
    # --------------------------------------------------------

    try:

        result = predict_image(
            image_bytes
        )


        return result


    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


    except Exception as exc:

        print(
            "[CONAN imaging] Prediction error:",
            exc,
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "The imaging model could not "
                "process the uploaded image."
            ),
        )