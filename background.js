/**
 * Background script for the Firefox extension
 * Initializes default settings when the extension is installed
 */
browser.runtime.onInstalled.addListener(() => {
    // Set default configuration values
    browser.storage.sync.set({
        theme: 'light',          // Default theme setting
        primaryColor: '#10A37F', // Default accent color
        apiKey: ''              // Empty API key by default
    });
});