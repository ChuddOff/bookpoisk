import json
import re


def try_fix_json(text: str):
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        return False

    text = text.strip()
    text = text[text.find("{"):text.rfind("}") + 1]
    text = text.replace("“", "\"").replace("”", "\"").replace("«", "\"").replace("»", "\"")
    text = re.sub(r'":\s*"([^"]*)\n([^"]*)"', r'": "\1 \2"', text)

    try:
        return json.loads(text)

    except json.JSONDecodeError:
        return False
