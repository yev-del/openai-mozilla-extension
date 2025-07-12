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
        gfm: true, // GitHub Flavored Markdown
        breaks: true, // Convert line breaks to <br>
        headerIds: true, // Generate IDs for headings
        mangle: false, // Don't mangle email addresses
        pedantic: false, // Don't conform to original markdown spec
        smartLists: true, // Use smarter list behavior
        smartypants: true, // Use "smart" typographic punctuation
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
    // Configure DOMPurify to allow necessary HTML elements and attributes for markdown
    const purifyConfig = {
        ALLOWED_TAGS: [
            // Basic formatting
            'p', 'div', 'span', 'br', 'hr',
            // Headings
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            // Text formatting
            'b', 'i', 'strong', 'em', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
            // Lists
            'ul', 'ol', 'li', 'dl', 'dt', 'dd',
            // Code
            'code', 'pre',
            // Tables
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            // Links and images
            'a', 'img',
            // Blockquotes
            'blockquote',
            // Task lists
            'input'
        ],
        ALLOWED_ATTR: [
            // Global attributes
            'id', 'class', 'style',
            // Link attributes
            'href', 'target', 'rel',
            // Image attributes
            'src', 'alt', 'title', 'width', 'height',
            // Code attributes
            'class', 'language',
            // Task list attributes
            'type', 'checked', 'disabled'
        ],
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target'], // Allow target attribute for links
        FORBID_TAGS: ['style', 'script'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick']
    };

    // Sanitize HTML with our custom configuration
    const sanitizedHtml = DOMPurify.sanitize(html, purifyConfig);
    
    // Set the sanitized HTML to the element
    // The HTML has been sanitized with DOMPurify and is safe to assign
    element.innerHTML = sanitizedHtml;
    
    // Add target="_blank" to all links to open in new tab
    element.querySelectorAll('a').forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
    });
    
    return element;
}

// API configuration and constants
const API_URLS = {
    openai: 'https://api.openai.com/v1/chat/completions',
    claude: 'https://api.anthropic.com/v1/messages',
    grok: 'https://api.x.ai/v1/chat/completions'
};
let API_KEYS = {
    openai: '',
    claude: '',
    grok: ''
};
let CURRENT_MODEL = {
    openai: 'gpt-3.5-turbo',
    claude: 'claude-3-sonnet-20240229',
    grok: 'grok-2-1212'
};
let CURRENT_PROVIDER = 'openai';
let chatHistories = {
    openai: [],
    claude: [],
    grok: []
};

