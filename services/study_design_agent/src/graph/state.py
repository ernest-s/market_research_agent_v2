from typing import TypedDict, List, Optional


class State(TypedDict):
    conversation_history: List[dict]    # [{role: 'user', content:'...'}]
    user_input: Optional[str]           # Latest user message
    agent_message: Optional[str]        # Message for Dialogue Agent
    status: Optional[str]               # Controls flow


def initial_state() -> State:
    return {
        "conversation_history": [],
        "user_input": None,
        "agent_message": None,
        "status": None
    }
