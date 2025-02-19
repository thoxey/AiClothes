import os
import json
from collections import defaultdict
import requests
import re

def load_wardrobe(json_folder: str):
    wardrobe = defaultdict(list)
    valid_types = {"Tops", "Mid Layers", "Outerwear", "Bottoms", "Suits & Formalwear", "Footwear"}

    for filename in os.listdir(json_folder):
        if filename.endswith(".json"):
            file_path = os.path.join(json_folder, filename)

            try:
                with open(file_path, "r", encoding="utf-8") as file:
                    data = json.load(file)

                    if "wardrobe" in data and isinstance(data["wardrobe"], list):
                        for category in data["wardrobe"]:
                            if isinstance(category, dict) and "type" in category and "items" in category:
                                item_type = category["type"].capitalize()
                                if item_type in valid_types and isinstance(category["items"], list):
                                    wardrobe[item_type].extend(category["items"])
                                else:
                                    print(f"Skipping invalid type or structure in {filename}")
                    else:
                        print(f"Skipping invalid JSON structure in {filename}")
            except json.JSONDecodeError:
                print(f"Error decoding JSON in {filename}")

    return dict(wardrobe)

def generate_prompt(wardrobe):
    prompt = "Select a fashionable outfit based on the following wardrobe:\n\n"
    for category, items in wardrobe.items():
        prompt += f"{category}:\n"
        for item in items:
            prompt += f"  - A {item['color']} {item['material']} {item['item']}\n"
        prompt += "\n"
    prompt += "\nProvide a complete outfit that is stylish and well-coordinated."
    return prompt

def clean_deepseek_response(response_json):
    if "response" in response_json:
        response_text = response_json["response"]
        # Remove the \think section if present
        response_text = re.sub(r"<think>.*?</think>", "", response_text, flags=re.DOTALL).strip()
        return response_text
    return "No valid outfit found in response."

def get_outfit_from_deepseek(prompt, api_url="http://localhost:11434/api/generate"):
    headers = {"Content-Type": "application/json"}
    payload = {"model": "deepseek-r1", "prompt": prompt, "stream": False}

    response = requests.post(api_url, headers=headers, json=payload)
    if response.status_code == 200:
        try:
            response_json = response.json()
            return clean_deepseek_response(response_json)
        except json.JSONDecodeError:
            return "Error: Unable to parse JSON response from DeepSeek."
    else:
        return f"Error: {response.status_code} - {response.text}"

# Example usage
if __name__ == "__main__":
    folder_path = input("Enter the path to the folder containing the JSON wardrobe files: ").strip()
    api_url = "http://localhost:11434/api/generate"  # Local Ollama DeepSeek server URL

    if not os.path.isdir(folder_path):
        print("Invalid folder path. Please check and try again.")
    else:
        wardrobe_data = load_wardrobe(folder_path)
        prompt = generate_prompt(wardrobe_data)
        outfit = get_outfit_from_deepseek(prompt, api_url)

        print("Generated Outfit:")
        print(outfit)
