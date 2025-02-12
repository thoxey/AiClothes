from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import numpy as np
import cv2
from PIL import Image
from processors.sam_segmenter import SAMSegmenter
import base64
from io import BytesIO

app = Flask(__name__)

UPLOAD_FOLDER = "static/uploads"
CUTOUT_FOLDER = "static/cutouts"

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["CUTOUT_FOLDER"] = CUTOUT_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CUTOUT_FOLDER, exist_ok=True)

segmenter = SAMSegmenter()


@app.route("/")
def home():
    return render_template("index.html")


def encode_mask_to_base64(mask):
    """Encodes a NumPy mask as a base64 PNG."""
    mask_img = Image.fromarray(mask)  # Convert NumPy array to PIL image
    buffered = BytesIO()
    mask_img.save(buffered, format="PNG")  # Save as PNG to buffer
    return base64.b64encode(buffered.getvalue()).decode("utf-8")  # Encode to base64 string

@app.route("/upload", methods=["POST"])
def upload_image():
    """Handles image upload and segmentation."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filename = file.filename
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    # Process Image
    union_mask, compound_paths = segmenter.predict_clothing(file_path)

    # Encode mask as base64
    encoded_mask = encode_mask_to_base64(union_mask)

    return jsonify({
        "success": True,
        "file": filename,
        "polygons": compound_paths,  # List of segmented paths
        "mask": encoded_mask  # Send mask as base64 string
    })

@app.route("/save-selection", methods=["POST"])
def save_selection():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data sent"}), 400

    filename = data.get("filename")
    mask_base64 = data.get("maskBase64")
    if not filename or not mask_base64:
        return jsonify({"error": "Missing filename or maskBase64"}), 400

    image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    if not os.path.exists(image_path):
        return jsonify({"error": "Image not found"}), 404

    try:
        # Load the original image
        image = Image.open(image_path).convert("RGBA")
        image_data = np.array(image)

        # 1. Decode the base64 string -> PNG bytes
        mask_bytes = base64.b64decode(mask_base64)

        # 2. Open it as a Pillow image (which decompresses the PNG)
        from io import BytesIO
        mask_image = Image.open(BytesIO(mask_bytes)).convert("L")

        # 3. Resize mask to match the original image (if needed)
        mask_image = mask_image.resize((image.width, image.height))

        # 4. Convert to a NumPy array of 0/255
        mask_data = np.array(mask_image)

        # 5. Apply transparency: 0 => Transparent, 255 => Opaque
        image_data[:, :, 3] = np.where(mask_data == 0, 0, 255)

        # 6. Convert back to an Image
        cutout = Image.fromarray(image_data)
        cutout_filename = filename.rsplit(".", 1)[0] + "_cutout.png"
        cutout_path = os.path.join(app.config["CUTOUT_FOLDER"], cutout_filename)
        cutout.save(cutout_path)

        return jsonify({"success": True, "cutout": f"/static/cutouts/{cutout_filename}"})

    except Exception as e:
        print("Error processing mask:", e)
        return jsonify({"error": f"Failed to process mask: {str(e)}"}), 500


def apply_mask(image, mask):
    """Applies a binary mask to an image, making the unselected areas transparent."""
    img_rgba = np.array(image)
    mask_array = np.array(mask)

    # Set alpha channel based on mask
    img_rgba[..., 3] = mask_array  # Directly use the grayscale mask as the alpha channel

    return Image.fromarray(img_rgba)


def save_selection_old():
    """Processes selected segments, creates a combined mask, and applies it to the image."""
    data = request.json
    selected_segments = data.get("selectedSegments", [])
    filename = data.get("filename", "")

    if not selected_segments or not filename:
        return jsonify({"error": "No selection provided."}), 400

    image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    image = Image.open(image_path)

    # Create an empty mask
    mask_shape = (image.height, image.width)
    combined_mask = np.zeros(mask_shape, dtype=np.uint8)

    # Convert SVG paths into masks and merge them
    for path_str in selected_segments:
        segment_mask = svg_path_to_mask(path_str, mask_shape)
        combined_mask = cv2.bitwise_or(combined_mask, segment_mask)
    #fart
    # Apply mask to image
    cutout = apply_mask(image, combined_mask)

    # Save cutout
    cutout_filename = filename.replace(".jpeg", "_cutout.png")
    cutout_path = os.path.join(app.config["CUTOUT_FOLDER"], cutout_filename)
    cutout.save(cutout_path)

    return jsonify({
        "success": True,
        "cutout": f"/static/cutouts/{cutout_filename}"
    })


def svg_path_to_mask(svg_path, mask_shape):
    """Converts an SVG path string into a binary mask."""
    mask = np.zeros(mask_shape, dtype=np.uint8)
    contours = parse_svg_path(svg_path)
    if contours:
        cv2.fillPoly(mask, [np.array(contours, dtype=np.int32)], 255)
    return mask


def parse_svg_path(svg_path):
    """Parses an SVG path string into a list of (x, y) points."""
    points = []
    parts = svg_path.split(" ")
    for part in parts:
        if "," in part:
            x, y = part.split(",")
            points.append((int(float(x)), int(float(y))))
    return points


def apply_mask(image, mask):
    """Applies a binary mask to an image, making the unselected areas transparent."""
    img_rgba = image.convert("RGBA")
    img_array = np.array(img_rgba)

    # Set alpha channel based on mask
    img_array[..., 3] = np.where(mask == 255, 255, 0)

    return Image.fromarray(img_array)


if __name__ == "__main__":
    app.run(port=8000, debug=True)
