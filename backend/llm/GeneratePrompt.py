import json
import requests
import re


class WardrobeGuru:
    api_url = "http://localhost:11434/api/generate"

    def generate_prompt(self, wardrobe):
        """Generate a prompt for selecting an outfit from a wardrobe using the new JSON format."""
        try:
            if not isinstance(wardrobe, list):
                raise ValueError("Invalid wardrobe format. Expected a list of clothing items.")

            prompt = "Select a fashionable outfit based on the following wardrobe:\n\n"

            for item in wardrobe:
                if not isinstance(item, dict) or "clothingType" not in item or "dominantColor" not in item:
                    raise ValueError("Each clothing item must have 'clothingType' and 'dominantColor'.")

                prompt += f"- A {item['dominantColor']} {item['clothingType']}\n"

            prompt += "\nProvide a complete outfit that is stylish and well-coordinated.\n"
            return prompt

        except Exception as e:
            print(f"Error generating prompt: {e}")
            return "Invalid wardrobe format or missing required fields."

    def clean_deepseek_response(self, response_json):
        """Cleans up DeepSeek's response by removing unnecessary sections."""
        if "response" in response_json:
            response_text = response_json["response"]
            response_text = re.sub(r"<think>.*?</think>", "", response_text, flags=re.DOTALL).strip()
            return response_text
        return "No valid outfit found in response."

    def get_outfit_from_deepseek(self, wardrobe):
        """Fetches a suggested outfit from DeepSeek based on the given wardrobe."""
        prompt = self.generate_prompt(wardrobe)
        headers = {"Content-Type": "application/json"}
        payload = {"model": "deepseek-r1", "prompt": prompt, "stream": False}

        response = requests.post(self.api_url, headers=headers, json=payload)
        if response.status_code == 200:
            try:
                response_json = response.json()
                return self.clean_deepseek_response(response_json)
            except json.JSONDecodeError:
                return "Error: Unable to parse JSON response from DeepSeek."
        else:
            return f"Error: {response.status_code} - {response.text}"