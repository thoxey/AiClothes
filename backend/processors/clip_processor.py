import open_clip
import torch
import json


class CLIPProcessor:
    def __init__(self, device=None):
        # ✅ Detect CUDA properly
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            'hf-hub:Marqo/marqo-fashionSigLIP', device=self.device
        )
        self.tokenizer = open_clip.get_tokenizer('hf-hub:Marqo/marqo-fashionSigLIP')

        # ✅ Load colour labels
        with open("backend/colours.json", "r") as f:
            self.color_labels = json.load(f)["colors"]

        # ✅ Load clothing labels
        with open("backend/clothing_types.json", "r") as f:
            clothing_data = json.load(f)
            self.clothing_labels = [item for category in clothing_data["categories"].values() for item in category]

    def _classify(self, image, labels, top_k=3):
        """Classifies an image against a given set of labels and returns top-k matches."""
        image = self.preprocess(image).unsqueeze(0).to(self.device)
        text_inputs = self.tokenizer(labels).to(self.device)

        with torch.no_grad(), torch.amp.autocast(self.device):
            image_features = self.model.encode_image(image)
            text_features = self.model.encode_text(text_inputs)
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)

            similarities = (100.0 * image_features @ text_features.T).softmax(dim=-1)

        # ✅ Return results with proper formatting
        top_results = [
            {"label": labels[i], "confidence": round(similarities[0, i].item(), 4)}
            for i in similarities.argsort(descending=True)[0][:top_k]
        ]
        return top_results

    def classify_clothing(self, image):
        """Classify clothing type from image."""
        return self._classify(image, self.clothing_labels)

    def classify_color(self, image):
        """Classify the main colour of the clothing."""
        return self._classify(image, self.color_labels)