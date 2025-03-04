class WardrobeTool:
    """ Generates a formatted prompt based on the wardrobe and weather conditions. """
    def run(self, data):
        wardrobe = data.get("wardrobe")  # ✅ Wardrobe is now guaranteed to exist
        weather = data.get("weather", "Unknown weather")  # ✅ Get weather safely

        if not isinstance(wardrobe, list):
            raise ValueError("Invalid wardrobe format. Expected a list of clothing items.")

        prompt = f"Weather conditions: {weather} degrees c\n"
        prompt += "Select a fashionable outfit based on the following wardrobe:\n\n"

        for item in wardrobe:
            if not isinstance(item, dict) or "clothingType" not in item or "dominantColor" not in item:
                raise ValueError("Each clothing item must have 'clothingType' and 'dominantColor'.")

            prompt += f"- A {item['dominantColor']} {item['clothingType']}\n"

        prompt += "\nProvide a single complete outfit that is stylish and well-coordinated.\n"
        prompt += "Use a fun casual tone, but still professional, feel free to use appropriate emojis.\n"
        prompt += "This is for an app that helps users decide what to wear based on their wardrobe and the weather. So the answer should make sense in the context of a user simply pressing a button and getting an outfit suggestion.\n"
        prompt += "Be economical with new lines since the output will be displayed in a single message box.\n"
        prompt += "Only use the items provided in the wardrobe, and don't add any new items.\n"
        prompt += "Refer to the items endearingly and as \"your [Item name]\" etc. since the items are all owned by the user.\n"

        return {"prompt": prompt}  # ✅ Always return a dictionary