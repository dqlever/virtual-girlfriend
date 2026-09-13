import aiosqlite
import json
import time
from datetime import datetime, timedelta
from .config import get_db_path

FOLDER_CHAT = "微信女友/聊天记录"
FOLDER_PROFILE = "微信女友/用户画像"
FOLDER_DAILY = "微信女友/每日整理"

TAG_PERMANENT = "永久记忆"
TAG_LONG = "长期记忆"
TAG_SHORT = "短期记忆"
TAG_EMOTIONAL = "情绪记忆"

RETENTION_DAYS = {
    TAG_PERMANENT: -1,
    TAG_LONG: 90,
    TAG_SHORT: 14,
    TAG_EMOTIONAL: 7,
}

_db = None

async def get_db():
    global _db
    if _db is None:
        _db = await aiosqlite.connect(get_db_path())
        await _db.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                folder_path TEXT NOT NULL,
                tags TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT
            )
        """)
        await _db.execute("""
            CREATE TABLE IF NOT EXISTS intimacy (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                score INTEGER NOT NULL DEFAULT 30,
                updated_at TEXT NOT NULL,
                last_interaction TEXT,
                daily_interacted INTEGER DEFAULT 0
            )
        """)
        await _db.execute("""
            CREATE TABLE IF NOT EXISTS chat_stats (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                total_messages INTEGER NOT NULL DEFAULT 0,
                total_replies INTEGER NOT NULL DEFAULT 0,
                current_round INTEGER NOT NULL DEFAULT 0,
                mode_switches INTEGER NOT NULL DEFAULT 0
            )
        """)
        await _db.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                extras TEXT,
                created_at TEXT NOT NULL
            )
        """)
        await _db.commit()
        await _init_intimacy()
        await _init_stats()
    return _db

async def _init_intimacy():
    db = await get_db()
    async with db.execute("SELECT score FROM intimacy WHERE id = 1") as cur:
        row = await cur.fetchone()
    if row is None:
        now = datetime.now().isoformat()
        await db.execute(
            "INSERT INTO intimacy (id, score, updated_at, last_interaction, daily_interacted) VALUES (1, 30, ?, NULL, 0)",
            (now,)
        )
        await db.commit()

async def _init_stats():
    db = await get_db()
    async with db.execute("SELECT total_messages FROM chat_stats WHERE id = 1") as cur:
        row = await cur.fetchone()
    if row is None:
        await db.execute(
            "INSERT INTO chat_stats (id, total_messages, total_replies, current_round, mode_switches) VALUES (1, 0, 0, 0, 0)"
        )
        await db.commit()

async def create_memory(title, content, folder_path, tags):
    db = await get_db()
    now = datetime.now().isoformat()
    expires_at = None
    for tag in tags.split(","):
        tag = tag.strip()
        days = RETENTION_DAYS.get(tag)
        if days is not None and days > 0:
            expires_at = (datetime.now() + timedelta(days=days)).isoformat()
            break
    await db.execute(
        "INSERT INTO memories (title, content, folder_path, tags, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
        (title, content, folder_path, tags, now, expires_at)
    )
    await db.commit()

async def query_memory(query, folder_path=None, limit=10):
    db = await get_db()
    sql = "SELECT id, title, content, folder_path, tags, created_at FROM memories WHERE content LIKE ?"
    params = [f"%{query}%"]
    if folder_path:
        sql += " AND folder_path = ?"
        params.append(folder_path)
    sql += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    async with db.execute(sql, params) as cur:
        rows = await cur.fetchall()
    return [{"id": r[0], "title": r[1], "content": r[2], "folder_path": r[3], "tags": r[4], "created_at": r[5]} for r in rows]

async def query_by_tag(tag, folder_path=None, limit=50):
    db = await get_db()
    sql = "SELECT id, title, content, tags, created_at FROM memories WHERE tags LIKE ?"
    params = [f"%{tag}%"]
    if folder_path:
        sql += " AND folder_path = ?"
        params.append(folder_path)
    sql += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    async with db.execute(sql, params) as cur:
        rows = await cur.fetchall()
    return [{"id": r[0], "title": r[1], "content": r[2], "tags": r[3], "created_at": r[4]} for r in rows]

async def delete_memory(memory_id):
    db = await get_db()
    await db.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
    await db.commit()


async def add_chat_history(role, content, extras=None):
    db = await get_db()
    now = datetime.now().isoformat()
    extras_json = json.dumps(extras, ensure_ascii=False) if extras else None
    await db.execute(
        "INSERT INTO chat_history (role, content, extras, created_at) VALUES (?, ?, ?, ?)",
        (role, content, extras_json, now)
    )
    await db.execute("DELETE FROM chat_history WHERE id NOT IN (SELECT id FROM chat_history ORDER BY id DESC LIMIT 60)")
    await db.commit()


