import os
import sys

current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(current)
sys.path.append(parent)

import config
from chains.llm_provider import llm
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate


challenges_opportunities_system_template = ("""
You are a market research assistant.

Your task:
Given the research objective and company name, produce a JSON output with three fields:
1. 'objective_summary': Rewrite the research objective provided by the user in 1–2 clear sentences without changing its 
meaning.
2. 'challenges': List 2–3 realistic challenges a company may face based strictly on the objective and the product/
service mentioned.
3. 'opportunities': List 2–3 realistic opportunities the company may explore based strictly on the objective and 
product/service.

Input:
- Research Objective
- Company Name

Rules:
1. Do NOT alter the meaning of the objective.
2. Do NOT fabricate goals not present in the objective.
3. Challenges and opportunities must logically follow from the objective and the nature of the product/service.
4. Keep everything crisp, concise, and business-focused.
5. Output ONLY valid JSON in the following structure and nothing else:
    {{
        'objective_summary': '...',
        'challenges': [],
        'opportunities': []
    }}
6. Do NOT add explanations, reasoning, or any text outside of the JSON.
""".strip())


challenges_opportunities_template = HumanMessagePromptTemplate.from_template(
    "Research Objective: {research_objective}\n"
    "Company Name: {company_name}"
)


challenges_opportunities_prompt = ChatPromptTemplate.from_messages([challenges_opportunities_system_template,
                                                                    challenges_opportunities_template])

challenges_opportunities_chain = challenges_opportunities_prompt | llm


def run_challenges_opportunities(research_objective: str, company_name: str) -> str:
    print("***")
    print("run_challenges_opportunities_chain")
    result = challenges_opportunities_chain.invoke({
        "research_objective": research_objective,
        "company_name": company_name
    }).content
    print("***")
    print(result)
    return result
