import re

class DeepSeekResponseCleaner:
    """ Cleans up the DeepSeek response. """
    def run(self, response_json):
        if "response" in response_json:
            response_text = response_json["response"]
            cleaned_text = re.sub(r"<think>.*?</think>", "", response_text, flags=re.DOTALL).strip()
            return cleaned_text
        return "No valid outfit found in response."
