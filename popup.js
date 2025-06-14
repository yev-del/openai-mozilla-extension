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
const API_URLS = {
    openai: 'https://api.openai.com/v1/chat/completions',
    claude: 'https://api.anthropic.com/v1/messages'
};
let API_KEYS = {
    openai: '',
    claude: ''
};
let CURRENT_MODEL = 'gpt-4';
let chatHistory = [];

// DOM elements mapping
const elements = {
    chatContainer: document.getElementById('chat-container'),
    userInput: document.getElementById('user-input'),
    sendButton: document.getElementById('send-button'),
    providerSelect: document.getElementById('provider-select'),
    modelSelect: document.getElementById('model-select'),
    clearHistoryButton: document.getElementById('clear-history'),
    settingsButton: document.getElementById('settings'),
    settingsPanel: document.getElementById('settings-panel'),
    apiKeyInput: document.getElementById('api-key'),
    claudeKeyInput: document.getElementById('claude-api-key'),
    themeSelect: document.getElementById('theme-select'),
    saveSettingsButton: document.getElementById('save-settings'),
    clearApiKeyButton: document.getElementById('clear-api-key'),
    notification: document.getElementById('notification')
};

// Initialize extension settings and restore chat history
document.addEventListener('DOMContentLoaded', async () => {
    const settings = await browser.storage.sync.get(null);
    console.log('Loaded settings:', settings);

    API_KEYS.openai = settings.apiKey || '';
    API_KEYS.claude = settings.claudeKey || '';
    
    console.log('Loaded API keys:', {
        openai: API_KEYS.openai,
        claude: API_KEYS.claude
    });

    // Set initial values for API key inputs
    elements.apiKeyInput.value = API_KEYS.openai;
    elements.claudeKeyInput.value = API_KEYS.claude;
    
    if (settings.chatHistory) {
        chatHistory = settings.chatHistory;
        restoreChat();
    }
    
    applyTheme(settings.theme || 'light');
    applyAccentColor(settings.primaryColor || '#10A37F');
    
    elements.modelSelect.value = CURRENT_MODEL;

    // Populate model options based on provider
    const modelOptions = {
        openai: [
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
            { value: 'gpt-4', label: 'GPT-4' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
            { value: 'gpt-4o', label: 'GPT-4 Omni' }
        ],
        claude: [
            { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
            { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
            { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
        ]
    };

    function updateModelOptions(provider) {
        const models = modelOptions[provider] || [];
        elements.modelSelect.innerHTML = '';
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.label;
            elements.modelSelect.appendChild(option);
        });
        elements.modelSelect.disabled = models.length === 0;
    }

    elements.providerSelect.addEventListener('change', () => {
        updateModelOptions(elements.providerSelect.value);
    });

    updateModelOptions(elements.providerSelect.value);
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

// Send message to API
async function sendMessage(userMessage) {
    const provider = elements.providerSelect.value;
    const API_KEY = API_KEYS[provider];
    if (!API_KEY) {
        throw new Error(`Please set your ${provider} API key`);
    }

    try {
        if (provider === 'openai') {
            // OpenAI API call via background script to avoid CORS issues
            const messages = [
                ...chatHistory.map(msg => ({
                    role: msg.isUser ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: userMessage }
            ];
            
            // Send message to background script
            return new Promise((resolve, reject) => {
                browser.runtime.sendMessage({
                    action: "callOpenAIAPI",
                    apiKey: API_KEY,
                    model: elements.modelSelect.value,
                    messages: messages
                }, response => {
                    if (response.success) {
                        if (response.data.choices && response.data.choices.length > 0) {
                            resolve(response.data.choices[0].message.content);
                        } else if (response.data.error) {
                            reject(new Error(response.data.error.message || 'OpenAI API error'));
                        } else {
                            reject(new Error('Unexpected response format from OpenAI API'));
                        }
                    } else {
                        reject(new Error(response.error || 'Failed to call OpenAI API'));
                    }
                });
            });
        } else if (provider === 'claude') {
            // Claude API call via background script to avoid CORS issues
            const messages = [
                ...chatHistory.map(msg => ({
                    role: msg.isUser ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: userMessage }
            ];
            
            // Send message to background script
            return new Promise((resolve, reject) => {
                browser.runtime.sendMessage({
                    action: "callClaudeAPI",
                    apiKey: API_KEY,
                    model: elements.modelSelect.value,
                    messages: messages
                }, response => {
                    if (response.success) {
                        if (response.data.content && response.data.content.length > 0) {
                            resolve(response.data.content[0].text);
                        } else if (response.data.error) {
                            reject(new Error(response.data.error.message || 'Claude API error'));
                        } else {
                            reject(new Error('Unexpected response format from Claude API'));
                        }
                    } else {
                        reject(new Error(response.error || 'Failed to call Claude API'));
                    }
                });
            });
        }
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
            
            // Create loading message with animated dots
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'message assistant-message';
            
            // Create a span with the loading-dots class for animation
            const loadingSpan = document.createElement('span');
            loadingSpan.className = 'loading-dots';
            loadingSpan.textContent = 'Thinking';
            
            loadingDiv.appendChild(loadingSpan);
            elements.chatContainer.appendChild(loadingDiv);
            elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;

            const response = await sendMessage(message);
            elements.chatContainer.removeChild(loadingDiv);
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
    const provider = elements.providerSelect.value;
    if (provider === 'openai') {
        await browser.storage.sync.set({ apiKey: '' });
        elements.apiKeyInput.value = '';
        API_KEYS.openai = '';
    } else if (provider === 'claude') {
        await browser.storage.sync.set({ claudeKey: '' });
        elements.claudeKeyInput.value = '';
        API_KEYS.claude = '';
    }
});

elements.saveSettingsButton.addEventListener('click', async () => {
    // Get all API keys
    API_KEYS.openai = elements.apiKeyInput.value;
    API_KEYS.claude = elements.claudeKeyInput.value;

    const theme = elements.themeSelect.value;
    const selectedColor = document.querySelector('.color-option.selected')?.getAttribute('data-color') || '#10A37F';

    // Save all settings
    await browser.storage.sync.set({
        apiKey: API_KEYS.openai,
        claudeKey: API_KEYS.claude,
        theme,
        primaryColor: selectedColor
    });
    
    // Log saved settings for debugging
    console.log('Saved settings:', {
        openai: API_KEYS.openai,
        claude: API_KEYS.claude,
        theme,
        primaryColor: selectedColor
    });
    
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
