/**
 * Main Popup Controller
 * LinnectFlow Extension
 */

class PopupController {
    constructor() {
        this.currentTab = 'compose';
        this.profileData = null;
    }

    async init() {
        await this.loadUserData();
        this.setupTabNavigation();
        this.setupHeader();
        this.loadComponents();
    }

    async loadUserData() {
        const result = await chrome.storage.local.get(['dailyActivity']);

        // Update activity counter
        const today = new Date().toISOString().split('T')[0];
        const activity = result.dailyActivity || {};
        const todayActivity = activity[today] || { messagesSent: 0 };

        if (document.getElementById('messageCount')) {
            document.getElementById('messageCount').textContent = todayActivity.messagesSent;
        }
    }

    setupTabNavigation() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;

                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));

                // Add active class to clicked tab and its content
                tab.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');

                this.currentTab = targetTab;

                // Load tab-specific data
                this.onTabChange(targetTab);
            });
        });
    }

    async setupHeader() {
        // Refresh activity counter every second
        setInterval(async () => {
            const result = await chrome.storage.local.get(['dailyActivity']);
            const today = new Date().toISOString().split('T')[0];
            const activity = result.dailyActivity || {};
            const todayActivity = activity[today] || { messagesSent: 0 };

            document.getElementById('messageCount').textContent = todayActivity.messagesSent;
        }, 5000); // Every 5 seconds
    }

    loadComponents() {
        // Components will initialize themselves
        // This is just a placeholder for any additional setup
    }

    async onTabChange(tabName) {
        if (tabName === 'templates') {
            if (window.templatesComponent) {
                await window.templatesComponent.loadTemplates();
            }
        } else if (tabName === 'history') {
            if (window.historyComponent) {
                await window.historyComponent.loadHistory();
            }
        } else if (tabName === 'analytics') {
            if (window.analyticsComponent) {
                await window.analyticsComponent.loadAnalytics();
            }
        }
    }

    showNotification(message, type = 'success') {
        // Simple toast notification
        const notification = document.createElement('div');
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#057642' : type === 'error' ? '#cc0000' : '#0A66C2'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s;
      font-size: 14px;
    `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showLoading(show = true) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const controller = new PopupController();
    await controller.init();
    window.popupController = controller;
});
