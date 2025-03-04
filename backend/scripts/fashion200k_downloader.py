from datasets import load_dataset
import os

# ✅ Define a cache path
CACHE_DIR = os.path.expanduser("~/.cache/fashion200k")

# ✅ Ensure the cache directory exists
os.makedirs(CACHE_DIR, exist_ok=True)

# ✅ Load Fashion200k and store in cache
fashion_ds = load_dataset("Marqo/fashion200k", cache_dir=CACHE_DIR)

print("Fashion200k dataset cached at:", CACHE_DIR)
