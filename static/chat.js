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
const emojiBtn = document.getElementById("emoji-btn");
const plusBtn = document.getElementById("plus-btn");
const emojiPanel = document.getElementById("emoji-panel");
const plusPanel = document.getElementById("plus-panel");
const emojiGrid = document.getElementById("emoji-grid");
const moreBtn = document.getElementById("more-btn");
const moreMenu = document.getElementById("more-menu");
const imageUpload = document.getElementById("image-upload");
const callBtn = document.getElementById("call-btn");
const videoBtn = document.getElementById("video-btn");
const modalOverlay = document.getElementById("modal-overlay");
const modalContent = document.getElementById("modal-content");

let ws = null;
let waitingForReply = false;
let currentEmojiTab = "emoji";
let chatHistory = [];
const MAX_HISTORY = 200;

function saveChatHistory() {
  try {
    localStorage.setItem("vg_chat_history", JSON.stringify(chatHistory.slice(-MAX_HISTORY)));
  } catch(e) {}
}

function loadChatHistory() {
  try {
    const data = localStorage.getItem("vg_chat_history");
    if (data) {
      chatHistory = JSON.parse(data);
      chatHistory.forEach(function(item) {
        if (item.type === "text") {
          addMessage(item.text, item.role);
        } else if (item.type === "receipt") {
          showReadReceipt();
        } else if (item.type === "extra") {
          handleExtra(item.extra);
        } else if (item.type === "system") {
          addMessage(item.text, "system");
        }
      });
    }
  } catch(e) {}
}

// 表情数据
const EMOJI_LIST = [
  "😀","😃","😄","😁","😆","😅","🤣","😂",
  "🙂","🙃","😉","😊","😇","🥰","😍","🤩",
  "😘","😗","😚","😙","🥲","😋","😛","😜",
  "🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐",
  "🤨","😐","😑","😶","😏","😒","🙄","😬",
  "🤥","😌","😔","😪","🤤","😴","😷","🤒",
  "🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵",
  "🤯","🤠","🥳","😎","🤓","🧐","😕","😟",
  "🙁","😮","😯","😲","😳","🥺","😦","😧",
  "😨","😰","😥","😢","😭","😱","😖","😣",
  "😞","😓","😩","😫","🥱","😤","😡","😠",
  "🤬","😈","👿","💀","☠️","💩","🤡","👹",
  "👺","👻","👽","👾","🤖","😺","😸","😹",
  "😻","😼","😽","🙀","😿","😾","❤️","🧡",
  "💛","💚","💙","💜","🖤","🤍","🤎","💔",
  "💕","💞","💓","💗","💖","💘","💝","💟",
  "👍","👎","👌","✌️","🤞","🤟","🤘","🤙",
  "👋","🤚","🖐️","✋","🖖","👏","🙌","👐",
  "🤲","🤝","🙏","✍️","💪","🦵","🦶","👀",
  "👄","👅","👂","👃","🧠","🦷","🦴","👶",
];

const STICKER_LIST = [
  { emoji: "🐱", name: "猫咪" },
  { emoji: "🐶", name: "狗狗" },
  { emoji: "🐰", name: "兔子" },
  { emoji: "🐻", name: "熊熊" },
  { emoji: "🐼", name: "熊猫" },
  { emoji: "🦊", name: "狐狸" },
  { emoji: "🐨", name: "考拉" },
  { emoji: "🐯", name: "老虎" },
  { emoji: "🦁", name: "狮子" },
  { emoji: "🐮", name: "牛牛" },
  { emoji: "🐷", name: "猪猪" },
  { emoji: "🐸", name: "青蛙" },
  { emoji: "🐵", name: "猴子" },
  { emoji: "🐔", name: "鸡鸡" },
  { emoji: "🐧", name: "企鹅" },
  { emoji: "🦆", name: "鸭子" },
  { emoji: "🦉", name: "猫头鹰" },
  { emoji: "🦋", name: "蝴蝶" },
  { emoji: "🐝", name: "蜜蜂" },
  { emoji: "🐢", name: "乌龟" },
  { emoji: "🐙", name: "章鱼" },
  { emoji: "🦀", name: "螃蟹" },
  { emoji: "🐳", name: "鲸鱼" },
  { emoji: "🦄", name: "独角兽" },
];

