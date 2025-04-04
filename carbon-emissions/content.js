// Content script for the Carbon Emissions extension

const CARBON_CONSTANTS = {
  WATTS_PER_TOKEN: 0.003,
  CARBON_INTENSITY: 0.475,
  SECONDS_PER_TOKEN: 0.05,
  CHARS_PER_TOKEN: 4,
  
  // Expanded list of ignored keywords and patterns
  IGNORED_KEYWORDS: [
    'settings', 
    'chatgpt', 
    'upgrade', 
    'help', 
    'feedback', 
    'new chat', 
    'regenerate', 
    'clear conversations',
    'welcome back',
    'how can i help you today?',
    'loading',
    'thinking',
    'plugin store'
  ],

  // Improved selectors for assistant messages
  ASSISTANT_SELECTORS: [
    'div[data-testid="conversation-turn-response"]',
    'div[class*="assistant-message"]',
    'div[class*="response"]',
    'div[class*="message-container"]',
    'div[data-message-author="assistant"]',
    '.group .whitespace-pre-wrap'
  ],

  // Patterns to exclude from message content
  EXCLUDE_PATTERNS: [
    /\[.*?\]/g,  
    /\(.*?\)/g,  
    /^\s*[•\-]\s*/gm  
  ]
};

class ImprovedCarbonTracker {
  constructor() {
    this.userMessageCount = 0;
    this.userTokens = 0;
    this.assistantTokens = 0;
    this.totalTokens = 0;
    this.carbonEmissions = 0;
    this.sessionStartTime = Date.now();
    
    this.uiContainer = null;
    this.isAnalyzing = false;
    this.isInitialized = false;

    this.createUI();
    this.initWhenReady().then(() => {
      this.isInitialized = true;
      console.log('Carbon Tracker initialized successfully');
    });

    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      try {
        switch(message.action) {
          case 'getCurrentStats':
            sendResponse({
              totalTokens: this.totalTokens,
              carbonEmissions: this.carbonEmissions
            });
            break;
          case 'resetStats':
            this.resetStats();
            sendResponse({ success: true });
            break;
          default:
            console.log('Unhandled message:', message);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        sendResponse({ error: error.toString() });
      }
      return true; 
    });
  }

  resetStats() {
    // Reset all tracking variables
    this.userMessageCount = 0;
    this.userTokens = 0;
    this.assistantTokens = 0;
    this.totalTokens = 0;
    this.carbonEmissions = 0;
    this.sessionStartTime = Date.now();
    this.updateUI();
    console.log('Stats reset successfully');
  }

  async initWhenReady() {
    const attemptInit = () => {
      const chatContainer = this.findChatContainer();
      if (chatContainer) {
        console.log('Chat container found, setting up observer');
        this.setupConversationObserver(chatContainer);
        this.analyzeConversation();
      } else {
        console.log('Chat container not found, retrying...');
        setTimeout(attemptInit, 1000);
      }
    };
    attemptInit();
  }

  findChatContainer() {
    const selectors = [
      '#__next > div', 
      'main', 
      '[data-testid="conversation-container"]', 
      '.conversation-container', 
      'div[class*="chat"]',
      'div[class*="conversation"]'
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) return container;
    }
    return null;
  }

  setupConversationObserver(chatContainer) {
    const observer = new MutationObserver(this.debounceAnalyzeConversation.bind(this));
    observer.observe(chatContainer, { 
      childList: true, 
      subtree: true,
      characterData: true
    });
    console.log('MutationObserver set up successfully');
  }

  debounceAnalyzeConversation() {
    if (this.isAnalyzing || !this.isInitialized) {
      return;
    }
    this.isAnalyzing = true;
    setTimeout(() => {
      try {
        this.analyzeConversation();
      } catch (error) {
        console.error('Error during conversation analysis:', error);
      } finally {
        this.isAnalyzing = false;
      }
    }, 1000);
  }

  analyzeConversation() {
    const userMessages = this.selectUserMessages();
    const assistantMessages = this.selectAssistantMessages();
  
    this.userMessageCount = userMessages.length;
    this.userTokens = 0;
    this.assistantTokens = 0;
  
    // Analyze user messages
    userMessages.forEach((message, index) => {
      const text = this.extractCleanText(message);
      if (!this.isIgnoredMessage(text)) {
        const tokens = this.estimateTokens(text);
        this.userTokens += tokens;
        console.log(`User message ${index + 1}: tokens = ${tokens}`);
      }
    });
  
    // Analyze assistant messages
    assistantMessages.forEach((message, index) => {
      const text = this.extractCleanText(message);
      if (!this.isIgnoredMessage(text)) {
        const tokens = this.estimateTokens(text);
        this.assistantTokens += tokens;
        console.log(`Assistant message ${index + 1}: tokens = ${tokens}`);
      }
    });
  
    // Calculate total tokens and emissions
    this.totalTokens = this.userTokens + this.assistantTokens;
    this.calculateCarbonEmissions();
    this.updateUI();
  }

  selectUserMessages() {
    const userSelectors = [
      'div[class*="user"]',
      'div[class*="message"][data-message-author="user"]',
      'div[data-testid="conversation-turn-user"]'
    ];

    for (const selector of userSelectors) {
      const messages = document.querySelectorAll(selector);
      if (messages.length > 0) return Array.from(messages);
    }
    return [];
  }

  
  selectAssistantMessages() {
    for (const selector of CARBON_CONSTANTS.ASSISTANT_SELECTORS) {
      const messages = document.querySelectorAll(selector);
      
      if (messages.length > 0) {
        const validMessages = Array.from(messages)
          .filter(this.isValidAssistantMessage.bind(this))
          .filter(message => {
            const text = this.extractCleanText(message);
            return text.length > 10 && !this.isIgnoredMessage(text);
          });

        if (validMessages.length > 0) {
          console.log(`Found ${validMessages.length} valid assistant messages using selector: ${selector}`);
          return validMessages;
        }
      }
    }

    console.log('Falling back to aggressive assistant message selection');
    return this.fallbackAssistantMessageSelection();
  }

  
  fallbackAssistantMessageSelection() {
    const potentialSelectors = [
      'div:not([class*="user"]) > div.whitespace-pre-wrap',
      'div:not([class*="user"]) > p',
    ];

    for (const selector of potentialSelectors) {
      const messages = document.querySelectorAll(selector);
      
      if (messages.length > 0) {
        const validMessages = Array.from(messages)
          .filter(message => {
            const text = this.extractCleanText(message);
            return (
              text.length > 10 && 
              !this.isIgnoredMessage(text) && 
              !text.toLowerCase().includes('user')
            );
          });

        if (validMessages.length > 0) {
          console.log(`Fallback: Found ${validMessages.length} messages using selector: ${selector}`);
          return validMessages;
        }
      }
    }

    return [];
  }


  isIgnoredMessage(text) {
    const lowercaseText = text.toLowerCase();
    
    const hasIgnoredKeyword = CARBON_CONSTANTS.IGNORED_KEYWORDS.some(keyword => 
      lowercaseText.includes(keyword)
    );
  
    const isShortOrEmpty = text.length <= 10;
    const isSystemMessage = lowercaseText.includes('chatgpt') || 
                            lowercaseText.includes('welcome') || 
                            lowercaseText.includes('help') ||
                            lowercaseText.includes('how can i help you today') ||
                            lowercaseText.includes('new chat') ||
                            lowercaseText.includes('model: gpt');
  
    return hasIgnoredKeyword || isShortOrEmpty || isSystemMessage;
  }


  extractCleanText(messageElement) {
    let text = messageElement.innerText || messageElement.textContent || '';
    
    CARBON_CONSTANTS.EXCLUDE_PATTERNS.forEach(pattern => {
      text = text.replace(pattern, '');
    });

    // Additional cleaning steps
    return text.trim()
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/[^\w\s.,!?]/g, '')  // Remove special characters
      .toLowerCase();
  }

  /**
   * Estimate the number of tokens with more sophisticated approach
   * @param {string} text - The text to estimate tokens for
   * @returns {number} Estimated number of tokens
   */
  estimateTokens(text) {
    // More nuanced token estimation
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;
    
    // Weighted estimation with additional refinement
    return Math.max(1, Math.ceil(
      (0.6 * (charCount / CARBON_CONSTANTS.CHARS_PER_TOKEN)) + 
      (0.4 * wordCount)
    ));
  }

  calculateCarbonEmissions() {
    // More precise energy and carbon calculations
    const energyUsageWh = (
      this.totalTokens * 
      CARBON_CONSTANTS.WATTS_PER_TOKEN
    );
    
    this.carbonEmissions = energyUsageWh * CARBON_CONSTANTS.CARBON_INTENSITY;
    
    console.log(
      'Calculated emissions:', 
      this.carbonEmissions.toFixed(6), 
      'g CO₂e for', 
      this.totalTokens, 
      'tokens'
    );
  }

  generateEquivalents() {
    // Conversion factors for carbon emissions equivalents
    return [
      { 
        activity: "Google queries", 
        amount: (this.carbonEmissions / 0.2).toFixed(3), 
        unit: "Number (annually)" 
      },
      { 
        activity: "Boiling ", 
        amount: (this.carbonEmissions / 15).toFixed(3), 
        unit: "cups water in kettle (annually)" 
      },
      { 
        activity: "Video Streaming ", 
        amount: (this.carbonEmissions / 55).toFixed(3), 
        unit: "Hours (annually)" 
      },
    ];
  }

  createUI() {
    this.uiContainer = document.createElement('div');
    this.uiContainer.id = 'carbon-tracker-container';
    this.uiContainer.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; background-color: rgba(255, 255, 255, 0.95);
      border: 1px solid #10a37f; border-radius: 8px; padding: 12px; width: 240px;
      font-family: system-ui, -apple-system, sans-serif; font-size: 14px; color: #333;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); z-index: 10000;
    `;

    const header = document.createElement('div');
    header.style.cssText = `display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-weight: bold; color: #10a37f;`;
    const title = document.createElement('div');
    title.innerHTML = '🌱 Carbon Footprint';
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '−';
    toggleButton.style.cssText = `background: none; border: none; font-size: 16px; cursor: pointer; color: #666;`;

    this.contentArea = document.createElement('div');
    this.contentArea.id = 'carbon-tracker-content';

    let isCollapsed = false;
    toggleButton.addEventListener('click', () => {
      this.contentArea.style.display = isCollapsed ? 'block' : 'none';
      toggleButton.textContent = isCollapsed ? '−' : '+';
      this.uiContainer.style.width = isCollapsed ? '240px' : 'auto';
      isCollapsed = !isCollapsed;
    });

    header.appendChild(title);
    header.appendChild(toggleButton);
    this.uiContainer.appendChild(header);
    this.uiContainer.appendChild(this.contentArea);
    document.body.appendChild(this.uiContainer);

    this.updateUI();
  }

  updateUI() {
    if (!this.contentArea) return;
    const equivalents = this.generateEquivalents();
    const sessionDurationMinutes = Math.round((Date.now() - this.sessionStartTime) / 60000);

    this.contentArea.innerHTML = `
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Total tokens:</span>
          <span>${this.totalTokens.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>User tokens:</span>
          <span>${this.userTokens.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Assistant tokens:</span>
          <span>${this.assistantTokens.toLocaleString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Carbon emissions:</span>
          <span>${this.carbonEmissions.toFixed(6)} g CO₂e</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Session duration:</span>
          <span>${sessionDurationMinutes} min</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>User messages:</span>
          <span>${this.userMessageCount}</span>
        </div>
      </div>
      <div style="margin-bottom: 10px;">
        <div style="font-weight: 500; margin-bottom: 5px; color: #10a37f;">Equivalent to:</div>
        ${equivalents.map(eq => `
          <div style="display: flex; justify-content: space-between; gap: 10px; margin-bottom: 3px; font-size: 13px;">
            <span>${eq.activity}</span>
            <span>${eq.amount} ${eq.unit}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  showError(message) {
    if (this.contentArea) {
      this.contentArea.innerHTML = `<div style="color: #d32f2f;">${message}</div>`;
    }
  }
}

// Initialize the tracker when the document is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  new ImprovedCarbonTracker();
} else {
  window.addEventListener('DOMContentLoaded', () => new ImprovedCarbonTracker());
}