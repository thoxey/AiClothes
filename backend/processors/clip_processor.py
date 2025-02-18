import torch
import clip
import json

class CLIPProcessor:
    def __init__(self, device="cpu"):  # ✅ CLIP works fine on CPU
        self.device = device
        self.model, self.preprocess = clip.load("ViT-B/32", device=device)

        # ✅ Load color labels from JSON file
        with open("backend/colours.json", "r") as f:
            color_data = json.load(f)
            self.color_labels = color_data["colors"]

        # ✅ Load clothing labels from JSON file
        with open("backend/clothing_types.json", "r") as f:
            clothing_data = json.load(f)

        # ✅ Extract clothing labels (flattened list)
        self.clothing_labels = [
            item for category in clothing_data["categories"].values() for item in category
        ]

    def _classify(self, image, labels):
        """Internal method to classify an image against a given set of labels."""
        text_inputs = clip.tokenize(labels).to(self.device)
        with torch.no_grad():
            image_features = self.model.encode_image(self.preprocess(image).unsqueeze(0).to(self.device))
            text_features = self.model.encode_text(text_inputs)
            similarities = (image_features @ text_features.T).softmax(dim=-1)
        return labels[similarities.argmax().item()]

    def classify_clothing(self, image):
        """Classifies the image to determine clothing type."""
        return self._classify(image, self.clothing_labels)

    def classify_color(self, image):
        """Classifies the image to determine the most likely color."""
        return self._classify(image, self.color_labels)