// DOM elements mapping
const elements = {
    // Tab elements
    tabs: document.querySelectorAll('.tab'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    
    // ChatGPT tab elements
    openaiChatContainer: document.getElementById('openai-chat-container'),
    openaiUserInput: document.getElementById('openai-user-input'),
    openaiSendButton: document.getElementById('openai-send-button'),
    openaiModelSelect: document.getElementById('openai-model-select'),
    openaiClearHistoryButton: document.getElementById('openai-clear-history'),
    
    // Claude tab elements
    claudeChatContainer: document.getElementById('claude-chat-container'),
    claudeUserInput: document.getElementById('claude-user-input'),
    claudeSendButton: document.getElementById('claude-send-button'),
    claudeModelSelect: document.getElementById('claude-model-select'),
    claudeClearHistoryButton: document.getElementById('claude-clear-history'),
    
    // GROK tab elements
    grokChatContainer: document.getElementById('grok-chat-container'),
    grokUserInput: document.getElementById('grok-user-input'),
    grokSendButton: document.getElementById('grok-send-button'),
    grokModelSelect: document.getElementById('grok-model-select'),
    grokClearHistoryButton: document.getElementById('grok-clear-history'),
    
    // Settings elements
    apiKeyInput: document.getElementById('api-key'),
    claudeKeyInput: document.getElementById('claude-api-key'),
    grokKeyInput: document.getElementById('grok-api-key'),
    themeSelect: document.getElementById('theme-select'),
    saveSettingsButton: document.getElementById('save-settings'),
    clearApiKeyButton: document.getElementById('clear-api-key'),
    notification: document.getElementById('notification')
};

// Helper: Save input value for provider
function saveInputDraft(provider, value) {
    browser.storage.local.set({ [`draft_${provider}`]: value });
}

// Helper: Restore input value for provider
async function restoreInputDraft(provider) {
    const key = `draft_${provider}`;
    const result = await browser.storage.local.get(key);
    return result[key] || '';
}

// Initialize extension settings and restore chat history
document.addEventListener('DOMContentLoaded', async () => {
    const settings = await browser.storage.sync.get(null);
    console.log('Loaded settings:', settings);

    API_KEYS.openai = settings.apiKey || '';
    API_KEYS.claude = settings.claudeKey || '';
    API_KEYS.grok = settings.grokKey || '';
    
    console.log('Loaded API keys:', {
        openai: API_KEYS.openai,
        claude: API_KEYS.claude,
        grok: API_KEYS.grok
    });

    // Set initial values for API key inputs
    elements.apiKeyInput.value = API_KEYS.openai;
    elements.claudeKeyInput.value = API_KEYS.claude;
    elements.grokKeyInput.value = API_KEYS.grok;
    
    // Restore chat histories
    if (settings.chatHistory_openai) {
        chatHistories.openai = settings.chatHistory_openai;
    }
    
    if (settings.chatHistory_claude) {
        chatHistories.claude = settings.chatHistory_claude;
    }
    
    if (settings.chatHistory_grok) {
        chatHistories.grok = settings.chatHistory_grok;
    }
    
    // For backward compatibility
    if (settings.chatHistory && !settings.chatHistory_openai && !settings.chatHistory_claude) {
        const provider = settings.provider || 'openai';
        chatHistories[provider] = settings.chatHistory;
    }
    
    // Restore provider and model selection - FIX: Properly restore all models
    CURRENT_PROVIDER = settings.provider || 'openai';
    
    // Restore OpenAI model (backward compatibility with 'model' key)
    if (settings.openaiModel) {
        CURRENT_MODEL.openai = settings.openaiModel;
    } else if (settings.model) {
        CURRENT_MODEL.openai = settings.model;
    }
    
    // Restore Claude model
    if (settings.claudeModel) {
        CURRENT_MODEL.claude = settings.claudeModel;
    }
    
    // Restore GROK model
    if (settings.grokModel) {
        CURRENT_MODEL.grok = settings.grokModel;
    }

    console.log('Restored models:', CURRENT_MODEL);

    // --- Исправление: корректно восстанавлием тему ---
    const themeToApply = settings.theme || 'light';
    applyTheme(themeToApply);
    elements.themeSelect.value = themeToApply;

    applyAccentColor(settings.primaryColor || '#10A37F');

    // Set up tabs
    setupTabs();

    // Restore chat for all providers
    await restoreChat('openai');
    await restoreChat('claude');
    await restoreChat('grok');

    // Restore input drafts
    elements.openaiUserInput.value = await restoreInputDraft('openai');
    elements.claudeUserInput.value = await restoreInputDraft('claude');
    elements.grokUserInput.value = await restoreInputDraft('grok');

    // Populate model options for all providers - this will set the correct values
    populateModelOptions();
    
    // Set the active tab based on the last provider
    setActiveTab(CURRENT_PROVIDER === 'claude' ? 'claude' : CURRENT_PROVIDER === 'grok' ? 'grok' : 'chatgpt');
});

// Set up tab functionality
function setupTabs() {
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            setActiveTab(tabName);
            
            // Update current provider if switching to a chat tab
            if (tabName === 'chatgpt') {
                CURRENT_PROVIDER = 'openai';
                browser.storage.sync.set({ provider: CURRENT_PROVIDER });
            } else if (tabName === 'claude') {
                CURRENT_PROVIDER = 'claude';
                browser.storage.sync.set({ provider: CURRENT_PROVIDER });
            } else if (tabName === 'grok') {
                CURRENT_PROVIDER = 'grok';
                browser.storage.sync.set({ provider: CURRENT_PROVIDER });
            }
        });
    });
}

