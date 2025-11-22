from openai.types.chat import ChatCompletion


def validate_answer(response: ChatCompletion) -> bool:
    from . import try_fix_json

    try:
        text = response.choices[0].message.content.strip()
        try_fix_json(text)
        return True

    except Exception:
        return False
