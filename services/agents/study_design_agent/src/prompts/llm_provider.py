import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
env_path = os.path.join(base_dir, ".env")
load_dotenv(env_path)
openai_api_key = os.getenv("OPENAI_API_KEY")

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, max_completion_tokens=4096, api_key=openai_api_key)
