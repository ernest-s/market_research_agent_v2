import streamlit as st
from agents.dialogue_agent import DialogueAgent

st.set_page_config(
    page_title="MRX Agent",
    page_icon="📊",
    layout="centered"
)

st.title("🔍📊 Your AI Market Research Partner")
st.caption("Let's design your market research study step by step")

# ---------------------------------------------------------
# Inject clean CSS (no icons, right/left aligned bubbles)
# ---------------------------------------------------------
st.markdown("""
<style>
.chat-bubble {
    padding: 0.75rem 1rem;
    margin: 0.35rem 0;
    border-radius: 1rem;
    max-width: 80%;
    font-size: 1rem;
    word-wrap: break-word;
}

.user-bubble {
    background-color: rgba(0, 123, 255, 0.15);
    color: var(--text-color);
    margin-left: auto;
    text-align: right;
}

.agent-bubble {
    background-color: rgba(108, 117, 125, 0.15);
    color: var(--text-color);
    margin-right: auto;
    text-align: left;
}
</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Session State
# ---------------------------------------------------------
if "conversation_history" not in st.session_state:
    st.session_state.conversation_history = []  # list of {"user": "..."} or {"agent": "..."}

if "agent_state" not in st.session_state:
    st.session_state.agent_state = {"status": "start",
                                    "conversation_history": []}  # LangGraph state


# Create Dialogue Agent instance
dialogue_agent = DialogueAgent()

# ---------------------------------------------------------
# Render history
# ---------------------------------------------------------
for item in st.session_state.conversation_history:
    role = item["role"]
    msg = item["message"]
    if role == "user":
        st.markdown(f'<div class="chat-bubble user-bubble"><strong>🧑 You:</strong> {msg}</div>',
                    unsafe_allow_html=True)
    else:
        st.markdown(f'<div class="chat-bubble agent-bubble"><strong>🛠️ Agent:</strong> {msg}</div>',
                    unsafe_allow_html=True)

# Fetch options from state
options = st.session_state.agent_state.get("options")
option_type = st.session_state.agent_state.get("option_type")


# ---------------------------------------------------------
# OPTION MODE (if agent provided button choices)
# ---------------------------------------------------------
if options and isinstance(options, list):
    cols_per_row = 3
    cols = st.columns(cols_per_row)
    selected_option = None
    if option_type in ("single-select", "single-select-free-text"):
        for i, option in enumerate(options):
            col = cols[i % cols_per_row]
            with col:
                if st.button(option, key=option, use_container_width=True):
                    st.session_state.selected_option = option
                    # Update session history
                    st.session_state.conversation_history.append({"role": "user", "message": option})
                    st.rerun()

        # ---------------------------------------------------------
        # Free-text mode: only show if option_type allows it
        # ---------------------------------------------------------
        if option_type == 'single-select-free-text':
            st.markdown("---")
            with st.form("chat_input_form", clear_on_submit=True):
                user_input = st.text_input("Type your message:", key="chat_input")
                submitted = st.form_submit_button("Send")

            if submitted and user_input.strip():
                # Update session history
                st.session_state.conversation_history.append({"role": "user", "message": user_input})

                # Send to dialogue agent
                agent_reply, updated_state = dialogue_agent.process(
                    user_input=user_input,
                    agent_state=st.session_state.agent_state
                )

                # Update session history
                st.session_state.conversation_history.append({"role": "agent", "message": agent_reply})

                # Update agent state
                st.session_state.agent_state = updated_state

                st.rerun()

        # ---------------------------------------------------------
        # Only run the agent when a real selection exists
        # ---------------------------------------------------------
        if st.session_state.get("selected_option") is not None:
            selected_option = st.session_state.selected_option
            st.session_state.selected_option = None
            agent_reply, updated_state = dialogue_agent.process(
                user_input=selected_option,
                agent_state=st.session_state.agent_state)

            # Display agent reply
            st.session_state.conversation_history.append({"role": "agent", "message": agent_reply})
            st.session_state.agent_state = updated_state
            # Clear the selection so it doesn't re-trigger forever
            st.session_state.selected_option = None

            st.rerun()
else:
    # ---------------------------------------------------------
    # CHECK FOR PRE-POPULATED TEXT MODE
    # ---------------------------------------------------------
    prefill = ""
    if st.session_state.agent_state.get("option_type") == "plain-text-modify":
        prefill = st.session_state.agent_state.get("options", "")

        # Clear these so this mode runs only once
        st.session_state.agent_state["options"] = ""
        st.session_state.agent_state["option_type"] = ""
    # ---------------------------------------------------------
    # NORMAL FREE-TEXT USER INPUT (with optional prefill)
    # ---------------------------------------------------------
    st.markdown("---")
    with st.form("chat_input_form", clear_on_submit=True):
        user_input = st.text_input("Type your message:", key="chat_input", value=prefill)
        submitted = st.form_submit_button("Send")

    if submitted and user_input.strip():
        # Update session history
        st.session_state.conversation_history.append({"role": "user", "message": user_input})

        # Send to dialogue agent
        agent_reply, updated_state = dialogue_agent.process(
            user_input=user_input,
            agent_state=st.session_state.agent_state
        )

        # Update session history
        st.session_state.conversation_history.append({"role": "agent", "message": agent_reply})

        # Update agent state
        st.session_state.agent_state = updated_state

        st.rerun()

# ---------------------------------------------------------
# Reset Sidebar Button
# ---------------------------------------------------------
st.sidebar.button("🔄 Reset", on_click=lambda: st.session_state.clear())
