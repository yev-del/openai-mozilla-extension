/**
 * Background script for the Firefox extension
 * Initializes default settings when the extension is installed
 */
browser.runtime.onInstalled.addListener(() => {
    // Set default configuration values
    browser.storage.sync.set({
        theme: 'light',          // Default theme setting
        primaryColor: '#10A37F', // Default accent color
        apiKey: '',              // Empty API key by default
        claudeKey: '',           // Empty Claude API key by default
        grokKey: '',             // Empty GROK API key by default
        provider: 'openai',      // Default provider
        openaiModel: 'gpt-3.5-turbo',        // Default OpenAI model
        claudeModel: 'claude-opus-4-20250514', // Default Claude model (latest)
        grokModel: 'grok-4',            // Default GROK model (latest)
        model: 'gpt-3.5-turbo',  // Backward compatibility
        chatHistory_openai: [],  // Empty chat history for OpenAI
        chatHistory_claude: [],  // Empty chat history for Claude
        chatHistory_grok: []     // Empty chat history for GROK
    });
});

// Listen for storage changes to debug
browser.storage.onChanged.addListener((changes, area) => {
    console.log('Storage changes detected in', area);
    
    // If apiKey was changed, make sure it's properly saved
    if (changes.apiKey) {
        console.log('OpenAI API key changed:', {
            oldValue: changes.apiKey.oldValue ? 'present' : 'not present',
            newValue: changes.apiKey.newValue ? 'present' : 'not present'
        });
        
        // Verify the key was saved
        browser.storage.sync.get('apiKey').then(result => {
            console.log('Verified OpenAI API key in storage:', 
                result.apiKey ? 'present' : 'not present');
        });
    }
});

// Open the sidebar when the browser action is clicked
browser.browserAction.onClicked.addListener(() => {
    browser.sidebarAction.open();
});

// Handle API requests from popup.js
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "callClaudeAPI") {
        // Make the API call from the background script to avoid CORS issues
        fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': request.apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: request.model,
                messages: request.messages,
                max_tokens: 4000
            })
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error("Claude API error:", error);
            sendResponse({ success: false, error: error.message });
        });
        
        // Return true to indicate we will send a response asynchronously
        return true;
    }
    
    if (request.action === "callOpenAIAPI") {
        // Make the API call from the background script to avoid CORS issues
        fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${request.apiKey}`
            },
            body: JSON.stringify({
                model: request.model,
                messages: request.messages
            })
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error("OpenAI API error:", error);
            sendResponse({ success: false, error: error.message });
        });
        
        // Return true to indicate we will send a response asynchronously
        return true;
    }
    
    if (request.action === "callGrokAPI") {
        // X.AI API is OpenAI-compatible, use the correct endpoint
        const apiUrl = 'https://api.x.ai/v1/chat/completions';
        
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${request.apiKey}`
            },
            body: JSON.stringify({
                model: request.model,
                messages: request.messages,
                max_tokens: 4000,
                temperature: 0.7,
                stream: false
            })
        })
        .then(response => {
            console.log(`GROK API Response Status: ${response.status}`);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error(`GROK API Error Response: ${text}`);
                    throw new Error(`HTTP ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("GROK API Success Response:", data);
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error("GROK API Error Details:", error);
            sendResponse({ success: false, error: `GROK API Error: ${error.message}` });
        });
        
        // Return true to indicate we will send a response asynchronously
        return true;
    }
});
