from flask import Flask, request, jsonify, send_from_directory
import base64
import io
from PIL import Image

from backend.processors.mask_processor import MaskProcessor
from backend.processors.sam_segmenter import SAMSegmenter
from backend.processors.image_processor import ImageProcessor
from backend.processors.clip_processor import CLIPProcessor


app = Flask(__name__, static_folder='frontend/build')

segmenter = SAMSegmenter()
image_processor = ImageProcessor()
clip_processor = CLIPProcessor()

@app.route("/")
def serve_index():
    # Serve the React build's index.html
    return send_from_directory(app.static_folder, 'index.html')

@app.route("/<path:path>")
def serve_react_app(path):
    # Serve any static files from the React build
    return send_from_directory(app.static_folder, path)

@app.route("/upload", methods=["POST"])
def upload_image():
    """
    Receives a JSON body with "imageBase64".
    Processes the image (predict_clothing) in memory,
    returns polygons and a mask as base64.
    """
    data = request.get_json()
    if not data or "imageBase64" not in data:
        return jsonify({"error": "No base64 image provided"}), 400

    image_base64 = data["imageBase64"]

    # 1. Decode the base64 into bytes
    try:
        image_bytes = base64.b64decode(image_base64)
        # 2. Load into Pillow in memory
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    except Exception as e:
        return jsonify({"error": f"Could not decode image: {str(e)}"}), 400

    # 3. Process image with segmenter (in memory)
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    union_mask, compound_paths = segmenter.predict_clothing_interactive(pil_image)

    # 4. Encode the mask as base64
    encoded_mask = MaskProcessor.encode(union_mask)

    return jsonify({
        "success": True,
        "polygons": compound_paths,
        "mask": encoded_mask
    })

@app.route("/save-selection", methods=["POST"])
def save_selection():
    """
    Receives JSON with "imageBase64" and "maskBase64".
    Applies the mask to the original image in memory,
    returns the final cutout as base64.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data sent"}), 400

    image_base64 = data.get("imageBase64")
    mask_base64 = data.get("maskBase64")
    if not image_base64 or not mask_base64:
        return jsonify({"error": "Missing imageBase64 or maskBase64"}), 400

    try:
        # 1. Decode the image
        image_bytes = base64.b64decode(image_base64)
        #Create a PIL Image from the image bytes
        image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

        # 2. Apply the mask
        #    MaskProcessor.apply can be refactored to accept a Pillow Image
        #    and a base64 mask, returning a new Pillow Image
        cutout = MaskProcessor.apply(image, mask_base64)

        # 3. Convert the cutout back to base64
        output_buffer = io.BytesIO()
        cutout.save(output_buffer, format="PNG")
        cutout_base64 = base64.b64encode(output_buffer.getvalue()).decode("utf-8")

        return jsonify({"success": True, "cutoutBase64": cutout_base64})

    except Exception as e:
        print("Error processing mask:", e)
        return jsonify({"error": f"Failed to process mask: {str(e)}"}), 500

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




if __name__ == "__main__":
    app.run(debug=True, port=5000)
