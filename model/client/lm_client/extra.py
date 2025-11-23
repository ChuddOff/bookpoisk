import json
import re


def try_fix_json(text: str):
    text = text.strip()
    text = text[text.find("{"):text.rfind("}") + 1]
    text = text.replace("“", "\"").replace("”", "\"").replace("«", "\"").replace("»", "\"")
    text = re.sub(r'":\s*"([^"]*)\n([^"]*)"', r'": "\1 \2"', text)

    try:
        return json.loads(text)

    except json.JSONDecodeError:
        return False
