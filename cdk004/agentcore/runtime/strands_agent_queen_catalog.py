# Example queries the agent can answer:
#  agent("List all songs written by John Deacon.")
#  agent("Find all Hard Rock tracks from 1974 where Freddie Mercury is the singer.")
#  agent("How many songs are on each album in the dataset?")
#  agent("Show me all ballads released between 1974 and 1977.")
#  agent("Who wrote the most songs in the catalog between 1973 and 1979?")

from strands import Agent
from strands.models import BedrockModel
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands_tools_queen_catalog import QueenCatalogTools
import argparse
import json

#Defining which Bedrock Model to use
bedrock_model_id = "global.amazon.nova-2-lite-v1:0"

#Initializing the agentcore app
app = BedrockAgentCoreApp()

#Initializing the class-based strands tools
catalog = QueenCatalogTools("queen_catalog.csv")

#Agent setup
agent = Agent(
    model =
        BedrockModel(
            model_id = bedrock_model_id
        ),
    tools = [catalog.search_queen_songs, catalog.get_catalog_stats],
    system_prompt = (
        "You are a Queen Discography Catalog Assistant."
        "Your source of truth is the data returned by your catalog tools."
        "STRICT RULES:"
        "1. Answer ONLY questions that can be directly answered using rows returned by your CSV tools."
        "2. If the user asks about band members' personal lives, biographies, or anything not related to discography, refuse it."
        "3. Every claim in your response must come directly from a tool result, do not guess or invent data."
    )
)

#Informing entrypoint for the agentcore runtime to call /invocations
@app.entrypoint
def strands_agent_bedrock(payload):
    user_input = payload.get("prompt")
    response = agent(user_input)
    return response.message['content'][0]['text']

#Giving agentcore runtime the control to run the app
if __name__ == "__main__":
    app.run()
