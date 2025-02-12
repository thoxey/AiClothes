import numpy as np
from PIL import Image
import base64
import zlib

class MaskProcessor:
    @staticmethod
    def encode(mask: np.ndarray) -> str:
        """
        Encodes a binary NumPy mask (0/255) into a zlib-compressed, Base64-encoded string.
        """
        raw_bytes = mask.tobytes()
        compressed_data = zlib.compress(raw_bytes)
        return base64.b64encode(compressed_data).decode("utf-8")

    @staticmethod
    def decode(encoded_mask: str, shape: tuple, dtype: np.dtype = np.uint8) -> np.ndarray:
        """
        Decodes a zlib-compressed, Base64-encoded mask back into a NumPy array.
        Assumes the mask has only 0/255 values and matches the specified shape/dtype.
        """
        compressed_data = base64.b64decode(encoded_mask)
        raw_bytes = zlib.decompress(compressed_data)
        return np.frombuffer(raw_bytes, dtype=dtype).reshape(shape)

    @staticmethod
    def apply(image_path: str, encoded_mask: str) -> Image.Image:
        """
        Loads the original image as RGBA, decodes the zlib-compressed, Base64-encoded mask,
        resizes if necessary, and applies it to the image’s alpha channel:
        0 => Transparent, 255 => Opaque.
        Returns the resulting PIL Image.
        """
        # 1. Load the original image as RGBA
        image = Image.open(image_path).convert("RGBA")
        image_data = np.array(image)

        # 2. Decode the mask to match image dimensions
        height, width = image_data.shape[0], image_data.shape[1]
        mask_data = MaskProcessor.decode(encoded_mask, (height, width))

        # 3. Resize if there’s a shape mismatch
        if mask_data.shape != (height, width):
            mask_image = Image.fromarray(mask_data)
            mask_image = mask_image.resize((width, height), Image.NEAREST)
            mask_data = np.array(mask_image)

        # 4. Apply the mask to the alpha channel
        image_data[:, :, 3] = np.where(mask_data == 0, 0, 255)

        # 5. Return as PIL Image
        return Image.fromarray(image_data)