// Set active tab
function setActiveTab(tabName) {
    // Update tab styling
    elements.tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Show active tab content
    elements.tabPanes.forEach(pane => {
        if (pane.id === `${tabName}-tab`) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    // --- Ensure model select values are always in sync with CURRENT_MODEL ---
    if (tabName === 'chatgpt') {
        // OpenAI tab: ensure select is correct
        if (elements.openaiModelSelect.value !== CURRENT_MODEL.openai) {
            elements.openaiModelSelect.value = CURRENT_MODEL.openai;
        }
    } else if (tabName === 'claude') {
        // Claude tab: ensure select is correct and fallback if missing
        const options = Array.from(elements.claudeModelSelect.options).map(opt => opt.value);
        if (!options.includes(CURRENT_MODEL.claude)) {
            elements.claudeModelSelect.value = options[0];
            CURRENT_MODEL.claude = options[0];
        } else {
            elements.claudeModelSelect.value = CURRENT_MODEL.claude;
        }
    } else if (tabName === 'grok') {
        // GROK tab: ensure select is correct and fallback if missing
        const options = Array.from(elements.grokModelSelect.options).map(opt => opt.value);
        if (!options.includes(CURRENT_MODEL.grok)) {
            elements.grokModelSelect.value = options[0];
            CURRENT_MODEL.grok = options[0];
        } else {
            elements.grokModelSelect.value = CURRENT_MODEL.grok;
        }
    }
}

// Populate model options for both providers
function populateModelOptions() {
    const modelOptions = {
        openai: [
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
            { value: 'gpt-4', label: 'GPT-4' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
            { value: 'gpt-4o', label: 'GPT-4 Omni' }
        ],
        claude: [
            // Claude 4 Family - Latest and most powerful
            { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
            { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
            
            // Claude 3.7 Family
            { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet' },
            
            // Claude 3.5 Family
            { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (New)' },
            { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
            { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
            
            // Claude 3 Family
            { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
            { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
            { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
            
            // Legacy models (still supported)
            { value: 'claude-2.1', label: 'Claude 2.1 (Legacy)' },
            { value: 'claude-2.0', label: 'Claude 2.0 (Legacy)' },
            { value: 'claude-instant-1.2', label: 'Claude Instant 1.2 (Legacy)' }
        ],
        grok: [
            { value: 'grok-4', label: 'Grok 4 (Latest)' },
            { value: 'grok-3', label: 'Grok 3' },
            { value: 'grok-3-mini', label: 'Grok 3 Mini' },
            { value: 'grok-2-vision-1212', label: 'Grok 2 Vision' },
            { value: 'grok-2-1212', label: 'Grok 2' },
            { value: 'grok-vision-beta', label: 'Grok Vision Beta' },
            { value: 'grok-beta', label: 'Grok Beta' }
        ]
    };

    // Populate OpenAI models
    elements.openaiModelSelect.innerHTML = '';
    modelOptions.openai.forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.label;
        elements.openaiModelSelect.appendChild(option);
    });
    // Set value or fallback to first option
    elements.openaiModelSelect.value = modelOptions.openai.some(m => m.value === CURRENT_MODEL.openai)
        ? CURRENT_MODEL.openai
        : modelOptions.openai[0].value;
    CURRENT_MODEL.openai = elements.openaiModelSelect.value;

    // Populate Claude models
    elements.claudeModelSelect.innerHTML = '';
    modelOptions.claude.forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.label;
        elements.claudeModelSelect.appendChild(option);
    });
    // Set value or fallback to first option
    elements.claudeModelSelect.value = modelOptions.claude.some(m => m.value === CURRENT_MODEL.claude)
        ? CURRENT_MODEL.claude
        : modelOptions.claude[0].value;
    CURRENT_MODEL.claude = elements.claudeModelSelect.value;

    // Populate GROK models
    elements.grokModelSelect.innerHTML = '';
    modelOptions.grok.forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.label;
        elements.grokModelSelect.appendChild(option);
    });
    // Set value or fallback to first option
    elements.grokModelSelect.value = modelOptions.grok.some(m => m.value === CURRENT_MODEL.grok)
        ? CURRENT_MODEL.grok
        : modelOptions.grok[0].value;
    CURRENT_MODEL.grok = elements.grokModelSelect.value;

    // Add event listeners for model selection
    elements.openaiModelSelect.addEventListener('change', () => {
        CURRENT_MODEL.openai = elements.openaiModelSelect.value;
        // Save both as 'model' (backward compatibility) and 'openaiModel'
        browser.storage.sync.set({ 
            model: CURRENT_MODEL.openai,
            openaiModel: CURRENT_MODEL.openai 
        });
    });
    
    elements.claudeModelSelect.addEventListener('change', () => {
        CURRENT_MODEL.claude = elements.claudeModelSelect.value;
        browser.storage.sync.set({ claudeModel: CURRENT_MODEL.claude });
    });
    
    elements.grokModelSelect.addEventListener('change', () => {
        CURRENT_MODEL.grok = elements.grokModelSelect.value;
        browser.storage.sync.set({ grokModel: CURRENT_MODEL.grok });
    });
}

// Restore previous chat messages from history
async function restoreChat(provider) {
    const chatContainer = provider === 'openai' ? elements.openaiChatContainer : provider === 'claude' ? elements.claudeChatContainer : elements.grokChatContainer;

    // Clear chat container safely
    while (chatContainer.firstChild) {
        chatContainer.removeChild(chatContainer.firstChild);
    }

    // Always reload from storage to avoid missing last message
    const storageKey = provider === 'openai' ? 'chatHistory_openai' : provider === 'claude' ? 'chatHistory_claude' : 'chatHistory_grok';
    const stored = await browser.storage.sync.get(storageKey);
    if (stored[storageKey]) {
        chatHistories[provider] = stored[storageKey];
    }

    chatHistories[provider].forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.isUser ? 'user-message' : 'assistant-message'}`;
        
        if (msg.isUser) {
            messageDiv.textContent = msg.content;
        } else {
            // Parse markdown to HTML and set it to the message div
            setCleanHtml(messageDiv, marked.parse(msg.content));
        }
        
        // Add copy button to the message
        createCopyButton(messageDiv, msg.content);
        
        chatContainer.appendChild(messageDiv);
    });
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
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
        }, 300);
    }, duration);
}

// Send message to API
async function sendMessage(userMessage, provider) {
    const API_KEY = API_KEYS[provider];
    if (!API_KEY) {
        throw new Error(`Please set your ${provider} API key`);
    }

    try {
        if (provider === 'openai') {
            // OpenAI API call via background script to avoid CORS issues
            const messages = [
                ...chatHistories.openai.map(msg => ({
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
                    model: CURRENT_MODEL.openai,
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
                ...chatHistories.claude.map(msg => ({
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
                    model: CURRENT_MODEL.claude,
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
        } else if (provider === 'grok') {
            // GROK API call via background script to avoid CORS issues
            const messages = [
                ...chatHistories.grok.map(msg => ({
                    role: msg.isUser ? 'user' : 'assistant',
                    content: msg.content
                })),
                { role: 'user', content: userMessage }
            ];
            
            // Send message to background script
            return new Promise((resolve, reject) => {
                browser.runtime.sendMessage({
                    action: "callGrokAPI",
                    apiKey: API_KEY,
                    model: CURRENT_MODEL.grok,
                    messages: messages
                }, response => {
                    console.log("GROK API response received:", response);
                    if (response.success) {
                        if (response.data.choices && response.data.choices.length > 0) {
                            resolve(response.data.choices[0].message.content);
                        } else if (response.data.error) {
                            console.error("GROK API returned error:", response.data.error);
                            reject(new Error(response.data.error.message || 'GROK API error'));
                        } else {
                            console.error("Unexpected GROK API response format:", response.data);
                            reject(new Error('Unexpected response format from GROK API'));
                        }
                    } else {
                        console.error("GROK API call failed:", response.error);
                        reject(new Error(response.error || 'Failed to call GROK API'));
                    }
                });
            });
        }
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Function to create a copy button for messages
function createCopyButton(messageDiv, content) {
    const copyButton = document.createElement('div');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    `;
    
    // Add click event to copy message content
    copyButton.addEventListener('click', async () => {
        try {
            // Get the text content of the message
            let textToCopy = content;
            
            // Copy to clipboard
            await navigator.clipboard.writeText(textToCopy);
            
            // Optional: Show a notification or console log for debugging
            console.log('Text copied to clipboard');
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    });
    
    messageDiv.appendChild(copyButton);
}

// Add new message to chat interface and save to history
function addMessageToChat(message, isUser, provider) {
    const chatContainer = provider === 'openai' ? elements.openaiChatContainer : provider === 'claude' ? elements.claudeChatContainer : elements.grokChatContainer;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
    
    if (isUser) {
        messageDiv.textContent = message;
    } else {
        // Parse markdown to HTML and set it to the message div
        setCleanHtml(messageDiv, marked.parse(message));
    }
    
    // Add copy button to the message
    createCopyButton(messageDiv, message);
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    chatHistories[provider].push({ content: message, isUser });
    browser.storage.sync.set({ [`chatHistory_${provider}`]: chatHistories[provider] });
}

// Helper function to auto-resize textarea with proper line wrapping detection
function autoResizeTextarea(textarea) {
    // Get computed styles
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseInt(computedStyle.lineHeight) || 20;
    const paddingTop = parseInt(computedStyle.paddingTop) || 0;
    const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
    const borderTop = parseInt(computedStyle.borderTopWidth) || 0;
    const borderBottom = parseInt(computedStyle.borderBottomWidth) || 0;
    
    // Calculate heights
    const minHeight = lineHeight + paddingTop + paddingBottom + borderTop + borderBottom;
    const maxHeight = (lineHeight * 6) + paddingTop + paddingBottom + borderTop + borderBottom;
    
    // If textarea is empty, set to minimum height
    if (!textarea.value) {
        textarea.style.height = minHeight + 'px';
        textarea.style.overflow = 'hidden';
        return;
    }
    
    // Create a hidden clone to measure actual content height
    const clone = document.createElement('textarea');
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.height = 'auto';
    clone.style.width = textarea.offsetWidth + 'px';
    clone.style.fontSize = computedStyle.fontSize;
    clone.style.fontFamily = computedStyle.fontFamily;
    clone.style.lineHeight = computedStyle.lineHeight;
    clone.style.padding = computedStyle.padding;
    clone.style.border = computedStyle.border;
    clone.style.boxSizing = computedStyle.boxSizing;
    clone.style.wordWrap = computedStyle.wordWrap;
    clone.style.whiteSpace = computedStyle.whiteSpace;
    clone.value = textarea.value;
    
    // Add clone to document temporarily
    document.body.appendChild(clone);
    
    // Measure the content height
    const contentHeight = clone.scrollHeight;
    
    // Remove clone
    document.body.removeChild(clone);
    
    // Calculate target height
    let targetHeight;
    if (contentHeight <= minHeight) {
        targetHeight = minHeight;
    } else if (contentHeight >= maxHeight) {
        targetHeight = maxHeight;
        textarea.style.overflow = 'auto';
    } else {
        targetHeight = contentHeight;
        textarea.style.overflow = 'hidden';
    }
    
    // Apply the height
    textarea.style.height = targetHeight + 'px';
}

// Event Listeners for OpenAI
elements.openaiSendButton.addEventListener('click', async () => {
    const message = elements.openaiUserInput.value.trim();
    if (message) {
        let loadingDiv = null;
        try {
            addMessageToChat(message, true, 'openai');
            elements.openaiUserInput.value = '';
            // Reset textarea height after clearing
            autoResizeTextarea(elements.openaiUserInput);
            saveInputDraft('openai', ''); // Clear draft

            // Create loading message with animated dots
            loadingDiv = document.createElement('div');
            loadingDiv.className = 'message assistant-message';
            
            // Create a span with the loading-dots class for animation
            const loadingSpan = document.createElement('span');
            loadingSpan.className = 'loading-dots';
            loadingSpan.textContent = 'Thinking';
            
            loadingDiv.appendChild(loadingSpan);
            elements.openaiChatContainer.appendChild(loadingDiv);
            elements.openaiChatContainer.scrollTop = elements.openaiChatContainer.scrollHeight;

            const response = await sendMessage(message, 'openai');
            // Remove loading message
            if (loadingDiv && loadingDiv.parentNode) {
                elements.openaiChatContainer.removeChild(loadingDiv);
            }
            addMessageToChat(response, false, 'openai');
        } catch (error) {
            // Ensure loading message is removed on error
            if (loadingDiv && loadingDiv.parentNode) {
                elements.openaiChatContainer.removeChild(loadingDiv);
            }
            addMessageToChat(`Error: ${error.message}`, false, 'openai');
        }
    }
});

// Event Listeners for Claude
elements.claudeSendButton.addEventListener('click', async () => {
    const message = elements.claudeUserInput.value.trim();
    if (message) {
        let loadingDiv = null;
        try {
            addMessageToChat(message, true, 'claude');
            elements.claudeUserInput.value = '';
            // Reset textarea height after clearing
            autoResizeTextarea(elements.claudeUserInput);
            saveInputDraft('claude', ''); // Clear draft

            // Create loading message with animated dots
            loadingDiv = document.createElement('div');
            loadingDiv.className = 'message assistant-message';
            
            // Create a span with the loading-dots class for animation
            const loadingSpan = document.createElement('span');
            loadingSpan.className = 'loading-dots';
            loadingSpan.textContent = 'Thinking';
            
            loadingDiv.appendChild(loadingSpan);
            elements.claudeChatContainer.appendChild(loadingDiv);
            elements.claudeChatContainer.scrollTop = elements.claudeChatContainer.scrollHeight;

            const response = await sendMessage(message, 'claude');
            // Remove loading message
            if (loadingDiv && loadingDiv.parentNode) {
                elements.claudeChatContainer.removeChild(loadingDiv);
            }
            addMessageToChat(response, false, 'claude');
        } catch (error) {
            // Ensure loading message is removed on error
            if (loadingDiv && loadingDiv.parentNode) {
                elements.claudeChatContainer.removeChild(loadingDiv);
            }
            addMessageToChat(`Error: ${error.message}`, false, 'claude');
        }
    }
});

// Event Listeners for GROK
elements.grokSendButton.addEventListener('click', async () => {
    const message = elements.grokUserInput.value.trim();
    if (message) {
        let loadingDiv = null;
        try {
            addMessageToChat(message, true, 'grok');
            elements.grokUserInput.value = '';
            // Reset textarea height after clearing
            autoResizeTextarea(elements.grokUserInput);
            saveInputDraft('grok', ''); // Clear draft

            // Create loading message with animated dots
            loadingDiv = document.createElement('div');
            loadingDiv.className = 'message assistant-message';
            
            // Create a span with the loading-dots class for animation
            const loadingSpan = document.createElement('span');
            loadingSpan.className = 'loading-dots';
            loadingSpan.textContent = 'Thinking';
            
            loadingDiv.appendChild(loadingSpan);
            elements.grokChatContainer.appendChild(loadingDiv);
            elements.grokChatContainer.scrollTop = elements.grokChatContainer.scrollHeight;

            const response = await sendMessage(message, 'grok');
            // Remove loading message
            if (loadingDiv && loadingDiv.parentNode) {
                elements.grokChatContainer.removeChild(loadingDiv);
            }
            addMessageToChat(response, false, 'grok');
        } catch (error) {
            // Ensure loading message is removed on error
            if (loadingDiv && loadingDiv.parentNode) {
                elements.grokChatContainer.removeChild(loadingDiv);
            }
            addMessageToChat(`Error: ${error.message}`, false, 'grok');
        }
    }
});

// Clear history buttons
elements.openaiClearHistoryButton.addEventListener('click', () => {
    // Clear chat container safely
    while (elements.openaiChatContainer.firstChild) {
        elements.openaiChatContainer.removeChild(elements.openaiChatContainer.firstChild);
    }
    chatHistories.openai = [];
    browser.storage.sync.set({ chatHistory_openai: [] });
});

elements.claudeClearHistoryButton.addEventListener('click', () => {
    // Clear chat container safely
    while (elements.claudeChatContainer.firstChild) {
        elements.claudeChatContainer.removeChild(elements.claudeChatContainer.firstChild);
    }
    chatHistories.claude = [];
    browser.storage.sync.set({ chatHistory_claude: [] });
});

elements.grokClearHistoryButton.addEventListener('click', () => {
    // Clear chat container safely
    while (elements.grokChatContainer.firstChild) {
        elements.grokChatContainer.removeChild(elements.grokChatContainer.firstChild);
    }
    chatHistories.grok = [];
    browser.storage.sync.set({ chatHistory_grok: [] });
});

elements.clearApiKeyButton.addEventListener('click', async () => {
    // Clear both API keys
    await browser.storage.sync.set({ apiKey: '', claudeKey: '', grokKey: '' });
    elements.apiKeyInput.value = '';
    elements.claudeKeyInput.value = '';
    elements.grokKeyInput.value = '';
    API_KEYS.openai = '';
    API_KEYS.claude = '';
    API_KEYS.grok = '';
});

elements.saveSettingsButton.addEventListener('click', async () => {
    // Get all API keys
    API_KEYS.openai = elements.apiKeyInput.value;
    API_KEYS.claude = elements.claudeKeyInput.value;
    API_KEYS.grok = elements.grokKeyInput.value;

    const theme = elements.themeSelect.value;
    const selectedColor = document.querySelector('.color-option.selected')?.getAttribute('data-color') || '#10A37F';

    // Save all settings including current models
    await browser.storage.sync.set({
        apiKey: API_KEYS.openai,
        claudeKey: API_KEYS.claude,
        grokKey: API_KEYS.grok,
        theme,
        primaryColor: selectedColor,
        openaiModel: CURRENT_MODEL.openai,  // Save OpenAI model
        claudeModel: CURRENT_MODEL.claude,  // Save Claude model
        grokModel: CURRENT_MODEL.grok,      // Save GROK model
        model: CURRENT_MODEL.openai         // Backward compatibility
    });
    
    // Log saved settings for debugging
    console.log('Saved settings:', {
        openai: API_KEYS.openai,
        claude: API_KEYS.claude,
        grok: API_KEYS.grok,
        openaiModel: CURRENT_MODEL.openai,
        claudeModel: CURRENT_MODEL.claude,
        grokModel: CURRENT_MODEL.grok,
        theme,
        primaryColor: selectedColor
    });
    
    applyTheme(theme);
    applyAccentColor(selectedColor);
    elements.themeSelect.value = theme; // ensure select stays in sync
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

// Input handling for message sending - OpenAI
elements.openaiUserInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (e.ctrlKey) {
            e.preventDefault();
            const start = elements.openaiUserInput.selectionStart;
            const end = elements.openaiUserInput.selectionEnd;
            const value = elements.openaiUserInput.value;
            elements.openaiUserInput.value = value.substring(0, start) + '\n' + value.substring(end);
            elements.openaiUserInput.selectionStart = elements.openaiUserInput.selectionEnd = start + 1;
            // Trigger auto-resize after adding new line
            autoResizeTextarea(elements.openaiUserInput);
        } else if (!e.shiftKey) {
            e.preventDefault();
            elements.openaiSendButton.click();
        }
    }
});

// Input handling for message sending - Claude
elements.claudeUserInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (e.ctrlKey) {
            e.preventDefault();
            const start = elements.claudeUserInput.selectionStart;
            const end = elements.claudeUserInput.selectionEnd;
            const value = elements.claudeUserInput.value;
            elements.claudeUserInput.value = value.substring(0, start) + '\n' + value.substring(end);
            elements.claudeUserInput.selectionStart = elements.claudeUserInput.selectionEnd = start + 1;
            // Trigger auto-resize after adding new line
            autoResizeTextarea(elements.claudeUserInput);
        } else if (!e.shiftKey) {
            e.preventDefault();
            elements.claudeSendButton.click();
        }
    }
});

// Input handling for message sending - GROK
elements.grokUserInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (e.ctrlKey) {
            e.preventDefault();
            const start = elements.grokUserInput.selectionStart;
            const end = elements.grokUserInput.selectionEnd;
            const value = elements.grokUserInput.value;
            elements.grokUserInput.value = value.substring(0, start) + '\n' + value.substring(end);
            elements.grokUserInput.selectionStart = elements.grokUserInput.selectionEnd = start + 1;
            // Trigger auto-resize after adding new line
            autoResizeTextarea(elements.grokUserInput);
        } else if (!e.shiftKey) {
            e.preventDefault();
            elements.grokSendButton.click();
        }
    }
});

// Save input drafts on input and auto-resize
elements.openaiUserInput.addEventListener('input', (e) => {
    saveInputDraft('openai', e.target.value);
    autoResizeTextarea(e.target);
});
elements.claudeUserInput.addEventListener('input', (e) => {
    saveInputDraft('claude', e.target.value);
    autoResizeTextarea(e.target);
});
elements.grokUserInput.addEventListener('input', (e) => {
    saveInputDraft('grok', e.target.value);
    autoResizeTextarea(e.target);
});
