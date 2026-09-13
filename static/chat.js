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

  ws.onopen = () => { loadStatus(); };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case "greeting":
        charName.textContent = data.character_name;
        document.title = "💕 " + data.character_name;
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

function addMessage(text, type) {
  type = type || "bot";
  const div = document.createElement("div");
  div.className = "message " + type;
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
      voiceDiv.innerHTML = '
🎤
' + generateVoiceBars(extra.duration) + '
' + extra.duration + '"
';
      chatArea.appendChild(voiceDiv);
      break;
    case "image":
      const imgDiv = document.createElement("div");
      imgDiv.className = "message bot";
      imgDiv.innerHTML = '
' + (extra.caption ? '
' + extra.caption + '
' : '') + '
';
      chatArea.appendChild(imgDiv);
      break;
    case "moment":
      const momentDiv = document.createElement("div");
      momentDiv.className = "moment-card";
      momentDiv.innerHTML = '
💕
' + charName.textContent + '
' + extra.content + '
' + extra.time + '❤️ ' + extra.likes + '
';
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
}

function generateVoiceBars(duration) {
  let bars = "";
  const count = Math.min(15, Math.max(5, duration * 2));
  for (let i = 0; i < count; i++) {
    const h = Math.random() * 14 + 4;
    bars += '';
  }
  return bars;
}

function toggleVoice(el) {
  el.classList.toggle("playing");
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
    document.title = "💕 " + data.character_name;
    intimacyBadge.textContent = "💗 " + data.intimacy_score;
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

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    addUserImage(event.target.result);
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
  div.innerHTML = '';
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  showReadReceipt();
}

function sendRedPacket() {
  const greetings = ["恭喜发财，大吉大利","爱你哟~","拿去买好吃的","小小心意","宝贝节日快乐"];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const amount = (Math.random() * 50 + 5).toFixed(2);
  const div = document.createElement("div");
  div.className = "redpacket-msg user";
  div.innerHTML = '
🧧微信红包
' + greeting + '
';
  div.onclick = () => {
    addMessage("领取了你的红包 ¥" + amount, "system");
    setTimeout(() => { addMessage("哇！谢谢宝贝的红包~ 爱死你了！🥰🥰🥰", "bot"); }, 800);
  };
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  setTimeout(() => { addMessage("💕 对方已领取红包", "system"); }, 2000);
}

function addRedPacket(data, type) {
  const div = document.createElement("div");
  div.className = "redpacket-msg " + type;
  div.innerHTML = '
🧧微信红包
' + (data.greeting || "恭喜发财") + '
';
  chatArea.appendChild(div);
}

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
  div.innerHTML = '
📍
' + place.name + '
' + place.addr + '
';
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  showReadReceipt();
  setTimeout(() => {
    showTyping();
    setTimeout(() => { hideTyping(); addMessage("哇，你在那里呀~ 等我过来找你！🥺", "bot"); }, 1500);
  }, 800);
}

function addLocation(data, type) {
  const div = document.createElement("div");
  div.className = "location-card " + type;
  div.innerHTML = '
📍
' + data.name + '
' + data.addr + '
';
  chatArea.appendChild(div);
}

function showFortune() {
  const fortune = FORTUNE_DATA[Math.floor(Math.random() * FORTUNE_DATA.length)];
  const div = document.createElement("div");
  div.className = "fortune-card";
  let tagsHtml = "";
  fortune.tags.forEach(t => { tagsHtml += '' + t + ''; });
  div.innerHTML = '
🔮 今日运势
' + fortune.lucky + '
' + fortune.desc + '
' + tagsHtml + '
';
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function showWeather() {
  const weather = WEATHER_DATA[Math.floor(Math.random() * WEATHER_DATA.length)];
  const div = document.createElement("div");
  div.className = "weather-card";
  div.innerHTML = '
' + weather.city + '
' + weather.icon + '' + weather.temp + '
' + weather.desc + '
💧 湿度 ' + weather.humidity + '🌬️ ' + weather.wind + '
';
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function showGame() {
  const div = document.createElement("div");
  div.className = "game-card";
  div.id = "rps-game";
  div.innerHTML = '
🎮 来玩石头剪刀布吧！
✊
✌️
🖐️
选择你的出招~
';
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
    gameCard.innerHTML = '
🎮 石头剪刀布
' + emojis[userChoice] + '
你
VS
' + emojis[botChoice] + '
她
' + result + '
';
    gameCard.id = "";
  }
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

function showCallScreen(type) {
  const isVideo = type === "video";
  modalContent.innerHTML = '
💕
' + charName.textContent + '
' + (isVideo ? "视频通话中..." : "等待对方接听...") + '
📞' + (!isVideo ? '🎧' : '') + '
';
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
      statusEl.textContent = "通话中... " + m + ":" + s;
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

function showCard() {
  const div = document.createElement("div");
  div.className = "message bot";
  div.innerHTML = '
💕
' + charName.textContent + '
微信号：xiaoqi_love
';
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function showTransfer() {
  addMessage("💰 转账功能只是装饰哦~ 心意到了就好啦！🥰", "bot");
}

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
      div.innerHTML = '
💕
' + data.character_name + '
' + m.text + '
' + m.time + '❤️ ' + m.likes + '
';
      chatArea.appendChild(div);
    });
    chatArea.scrollTop = chatArea.scrollHeight;
  } catch (e) {
    addMessage("加载朋友圈失败...", "error");
  }
}

function showSettings() {
  modalContent.innerHTML = '
⚙️ 设置
声音提醒开启
震动反馈开启
置顶聊天已置顶
消息免打扰关闭
亲密度显示开启
关闭
';
  modalOverlay.classList.remove("hidden");
}

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener("focus", () => { closeAllPanels(); });
emojiBtn.addEventListener("click", toggleEmojiPanel);
plusBtn.addEventListener("click", togglePlusPanel);
moreBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMoreMenu(); });

document.addEventListener("click", (e) => {
  if (!moreMenu.contains(e.target) && !moreBtn.contains(e.target)) {
    moreMenu.classList.add("hidden");
  }
});

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) { closeModal(); }
});

document.querySelectorAll(".emoji-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".emoji-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentEmojiTab = tab.dataset.tab;
    renderEmojiPanel();
  });
});

document.querySelectorAll(".plus-item").forEach(item => {
  item.addEventListener("click", () => { handlePlusAction(item.dataset.action); });
});

document.querySelectorAll(".more-menu-item").forEach(item => {
  item.addEventListener("click", () => { handleMoreAction(item.dataset.action); });
});

imageUpload.addEventListener("change", handleImageUpload);
callBtn.addEventListener("click", () => showCallScreen("voice"));
videoBtn.addEventListener("click", () => showCallScreen("video"));

connect();