const FORTUNE_DATA = [
  { lucky: "大吉", desc: "今天运气超棒！做什么都顺风顺水，约她出来玩成功率很高哦~", tags: ["桃花运爆棚", "宜约会", "忌宅家"] },
  { lucky: "中吉", desc: "今天运气不错，心情好的话运气会更好！主动一点会有惊喜~", tags: ["运势上升", "宜主动", "忌消极"] },
  { lucky: "小吉", desc: "平平淡淡的一天，但小小的幸福就在身边，用心感受吧~", tags: ["平稳顺遂", "宜聊天", "忌熬夜"] },
  { lucky: "吉", desc: "今天会有小开心的事情发生，保持期待的心情哦~", tags: ["小有收获", "宜分享", "忌焦虑"] },
  { lucky: "末吉", desc: "运气一般般，但也不会有坏事发生。平常心对待就好~", tags: ["平稳度日", "宜休息", "忌冲动"] },
  { lucky: "凶", desc: "今天可能有点小倒霉，但别担心，抱抱就好啦~", tags: ["需要安慰", "宜抱抱", "忌作死"] },
];

const WEATHER_DATA = [
  { city: "杭州", icon: "☀️", temp: "26°", desc: "晴朗", humidity: "45%", wind: "微风" },
  { city: "杭州", icon: "⛅", temp: "23°", desc: "多云", humidity: "60%", wind: "3级" },
  { city: "杭州", icon: "🌧️", temp: "19°", desc: "小雨", humidity: "85%", wind: "4级" },
  { city: "杭州", icon: "☀️", temp: "28°", desc: "晴转多云", humidity: "50%", wind: "2级" },
];

function connect() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}/ws/chat`);

  ws.onopen = () => {
    loadChatHistory();
    loadStatus();
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case "greeting":
        charName.textContent = data.character_name;
        document.title = `💕 ${data.character_name}`;
        if (chatHistory.length === 0) {
          addMessage(data.content, "bot");
        }
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
  chatHistory.push({ type: "text", text: text, role: type });
  saveChatHistory();
}

function showReadReceipt() {
  const div = document.createElement("div");
  div.className = "read-receipt";
  div.textContent = "已读";
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  chatHistory.push({ type: "receipt" });
  saveChatHistory();
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
      const voiceText = extra.text || "";
      const voiceDiv = document.createElement("div");
      voiceDiv.className = "message bot";
      voiceDiv.innerHTML = `
        <div class="voice-msg" onclick="playVoice(this, '${voiceText.replace(/'/g, "\\'")}')">
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
      const imgId = "img_" + Date.now();
      imgDiv.innerHTML = `
        <div class="image-msg">
          <div class="image-loading" id="${imgId}_loading">
            <div class="img-spinner"></div>
            <span>生成中...</span>
          </div>
          <img id="${imgId}" style="display:none;" alt="图片" onload="document.getElementById('${imgId}_loading').style.display='none';this.style.display='block';" onerror="retryImg('${imgId}',0)" loading="lazy">
          ${extra.caption ? `<div class="image-caption">${extra.caption}</div>` : ""}
        </div>
      `;
      const imgEl = imgDiv.querySelector("img");
      imgEl.dataset.prompt = encodeURIComponent(extra.prompt);
      imgEl.src = `/api/image?prompt=${encodeURIComponent(extra.prompt)}&t=${Date.now()}`;
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

    case "redpacket":
      addRedPacket(extra, "bot");
      break;

    case "location":
      addLocation(extra, "bot");
      break;
  }
  chatArea.scrollTop = chatArea.scrollHeight;
  chatHistory.push({ type: "extra", extra: extra });
  saveChatHistory();
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

let currentVoiceEl = null;
let zhVoiceCache = null;

function initVoices() {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.filter(v => v.lang.startsWith("zh"));
  if (preferred.length > 0) {
    zhVoiceCache = preferred.find(v => v.name.includes("Tingting") || v.name.includes("Female") || v.name.includes("女"))
      || preferred.find(v => v.name.includes("Xiaoxiao") || v.name.includes("Huihui"))
      || preferred[0];
  }
}
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = initVoices;
  initVoices();
}

