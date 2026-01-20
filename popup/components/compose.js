/**
 * Compose Tab Component
 */

class ComposeComponent {
    constructor() {
        this.profileData = null;
        this.init();
    }

    init() {
        document.getElementById('grabProfileBtn').addEventListener('click', () => this.extractProfile());
        document.getElementById('generateBtn').addEventListener('click', () => this.generateMessage());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyMessage());
    }

    async extractProfile() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab.url.includes('linkedin.com/in/')) {
                alert('Please navigate to a LinkedIn profile page first!');
                return;
            }

            window.popupController.showLoading(true);

            const tier = await window.tierManager.getUserTier();

            try {
                // Try to send message first
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'extract_profile',
                    tier
                });
                this.handleProfileResponse(response);
            } catch (error) {
                // If script not ready/found, inject it
                console.log('Script not found, injecting...', error);

                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content/profile-extractor.js']
                });

                // Wait a moment for script to initialize
                await new Promise(resolve => setTimeout(resolve, 500));

                // Try again
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'extract_profile',
                    tier
                });
                this.handleProfileResponse(response);
            }

        } catch (error) {
            window.popupController.showLoading(false);
            alert('Error: ' + error.message + '\nTry refreshing the LinkedIn page.');
        }
    }

    handleProfileResponse(response) {
        this.profileData = response;
        this.displayProfile(response);
        window.popupController.showLoading(false);
        window.popupController.showNotification('Profile data extracted!');
    }

    displayProfile(data) {
        const container = document.getElementById('profileData');

        const initials = data.name.split(' ').map(n => n[0]).join('').substring(0, 2);

        container.innerHTML = `
      <div class="profile-info">
        <div class="profile-avatar">${initials}</div>
        <div class="profile-details">
          <div class="profile-name">${data.name}</div>
          <div class="profile-headline">${data.headline || 'Professional'}</div>
          <div class="profile-meta">
            ${data.company ? `📍 ${data.company}` : ''}
            ${data.location ? ` • ${data.location}` : ''}
          </div>
        </div>
      </div>
    `;
    }

    async generateMessage() {
        if (!this.profileData) {
            alert('Please extract profile data first!');
            return;
        }

        try {
            window.popupController.showLoading(true);

            const response = await chrome.runtime.sendMessage({
                action: 'ai_generate',
                profileData: this.profileData,
                context: { type: 'connection', tone: 'professional' }
            });

            if (response.success) {
                document.getElementById('messageOutput').value = response.message;
                window.popupController.showNotification('Message generated!');
            } else {
                throw new Error(response.error);
            }

            window.popupController.showLoading(false);

        } catch (error) {
            window.popupController.showLoading(false);
            alert('Error: ' + error.message);
        }
    }

    copyMessage() {
        const message = document.getElementById('messageOutput').value;
        if (!message) {
            alert('No message to copy!');
            return;
        }

        navigator.clipboard.writeText(message);
        window.popupController.showNotification('Copied to clipboard!');
    }



}

// Initialize
const composeComponent = new ComposeComponent();
window.composeComponent = composeComponent;
