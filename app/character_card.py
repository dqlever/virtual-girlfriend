import json
from .config import get_character_card_path

_card_cache = None

def load_character_card():
    global _card_cache
    if _card_cache is not None:
        return _card_cache
    path = get_character_card_path()
    with open(path, "r", encoding="utf-8") as f:
        _card_cache = json.load(f)
    return _card_cache

def get_character_name():
    return load_character_card().get("name", "未知")

def get_character_persona():
    return load_character_card().get("persona", "")

def get_character_speaking_style():
    return load_character_card().get("speaking_style", "")

def get_character_region():
    return load_character_card().get("region", "")

def get_character_greeting():
    return load_character_card().get("greeting", "你好呀~")

def get_character_scenario():
    return load_character_card().get("scenario", "")

def reload_character_card():
    global _card_cache
    _card_cache = None
    return load_character_card()
