const chatArea = document.getElementById("chat-area");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const typingIndicator = document.getElementById("typing-indicator");
const charName = document.getElementById("char-name");
const intimacyBadge = document.getElementById("intimacy-badge");
const intimacyLevel = document.getElementById("intimacy-level");
const msgCount = document.getElementById("msg-count");
const memCount = document.getElementById("mem-count");
const warningBanner = document.getElementById("warning-banner");

let ws = null;
let waitingForReply = false;

function connect() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}/ws/chat`);

  ws.onopen = () => { loadStatus(); };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "greeting":
        charName.textContent = data.character_name;
        document.title = `💕 ${data.character_name}`;
        addMessage(data.content, "bot");
        break;

      case "read":
        showReadReceipt();
        break;

      case "announcement":
        addMessage(data.content, "announcement");
        break;

      case "reply":
        hideTyping();
        addMessage(data.content, "bot");
        waitingForReply = false;
        loadStatus();
        break;

      case "extra":
        handleExtra(data.extra);
        break;

      case "proactive":
        hideTyping();
        addMessage(data.content, "bot");
        loadStatus();
        break;

      case "error":
        hideTyping();
        addMessage(data.content, "error");
        waitingForReply = false;
        break;
    }
  };

  ws.onclose = () => {
    showWarning("连接断开，5秒后重连...");
    setTimeout(connect, 5000);
  };

  ws.onerror = () => { hideTyping(); };
}

function showTyping() {
  typingIndicator.classList.remove("hidden");
  chatArea.scrollTop = chatArea.scrollHeight;
}

function hideTyping() {
  typingIndicator.classList.add("hidden");
}

function addMessage(text, type = "bot") {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function showReadReceipt() {
  const div = document.createElement("div");
  div.className = "read-receipt";
  div.textContent = "已读";
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function handleExtra(extra) {
  switch (extra.type) {
    case "emoji":
      const emojiDiv = document.createElement("div");
      emojiDiv.className = "message bot emoji-only";
      emojiDiv.textContent = extra.content;
      chatArea.appendChild(emojiDiv);
      break;

    case "voice":
      const voiceDiv = document.createElement("div");
      voiceDiv.className = "message bot";
      voiceDiv.innerHTML = `
        <div class="voice-msg">
          <span class="voice-icon">🎤</span>
          <div class="voice-bar">${generateVoiceBars(extra.duration)}</div>
          <span class="voice-duration">${extra.duration}"</span>
        </div>
      `;
      chatArea.appendChild(voiceDiv);
      break;

    case "image":
      const imgDiv = document.createElement("div");
      imgDiv.className = "message bot";
      imgDiv.innerHTML = `
        <div class="image-msg">
          <img src="/api/image?prompt=${encodeURIComponent(extra.prompt)}" alt="图片" loading="lazy">
          ${extra.caption ? `<div class="image-caption">${extra.caption}</div>` : ""}
        </div>
      `;
      chatArea.appendChild(imgDiv);
      break;

    case "moment":
      const momentDiv = document.createElement("div");
      momentDiv.className = "moment-card";
      momentDiv.innerHTML = `
        <div class="moment-header">
          <div class="moment-avatar">💕</div>
          <span class="moment-name">${charName.textContent}</span>
        </div>
        <div class="moment-text">${extra.content}</div>
        <div class="moment-footer">
          <span>${extra.time}</span>
          <span class="moment-likes">❤️ ${extra.likes}</span>
        </div>
      `;
      chatArea.appendChild(momentDiv);
      break;
  }
  chatArea.scrollTop = chatArea.scrollHeight;
}

function generateVoiceBars(duration) {
  let bars = "";
  const count = Math.min(15, Math.max(5, duration * 2));
  for (let i = 0; i < count; i++) {
    const h = Math.random() * 14 + 4;
    bars += `<span style="height:${h}px"></span>`;
  }
  return bars;
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !ws || ws.readyState !== WebSocket.OPEN || waitingForReply) return;

  addMessage(text, "user");
  messageInput.value = "";
  waitingForReply = true;
  showTyping();

  ws.send(JSON.stringify({ content: text }));
}

function showWarning(text) {
  warningBanner.textContent = text;
  warningBanner.classList.remove("hidden");
  setTimeout(() => warningBanner.classList.add("hidden"), 4000);
}

async function loadStatus() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();
    charName.textContent = data.character_name;
    document.title = `💕 ${data.character_name}`;
    intimacyBadge.textContent = `💗 ${data.intimacy_score}`;
    intimacyLevel.textContent = data.intimacy_level;
    msgCount.textContent = data.total_messages;
    memCount.textContent = data.memory_count;

    if (!data.llm_configured) {
      showWarning("⚠️ API Key 未配置，请编辑 config.yaml 填入你的 LLM API Key");
    }
  } catch (e) {
    console.error("Status load failed:", e);
  }
}

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

connect();