function playVoice(el, text) {
  if (!window.speechSynthesis) {
    addMessage("你的浏览器不支持语音播放", "system");
    return;
  }

  if (currentVoiceEl && currentVoiceEl !== el) {
    currentVoiceEl.classList.remove("playing");
    currentVoiceEl.querySelector(".voice-icon").textContent = "🎤";
  }

  if (el.classList.contains("playing")) {
    window.speechSynthesis.cancel();
    el.classList.remove("playing");
    el.querySelector(".voice-icon").textContent = "🎤";
    currentVoiceEl = null;
    return;
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  utter.rate = 0.85;
  utter.pitch = 1.4;
  utter.volume = 1.0;

  if (zhVoiceCache) {
    utter.voice = zhVoiceCache;
  } else {
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.name.includes("Tingting") || v.name.includes("Female"))
      || voices.find(v => v.lang.startsWith("zh"));
    if (zhVoice) utter.voice = zhVoice;
  }

  utter.onstart = () => {
    el.classList.add("playing");
    el.querySelector(".voice-icon").textContent = "🔊";
    currentVoiceEl = el;
  };

  utter.onend = () => {
    el.classList.remove("playing");
    el.querySelector(".voice-icon").textContent = "🎤";
    currentVoiceEl = null;
  };

  utter.onerror = () => {
    el.classList.remove("playing");
    el.querySelector(".voice-icon").textContent = "🎤";
    currentVoiceEl = null;
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
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

// 表情面板
function renderEmojiPanel() {
  emojiGrid.innerHTML = "";
  let list = [];

  if (currentEmojiTab === "emoji") {
    list = EMOJI_LIST.map(e => ({ emoji: e }));
  } else if (currentEmojiTab === "sticker") {
    list = STICKER_LIST;
  } else {
    list = ["❤️","💕","😘","🥰","😍","😊","😢","😭","😡","🤔","👍","👎","🙏","💪","🎉","🌸"].map(e => ({ emoji: e }));
  }

  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "emoji-item";
    div.textContent = item.emoji;
    div.onclick = () => insertEmoji(item.emoji);
    emojiGrid.appendChild(div);
  });
}

function insertEmoji(emoji) {
  const input = messageInput;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = input.value;
  input.value = text.substring(0, start) + emoji + text.substring(end);
  input.focus();
  input.selectionStart = input.selectionEnd = start + emoji.length;
}

function toggleEmojiPanel() {
  const isActive = emojiBtn.classList.contains("active");
  closeAllPanels();
  if (!isActive) {
    emojiPanel.classList.remove("hidden");
    emojiBtn.classList.add("active");
    renderEmojiPanel();
  }
}

function togglePlusPanel() {
  const isActive = plusBtn.classList.contains("active");
  closeAllPanels();
  if (!isActive) {
    plusPanel.classList.remove("hidden");
    plusBtn.classList.add("active");
  }
}

function closeAllPanels() {
  emojiPanel.classList.add("hidden");
  plusPanel.classList.add("hidden");
  emojiBtn.classList.remove("active");
  plusBtn.classList.remove("active");
}

// +号面板功能
function handlePlusAction(action) {
  closeAllPanels();

  switch (action) {
    case "album":
      imageUpload.click();
      break;
    case "camera":
      imageUpload.setAttribute("capture", "environment");
      imageUpload.click();
      setTimeout(() => imageUpload.removeAttribute("capture"), 100);
      break;
    case "video":
      showCallScreen("video");
      break;
    case "voice":
      showCallScreen("voice");
      break;
    case "redpacket":
      sendRedPacket();
      break;
    case "transfer":
      showTransfer();
      break;
    case "location":
      sendLocation();
      break;
    case "fortune":
      showFortune();
      break;
    case "favorite":
      addMessage("⭐ 暂无收藏内容", "system");
      break;
    case "card":
      showCard();
      break;
    case "file":
      addMessage("📁 暂不支持文件传输", "system");
      break;
    case "voice-input":
      addMessage("🎤 语音输入功能开发中...", "system");
      break;
  }
}

// 图片上传
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    addUserImage(event.target.result);
    // 模拟 AI 回复
    setTimeout(() => {
      showTyping();
      setTimeout(() => {
        hideTyping();
        const replies = [
          "哇，这张照片好棒！是在哪里拍的呀？🥺",
          "好好看！你的拍照技术越来越好了~ 😍",
          "看到这张照片就想起你了，想你~ 🥰",
          "咦这是什么呀？快给我讲讲~ 🤔",
          "哇塞，太好看了吧！存了存了~ ✨",
          "看着照片感觉你就在我身边一样~ 💗",
        ];
        addMessage(replies[Math.floor(Math.random() * replies.length)], "bot");
        waitingForReply = false;
        loadStatus();
      }, 1500 + Math.random() * 1000);
    }, 500);
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

