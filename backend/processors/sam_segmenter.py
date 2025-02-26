import os
import time
import torch
import urllib.request
import numpy as np
import cv2
from PIL import Image

from segment_anything import sam_model_registry, SamAutomaticMaskGenerator, SamPredictor

class SAMSegmenter:
    def __init__(self, model_path="backend/sam_vit_h_4b8939.pth", cache_dir="cache"):
        """Initialize the SAM model for automatic segmentation and cache masks."""
        self.device = "cpu"
        if torch.cuda.is_available():
            self.device = "cuda"

        torch.set_default_device(self.device)
        print("Set default torch device to " + self.device)
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)

        # Download model if missing
        if not os.path.exists(model_path):
            print("SAM model not found. Downloading...")
            self.download_sam_model(model_path)

        # Load the model
        self.model = sam_model_registry["vit_h"](checkpoint=model_path).to(self.device)
        self.mask_generator = SamAutomaticMaskGenerator(
            model=self.model,
            points_per_side=32,
            pred_iou_thresh=0.86,
            stability_score_thresh=0.92,
            crop_n_layers=1,
            crop_n_points_downscale_factor=2,
            min_mask_region_area=100  # Requires open-cv for post-processing
        )

        # Also initialize a predictor for interactive segmentation
        sam_predictor_model = sam_model_registry["vit_h"](checkpoint=model_path).to(self.device)
        sam_predictor_model.to(device=self.device)
        self.predictor = SamPredictor(sam_predictor_model)

    @staticmethod
    def download_sam_model(model_path):
        url = "https://dl.fbaipublicfiles.com/segment-anything/sam_vit_h_4b8939.pth"
        urllib.request.urlretrieve(url, model_path)
        print(f"Download complete: {model_path}")

    @staticmethod
    def contour_to_path_str(contour):
        """Convert a single contour (Nx1x2 array) into an SVG path string."""
        pts = contour.squeeze()
        if pts.ndim == 1:  # Only one point in the contour
            pts = [pts.tolist()]
        else:
            pts = pts.tolist()
        path_str = "M " + " ".join(f"{p[0]},{p[1]}" for p in pts) + " Z"
        return path_str

    def predict_clothing_interactive(self, pil_image: Image.Image, click_point: dict):
        """
        Runs interactive segmentation using the provided click point.
        """
        start_time = time.time()

        # Convert from RGBA → RGB
        np_image = np.array(pil_image.convert("RGB"))

        self.predictor.set_image(np_image)

        # Get image dimensions
        h, w, _ = np_image.shape

        # Extract the click point
        input_x = click_point.get("x", w / 2)
        input_y = click_point.get("y", h / 2)
        input_point = np.array([[input_x, input_y]])  # Convert to NumPy array
        input_label = np.array([1])  # Foreground label

        # Run SAM model for segmentation
        masks, scores, logits = self.predictor.predict(
            point_coords=input_point,
            point_labels=input_label,
            multimask_output=False,  # Single mask output
        )

        # If no masks found, return None
        if masks is None or not masks.any():
            print("⚠️ No masks found; no interactive segmentation result.")
            return None

        # Convert mask to binary (255/0)
        union_mask = masks[0].astype(np.uint8) * 255

        print(f"Elapsed time (interactive): {time.time() - start_time:.6f}s")
        return union_mask