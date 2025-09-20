def _validate_answer(answer: str) -> bool:
    if not isinstance(answer, str):
        return False

    if "recommended_books:" not in answer:
        return False

    if "1. " in answer and "2. " in answer:
        return False

    if len(answer.splitlines()) < 10:
        return False

    for line in answer.splitlines()[1:]:
        if " - " not in line:
            return False

    return True


def validate_response(func):
    def wrapper(*args, **kwargs):
        for i in range(5):
            answer = func(*args, **kwargs)
            if _validate_answer(answer):
                return answer
        return f"The model could not provide a valid response"
    return wrapper