async def get_recent_chat_history(limit=20):
    db = await get_db()
    async with db.execute(
        "SELECT role, content, extras, created_at FROM chat_history ORDER BY id DESC LIMIT ?",
        (limit,)
    ) as cur:
        rows = await cur.fetchall()
    result = []
    for r in reversed(rows):
        role = r[0]
        content = r[1]
        extras_json = r[2]
        if extras_json:
            try:
                extras = json.loads(extras_json)
                parts = [content]
                for ext in extras:
                    if ext.get("type") == "image":
                        parts.append("[发送了一张图片]")
                    elif ext.get("type") == "voice":
                        parts.append(f"[发送了一条语音消息: {ext.get('text', '')}]")
                    elif ext.get("type") == "emoji":
                        parts.append(f"[发送了表情: {ext.get('content', '')}]")
                    elif ext.get("type") == "redpacket":
                        parts.append(f"[发了一个红包: {ext.get('title', '')}]")
                    elif ext.get("type") == "location":
                        parts.append(f"[分享了位置: {ext.get('name', '')}]")
                    elif ext.get("type") == "fortune":
                        parts.append("[发了今日运势]")
                    elif ext.get("type") == "weather":
                        parts.append("[发了天气信息]")
                    elif ext.get("type") == "game":
                        parts.append("[邀请玩游戏]")
                    elif ext.get("type") == "moment":
                        parts.append(f"[发了朋友圈: {ext.get('content', '')}]")
                content = " ".join(parts)
            except:
                pass
        result.append({"role": role, "content": content})
    return result


async def clear_chat_history():
    db = await get_db()
    await db.execute("DELETE FROM chat_history")
    await db.commit()

async def delete_expired_memories():
    db = await get_db()
    now = datetime.now().isoformat()
    async with db.execute(
        "SELECT id FROM memories WHERE expires_at IS NOT NULL AND expires_at < ?", (now,)
    ) as cur:
        rows = await cur.fetchall()
    count = len(rows)
    if count > 0:
        await db.execute(
            "DELETE FROM memories WHERE expires_at IS NOT NULL AND expires_at < ?", (now,)
        )
        await db.commit()
    return count

async def cleanup_by_tag(tag, folder_path=None):
    db = await get_db()
    sql = "DELETE FROM memories WHERE tags LIKE ?"
    params = [f"%{tag}%"]
    if folder_path:
        sql += " AND folder_path = ?"
        params.append(folder_path)
    cursor = await db.execute(sql, params)
    deleted = cursor.rowcount
    await db.commit()
    return deleted

async def get_intimacy_score():
    db = await get_db()
    async with db.execute("SELECT score FROM intimacy WHERE id = 1") as cur:
        row = await cur.fetchone()
    return row[0] if row else 30

async def update_intimacy_score(delta, reason=""):
    db = await get_db()
    now = datetime.now().isoformat()
    async with db.execute("SELECT score FROM intimacy WHERE id = 1") as cur:
        row = await cur.fetchone()
    current = row[0] if row else 30
    new_score = max(0, min(100, current + delta))
    await db.execute(
        "UPDATE intimacy SET score = ?, updated_at = ?, last_interaction = ? WHERE id = 1",
        (new_score, now, now)
    )
    await db.commit()
    return new_score

async def check_daily_first_interaction():
    db = await get_db()
    today = datetime.now().strftime("%Y-%m-%d")
    async with db.execute("SELECT last_interaction, daily_interacted FROM intimacy WHERE id = 1") as cur:
        row = await cur.fetchone()
    if row is None:
        return True
    last_date = row[0][:10] if row[0] else ""
    if last_date != today:
        await db.execute(
            "UPDATE intimacy SET daily_interacted = 0, last_interaction = ? WHERE id = 1",
            (datetime.now().isoformat(),)
        )
        await db.commit()
        return True
    return False

async def mark_daily_interaction():
    db = await get_db()
    await db.execute(
        "UPDATE intimacy SET daily_interacted = 1, last_interaction = ? WHERE id = 1",
        (datetime.now().isoformat(),)
    )
    await db.commit()

async def increment_stat(field, amount=1):
    db = await get_db()
    field_map = {
        "total_messages": "total_messages",
        "total_replies": "total_replies",
        "current_round": "current_round",
        "mode_switches": "mode_switches",
    }
    col = field_map.get(field)
    if not col:
        return
    await db.execute(f"UPDATE chat_stats SET {col} = {col} + ? WHERE id = 1", (amount,))
    await db.commit()

async def get_stats():
    db = await get_db()
    async with db.execute("SELECT total_messages, total_replies, current_round, mode_switches FROM chat_stats WHERE id = 1") as cur:
        row = await cur.fetchone()
    if row is None:
        return {"total_messages": 0, "total_replies": 0, "current_round": 0, "mode_switches": 0}
    return {"total_messages": row[0], "total_replies": row[1], "current_round": row[2], "mode_switches": row[3]}

async def get_memory_count():
    db = await get_db()
    async with db.execute("SELECT COUNT(*) FROM memories WHERE tags NOT LIKE '%系统%'") as cur:
        row = await cur.fetchone()
    return row[0] if row else 0

async def generate_daily_summary():
    today = datetime.now().strftime("%Y-%m-%d")
    memories = await query_memory("", FOLDER_CHAT, limit=50)
    score = await get_intimacy_score()
    stats = await get_stats()
    summary = f"""📊 今日统计：
  - 聊天轮数：{stats['current_round']}
  - 主要话题：见聊天记录
  - 值得记住的事：见用户画像

💕 关系进展：
  - 亲密度：{score}/100
  - 总消息数：{stats['total_messages']}
"""
    await create_memory(
        title=f"{today} 聊天总结",
        content=summary,
        folder_path=FOLDER_DAILY,
        tags="每日整理,短期记忆"
    )
    return summary
