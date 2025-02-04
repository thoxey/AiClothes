import json
import os
import numpy as np
from PIL import Image

class WardrobeManager:
    def __init__(self, clothing_json="clothing_types.json", colours_json="colours.json", wardrobe_json="wardrobe.json"):
        """Loads clothing types, materials, and wardrobe storage."""
        self.wardrobe_json = wardrobe_json

        # ✅ Load clothing categories and materials
        with open(clothing_json, "r") as f:
            clothing_data = json.load(f)
            self.categories = clothing_data["categories"]
            self.materials = clothing_data["materials"]

        # ✅ Load existing wardrobe if it exists
        try:
            with open(self.wardrobe_json, "r") as f:
                self.wardrobe_data = json.load(f)["wardrobe"]
        except FileNotFoundError:
            self.wardrobe_data = []

    def categorize_item(self, clothing_label):
        """Finds the category of a clothing item."""
        for category, items in self.categories.items():
            if clothing_label in items:
                return category
        return "Other"

    def get_material(self, clothing_label):
        """Gets material for a clothing item, defaulting to 'unknown fabric'."""
        return self.materials.get(clothing_label, "unknown fabric")

    def add_to_wardrobe(self, item_data, category):
        """Adds an item to the wardrobe and saves the JSON."""
        # ✅ Ensure the category exists
        category_entry = next((c for c in self.wardrobe_data if c["type"] == category), None)
        if not category_entry:
            category_entry = {"type": category, "items": []}
            self.wardrobe_data.append(category_entry)

        # ✅ Append the new item
        category_entry["items"].append(item_data)

        # ✅ Save the updated wardrobe
        self.save_wardrobe(self.wardrobe_data)

    def save_wardrobe(self, wardrobe_data):
        """Saves wardrobe data to JSON."""
        with open(self.wardrobe_json, "w") as f:
            json.dump({"wardrobe": wardrobe_data}, f, indent=4)

    import numpy as np
    from PIL import Image

    def save_debug_image(self, image, mask, output_path):
        """Saves a transparent PNG cutout of the segmented clothing item with correct masking."""

        # ✅ Convert image to NumPy RGBA format
        img_rgba = np.array(image.convert("RGBA"))

        # ✅ Ensure mask is binary (255 = clothing, 0 = background)
        mask_binary = (mask > 0).astype(np.uint8)  # Convert to 0 and 1

        # ✅ Find bounding box (crop area)
        coords = np.argwhere(mask_binary)
        if coords.shape[0] == 0:
            print(f"⚠️ No valid segmentation in mask for {output_path}")
            return

        y_min, x_min = coords.min(axis=0)
        y_max, x_max = coords.max(axis=0) + 1  # Ensure inclusive range

        # ✅ Invert the mask so clothing is visible (255) and background is transparent (0)
        mask_binary = 1 - mask_binary  # Invert 0 ↔ 1

        # ✅ Apply transparency: Background becomes fully transparent
        img_rgba[..., 3] = np.where(mask_binary == 0, 255, 0)  # Clothing = 255 (opaque), background = 0 (transparent)

        # ✅ Crop image to bounding box
        cropped_rgba = img_rgba[y_min:y_max, x_min:x_max]

        # ✅ Save as transparent PNG
        Image.fromarray(cropped_rgba).save(output_path, "PNG")
        print(f"📸 Cutout image saved: {output_path} (Cropped & Transparent)")
