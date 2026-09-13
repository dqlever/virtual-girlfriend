import os
import yaml

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.yaml")

DEFAULT_CONFIG = {
    "llm": {
        "api_key": "",
        "base_url": "https://api.deepseek.com/v1",
        "model": "deepseek-chat",
        "temperature": 0.8,
        "max_tokens": 500,
    },
    "server": {
        "host": "0.0.0.0",
        "port": 8000,
    },
    "memory": {
        "db_path": "data/memory.db",
        "short_term_ttl": 86400,
        "long_term_ttl": 604800,
    },
    "intimacy": {
        "initial_score": 30,
        "per_message_bonus": 0.5,
        "round_bonus": 2,
        "daily_login_bonus": 5,
        "max_score": 100,
        "rules": {
            "daily_first": 1,
            "care_greeting": 2,
            "make_happy": 5,
            "argument": -5,
            "chat_over_10_rounds": 3,
        },
    },
    "scheduler": {
        "cleanup_hour": 3,
        "cleanup_minute": 0,
    },
    "character_card": "characters/example.json",
    "auth": {
        "password": "xp5201314",
    },
}

_config_cache = None

def load_config():
    global _config_cache
    if _config_cache is not None:
        return _config_cache
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            file_cfg = yaml.safe_load(f) or {}
        _config_cache = _deep_merge(DEFAULT_CONFIG, file_cfg)
    else:
        _config_cache = DEFAULT_CONFIG
    return _config_cache

def _deep_merge(base, override):
    result = base.copy()
    for k, v in override.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = _deep_merge(result[k], v)
        else:
            result[k] = v
    return result

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

def get_auth_password():
    pwd = load_config().get("auth", {}).get("password", "")
    env_pwd = os.environ.get("AUTH_PASSWORD")
    if env_pwd:
        pwd = env_pwd
    return pwd

def get_db_path():
    path = get_memory_config().get("db_path", "data/memory.db")
    if not os.path.isabs(path):
        base = os.path.dirname(os.path.dirname(__file__))
        path = os.path.join(base, path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path
