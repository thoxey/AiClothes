import json
import requests


class DeepSeekNode:
    """ Calls the DeepSeek API to get an outfit suggestion. """
    api_url = "http://localhost:11434/api/generate"

    def run(self, data):
        prompt = data["prompt"]

        headers = {"Content-Type": "application/json"}
        payload = {
            "model": "deepseek-r1",
            "prompt": prompt,
            "stream": False
        }

        response = requests.post(self.api_url, headers=headers, json=payload)
        if response.status_code == 200:
            try:
                return response.json()
            except json.JSONDecodeError:
                return {"error": "Error: Unable to parse JSON response from DeepSeek."}
        else:
            return {"error": f"Error: {response.status_code} - {response.text}"}

