import re

from openai import OpenAI
from language_model.config import *
from language_model.validation.validators import validate_response
from language_model.utils.retry import retry

client = OpenAI(base_url=MODEL_URL, api_key=MODEL_KEY)


@retry
@validate_response
def generate(prompt: str) -> str:
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "assistant", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    )
    answer = response.choices[0].message.content
    return re.sub(r"<think>.*?</think>", "", answer, flags=re.DOTALL).strip()
