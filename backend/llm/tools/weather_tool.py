class WeatherTool:
    """ Fetches weather information. For now, it returns dummy weather data as a dictionary. """
    def run(self, data):
        """
        Returns weather data while preserving the existing input (wardrobe).
        `data` contains the initial input, so we need to include it in the return.
        """
        return {**data, "weather": "sunny, 18°C"}  # ✅ Merge input data with weather