import os
from datasets import load_dataset
import json

# ✅ Define paths
CACHE_DIR = os.path.expanduser("~/.cache/fashion200k")  # Your dataset cache
LABELS_FILE = os.path.join(CACHE_DIR, "fashion_labels.json")  # Save only category3 labels


def load_fashion200k():
    """Load the Fashion200k dataset from cache."""
    print("Loading Fashion200k dataset...")
    return load_dataset("Marqo/fashion200k", cache_dir=CACHE_DIR)


def generate_category3_labels(dataset):
    """Extract and clean category3 labels from Fashion200k."""
    category3_labels = set()

    dataset_split = dataset["data"]  # ✅ Use the correct dataset split

    for item in dataset_split:
        cat3 = item["category3"].strip().lower()
        if cat3:
            category3_labels.add(cat3)

    return sorted(category3_labels)  # Return sorted unique labels


def save_labels(labels):
    """Save extracted category3 labels to a JSON file for caching."""
    with open(LABELS_FILE, "w") as f:
        json.dump(labels, f, indent=4)
    print(f"✅ Category3 labels saved to {LABELS_FILE}")


if __name__ == "__main__":
    # ✅ Run the script to extract and save only category3 labels
    dataset = load_fashion200k()
    labels = generate_category3_labels(dataset)
    save_labels(labels)

    print("🔥 Fashion200k Category3 Labels Extracted & Cached Successfully!")
