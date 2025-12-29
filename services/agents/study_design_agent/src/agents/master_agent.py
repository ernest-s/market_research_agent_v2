import os
import sys
import json

current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(current)
sys.path.append(parent)

import config
from chains.information_extraction_chain import run_information_extraction
from chains.challenges_opportunities_chain import run_challenges_opportunities


newline_char = "\n"


class MasterAgent:
    @staticmethod
    def step(state, user_input):
        """
        Replace this later with full LangGraph logic.
        For now: when user says 'hi' or anything, return the study-brief question.
        """
        if state["status"] == "start":
            # Master Agent is called for the first time
            state["status"] = "awaiting_brief_choice"
            state["agent_message"] = "Ask the user if they already have a study brief or need help creating one."
            state["options"] = ["I already have a brief", "I need help creating a brief"]
            state["option_type"] = "single-select"
            return state
        elif state["status"] == "awaiting_brief_choice":
            if user_input == "I already have a brief":
                state["status"] = "awaiting_brief_upload"
                state["agent_message"] = "Please upload the study brief."
                return state
            if user_input == "I need help creating a brief":
                state["status"] = "awaiting_study_type"
                state["agent_message"] = "Let me know what type of study do you want to conduct. "
                state["agent_message"] += "You can select from the below options or choose to type."
                state["options"] = [
                    "Brand Health / Equity",
                    "New Product / Concept Test",
                    "Pricing & Value Perception",
                    "Usage & Attitude",
                    "Segmentation / Persona Deep-dive",
                    "Sustainability / CSR Perception",
                    "Customer Journey / Pain-points",
                    "Re-positioning / Comms Test",
                    "Others"]
                state["option_type"] = "single-select"
                return state
        elif state["status"] == "awaiting_brief_upload":
            state["status"] = "complete"
            state["agent_message"] = "Upload process under construction."
            return state
        elif state["status"] == "awaiting_study_type":
            state["study_type"] = user_input
            state["status"] = "awaiting_research_objective"
            state["agent_message"] = "Please state your research objective."
            return state
        elif state["status"] == "awaiting_research_objective":
            state["research_objective"] = user_input
            extracted_info = run_information_extraction(user_input)
            extracted_info = json.loads(extracted_info)
            if config.client_company:
                state["company"] = config.client_company
            else:
                state["company"] = extracted_info["company_name"]
            state["product"] = extracted_info["product_or_service"]
            if state["company"] == "Not Found.":
                state["status"] = "awaiting_company_name"
                state["agent_message"] = "For which company are we running this study?"
            else:
                state = get_challenges_opportunities(state)
                if state["status"] == "confirm_challenges_opportunities":
                    state["agent_message"] = "Take a look a the challenges and opportunities and modify them if needed."
                    option_message = f"""{state['study_brief']['objective']}{newline_char}Challenges:
                    {newline_char} {newline_char.join(state['study_brief']['challenges'])}{newline_char}Opportunities: 
                    {newline_char} {newline_char.join(state['study_brief']['opportunities'])}"""
                    state["options"] = option_message
                    state["option_type"] = "plain-text-modify"
                return state
        elif state["status"] == "awaiting_company_name":
            state["company"] = user_input
            state = get_challenges_opportunities(state)
            if state["status"] == "confirm_challenges_opportunities":
                state["agent_message"] = "Take a look a the challenges and opportunities and modify them if needed."
                option_message = f"""{state['study_brief']['objective']}{newline_char}Challenges: {newline_char} {
                newline_char.join(state['study_brief']['challenges'])}{newline_char}Opportunities: {newline_char} {
                newline_char.join(state['study_brief']['opportunities'])}"""
                state["options"] = option_message
                state["option_type"] = "plain-text-modify"
            return state
        # elif state["status"] == "confirm_challenges_opportunities":
        #    state = modify_challenges_opportunities(state)
        #    state = get_objective_questions(state)
        else:
            # Stop execution
            state["status"] = "complete"
            state["agent_message"] = "Process is completed."
            return state


def get_challenges_opportunities(state, counter=0):
    # Try a maximum of 5 times
    if counter < 5:
        challenges_opportunities = run_challenges_opportunities(state["research_objective"], state["company"])
        try:
            challenges_opportunities = json.loads(challenges_opportunities)
        except:
            print("******* FAILURE ********")
            challenges_opportunities = ""
        state["study_brief"] = {}
        if "objective_summary" in challenges_opportunities:
            state["study_brief"]["objective"] = challenges_opportunities["objective_summary"]
        else:
            state = get_challenges_opportunities(state, counter+1)
        if "challenges" in challenges_opportunities:
            state["study_brief"]["challenges"] = challenges_opportunities["challenges"]
        else:
            state = get_challenges_opportunities(state, counter+1)
        if "opportunities" in challenges_opportunities:
            state["study_brief"]["opportunities"] = challenges_opportunities["opportunities"]
        else:
            state = get_challenges_opportunities(state, counter=1)
        state["status"] = "confirm_challenges_opportunities"
    else:
        state["status"] = "failure"
        state["agent_message"] = "Get challenges opportunities failed."
    return state

    return state

def modify_challenges_opportunities(state):
    return state
