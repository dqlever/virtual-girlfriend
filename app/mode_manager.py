import re

DEBUG_PREFIX_PATTERN = re.compile(r'^at\[(.+)\]$', re.DOTALL)

def check_debug_mode(message):
    match = DEBUG_PREFIX_PATTERN.match(message.strip())
    if match:
        return True, match.group(1)
    return False, message

def get_mode_announcement(entering_debug):
    if entering_debug:
        return "🔧 已切换到调试模式，聊完自动切回~"
    else:
        return "💕 调试结束，继续陪你聊天啦~"
