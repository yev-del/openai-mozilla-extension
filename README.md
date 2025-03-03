# OpenAI Chat Chrome Extension

A Mozilla extension for chatting with OpenAI's GPT models directly from your browser.

## Features
- Support for GPT-3.5 and GPT-4 models
- Dark/Light theme
- Customizable accent colors
- Local storage for chat history
- Markdown support for responses
- Secure API key storage

## Project Structure
- icons/
  - icon16.png
  - icon48.png
  - icon128.png
- lib/
  - default.min.css
  - highlight.min.js
  - marked.min.js
  - purify.min.js
- background.js
- popup.html
- popup.js
- styles.css
- README.md

## Installation
1. Navigate to https://addons.mozilla.org/ru/firefox/addon/openai-chat-extension/
2. Add extention to your browser
3. Add your OpenAI API key in the extension settings

## Usage
1. Click the extension icon in Mozilla
2. Enter your OpenAI API key in settings (you can get it from OpenAI dashboard)
3. Choose your preferred model (GPT-3.5 or GPT-4)
4. Start chatting with the AI
5. Use settings to customize theme and accent colors

## Development
The extension is built using:
- HTML/CSS/JavaScript
- OpenAI API
- Marked.js for Markdown rendering
- Highlight.js for code syntax highlighting

## Future Improvements
- Support for more OpenAI models
- Chat history export/import
- Custom system prompts
- Message formatting options
- Conversation templates

## License
MIT