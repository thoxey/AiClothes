import json
import requests
import re
import langgraph.graph as lg

class WeatherTool:
    """ Fetches weather information. For now, it returns dummy weather data as a dictionary. """
    def run(self, data):
        """
        Returns weather data while preserving the existing input (wardrobe).
        `data` contains the initial input, so we need to include it in the return.
        """
        return {**data, "weather": "sunny, 18°C"}  # ✅ Merge input data with weather


class WardrobeTool:
    """ Generates a formatted prompt based on the wardrobe and weather conditions. """
    def run(self, data):
        wardrobe = data.get("wardrobe")  # ✅ Wardrobe is now guaranteed to exist
        weather = data.get("weather", "Unknown weather")  # ✅ Get weather safely

        if not isinstance(wardrobe, list):
            raise ValueError("Invalid wardrobe format. Expected a list of clothing items.")

        prompt = f"Weather conditions: {weather}\n"
        prompt += "Select a fashionable outfit based on the following wardrobe:\n\n"

        for item in wardrobe:
            if not isinstance(item, dict) or "clothingType" not in item or "dominantColor" not in item:
                raise ValueError("Each clothing item must have 'clothingType' and 'dominantColor'.")

            prompt += f"- A {item['dominantColor']} {item['clothingType']}\n"

        prompt += "\nProvide a complete outfit that is stylish and well-coordinated.\n"

        return {"prompt": prompt}  # ✅ Always return a dictionary

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


class DeepSeekResponseCleaner:
    """ Cleans up the DeepSeek response. """
    def run(self, response_json):
        if "response" in response_json:
            response_text = response_json["response"]
            cleaned_text = re.sub(r"<think>.*?</think>", "", response_text, flags=re.DOTALL).strip()
            return cleaned_text
        return "No valid outfit found in response."


class WardrobeGuru:
    """ Orchestrates the LangGraph flow in a sequential order: Weather → Wardrobe → LLM. """
    def __init__(self):
        self.graph = lg.Graph()

        # Define nodes
        self.graph.add_node("weather_tool", WeatherTool().run)
        self.graph.add_node("wardrobe_tool", WardrobeTool().run)
        self.graph.add_node("deepseek_node", DeepSeekNode().run)
        self.graph.add_node("response_cleaner", DeepSeekResponseCleaner().run)

        # Define flow: weather → wardrobe → LLM → clean response
        self.graph.add_edge("weather_tool", "wardrobe_tool")
        self.graph.add_edge("wardrobe_tool", "deepseek_node")
        self.graph.add_edge("deepseek_node", "response_cleaner")

        # Set entry and exit points
        self.graph.set_entry_point("weather_tool")
        self.graph.set_finish_point("response_cleaner")

        # Compile the graph
        self.pipeline = self.graph.compile()

    def get_outfit_from_deepseek(self, wardrobe):
        """ Runs the LangGraph pipeline with the wardrobe input and returns the cleaned LLM response. """
        result = self.pipeline.invoke({"wardrobe": wardrobe})  # ✅ Correct input structure
        return result

