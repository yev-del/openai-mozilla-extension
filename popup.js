/**
 * Note about security warnings:
 * - Warnings in purify.min.js and highlight.min.js can be safely ignored as they are from trusted libraries
 * - We use DOMPurify to sanitize HTML content before inserting it into the DOM
 */

// Configure marked to work with DOMPurify
document.addEventListener('DOMContentLoaded', () => {
    // Set up marked options for secure rendering
    marked.setOptions({
        sanitize: false, // We'll use DOMPurify instead
        highlight: function(code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (err) {
                    console.error('Highlight.js error:', err);
                }
            }
            return code; // Return original code if language not found
        }
    });
});

function setCleanHtml(element, html) {
    // We know this HTML has been sanitized with DOMPurify
    element.innerHTML = html;
    return element;
}

// API configuration and constants
const API_URL = 'https://api.openai.com/v1/chat/completions';
let API_KEY = '';
let CURRENT_MODEL = 'gpt-4';
let chatHistory = [];

// DOM elements mapping
const elements = {
    chatContainer: document.getElementById('chat-container'),
    userInput: document.getElementById('user-input'),
    sendButton: document.getElementById('send-button'),
    modelSelect: document.getElementById('model-select'),
    clearHistoryButton: document.getElementById('clear-history'),
    settingsButton: document.getElementById('settings'),
    settingsPanel: document.getElementById('settings-panel'),
    apiKeyInput: document.getElementById('api-key'),
    themeSelect: document.getElementById('theme-select'),
    saveSettingsButton: document.getElementById('save-settings'),
    clearApiKeyButton: document.getElementById('clear-api-key'),
    notification: document.getElementById('notification')
};

// Initialize extension settings and restore chat history
document.addEventListener('DOMContentLoaded', async () => {
    const settings = await browser.storage.sync.get(['apiKey', 'theme', 'primaryColor', 'chatHistory']);
    
    API_KEY = settings.apiKey || '';
    elements.apiKeyInput.value = API_KEY;
    
    if (settings.chatHistory) {
        chatHistory = settings.chatHistory;
        restoreChat();
    }
    
    applyTheme(settings.theme || 'light');
    applyAccentColor(settings.primaryColor || '#10A37F');
    
    elements.modelSelect.value = CURRENT_MODEL;
});

// Restore previous chat messages from history
function restoreChat() {
// Clear chat container safely
while (elements.chatContainer.firstChild) {
    elements.chatContainer.removeChild(elements.chatContainer.firstChild);
}
    chatHistory.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.isUser ? 'user-message' : 'assistant-message'}`;
        if (msg.isUser) {
            messageDiv.textContent = msg.content;
        } else {
            const sanitizedHtml = DOMPurify.sanitize(marked.parse(msg.content));
            setCleanHtml(messageDiv, sanitizedHtml); 
        }
        elements.chatContainer.appendChild(messageDiv);
    });
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

// Display notification with animation
function showNotification(duration = 2000) {
    elements.notification.classList.remove('hidden');
    setTimeout(() => {
        elements.notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        elements.notification.classList.remove('show');
        setTimeout(() => {
            elements.notification.classList.add('hidden');
            elements.settingsPanel.classList.add('hidden');
        }, 300);
    }, duration);
}

// Send message to OpenAI API
async function sendMessage(message) {
    if (!API_KEY) {
        throw new Error('Please set your OpenAI API key');
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: elements.modelSelect.value,
                messages: [
                    ...chatHistory.map(msg => ({
                        role: msg.isUser ? 'user' : 'assistant',
                        content: msg.content
                    })),
                    { role: 'user', content: message }
                ]
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Add new message to chat interface and save to history
function addMessageToChat(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
    
    if (isUser) {
        messageDiv.textContent = message;
    } else {
        const sanitizedHtml = DOMPurify.sanitize(marked.parse(message));
        setCleanHtml(messageDiv, sanitizedHtml); 
    }
    elements.chatContainer.appendChild(messageDiv);
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
    
    chatHistory.push({ content: message, isUser });
    browser.storage.sync.set({ chatHistory });
}

// Event Listeners
elements.sendButton.addEventListener('click', async () => {
    const message = elements.userInput.value.trim();
    if (message) {
        try {
            addMessageToChat(message, true);
            elements.userInput.value = '';
            
            const response = await sendMessage(message);
            addMessageToChat(response, false);
        } catch (error) {
            addMessageToChat(`Error: ${error.message}`, false);
        }
    }
});

elements.clearHistoryButton.addEventListener('click', () => {
    // Clear chat container safely
    while (elements.chatContainer.firstChild) {
        elements.chatContainer.removeChild(elements.chatContainer.firstChild);
    }
    chatHistory = [];
    browser.storage.sync.set({ chatHistory });
});

elements.settingsButton.addEventListener('click', () => {
    elements.settingsPanel.classList.toggle('hidden');
});

elements.clearApiKeyButton.addEventListener('click', async () => {
    await browser.storage.sync.set({ apiKey: '' });
    elements.apiKeyInput.value = '';
    API_KEY = '';
});

elements.saveSettingsButton.addEventListener('click', async () => {
    const apiKey = elements.apiKeyInput.value;
    const theme = elements.themeSelect.value;
    const selectedColor = document.querySelector('.color-option.selected')?.getAttribute('data-color') || '#10A37F';

    await browser.storage.sync.set({ 
        apiKey, 
        theme, 
        primaryColor: selectedColor 
    });
    
    API_KEY = apiKey;
    applyTheme(theme);
    applyAccentColor(selectedColor);
    showNotification();
});

// Theme and styling functions
function applyTheme(theme) {
    document.body.className = theme;
}

function applyAccentColor(color) {
    document.documentElement.style.setProperty('--accent-color', color);
}

// Color palette handler
document.getElementById('color-palette').addEventListener('click', (e) => {
    const colorOption = e.target.closest('.color-option');
    if (colorOption) {
        document.querySelectorAll('.color-option').forEach(opt => 
            opt.classList.remove('selected'));
        colorOption.classList.add('selected');
        const color = colorOption.getAttribute('data-color');
        applyAccentColor(color);
    }
});

// Input handling for message sending
elements.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (e.ctrlKey) {
            e.preventDefault();
            const start = elements.userInput.selectionStart;
            const end = elements.userInput.selectionEnd;
            const value = elements.userInput.value;
            elements.userInput.value = value.substring(0, start) + '\n' + value.substring(end);
            elements.userInput.selectionStart = elements.userInput.selectionEnd = start + 1;
        } else if (!e.shiftKey) {
            e.preventDefault();
            elements.sendButton.click();
        }
    }
});