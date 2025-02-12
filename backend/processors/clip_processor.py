import torch
import clip
import json
from PIL import Image

class CLIPProcessor:
    def __init__(self, device="cpu"):  # ✅ CLIP works fine on CPU
        self.device = device
        self.model, self.preprocess = clip.load("ViT-B/32", device=device)

        # ✅ Load color labels from JSON file
        with open("colours.json", "r") as f:
            color_data = json.load(f)
            self.color_labels = color_data["colors"]

    def classify_clothing(self, image, clothing_labels):
        """Runs CLIP model to determine clothing type."""
        text_inputs = clip.tokenize(clothing_labels).to(self.device)
        with torch.no_grad():
            image_features = self.model.encode_image(self.preprocess(image).unsqueeze(0).to(self.device))
            text_features = self.model.encode_text(text_inputs)
            similarities = (image_features @ text_features.T).softmax(dim=-1)
        return clothing_labels[similarities.argmax().item()]

    def classify_color(self, image):
        """Uses CLIP to determine the most likely color from an expanded list."""
        text_inputs = clip.tokenize(self.color_labels).to(self.device)
        with torch.no_grad():
            image_features = self.model.encode_image(self.preprocess(image).unsqueeze(0).to(self.device))
            text_features = self.model.encode_text(text_inputs)
            similarities = (image_features @ text_features.T).softmax(dim=-1)
        return self.color_labels[similarities.argmax().item()]
