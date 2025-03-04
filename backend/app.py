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
        # 1. Decode the image
        image_bytes = base64.b64decode(image_base64)
        # Create a PIL Image from the image bytes
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

        # 2. Process the image with the CLIP model
        clothing_type = clip_processor.classify_clothing(image)

        # 3. Process the image with the Image Processor
        dominant_color = clip_processor.classify_color(image)

        return jsonify({"success": True, "clothingType": clothing_type, "dominantColor": dominant_color})

    except Exception as e:
        print("Error processing image:", e)
        return jsonify({"error": f"Failed to process image: {str(e)}"}), 500

@app.route("/save-to-wardrobe", methods=["POST"])
def save_to_wardrobe():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data sent"}), 400

    image_base64 = data.get("cutoutBase64")
    if not image_base64:
        return jsonify({"error": "Missing cutoutBase64"}), 400

    item_type = data.get("clothingType")
    if not item_type:
        return jsonify({"error": "Missing clothingType"}), 400

    dominant_color = data.get("dominantColor")
    if not dominant_color:
        return jsonify({"error": "Missing dominantColor"}), 400

    try:
        document = jsonify({"success": True, "clothingType": item_type, "dominantColor": dominant_color, "imageBase64": image_base64})
        clothing_table.insert(document.get_json())
        return jsonify({"success": True, "clothingType": item_type, "dominantColor": dominant_color, "imageBase64": image_base64})

    except Exception as e:
        print("Error saving image:", e)
        return jsonify({"error": f"Failed to save image: {str(e)}"}), 500


@app.route("/clothing-items", methods=["GET"])
def get_clothing_items():
    # Fetch all clothing items and include doc_id
    items = [{"id": item.doc_id, **item} for item in clothing_table.all()]
    return jsonify(items)


@app.route("/clothing-items", methods=["POST"])
def add_clothing_item():
    data = request.get_json()
    # Check for all required fields
    required_fields = ["clothingType", "dominantColor", "imageBase64" ]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing one or more required fields."}), 400

    # Insert the item into TinyDB
    clothing_table.insert(data)
    return jsonify(data), 201

@app.route("/clothing-items/<int:item_id>", methods=["DELETE"])
def delete_clothing_item(item_id):
    print(item_id)  # Debugging output

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
