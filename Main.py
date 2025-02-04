import os
from PIL import Image
from processors.clip_processor import CLIPProcessor
from processors.sam_segmenter import SAMSegmenter
from processors.image_processor import ImageProcessor
from wardrobe_manager import WardrobeManager

WARDROBE_DIR = "wardrobe"
CUTOUT_FOLDER = "static/cutouts"

# ✅ Initialize modules
segmenter = SAMSegmenter()
image_processor = ImageProcessor()
clip_processor = CLIPProcessor()
wardrobe_manager = WardrobeManager()

os.makedirs(CUTOUT_FOLDER, exist_ok=True)  # ✅ Ensure cutout folder exists

jpeg_files = [f for f in os.listdir(WARDROBE_DIR) if f.lower().endswith(".jpeg")]
wardrobe_data = {}

for image_file in jpeg_files:
    print(f"\n🔍 Processing: {image_file}")
    image_path = os.path.join(WARDROBE_DIR, image_file)
    image = Image.open(image_path)

    # 🎨 Use CLIP for color classification instead of manual extraction
    detected_colour = clip_processor.classify_color(image)

    # 📝 Classify clothing type with CLIP
    clothing_labels = [item for sublist in wardrobe_manager.categories.values() for item in sublist]
    best_match_label = clip_processor.classify_clothing(image, clothing_labels)

    # 🔹 Categorize clothing & detect material
    category = wardrobe_manager.categorize_item(best_match_label)
    material = wardrobe_manager.get_material(best_match_label)

    # 🎭 Segment clothing and save cutout image
    mask = segmenter.segment_clothing(image, image_file)
    cutout_filename = image_file.replace(".jpeg", ".png")
    cutout_path = os.path.join(CUTOUT_FOLDER, cutout_filename)
    wardrobe_manager.save_debug_image(image, mask, cutout_path)

    # ✅ Save structured wardrobe data with image link
    wardrobe_data.setdefault(category, {"type": category, "items": []})["items"].append({
        "item": best_match_label,
        "color": detected_colour,
        "material": material,
        "image": f"/static/cutouts/{cutout_filename}"  # ✅ Ensure image is linked
    })

# ✅ Save final wardrobe JSON
wardrobe_manager.save_wardrobe(list(wardrobe_data.values()))
print("\n✅ Wardrobe saved to 'wardrobe.json' with image links!")
