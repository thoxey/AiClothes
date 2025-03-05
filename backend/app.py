from tinydb import TinyDB
from flask import Flask, request, jsonify, send_from_directory
import base64
import io
from PIL import Image

from backend.processors.mask_processor import MaskProcessor
from backend.processors.sam_segmenter import SAMSegmenter
from backend.processors.image_processor import ImageProcessor
from backend.processors.clip_processor import CLIPProcessor
from backend.wardrobe_guru import WardrobeGuru

app = Flask(__name__, static_folder='frontend/build')

segmenter = SAMSegmenter()
image_processor = ImageProcessor()
clip_processor = CLIPProcessor()

db = TinyDB("clothing_db.json")
clothing_table = db.table("clothing_items")

@app.route("/")
def serve_index():
    # Serve the React build's index.html
    return send_from_directory(app.static_folder, 'index.html')

@app.route("/<path:path>")
def serve_react_app(path):
    # Serve any static files from the React build
    return send_from_directory(app.static_folder, path)

@app.route("/create-segmented-image", methods=["POST"])
def create_segmented_image():
    """
    Receives JSON with "imageBase64" and "clickPoint".
    Runs segmentation based on the point, applies the mask,
    and returns the final cutout as base64.
    """
    data = request.get_json()
    if not data or "imageBase64" not in data or "clickPoint" not in data:
        return jsonify({"error": "Missing imageBase64 or clickPoint"}), 400

    image_base64 = data["imageBase64"]
    click_point = data["clickPoint"]

    try:
        # Decode the base64 image
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

        # Run segmentation using the click point
        union_mask = segmenter.predict_clothing_interactive(image, click_point)

        if union_mask is None:
            return jsonify({"error": "No mask found"}), 400

        encoded_mask = MaskProcessor.encode(union_mask)
        # Apply the mask to extract the cutout
        cutout = MaskProcessor.apply(image, encoded_mask)

        # Convert the cutout to base64
        output_buffer = io.BytesIO()
        cutout.save(output_buffer, format="PNG")
        cutout_base64 = base64.b64encode(output_buffer.getvalue()).decode("utf-8")

        return jsonify({"success": True, "cutoutBase64": cutout_base64})

    except Exception as e:
        print("Error processing segmentation:", e)
        return jsonify({"error": f"Failed to process image: {str(e)}"}), 500

@app.route("/identify-image", methods=["POST"])
def identify_image():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data sent"}), 400

    image_base64 = data.get("cutoutBase64")
    if not image_base64:
        return jsonify({"error": "Missing cutoutBase64"}), 400

    try:
        # ✅ Decode the image
        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

        # ✅ Classify clothing type, color, and description
        clothing_type = clip_processor.classify_clothing(image)
        colours = clip_processor.classify_colors(image)
        pattern = clip_processor.classify_pattern(image)
        style = clip_processor.classify_style(image)

        return jsonify({
            "success": True,
            "clothingType": clothing_type,
            "colors": colours,
            "pattern": pattern,
            "style": style
        })

    except Exception as e:
        return jsonify({"error": f"Error processing image: {str(e)}"}), 500

@app.route("/save-to-wardrobe", methods=["POST"])
def save_to_wardrobe():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data sent"}), 400

    required_fields = ["cutoutBase64", "clothingType", "colors", "pattern", "style"]
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        return jsonify({"error": f"Missing fields: {', '.join(missing_fields)}"}), 400

    try:
        # Structure the item properly
        item = {
            "clothingType": data["clothingType"],
            "colors": data["colors"],  # List of colors
            "pattern": data["pattern"],
            "style": data["style"],
            "imageBase64": data["cutoutBase64"],
        }

        doc_id = clothing_table.insert(item)
        item["id"] = doc_id  # Add doc_id for reference

        return jsonify({"success": True, **item}), 201

    except Exception as e:
        print("Error saving clothing item:", e)
        return jsonify({"error": f"Failed to save item: {str(e)}"}), 500


@app.route("/clothing-items", methods=["GET"])
def get_clothing_items():
    """Fetch all clothing items with their ID."""
    items = [{"id": item.doc_id, **item} for item in clothing_table.all()]
    return jsonify(items)


@app.route("/clothing-items/<int:item_id>", methods=["DELETE"])
def delete_clothing_item(item_id):
    """Delete a clothing item by its ID."""
    if not clothing_table.contains(doc_id=item_id):
        return jsonify({"error": "Item not found"}), 404

    clothing_table.remove(doc_ids=[item_id])
    return jsonify({"success": True})

@app.route('/suggest-outfit', methods=['POST'])
def suggest_outfit():
    data = request.get_json()
    weather_info = data.get("weather")
    # get the clothing table with the images removed
    clothing_table_no_images = clothing_table.all()
    for item in clothing_table_no_images:
        item.pop("imageBase64")
    guru = WardrobeGuru()
    response = guru.get_outfit_from_deepseek(clothing_table_no_images, weather_info)

    return jsonify({"suggested_outfit": response})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
