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
        claudeKey: ''            // Empty Claude API key by default
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
});
