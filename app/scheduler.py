from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from .config import get_scheduler_config
from .memory_system import delete_expired_memories, cleanup_by_tag, FOLDER_CHAT, FOLDER_DAILY, generate_daily_summary

_scheduler = None

async def scheduled_cleanup():
    deleted = await delete_expired_memories()
    await cleanup_by_tag("短期记忆", FOLDER_CHAT)
    await cleanup_by_tag("情绪记忆", FOLDER_CHAT)
    await cleanup_by_tag("短期记忆", FOLDER_DAILY)
    await generate_daily_summary()

def get_scheduler():
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
        cfg = get_scheduler_config()
        hour = cfg.get("cleanup_hour", 3)
        minute = cfg.get("cleanup_minute", 0)
        _scheduler.add_job(
            scheduled_cleanup,
            CronTrigger(hour=hour, minute=minute),
            id="memory_cleanup",
            replace_existing=True,
        )
    return _scheduler

def start_scheduler():
    scheduler = get_scheduler()
    if not scheduler.running:
        scheduler.start()

def stop_scheduler():
    scheduler = get_scheduler()
    if scheduler.running:
        scheduler.shutdown()
