from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import numpy as np
import cv2
from PIL import Image

from processors.mask_processor import MaskProcessor
from processors.sam_segmenter import SAMSegmenter
import base64
import zlib
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

    # Process Image (example call to your segmenter)
    union_mask, compound_paths = segmenter.predict_clothing(file_path)

    # Encode mask as base64 using the MaskProcessor
    encoded_mask = MaskProcessor.encode(union_mask)

    return jsonify({
        "success": True,
        "file": filename,
        "polygons": compound_paths,  # List of segmented paths
        "mask": encoded_mask         # Send mask as base64 string
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
        # Use the MaskProcessor’s apply method to combine the image + mask
        cutout = MaskProcessor.apply(image_path, mask_base64)

        # Save the cutout
        cutout_filename = os.path.splitext(filename)[0] + "_cutout.png"
        cutout_path = os.path.join(app.config["CUTOUT_FOLDER"], cutout_filename)
        cutout.save(cutout_path)

        return jsonify({"success": True, "cutout": f"/static/cutouts/{cutout_filename}"})

    except Exception as e:
        print("Error processing mask:", e)
        return jsonify({"error": f"Failed to process mask: {str(e)}"}), 500

