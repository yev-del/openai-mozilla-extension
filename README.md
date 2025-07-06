# 🤖 ChatGPT & Claude API Chat Client

<div align="center">

![Version](https://img.shields.io/badge/version-1.3-blue.svg)
![Mozilla Extension](https://img.shields.io/badge/Mozilla-Extension-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![API Support](https://img.shields.io/badge/API-OpenAI%20%7C%20Claude-purple.svg)

**A powerful Mozilla Firefox extension for seamless communication with the latest AI models from OpenAI and Anthropic**

[Installation](#-installation) • [Features](#-features) • [Usage](#-usage) • [Development](#-development) • [Changelog](#-changelog)

</div>

---

## 🌟 Features

### 🧠 **Latest AI Models Support**
- **OpenAI Models**: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo, GPT-4 Omni
- **Claude 4 Family**: Claude 4 Opus, Claude 4 Sonnet *(NEW in v1.3)*
- **Claude 3.7**: Claude 3.7 Sonnet *(NEW in v1.3)*
- **Claude 3.5 Family**: Claude 3.5 Sonnet (Latest), Claude 3.5 Haiku
- **Claude 3 Family**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Legacy Support**: Claude 2.1, Claude 2.0, Claude Instant 1.2

### 🎯 **Smart Interface**
- **Dynamic Input Fields** *(NEW in v1.3)*: Message boxes automatically expand as you type multiple lines
- **Tab-Based Design**: Seamlessly switch between ChatGPT and Claude conversations
- **Persistent Model Selection** *(ENHANCED in v1.3)*: Your chosen model stays selected across sessions
- **Auto-Save Drafts**: Never lose your message drafts when switching tabs
- **Responsive Layout**: Optimized for the Firefox extension popup format

### 🎨 **Customization**
- **Dual Themes**: Light and Dark mode support
- **Accent Colors**: 6 beautiful color schemes to personalize your experience
- **Markdown Rendering**: Rich text formatting with syntax highlighting
- **Code Highlighting**: Powered by Highlight.js for beautiful code blocks

### 🔒 **Privacy & Security**
- **Local Storage**: All data stored securely in your browser
- **Direct API Connections**: No intermediate servers or data collection
- **Secure Key Storage**: API keys encrypted in Firefox's secure storage
- **No Tracking**: Zero analytics or user behavior monitoring

### ⚡ **Performance**
- **Instant Access**: One-click communication with AI models
- **Efficient Storage**: Optimized chat history management
- **Fast Rendering**: Smooth markdown and code highlighting
- **Memory Optimized**: Lightweight design for browser efficiency

---

## 📦 Installation

### From Mozilla Add-ons Store
1. Visit the [Mozilla Add-ons Store](https://addons.mozilla.org/firefox/addon/openai-chat-extension/)
2. Click "Add to Firefox"
3. Confirm the installation
4. The extension icon will appear in your toolbar

### Manual Installation (Development)
1. Clone this repository
```bash
git clone https://github.com/your-repo/chatgpt-claude-extension.git
cd chatgpt-claude-extension
```
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" → "Load Temporary Add-on"
4. Select the `manifest.json` file from the cloned directory

---

## 🚀 Usage

### Initial Setup
1. **Click the extension icon** in your Firefox toolbar
2. **Navigate to Settings tab**
3. **Add your API keys**:
   - **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Claude API Key**: Get from [Anthropic Console](https://console.anthropic.com/)
4. **Save settings** and you're ready to go!

### Chatting with AI
1. **Choose your provider**: Click either "ChatGPT" or "Claude" tab
2. **Select a model**: Use the dropdown to choose your preferred AI model
3. **Start typing**: The input field automatically expands for longer messages
4. **Send messages**: Press Enter or click the send button
5. **Copy responses**: Hover over any message to reveal the copy button

### Keyboard Shortcuts
- **Enter**: Send message
- **Shift + Enter**: New line in message
- **Ctrl + Enter**: Force new line in message

### Advanced Features
- **Clear History**: Use the trash icon to clear conversation history
- **Theme Toggle**: Switch between light and dark modes in settings
- **Color Themes**: Choose from 6 accent colors to personalize the interface
- **Draft Persistence**: Your typed messages are automatically saved as drafts

---

## 🛠 Development

### Technology Stack
- **Frontend**: HTML5, CSS3, ES6+ JavaScript
- **APIs**: OpenAI GPT API, Anthropic Claude API
- **Libraries**:
  - `marked.min.js` - Markdown parsing and rendering
  - `highlight.min.js` - Code syntax highlighting
  - `purify.min.js` - HTML sanitization for security
- **Browser APIs**: Firefox WebExtensions API, Storage API

### Project Structure
```
📁 openai-mozilla-extension/
├── 📁 icons/              # Extension icons (16px to 128px)
├── 📁 lib/                # External libraries
│   ├── default.min.css    # Highlight.js default theme
│   ├── highlight.min.js   # Code syntax highlighting
│   ├── markdown.css       # Markdown styling
│   ├── marked.min.js      # Markdown parser
│   └── purify.min.js      # HTML sanitization
├── background.js          # Extension background script
├── browser-polyfill.js    # Browser compatibility layer
├── manifest.json          # Extension manifest
├── popup.html            # Main extension popup
├── popup.js              # Main application logic
├── styles.css            # Core styling
└── README.md             # This file
```

### Key Components

#### 🔧 **popup.js** - Core Logic
- API communication with OpenAI and Claude
- Chat history management
- Model selection and persistence
- Dynamic UI updates and input handling

#### 🎨 **styles.css** - Interface Design
- Responsive layout for fixed 650x600 popup
- Dynamic textarea resizing
- Theme system with CSS custom properties
- Smooth animations and transitions

#### 🔒 **background.js** - Extension Backend
- CORS-free API requests
- Secure settings initialization
- Storage change monitoring

### Building Features

#### Adding New AI Models
1. Update the `modelOptions` object in `populateModelOptions()`
2. Ensure the model ID matches the API provider's specification
3. Test API compatibility with the new model

#### Extending Themes
1. Add new color variables to `:root` in `styles.css`
2. Update the color palette in `popup.html`
3. Ensure contrast ratios meet accessibility standards

---

## 📈 Changelog

### 🎉 Version 1.3 *(Current)*
**🆕 Major Features:**
- **Claude 4 Support**: Added Claude 4 Opus and Claude 4 Sonnet models
- **Dynamic Input Fields**: Message boxes now auto-expand for multi-line text with smooth transitions
- **Enhanced Model Persistence**: Selected models properly saved across sessions with improved fallback system
- **Improved Storage System**: Better handling of settings and chat history with consistent storage keys

**🔧 Technical Improvements:**
- Fixed critical loading message cleanup bug that could leave animations on screen
- Resolved duplicate script loading issue that could cause JavaScript conflicts
- Enhanced storage key consistency for both OpenAI and Claude models
- Improved textarea auto-resize functionality with proper height reset
- Better error handling for API responses with robust cleanup
- Added automatic textarea height reset when messages are sent

**🎨 UI/UX Enhancements:**
- Smoother height transitions for input fields (0.1s ease animation)
- Better visual feedback for model selection with proper sync
- Improved default model fallback system
- Enhanced icon reference consistency in manifest
- More robust DOM element cleanup and memory management

**🛡️ Security & Stability:**
- Resolved potential XSS vulnerabilities in message rendering
- Improved manifest icon references to prevent loading failures
- Enhanced error boundary handling for API calls
- Better memory management with proper event listener cleanup
- Strengthened content security policy compliance

### Version 1.2
- Added Claude 3.5 models support
- Implemented draft auto-save functionality
- Enhanced markdown rendering
- Improved theme switching

### Version 1.1
- Added Claude API support
- Implemented tab-based interface
- Added copy message functionality
- Enhanced security with DOMPurify

### Version 1.0
- Initial release with OpenAI GPT support
- Basic chat functionality
- Theme system implementation
- Secure API key storage

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature-name`
3. **Make your changes** and test thoroughly
4. **Commit changes**: `git commit -m "Add feature description"`
5. **Push to branch**: `git push origin feature-name`
6. **Open a Pull Request** with a detailed description

### Development Guidelines
- Follow existing code style and formatting
- Test all features across different Firefox versions
- Ensure API keys are handled securely
- Maintain responsive design principles
- Add appropriate comments for complex logic

---

## 📋 Requirements

- **Firefox**: Version 60.0 or higher
- **API Keys**: 
  - OpenAI API key for ChatGPT features
  - Anthropic API key for Claude features
- **Internet Connection**: Required for AI model communication

---

## 💰 Pricing

The extension itself is **completely free**. You only pay for API usage:

- **OpenAI Pricing**: [View OpenAI Pricing](https://openai.com/pricing)
- **Anthropic Pricing**: [View Claude Pricing](https://www.anthropic.com/pricing)

Both providers offer generous free tiers for new users.

---

## 🛡 Security & Privacy

- **🔒 Local Storage**: All data remains on your device
- **🛡 No Tracking**: We don't collect any user data
- **🔐 Secure Keys**: API keys stored in Firefox's encrypted storage
- **📡 Direct Connections**: No intermediate servers or proxies
- **🧹 HTML Sanitization**: All AI responses sanitized with DOMPurify

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: This README and inline code comments

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for the AI community**

⭐ **Star this repo if you find it helpful!** ⭐

</div>
