from .memory_system import (
    get_intimacy_score,
    update_intimacy_score,
    check_daily_first_interaction,
    mark_daily_interaction,
)
from .config import get_intimacy_config

def get_intimacy_level(score):
    if score <= 20:
        return "礼貌但疏远"
    elif score <= 40:
        return "友好、轻松（初识阶段）"
    elif score <= 60:
        return "亲密、撒娇"
    elif score <= 80:
        return "甜蜜、依赖"
    else:
        return "深度亲密、默契"

def get_tone_modifier(score):
    if score <= 20:
        return "保持礼貌和适度距离，不要太亲近"
    elif score <= 40:
        return "友好轻松，像刚认识的朋友，偶尔开个玩笑"
    elif score <= 60:
        return "亲密撒娇，偶尔用可爱的语气，可以主动关心对方"
    elif score <= 80:
        return "甜蜜依赖，经常撒娇，主动表达想念和关心"
    else:
        return "深度亲密默契，像恋人一样自然对话，可以任性撒娇"

async def process_message_interaction():
    rules = get_intimacy_config().get("rules", {})
    is_first = await check_daily_first_interaction()
    if is_first:
        await update_intimacy_score(rules.get("daily_first", 1), "每日首次互动")
        await mark_daily_interaction()
    return is_first

async def apply_care_bonus():
    rules = get_intimacy_config().get("rules", {})
    await update_intimacy_score(rules.get("care_greeting", 2), "收到关心/问候")

async def apply_happy_bonus():
    rules = get_intimacy_config().get("rules", {})
    await update_intimacy_score(rules.get("make_happy", 5), "说了让对方开心的话")

async def apply_argument_penalty():
    rules = get_intimacy_config().get("rules", {})
    await update_intimacy_score(rules.get("argument", -5), "争吵/不愉快")

async def apply_round_bonus(round_count):
    rules = get_intimacy_config().get("rules", {})
    if round_count > 0 and round_count % 10 == 0:
        await update_intimacy_score(rules.get("chat_over_10_rounds", 3), "聊天超过10轮")