function addUserImage(src) {
  const div = document.createElement("div");
  div.className = "message user-image";
  div.innerHTML = `<img src="${src}" alt="图片">`;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  showReadReceipt();
}

// 红包
function sendRedPacket() {
  const greetings = [
    "恭喜发财，大吉大利",
    "爱你哟~",
    "拿去买好吃的",
    "小小心意",
    "宝贝节日快乐",
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const amount = (Math.random() * 50 + 5).toFixed(2);

  const div = document.createElement("div");
  div.className = "redpacket-msg user";
  div.innerHTML = `
    <div class="redpacket-header">
      <span class="redpacket-icon">🧧</span>
      <span class="redpacket-title">微信红包</span>
    </div>
    <div class="redpacket-desc">${greeting}</div>
  `;
  div.onclick = () => {
    addMessage(`领取了你的红包 ¥${amount}`, "system");
    setTimeout(() => {
      addMessage("哇！谢谢宝贝的红包~ 爱死你了！🥰🥰🥰", "bot");
    }, 800);
  };
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;

  // 模拟对方领取
  setTimeout(() => {
    addMessage("💕 对方已领取红包", "system");
  }, 2000);
}

function addRedPacket(data, type) {
  const div = document.createElement("div");
  div.className = `redpacket-msg ${type}`;
  div.innerHTML = `
    <div class="redpacket-header">
      <span class="redpacket-icon">🧧</span>
      <span class="redpacket-title">微信红包</span>
    </div>
    <div class="redpacket-desc">${data.greeting || "恭喜发财"}</div>
  `;
  chatArea.appendChild(div);
}

// 位置
function sendLocation() {
  const places = [
    { name: "西湖断桥", addr: "浙江省杭州市西湖区北山街" },
    { name: "杭州东站", addr: "浙江省杭州市上城区全福桥路2号" },
    { name: "杭州大厦", addr: "浙江省杭州市下城区武林广场21号" },
    { name: "浙江大学", addr: "浙江省杭州市西湖区余杭塘路866号" },
  ];
  const place = places[Math.floor(Math.random() * places.length)];

  const div = document.createElement("div");
  div.className = "location-card user";
  div.innerHTML = `
    <div class="location-img">📍</div>
    <div class="location-name">${place.name}</div>
    <div class="location-addr">${place.addr}</div>
  `;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  showReadReceipt();

  setTimeout(() => {
    showTyping();
    setTimeout(() => {
      hideTyping();
      addMessage("哇，你在那里呀~ 等我过来找你！🥺", "bot");
    }, 1500);
  }, 800);
}

function addLocation(data, type) {
  const div = document.createElement("div");
  div.className = `location-card ${type}`;
  div.innerHTML = `
    <div class="location-img">📍</div>
    <div class="location-name">${data.name}</div>
    <div class="location-addr">${data.addr}</div>
  `;
  chatArea.appendChild(div);
}

// 运势
function showFortune() {
  const fortune = FORTUNE_DATA[Math.floor(Math.random() * FORTUNE_DATA.length)];
  const div = document.createElement("div");
  div.className = "fortune-card";
  div.innerHTML = `
    <div class="fortune-title">🔮 今日运势</div>
    <div class="fortune-lucky">${fortune.lucky}</div>
    <div class="fortune-desc">${fortune.desc}</div>
    <div class="fortune-tags">
      ${fortune.tags.map(t => `<span class="fortune-tag">${t}</span>`).join("")}
    </div>
  `;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// 天气
function showWeather() {
  const weather = WEATHER_DATA[Math.floor(Math.random() * WEATHER_DATA.length)];
  const div = document.createElement("div");
  div.className = "weather-card";
  div.innerHTML = `
    <div class="weather-city">${weather.city}</div>
    <div class="weather-main">
      <span class="weather-icon">${weather.icon}</span>
      <span class="weather-temp">${weather.temp}</span>
    </div>
    <div class="weather-desc">${weather.desc}</div>
    <div class="weather-details">
      <span>💧 湿度 ${weather.humidity}</span>
      <span>🌬️ ${weather.wind}</span>
    </div>
  `;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// 猜拳游戏
function showGame() {
  const div = document.createElement("div");
  div.className = "game-card";
  div.id = "rps-game";
  div.innerHTML = `
    <div class="game-title">🎮 来玩石头剪刀布吧！</div>
    <div class="game-options">
      <div class="game-option" onclick="playRPS('rock')">✊</div>
      <div class="game-option" onclick="playRPS('scissors')">✌️</div>
      <div class="game-option" onclick="playRPS('paper')">🖐️</div>
    </div>
    <div class="game-result">选择你的出招~</div>
  `;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function playRPS(userChoice) {
  const choices = ["rock", "scissors", "paper"];
  const emojis = { rock: "✊", scissors: "✌️", paper: "🖐️" };
  const botChoice = choices[Math.floor(Math.random() * 3)];

  let result = "";
  let resultText = "";
  if (userChoice === botChoice) {
    result = "平局！再来一局~";
    resultText = "tie";
  } else if (
    (userChoice === "rock" && botChoice === "scissors") ||
    (userChoice === "scissors" && botChoice === "paper") ||
    (userChoice === "paper" && botChoice === "rock")
  ) {
    result = "你赢了！好厉害~ 🎉";
    resultText = "win";
  } else {
    result = "你输了！嘻嘻~ 😜";
    resultText = "lose";
  }

  const gameCard = document.getElementById("rps-game");
  if (gameCard) {
    gameCard.innerHTML = `
      <div class="game-title">🎮 石头剪刀布</div>
      <div style="display:flex;justify-content:space-around;align-items:center;margin:15px 0;">
        <div style="text-align:center;">
          <div style="font-size:36px;">${emojis[userChoice]}</div>
          <div style="font-size:12px;color:#999;">你</div>
        </div>
        <div style="font-size:24px;">VS</div>
        <div style="text-align:center;">
          <div style="font-size:36px;">${emojis[botChoice]}</div>
          <div style="font-size:12px;color:#999;">她</div>
        </div>
      </div>
      <div class="game-result">${result}</div>
    `;
    gameCard.id = "";
  }

  // AI 后续反应
  setTimeout(() => {
    if (resultText === "win") {
      addMessage("呜呜你欺负我... 再来一局！我一定要赢回来！😤", "bot");
    } else if (resultText === "lose") {
      addMessage("嘿嘿~ 我厉害吧！要不要再来一局呀？😜", "bot");
    } else {
      addMessage("居然平局了！再来再来，这次一定要分出胜负！✊", "bot");
    }
  }, 800);
}

// 通话界面
function showCallScreen(type) {
  const isVideo = type === "video";
  modalContent.innerHTML = `
    <div class="call-screen">
      <div class="call-avatar">💕</div>
      <div class="call-name">${charName.textContent}</div>
      <div class="call-status">${isVideo ? "视频通话中..." : "等待对方接听..."}</div>
      <div class="call-actions">
        <button class="call-btn hangup" onclick="closeModal()">📞</button>
        ${!isVideo ? '<button class="call-btn accept" onclick="acceptCall()">🎧</button>' : ""}
      </div>
    </div>
  `;
  modalOverlay.classList.remove("hidden");
}

function acceptCall() {
  const statusEl = document.querySelector(".call-status");
  if (statusEl) {
    statusEl.textContent = "通话中... 00:01";
    let seconds = 1;
    const timer = setInterval(() => {
      seconds++;
      const m = Math.floor(seconds / 60).toString().padStart(2, "0");
      const s = (seconds % 60).toString().padStart(2, "0");
      statusEl.textContent = `通话中... ${m}:${s}`;
    }, 1000);
    modalContent.dataset.timer = timer;
  }
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  if (modalContent.dataset.timer) {
    clearInterval(modalContent.dataset.timer);
  }
  modalContent.innerHTML = "";
}

// 名片
function showCard() {
  const div = document.createElement("div");
  div.className = "message bot";
  div.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;">
      <div style="width:40px;height:40px;background:linear-gradient(135deg,#ff6b9d,#ff8fab);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:20px;">💕</div>
      <div>
        <div style="font-size:14px;font-weight:600;">${charName.textContent}</div>
        <div style="font-size:12px;color:#999;">微信号：xiaoqi_love</div>
      </div>
    </div>
  `;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// 转账
function showTransfer() {
  addMessage("💰 转账功能只是装饰哦~ 心意到了就好啦！🥰", "bot");
}

// 更多菜单
function toggleMoreMenu() {
  moreMenu.classList.toggle("hidden");
}

function handleMoreAction(action) {
  moreMenu.classList.add("hidden");
  switch (action) {
    case "moments":
      loadMoments();
      break;
    case "fortune":
      showFortune();
      break;
    case "weather":
      showWeather();
      break;
    case "game":
      showGame();
      break;
    case "settings":
      showSettings();
      break;
  }
}

async function loadMoments() {
  try {
    const res = await fetch("/api/moments");
    const data = await res.json();
    data.moments.forEach(m => {
      const div = document.createElement("div");
      div.className = "moment-card";
      div.innerHTML = `
        <div class="moment-header">
          <div class="moment-avatar">💕</div>
          <span class="moment-name">${data.character_name}</span>
        </div>
        <div class="moment-text">${m.text}</div>
        <div class="moment-footer">
          <span>${m.time}</span>
          <span class="moment-likes">❤️ ${m.likes}</span>
        </div>
      `;
      chatArea.appendChild(div);
    });
    chatArea.scrollTop = chatArea.scrollHeight;
  } catch (e) {
    addMessage("加载朋友圈失败...", "error");
  }
}

// 设置
function showSettings() {
  modalContent.innerHTML = `
    <div class="settings-panel">
      <div class="settings-title">⚙️ 设置</div>
      <div class="settings-item">
        <span>声音提醒</span>
        <span style="color:#07c160;">开启</span>
      </div>
      <div class="settings-item">
        <span>震动反馈</span>
        <span style="color:#07c160;">开启</span>
      </div>
      <div class="settings-item">
        <span>置顶聊天</span>
        <span style="color:#07c160;">已置顶</span>
      </div>
      <div class="settings-item">
        <span>消息免打扰</span>
        <span style="color:#999;">关闭</span>
      </div>
      <div class="settings-item">
        <span>亲密度显示</span>
        <span style="color:#07c160;">开启</span>
      </div>
      <div class="settings-item" style="border-top:1px solid #eee;margin-top:8px;padding-top:12px;">
        <span>🗑️ 清空聊天记录</span>
        <span style="color:#e74c3c;cursor:pointer;" onclick="clearChatHistory()">点击清空</span>
      </div>
      <button class="settings-close" onclick="closeModal()">关闭</button>
    </div>
  `;
  modalOverlay.classList.remove("hidden");
}

function clearChatHistory() {
  if (!confirm("确定要清空所有聊天记录吗？")) return;
  chatHistory = [];
  localStorage.removeItem("vg_chat_history");
  chatArea.innerHTML = "";
  closeModal();
  addMessage("聊天记录已清空", "system");
}

function retryImg(imgId, attempt) {
  const img = document.getElementById(imgId);
  if (!img || attempt >= 3) {
    const loading = document.getElementById(imgId + "_loading");
    if (loading) {
      loading.innerHTML = "<span>图片加载失败</span>";
    }
    return;
  }
  const prompt = img.dataset.prompt;
  img.src = `/api/image?prompt=${prompt}&t=${Date.now()}&retry=${attempt + 1}`;
}

// 事件绑定
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener("focus", () => {
  closeAllPanels();
});

emojiBtn.addEventListener("click", toggleEmojiPanel);
plusBtn.addEventListener("click", togglePlusPanel);
moreBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleMoreMenu();
});

document.addEventListener("click", (e) => {
  if (!moreMenu.contains(e.target) && !moreBtn.contains(e.target)) {
    moreMenu.classList.add("hidden");
  }
  if (!modalContent.contains(e.target) && e.target !== modalOverlay) {
    // modal 点击外部关闭
  }
});

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// 表情标签切换
document.querySelectorAll(".emoji-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".emoji-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentEmojiTab = tab.dataset.tab;
    renderEmojiPanel();
  });
});

// +号面板项
document.querySelectorAll(".plus-item").forEach(item => {
  item.addEventListener("click", () => {
    handlePlusAction(item.dataset.action);
  });
});

// 更多菜单项
document.querySelectorAll(".more-menu-item").forEach(item => {
  item.addEventListener("click", () => {
    handleMoreAction(item.dataset.action);
  });
});

// 图片上传
imageUpload.addEventListener("change", handleImageUpload);

// 通话按钮
callBtn.addEventListener("click", () => showCallScreen("voice"));
videoBtn.addEventListener("click", () => showCallScreen("video"));

connect();
