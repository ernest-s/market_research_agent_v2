def conversation_history_to_text(history: list[dict]) -> str:
    lines = []
    for msg in history:
        role = "User" if msg["role"] == "user" else "Assistant"
        lines.append(f"{role}: {msg['message']}")
    return "\n".join(lines)

# Sample conversation
# conversation_history = [
#     {"role": "user", "content": "Hi, I need help with a study."},
#     {"role": "agent", "content": "Sure, can you describe your product?"},
#     {"role": "user", "content": "It's a SaaS analytics tool."},
#     {"role": "agent", "content": "Thanks. What is the main goal of the study?"}
# ]
