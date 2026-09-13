// Virtual Girlfriend - Chat Assistant
// Created: 2026-09-13

const API_BASE_URL = 'https://api.example.com';
const API_KEY = 'your-api-key-here';

class VirtualGirlfriend {
  constructor() {
    this.messages = [];
    this.conversationId = null;
    this.isTyping = false;
  }

  async initialize() {
    this.setupEventListeners();
    this.loadConversation();
    this.renderWelcomeMessage();
  }

  setupEventListeners() {
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-input');
    
    if (sendButton) {
      sendButton.addEventListener('click', () => this.sendMessage());
    }
    
    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  }

  async sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput?.value?.trim();
    
    if (!message || this.isTyping) return;
    
    this.addUserMessage(message);
    this.isTyping = true;
    messageInput.value = '';
    
    try {
      const response = await this.callAPI(message);
      this.addBotMessage(response);
    } catch (error) {
      this.addBotMessage("I'm sorry, I'm having trouble connecting right now.");
      console.error('API Error:', error);
    }
    
    this.isTyping = false;
    this.saveConversation();
  }

  async callAPI(message) {
    const requestBody = {
      message: message,
      conversationId: this.conversationId
    };
    
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    return data.response || data.message || "I received your message!";
  }

  addUserMessage(text) {
    const message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    this.messages.push(message);
    this.renderMessage(message, 'user');
  }

  addBotMessage(text) {
    const message = {
      role: 'assistant',
      content: text,
      timestamp: new Date().toISOString()
    };
    this.messages.push(message);
    this.renderMessage(message, 'bot');
  }

  renderMessage(message, type) {
    const chatContainer = document.getElementById('chat-messages');
    if (!chatContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = `
      <div class="message-content">
        ${this.escapeHtml(message.content)}
      </div>
      <div class="message-time">
        ${new Date(message.timestamp).toLocaleTimeString()}
      </div>
    `;
    
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  renderWelcomeMessage() {
    this.addBotMessage("Hi there! I'm your virtual girlfriend. How are you feeling today?");
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  saveConversation() {
    localStorage.setItem('virtualGirlfriendMessages', JSON.stringify(this.messages));
    if (this.conversationId) {
      localStorage.setItem('virtualGirlfriendConversationId', this.conversationId);
    }
  }

  loadConversation() {
    const savedMessages = localStorage.getItem('virtualGirlfriendMessages');
    if (savedMessages) {
      this.messages = JSON.parse(savedMessages);
      this.messages.forEach(msg => this.renderMessage(msg, msg.role));
    }
    
    const savedId = localStorage.getItem('virtualGirlfriendConversationId');
    if (savedId) {
      this.conversationId = savedId;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.virtualGirlfriend = new VirtualGirlfriend();
  window.virtualGirlfriend.initialize();
});
