import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# Model selection
MODEL_NAME = "deepseek-ai/deepseek-coder-1.3B"

def load_model():
    """Loads DeepSeek Coder 1.3B model and tokenizer with GPU support."""
    print("Loading model...")

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    # Load model optimized for GPU
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16,  # Use float16 for efficiency
        device_map="auto"  # Auto place model on GPU if available
    )

    print("Model loaded successfully!")
    return model, tokenizer

def generate_code(prompt, model, tokenizer, max_tokens=256):
    """Generates code from a given prompt using DeepSeek Coder."""
    print(f"Generating code for: {prompt}")

    # Tokenize input
    inputs = tokenizer(prompt, return_tensors="pt").to("cuda" if torch.cuda.is_available() else "cpu")

    # Generate output
    output = model.generate(**inputs, max_length=max_tokens)

    # Decode and return
    generated_code = tokenizer.decode(output[0], skip_special_tokens=True)
    return generated_code

if __name__ == "__main__":
    # Load the model and tokenizer
    model, tokenizer = load_model()

    # Example: Generate code
    prompt = "Write a Python function to calculate Fibonacci numbers."
    code_output = generate_code(prompt, model, tokenizer)

    print("\nGenerated Code:\n")
    print(code_output)
