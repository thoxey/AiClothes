import os
import torch
import urllib.request
import numpy as np
import cv2
from segment_anything import sam_model_registry, SamAutomaticMaskGenerator
from PIL import Image

class SAMSegmenter:
    def __init__(self, model_path="sam_vit_h_4b8939.pth", cache_dir="cache"):
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

        self.model = sam_model_registry["vit_h"](checkpoint=model_path).to(self.device)
        self.mask_generator = SamAutomaticMaskGenerator(
        model=self.model,
        points_per_side=32,
        pred_iou_thresh=0.86,
        stability_score_thresh=0.92,
        crop_n_layers=1,
        crop_n_points_downscale_factor=2,
        min_mask_region_area=100,  # Requires open-cv to run post-processing
)

    def download_sam_model(self, model_path):
        url = "https://dl.fbaipublicfiles.com/segment-anything/sam_vit_h_4b8939.pth"
        urllib.request.urlretrieve(url, model_path)
        print(f"Download complete: {model_path}")

    def contour_to_path_str(self, contour):
        """Convert a single contour (Nx1x2 array) into an SVG path string."""
        # Remove the extra dimensions and ensure we have a list of [x, y] points.
        pts = contour.squeeze()
        if pts.ndim == 1:  # Only one point in the contour
            pts = [pts.tolist()]
        else:
            pts = pts.tolist()
        # Begin with a Move command and then Line commands; close with Z.
        path_str = "M " + " ".join(f"{p[0]},{p[1]}" for p in pts) + " Z"
        return path_str

    def segment_clothing(self, filename):
        """
        Segments clothing items using SAM and returns a union mask (for cutouts)
        along with a list of compound SVG path strings representing each segmented region.
        This version processes all masks above a given area threshold.
        """
        print(f"🔍 Running SAM segmentation for {filename}")
        image = cv2.imread(filename)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        masks = self.mask_generator.generate(image)

        if not masks:
            print(f"⚠️ No masks found for {filename}, falling back to bounding box.")
            return None, []

        # Filter out small masks.
        min_area_threshold = 100  # adjust as needed
        masks_filtered = [m for m in masks if m['area'] >= min_area_threshold]
        compound_paths = []
        # Create a union mask of all accepted masks.
        union_mask = np.zeros_like(masks_filtered[0]['segmentation'].astype(np.uint8) * 255)
        for mask_dict in masks_filtered:
            current_mask = mask_dict['segmentation'].astype(np.uint8) * 255
            union_mask = cv2.bitwise_or(union_mask, current_mask)

            # Use RETR_TREE to extract full hierarchy (outer contours and holes)
            contours, hierarchy = cv2.findContours(current_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            if hierarchy is not None:
                hierarchy = hierarchy[0]  # shape: (num_contours, 4)
                # Loop over each contour; if it has no parent, treat it as an outer contour.
                for i, h in enumerate(hierarchy):
                    if h[3] == -1:
                        outer_path = self.contour_to_path_str(contours[i])
                        inner_paths = []
                        # Check for contours whose parent is this outer contour.
                        for j, h2 in enumerate(hierarchy):
                            if h2[3] == i:
                                inner_paths.append(self.contour_to_path_str(contours[j]))
                        compound_path = outer_path
                        if inner_paths:
                            compound_path += " " + " ".join(inner_paths)
                        compound_paths.append(compound_path)

        return union_mask, compound_paths
