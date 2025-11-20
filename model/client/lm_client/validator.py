from openai.types.chat import ChatCompletion


def validate_answer(response: ChatCompletion) -> bool:
    ...