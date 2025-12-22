from langgraph.graph import StateGraph, START, END
from state import State
from src.agents.dialogue_agent import DialogueAgent
from src.agents.master_agent import MasterAgent


def capture_user_input(state: State, user_text: str) -> State:
    state["user_input"] = user_text
    state["conversation_history"].append({"role": "user", "content": user_text})
    return state


def build_graph():
    workflow = StateGraph(State)

    dialogue = DialogueAgent()
    master = MasterAgent()

    # Nodes
    workflow.add_node("capture_user_input", capture_user_input)
    workflow.add_node("master_agent", master.run)
    workflow.add_node("dialogue_agent", dialogue.run)

    # Edges
    workflow.add_edge(START, "capture_user_input")
    workflow.add_edge("capture_user_input", "master_agent")
    workflow.add_edge("master_agent", "dialogue_agent")
    workflow.add_edge("dialogue_agent", END)

    return workflow.compile()
