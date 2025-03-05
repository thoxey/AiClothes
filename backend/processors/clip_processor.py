import open_clip
import torch
import json

class CLIPProcessor:
    def __init__(self, device=None):
        # Detect CUDA properly
        if device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        # Load Marqo Fashion SigLIP model
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            'hf-hub:Marqo/marqo-fashionSigLIP', device=self.device
        )
        self.tokenizer = open_clip.get_tokenizer('hf-hub:Marqo/marqo-fashionSigLIP')

        # Load all fashion-related data from one JSON
        with open("backend/clothing_types.json", "r") as f:
            fashion_data = json.load(f)

        # Extract relevant sections
        self.color_labels = fashion_data["colors"]
        self.pattern_labels = fashion_data["patterns"]
        self.style_labels = fashion_data["styles"]

        # ✅ Properly flatten clothing categories into a single list
        self.clothing_labels = [
            item for category in fashion_data["categories"].values() for item in category
        ]

    def _classify(self, image, labels, top_k=3):
        """Classifies an image against a given set of labels and returns top-k matches."""
        image = self.preprocess(image).unsqueeze(0).to(self.device)
        text_inputs = self.tokenizer(labels).to(self.device)

        with torch.no_grad(), torch.amp.autocast(self.device):
            image_features = self.model.encode_image(image)
            text_features = self.model.encode_text(text_inputs)

            # Normalise the embeddings
            image_features /= image_features.norm(dim=-1, keepdim=True)
            text_features /= text_features.norm(dim=-1, keepdim=True)

            # Get softmaxed similarity scores
            similarities = (100.0 * image_features @ text_features.T).softmax(dim=-1)

        top_results = [
            {
                "label": labels[i],
                "confidence": round(similarities[0, i].item(), 4)
            }
            for i in similarities.argsort(descending=True)[0][:top_k]
        ]
        return top_results

    def classify_clothing(self, image):
        """Classify clothing type from image."""
        return self._classify(image, self.clothing_labels)

    def classify_colors(self, image, top_k=3):
        """Classify multiple colours in an image."""
        return self._classify(image, self.color_labels, top_k=top_k)

    def classify_pattern(self, image):
        """Classify the pattern of the clothing."""
        return self._classify(image, self.pattern_labels, top_k=1)

    def classify_style(self, image):
        """Classify style (e.g. 'casual', 'formal', 'summer', etc.)."""
        return self._classify(image, self.style_labels)
