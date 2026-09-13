# 💕 虚拟女友

> 一个完整的虚拟女友聊天应用，支持角色卡驱动、分层记忆、亲密度系统、模式切换、定时记忆清理、表情包、图片、语音、主动消息和朋友圈动态。

## 本地运行

### 1. 安装依赖
```bash
pip install -r requirements.txt
pip install websockets
```

### 2. 配置 API Key
编辑 `config.yaml`，或创建 `.env` 文件：
```
LLM_API_KEY=你的API Key
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
```

### 3. 启动
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --ws websockets
```

手机访问 `http://<电脑IP>:8000`

---

## 云端部署（Render 免费版）

部署后手机随时可用，电脑不用开机。

### 步骤 1：推送到 GitHub
```bash
cd virtual-girlfriend
git init
git add .
git commit -m "虚拟女友项目"
git remote add origin https://github.com/你的用户名/virtual-girlfriend.git
git push -u origin main
```

### 步骤 2：在 Render 部署
1. 打开 [render.com](https://render.com)，注册/登录
2. 点 **New +** → **Web Service**
3. 连接你的 GitHub 仓库
4. 选择仓库后 Render 会自动检测 `render.yaml`
5. 在 **Environment** 中添加环境变量：
   - `LLM_API_KEY` = 你的 DeepSeek API Key
   - `LLM_BASE_URL` = `https://api.deepseek.com/v1`
   - `LLM_MODEL` = `deepseek-chat`
6. 点 **Create Web Service**
7. 等待 2-3 分钟构建完成

### 步骤 3：手机访问
Render 会给你一个地址，如 `https://virtual-girlfriend-xxxx.onrender.com`
手机浏览器打开即可，任何网络都能访问。

### 免费版限制
- 15 分钟无活动会休眠，下次访问冷启动约 30 秒
- 每月 750 小时免费时长
- 数据库（SQLite）在休眠后重置，长期记忆需要外部数据库

---

## 功能清单

| 功能 | 说明 |
|------|------|
| 角色卡驱动 | 通过 JSON 定义角色人设、性格、语气 |
| 分层记忆 | 永久/长期/短期/情绪 四级记忆，自动过期 |
| 亲密度系统 | 0-100 动态评分，影响称呼和语气 |
| 模式切换 | `at[...]` 进入调试模式 |
| 定时清理 | 每日凌晨 3 点自动清理过期记忆 |
| 表情包 | 按上下文发送 emoji |
| 图片消息 | 聊到美食/自拍/猫等话题自动发图 |
| 语音消息 | 随机发送语音气泡 |
| 主动消息 | 每 2-5 分钟主动关心你 |
| 朋友圈动态 | 偶尔发一条朋友圈卡片 |
| 已读回执 | 消息发送后显示"已读" |
| 打字动画 | "对方正在输入..." + 仿真打字延迟 |
| 微信风格 UI | 绿色气泡、方框头像 |

## 自定义角色卡

编辑 `characters/example.json`：
```json
{
  "name": "角色名",
  "persona": "角色人设描述...",
  "speaking_style": "说话风格描述...",
  "region": "城市",
  "scenario": "背景故事...",
  "greeting": "开场白"
}
```

## 项目结构
```
virtual-girlfriend/
├── app/
│   ├── main.py            # FastAPI + WebSocket + 主动消息推送
│   ├── config.py          # 配置（支持环境变量）
│   ├── character_card.py  # 角色卡管理
│   ├── memory_system.py   # SQLite 分层记忆
│   ├── intimacy.py        # 亲密度系统
│   ├── mode_manager.py    # 模式切换
│   ├── chat_engine.py     # LLM 引擎 + 表情/图片/语音/朋友圈
│   └── scheduler.py       # 定时记忆清理
├── static/
│   ├── index.html         # 微信风格聊天界面
│   ├── style.css          # 移动端样式
│   └── chat.js            # WebSocket + 富媒体渲染
├── characters/
│   └── example.json       # 示例角色卡（小柒）
├── Dockerfile             # 容器化部署
├── render.yaml            # Render 部署配置
├── .env.example           # 环境变量模板
├── config.yaml            # 配置文件
├── requirements.txt
└── start.bat              # Windows 启动脚本
```
