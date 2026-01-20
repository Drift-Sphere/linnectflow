/**
 * Activity Tracker
 * Tracks user actions on LinkedIn for limit monitoring
 */
(function () {
    if (window.linkedInActivityTrackerInitialized) return;
    window.linkedInActivityTrackerInitialized = true;

    class ActivityTracker {
        constructor() {
            this.tracked = new Set();
        }

        init() {
            this.trackConnectionRequests();
            this.trackMessages();
            this.trackProfileViews();
        }

        trackConnectionRequests() {
            // Watch for "Connect" button clicks
            document.addEventListener('click', async (e) => {
                const target = e.target;

                // Check if it's a connect button
                if (this.isConnectButton(target)) {
                    await this.recordActivity('connection');
                    this.showActivityNotification('connection');
                }
            }, true); // Use capture phase to catch before LinkedIn handles it
        }

        trackMessages() {
            // Watch for message send button clicks
            document.addEventListener('click', async (e) => {
                const target = e.target;

                if (this.isSendButton(target)) {
                    await this.recordActivity('message');
                    this.showActivityNotification('message');

                    // Also save message content for history
                    const messageContent = this.extractMessageContent();
                    if (messageContent) {
                        await this.saveMessageToHistory(messageContent);
                    }
                }
            }, true);
        }

        trackProfileViews() {
            // Track when user navigates to different profiles
            let lastProfile = window.location.href;

            setInterval(() => {
                if (window.location.href !== lastProfile && window.location.href.includes('/in/')) {
                    lastProfile = window.location.href;
                    this.recordActivity('profile_view');
                }
            }, 1000);
        }

        isConnectButton(element) {
            if (!element) return false;

            const text = element.innerText?.toLowerCase() || '';
            const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';

            return (
                text.includes('connect') ||
                ariaLabel.includes('connect') ||
                element.closest('button[aria-label*="connect"]') !== null
            );
        }

        isSendButton(element) {
            if (!element) return false;

            const text = element.innerText?.toLowerCase() || '';
            const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';

            return (
                text === 'send' ||
                ariaLabel.includes('send') ||
                element.closest('button[type="submit"]')?.closest('.msg-form') !== null
            );
        }

        extractMessageContent() {
            // Try to get message from composer
            const composer = document.querySelector('.msg-form__contenteditable');
            if (composer) {
                return composer.innerText.trim();
            }
            return null;
        }

        async recordActivity(type) {
            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'record_activity',
                    activityType: type
                });

                // Check if approaching limits
                if (response.warning) {
                    this.showLimitWarning(response);
                }
            } catch (error) {
                // Ignore context invalidated errors (happens on update)
                if (!error.message.includes('Extension context invalidated')) {
                    console.error('Failed to record activity:', error);
                }
            }
        }

        async saveMessageToHistory(content) {
            try {
                // Get recipient info from current page
                const recipientName = this.getRecipientName();
                const profileUrl = this.getRecipientProfileUrl();

                await chrome.runtime.sendMessage({
                    action: 'save_message',
                    message: {
                        recipientName,
                        recipientProfileUrl: profileUrl,
                        messageContent: content,
                        sentVia: 'linkedin_direct'
                    }
                });
            } catch (error) {
                if (!error.message.includes('Extension context invalidated')) {
                    console.error('Failed to save message:', error);
                }
            }
        }

        getRecipientName() {
            // Try multiple selectors for recipient name
            const selectors = [
                '.msg-thread__link-to-profile',
                '.msg-overlay-conversation-bubble__conversation-heading',
                'h2.msg-entity-lockup__entity-title'
            ];

            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    return element.innerText.trim();
                }
            }

            return 'Unknown';
        }

        getRecipientProfileUrl() {
            const profileLink = document.querySelector('.msg-thread__link-to-profile');
            if (profileLink) {
                return profileLink.href;
            }
            return null;
        }

        showActivityNotification(type) {
            const messages = {
                connection: '✅ Connection request tracked',
                message: '✅ Message tracked',
                profile_view: '👁️ Profile view tracked'
            };

            // Small, subtle notification
            const notification = document.createElement('div');
            notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(10, 102, 194, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: fadeInOut 2s ease-out;
    `;
            notification.textContent = messages[type];

            document.body.appendChild(notification);

            setTimeout(() => notification.remove(), 2000);
        }

        showLimitWarning(data) {
            const { type, current, limit, percentage } = data;

            let emoji = '⚠️';
            let message = '';

            if (percentage >= 95) {
                emoji = '⛔';
                message = `You're at your ${type} limit! (${current}/${limit})`;
            } else if (percentage >= 80) {
                emoji = '⚠️';
                message = `Slow down! ${current}/${limit} ${type} today`;
            }

            if (!message) return;

            const warning = document.createElement('div');
            warning.style.cssText = `
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      text-align: center;
      animation: shake 0.5s ease-in-out;
    `;

            warning.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 8px;">${emoji}</div>
      <div>${message}</div>
      <div style="font-size: 12px; margin-top: 8px; opacity: 0.9;">
        LinkedIn may restrict your account if you exceed limits
      </div>
    `;

            document.body.appendChild(warning);

            setTimeout(() => {
                warning.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => warning.remove(), 300);
            }, 5000);
        }
    }

    // Add animations
    if (!document.getElementById('linkedin-ai-animations')) {
        const style = document.createElement('style');
        style.id = 'linkedin-ai-animations';
        style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(20px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(20px); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(-50%) rotate(0deg); }
        25% { transform: translateX(-50%) rotate(-2deg); }
        75% { transform: translateX(-50%) rotate(2deg); }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
        document.head.appendChild(style);
    }

    // Initialize tracker
    const tracker = new ActivityTracker();
    tracker.init();
})();
