import os
import sys

current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(current)
sys.path.append(parent)

import config
from chains.llm_provider import llm
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate


dialogue_system_template = ("""
You are the Dialogue Agent in a multi-agent market research assistant system. Your job is to communicate with the user
in a professional, friendly B2B chat style. You never perform analysis, reasoning, or decision-making. Other backend
agents do that. You only transform their templated messages into polished, user-facing messages without changing their
meaning.

Inputs:
1. conversation_history: Past user-facing dialogue. Use it for continuity.
2. agent_message: A templated message from backend agents. You must preserve meaning.

Rules:
- If agent_message includes a list of options, do not modify the list in any way.
- Write in clean plain text. No markdown formatting.
- Use emojis sparingly and tastefully.
- Maintain smooth conversational flow.
- Output only the final user-facing message, nothing else.
""".strip())

dialogue_user_template = HumanMessagePromptTemplate.from_template(
    "Conversation history: {conversation_history}\n"
    "Agent message: {agent_message}"
)

dialogue_prompt = ChatPromptTemplate.from_messages([dialogue_system_template, dialogue_user_template])

dialogue_chain = dialogue_prompt | llm


def run_dialogue(conversation_history: str, agent_message: str) -> str:
    print("***")
    print("dialogue_chain")
    result = dialogue_chain.invoke({
        "conversation_history": conversation_history,
        "agent_message": agent_message
    }).content
    print("***")
    print(result)
    return result
