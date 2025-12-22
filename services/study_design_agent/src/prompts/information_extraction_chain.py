import os
import sys

current = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(current)
sys.path.append(parent)

import config
from chains.llm_provider import llm
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate

company_extraction_system_template = ("""
You are an information extraction assistant.

Your task is to extract the COMPANY NAME and the PRODUCT OR SERVICE that the 
market research objective is referring to.

Definitions:
- A 'product or service' can be explicit (e.g., 'Amazon Prime') or implicit/
  descriptive (e.g., 'sustainable home finance', 'digital payments platform',
  'enterprise SaaS solution').
- A company may or may not be explicitly mentioned in the objective.

Input: Market Research Objective

Rules:
1. If a company name is explicitly mentioned, return it exactly as written.
2. If the objective describes a product or service without naming it formally, 
   extract the descriptive phrase that represents the offering.
3. If only a product or service is mentioned, identify the company ONLY IF that 
   product or service is globally and uniquely owned by one company 
   (e.g., iPhone → Apple).
4. If multiple companies could plausibly offer the product or service, do NOT guess — 
   return 'Not Found.' for company_name.
5. If company name is missing, return 'Not Found.' for company_name.
6. If product/service is missing, return 'Not Found.' for product_or_service.
7. Output ONLY a JSON dictionary with two keys:
    {{
        'company_name': '...',
        'product_or_service': '...'
    }}
8. Do NOT add explanations, reasoning, or any text outside of the JSON.
""".strip())

company_extraction_template = HumanMessagePromptTemplate.from_template(
    "Market Research Objective: {research_objective}"
)

company_extraction_prompt = ChatPromptTemplate.from_messages([company_extraction_system_template,
                                                              company_extraction_template])

company_extraction_chain = company_extraction_prompt | llm


def run_information_extraction(research_objective: str) -> str:
    print("***")
    print("information_extraction_chain")
    result = company_extraction_chain.invoke({
        "research_objective": research_objective
    }).content
    print("***")
    print(result)
    return result
