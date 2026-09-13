import os
import yaml

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.yaml")

_config_cache = None

def load_config():
    global _config_cache
    if _config_cache is not None:
        return _config_cache
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        _config_cache = yaml.safe_load(f)
    return _config_cache

def get_llm_config():
    cfg = load_config().get("llm", {})
    if os.environ.get("LLM_API_KEY"):
        cfg["api_key"] = os.environ["LLM_API_KEY"]
    if os.environ.get("LLM_BASE_URL"):
        cfg["base_url"] = os.environ["LLM_BASE_URL"]
    if os.environ.get("LLM_MODEL"):
        cfg["model"] = os.environ["LLM_MODEL"]
    return cfg

def get_server_config():
    cfg = load_config().get("server", {})
    if os.environ.get("PORT"):
        cfg["port"] = int(os.environ["PORT"])
    if os.environ.get("HOST"):
        cfg["host"] = os.environ["HOST"]
    return cfg

def get_memory_config():
    return load_config().get("memory", {})

def get_intimacy_config():
    return load_config().get("intimacy", {})

def get_scheduler_config():
    return load_config().get("scheduler", {})

def get_character_card_path():
    path = load_config().get("character_card", "characters/example.json")
    if not os.path.isabs(path):
        base = os.path.dirname(os.path.dirname(__file__))
        path = os.path.join(base, path)
    return path

def get_db_path():
    path = get_memory_config().get("db_path", "data/memory.db")
    if not os.path.isabs(path):
        base = os.path.dirname(os.path.dirname(__file__))
        path = os.path.join(base, path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path
