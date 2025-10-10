#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
books_normalize.py
Чтение books.json -> обработка через локальную LLM (LM Studio OpenAI-совместимый API)
Результат сохраняется построчно в books_out.jsonl и в массив в books_out.json
"""

import os
import json
import time
import re
import requests
from typing import Optional, Dict, Any, List

# ----------------- Конфиг -----------------
INPUT_FILE = os.getenv("BOOKS_INPUT", "books.json")
OUTPUT_NDJSON = os.getenv("BOOKS_OUT_NDJSON", "books_out.jsonl")
FINAL_OUTPUT = os.getenv("BOOKS_OUT_JSON", "books_out.json")
LMSTUDIO_BASE = os.getenv("LMSTUDIO_API_URL", "http://localhost:1234/v1")
LMSTUDIO_API_KEY = os.getenv("LMSTUDIO_API_KEY", "lm-studio")
LMSTUDIO_MODEL = os.getenv("LMSTUDIO_MODEL", "maziyarpanahi/mistral-7b-instruct-v0.3")
REQUEST_TIMEOUT = 100
# --------------------------------------------------------------------------

def load_books(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_ndjson_append(path: str, obj: Dict[str, Any]):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")

def dump_final_json(ndjson_path: str, final_path: str):
    out = []
    with open(ndjson_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                out.append(json.loads(line))
    with open(final_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

def call_lmstudio_chat(messages: List[Dict[str, str]], model: str = LMSTUDIO_MODEL, temperature: float = 0.0, max_tokens: int = 800) -> str:
    url = LMSTUDIO_BASE.rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if LMSTUDIO_API_KEY:
        headers["Authorization"] = f"Bearer {LMSTUDIO_API_KEY}"
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    j = resp.json()
    try:
        return j["choices"][0]["message"]["content"]
    except Exception:
        return json.dumps(j, ensure_ascii=False)

def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r'(\{(?:.|\n)*\})', text)
        if not m:
            try:
                return json.loads(text.replace("'", '"'))
            except Exception:
                return None
        candidate = m.group(1)
        for end in range(len(candidate), 0, -1):
            try:
                return json.loads(candidate[:end])
            except Exception:
                continue
        try:
            return json.loads(candidate.replace("'", '"'))
        except Exception:
            return None

def normalize_book_with_lm(book: Dict[str, Any], retries: int = 2) -> Dict[str, Any]:
    system = (
        "Ты — помощник для очистки и нормализации метаданных книг. "
        "Получаешь JSON-объект книги. "
        "Верни ТОЛЬКО JSON с ключами:\n"
        '{ "title": string, "author": string, "year": string or null, "description": string or null, '
        '"genre": string or null, "tags": array of strings or null, "cover_url": string or null, '
        '"photos": array of strings or null, "pages": string or null, "read_link": string or null, '
        '"verified": {"year": bool, "pages": bool}, "changes": {"<field>": "explanation", ...} }'
    )

    user_msg = {"role": "user", "content": "INPUT_BOOK:\n" + json.dumps(book, ensure_ascii=False)}

    for attempt in range(1, retries + 1):
        try:
            resp_text = call_lmstudio_chat([{"role": "assistant", "content": system}, user_msg], model=LMSTUDIO_MODEL)
            parsed = extract_json_from_text(resp_text)
            if parsed is None:
                raise ValueError("LM ответ не является JSON")
            for k in ("title", "author", "year", "description", "genre", "tags", "pages", "verified", "changes"):
                if k not in parsed:
                    parsed.setdefault("changes", parsed.get("changes", {}))
                    parsed["changes"]["__missing_keys"] = f"LM не вернул ключ '{k}'"
            return parsed
        except Exception as e:
            print(f"[attempt {attempt}] Ошибка при вызове LLM: {e}")
            time.sleep(1)
    fallback = dict(book)
    fallback.setdefault("verified", {"year": False, "pages": False})
    fallback.setdefault("changes", {"error": "LM failed to produce valid JSON"})
    return fallback

def numeric_from_maybe_str(v):
    if v is None:
        return None
    if isinstance(v, int):
        return v
    if isinstance(v, str):
        s = re.sub(r'[^\d]', '', v)
        return int(s) if s.isdigit() else None
    try:
        return int(v)
    except Exception:
        return None

def final_validate_merge(original: Dict[str, Any], lm_out: Dict[str, Any]) -> Dict[str, Any]:
    res = dict(lm_out)
    curr_year = 2025
    y = numeric_from_maybe_str(res.get("year"))
    if y and 1000 <= y <= curr_year:
        res["year"] = str(y)
        res.setdefault("verified", {})["year"] = res.get("verified", {}).get("year", False)
    else:
        orig_y = numeric_from_maybe_str(original.get("year"))
        res["year"] = str(orig_y) if orig_y else None
        res.setdefault("verified", {})["year"] = False
        res.setdefault("changes", {})["year"] = res.get("changes", {}).get("year", "invalid year")
    p = numeric_from_maybe_str(res.get("pages"))
    if p and 1 <= p <= 20000:
        res["pages"] = str(p)
        res.setdefault("verified", {})["pages"] = res.get("verified", {}).get("pages", False)
    else:
        orig_p = numeric_from_maybe_str(original.get("pages"))
        res["pages"] = str(orig_p) if orig_p else None
        res.setdefault("verified", {})["pages"] = False
        res.setdefault("changes", {})["pages"] = res.get("changes", {}).get("pages", "invalid pages")
    def ensure_list(v):
        if v is None:
            return None
        if isinstance(v, list):
            return [str(x).strip() for x in v if x is not None]
        if isinstance(v, str):
            parts = [p.strip() for p in re.split(r'[;,]', v) if p.strip()]
            return parts if parts else None
        return None
    res["genre"] = ensure_list(res.get("genre"))
    res["tags"] = ensure_list(res.get("tags"))
    res["photos"] = ensure_list(res.get("photos")) or res.get("photos") or None
    desc = res.get("description")
    if isinstance(desc, str):
        desc = desc.strip()
        if len(desc) > 1200:
            desc = desc[:1200].rsplit(" ", 1)[0] + "…"
        res["description"] = desc
    for k in ("title", "author", "cover_url", "read_link"):
        if k not in res:
            res[k] = original.get(k)
    return res

def is_valid_book(book: Dict[str, Any]) -> bool:
    """
    Проверка, что объект действительно книга, а не набор/акция.
    Простейшая эвристика: наличие title и author, отсутствие слов вроде 'набор', 'коллекция', 'пак'
    """
    title = (book.get("title") or "").lower()
    author = (book.get("author") or "").lower()
    if not title or not author:
        return False
    blacklist = ["набор", "коллекция", "пак", "акция", "bundle"]
    for w in blacklist:
        if w in title:
            return False
    return True

def main():
    if not os.path.exists(INPUT_FILE):
        print("Не найден входной файл:", INPUT_FILE)
        return
    books = load_books(INPUT_FILE)
    processed_keys = set()
    if os.path.exists(OUTPUT_NDJSON):
        with open(OUTPUT_NDJSON, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    o = json.loads(line)
                    key = (o.get("title","").strip(), o.get("author","").strip())
                    processed_keys.add(key)
                except Exception:
                    continue

    for book in books:
        key = (book.get("title","").strip(), book.get("author","").strip())
        if key in processed_keys:
            print("Пропускаем уже обработанную книгу:", key)
            continue
        if not is_valid_book(book):
            print("Пропускаем не-книгу/набор:", key)
            continue

        print("Обрабатываю:", key)
        lm_out = normalize_book_with_lm(book)
        final = final_validate_merge(book, lm_out)
        final.setdefault("_meta", {})["generated_by"] = "lmstudio-local"
        save_ndjson_append(OUTPUT_NDJSON, final)
        processed_keys.add(key)
        time.sleep(0.3)

    dump_final_json(OUTPUT_NDJSON, FINAL_OUTPUT)
    print("Готово. Результат в:", OUTPUT_NDJSON, "и", FINAL_OUTPUT)

if __name__ == "__main__":
    main()
