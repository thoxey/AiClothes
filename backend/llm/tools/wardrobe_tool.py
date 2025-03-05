class WardrobeTool:
    """Generates a formatted prompt based on the wardrobe and weather conditions."""

    def run(self, data):
        wardrobe = data.get("wardrobe")  # ✅ Wardrobe is now guaranteed to exist
        weather = data.get("weather", "Unknown weather")  # ✅ Get weather safely

        if not isinstance(wardrobe, list):
            raise ValueError("Invalid wardrobe format. Expected a list of clothing items.")

        prompt = f"Weather conditions: {weather}°C\n"
        prompt += "Select a fashionable outfit based on the following wardrobe:\n\n"

        for item in wardrobe:
            if not isinstance(item, dict) or "clothingType" not in item or "colors" not in item or "style" not in item:
                raise ValueError("Each clothing item must have 'clothingType', 'colors', and 'style'.")

            colors = ", ".join(item["colors"]) if isinstance(item["colors"], list) else item["colors"]
            pattern = f" with a {item['pattern']} pattern" if item.get("pattern") and item[
                "pattern"].lower() != "solid" else ""
            style = f"({item['style']})" if item.get("style") else ""

            prompt += f"- Your {colors} {item['clothingType']}{pattern} {style}\n"

        prompt += "\nProvide a single complete outfit that is stylish and well-coordinated.\n"
        prompt += "Make sure not to have multiple equivalent items, e.g. tshirt and a polo.\n"
        prompt += "Have at least a Top and a bottom. If it is colder then a mid layer and if it is even colder an outerwear too\n"
        prompt += "Use a fun casual tone, but still professional, and feel free to use appropriate emojis.\n"
        prompt += "This is for an app that helps users decide what to wear based on their wardrobe and the weather.\n"
        prompt += "The response should be concise and fit within a single message box.\n"
        prompt += "Only use the items provided in the wardrobe—do not add new items.\n"
        prompt += "Refer to the items endearingly as 'your [item name]' to create a personal touch.\n"

        return {"prompt": prompt}  # ✅ Always return a dictionary
