/**
 * Settings Tab Component
 */

class SettingsComponent {
  constructor() {
    this.init();
  }

  async init() {
    console.log('Settings Component Loaded: v4.1.0 (B.Y.O. API)');
    await this.loadSettings();

    document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
    document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
    document.getElementById('clearDataBtn').addEventListener('click', () => this.clearData());
    document.getElementById('testConnectionBtn').addEventListener('click', () => this.testConnection());

    // Update model placeholder based on provider
    document.getElementById('aiProviderSelect').addEventListener('change', (e) => {
      const modelInput = document.getElementById('aiModelInput');
      if (e.target.value === 'groq') {
        modelInput.placeholder = 'e.g. llama-3.3-70b-versatile';
      } else if (e.target.value === 'openai') {
        modelInput.placeholder = 'e.g. gpt-4o';
      }
    });
  }

  async loadSettings() {
    const result = await chrome.storage.local.get([
      'customPrompt',
      'aiProvider',
      'aiApiKey',
      'aiModel'
    ]);

    document.getElementById('customPromptInput').value = result.customPrompt || 'Write a short, professional 2-sentence LinkedIn invite. Mention their specific roles. Be friendly.';
    document.getElementById('aiProviderSelect').value = result.aiProvider || 'groq';
    document.getElementById('aiApiKeyInput').value = result.aiApiKey || '';
    document.getElementById('aiModelInput').value = result.aiModel || '';

    // Tier-related UI elements (currentPlan, upgradeBtn) will be hidden/removed in HTML/CSS
  }

  async saveSettings() {
    const customPrompt = document.getElementById('customPromptInput').value.trim();
    const aiProvider = document.getElementById('aiProviderSelect').value;
    const aiApiKey = document.getElementById('aiApiKeyInput').value.trim();
    const aiModel = document.getElementById('aiModelInput').value.trim();

    await chrome.storage.local.set({
      customPrompt: customPrompt,
      aiProvider,
      aiApiKey,
      aiModel
    });

    window.popupController.showNotification('Settings saved!');
  }

  async testConnection() {
    const provider = document.getElementById('aiProviderSelect').value;
    const apiKey = document.getElementById('aiApiKeyInput').value.trim();
    const model = document.getElementById('aiModelInput').value.trim();

    if (!apiKey) {
      alert('Please enter an API key first');
      return;
    }

    const testBtn = document.getElementById('testConnectionBtn');
    const originalText = testBtn.textContent;
    testBtn.textContent = 'Testing...';
    testBtn.disabled = true;

    try {
      const success = await window.aiService.testConnection(provider, apiKey, model);
      if (success) {
        window.popupController.showNotification('Connection successful!', 'success');
      } else {
        throw new Error('Unexpected response from API');
      }
    } catch (error) {
      alert('Connection failed: ' + error.message);
    } finally {
      testBtn.textContent = originalText;
      testBtn.disabled = false;
    }
  }

  async exportData() {
    const data = await window.storageManager.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-ai-pro-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    window.popupController.showNotification('Data exported!');
  }

  async clearData() {
    if (!confirm('Are you sure? This will delete all templates, messages, and settings!')) {
      return;
    }

    await chrome.storage.local.clear();

    // Reset to defaults
    await chrome.storage.local.set({
      userTier: 'free',
      templates: [],
      messages: [],
      reminders: [],
      dailyActivity: {},
      aiUsage: {}
    });

    window.popupController.showNotification('All data cleared!');
    await this.loadSettings();
  }
}

// Initialize
const settingsComponent = new SettingsComponent();
window.settingsComponent = settingsComponent;
