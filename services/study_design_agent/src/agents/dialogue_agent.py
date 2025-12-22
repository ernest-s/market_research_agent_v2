from agents.master_agent import MasterAgent
from chains.dialogue_chain import run_dialogue
from utils.history import conversation_history_to_text


call_llm = True


class DialogueAgent:
    def __init__(self):
        self.master = MasterAgent()

    def process(self, user_input, agent_state):
        print("***")
        print(user_input)
        print("***")
        print(agent_state)
        """
        Main entrypoint called by Streamlit.
        It determines whether input came from the user or the master agent.

        Streamlit ALWAYS calls this when the user types something,
        so this is a USER message → forward to master agent.
        """
        # Update state's conversation history
        agent_state["conversation_history"].append({"role": "user", "message": user_input})

        # Remove options if any
        agent_state["options"] = None
        agent_state["option_type"] = None

        # USER sent a message → forward directly to master agent
        new_state = self.handle_user_input(user_input, agent_state)
        agent_message, new_state = self.handle_agent_message(new_state)
        return agent_message, new_state

    def handle_user_input(self, user_input, agent_state):
        """
        Receives user input, updates conversation history,
        passes control to MasterAgent, formats the response.
        """
        """
                Called by Streamlit when user types something.
                Forwards the input to the master agent, updates state.
                Does NOT call the dialogue chain.
                """
        # Call master agent with user input
        new_state = self.master.step(agent_state, user_input)
        return new_state

    @staticmethod
    def handle_agent_message(agent_state):
        """
        Called by Master Agent when it wants to show a message to the user.
        Uses dialogue chain to polish and format the message for UI.
        """
        # Convert conversation history to text for LLM
        history_text = conversation_history_to_text(agent_state["conversation_history"])

        # Call dialogue chain
        if call_llm:
            final_message = run_dialogue(
                conversation_history=history_text.strip(),
                agent_message=agent_state["agent_message"].strip()
            )
        else:
            final_message = agent_state["agent_message"]

        if "option_type" in agent_state:
            if agent_state["option_type"] in ("plain-text", "plain-text-modify"):
                final_message = f"{final_message}\n{agent_state['options']}"
                if agent_state["option_type"] == "plain-text":
                    agent_state["options"] = ""
                    agent_state["option_type"] = ""
        # Store agent message in history
        agent_state["conversation_history"].append({"role": "agent", "message": final_message})

        return final_message, agent_state
