import os
import cv2
import numpy as np
from collections import Counter


class ImageProcessor:
    def __init__(self, cache_dir="cache"):
        """Handles color extraction using cached masks."""
        self.cache_dir = cache_dir
        os.makedirs(self.cache_dir, exist_ok=True)  # ✅ Ensure cache directory exists

    def get_dominant_colour(self, image, filename, segmenter, k=5):
        """Extracts dominant colour using SAM-segmented mask, checking cache first."""

        # ✅ Cache file path
        mask_cache_path = os.path.join(self.cache_dir, f"{filename}.npy")

        # ✅ Check if mask is already cached
        if os.path.exists(mask_cache_path):
            print(f"⚡ Using cached mask for {filename}")
            mask = np.load(mask_cache_path)
        else:
            print(f"🔍 Running SAM segmentation for {filename}")
            mask = segmenter.segment_clothing(image, filename)

        # ✅ Convert image to OpenCV format (BGR)
        img_bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # ✅ Apply mask to the original image (Keep only clothing pixels)
        clothing_pixels = img_bgr[mask == 255].reshape(-1, 3)

        # ✅ Ensure we have valid pixels
        if len(clothing_pixels) == 0:
            print(f"⚠️ No clothing pixels detected for {filename}, falling back.")
            return (128, 128, 128)  # Return neutral gray as fallback

        # ✅ Run K-Means clustering to find the dominant color
        clothing_pixels = np.float32(clothing_pixels)
        _, labels, palette = cv2.kmeans(
            clothing_pixels, k, None,
            (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2),
            10, cv2.KMEANS_RANDOM_CENTERS
        )

        # ✅ Get the most common color
        counts = Counter(labels.flatten())
        dominant_rgb = palette[max(counts, key=counts.get)]

        return tuple(map(int, dominant_rgb[::-1]))  # Convert BGR → RGB
