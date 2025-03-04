import langgraph.graph as lg

from backend.llm.deepseek_node import DeepSeekNode
from backend.llm.tools.deepseek_response_cleaner import DeepSeekResponseCleaner
from backend.llm.tools.wardrobe_tool import WardrobeTool
from backend.llm.tools.weather_tool import WeatherTool


class WardrobeGuru:
    """ Orchestrates the LangGraph flow in a sequential order: Weather → Wardrobe → LLM. """
    def __init__(self):
        self.graph = lg.Graph()

        # Define nodes
        #self.graph.add_node("weather_tool", WeatherTool().run)
        self.graph.add_node("wardrobe_tool", WardrobeTool().run)
        self.graph.add_node("deepseek_node", DeepSeekNode().run)
        self.graph.add_node("response_cleaner", DeepSeekResponseCleaner().run)

        # Define flow: weather → wardrobe → LLM → clean response
        #self.graph.add_edge("weather_tool", "wardrobe_tool")
        self.graph.add_edge("wardrobe_tool", "deepseek_node")
        self.graph.add_edge("deepseek_node", "response_cleaner")

        # Set entry and exit points
        self.graph.set_entry_point("wardrobe_tool")
        self.graph.set_finish_point("response_cleaner")

        # Compile the graph
        self.pipeline = self.graph.compile()

    def get_outfit_from_deepseek(self, wardrobe, weather):
        """ Runs the LangGraph pipeline with the wardrobe input and returns the cleaned LLM response. """
        result = self.pipeline.invoke({"wardrobe": wardrobe, "weather": weather})  # ✅ Correct input structure
        return result