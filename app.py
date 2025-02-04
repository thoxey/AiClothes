from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import numpy as np
import cv2
from PIL import Image
from processors.sam_segmenter import SAMSegmenter

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
    _, compound_paths = segmenter.segment_clothing(file_path)

    return jsonify({
        "success": True,
        "file": filename,
        "polygons": compound_paths  # List of segmented paths
    })


@app.route("/save-selection", methods=["POST"])
def save_selection():
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
