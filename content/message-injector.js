/**
 * Message Composer Injector
 * Injects UI elements into LinkedIn message composer
 */

class MessageComposerInjector {
    constructor() {
        this.injected = false;
        this.observer = null;
        this.currentComposer = null;
    }

    init() {
        // Watch for message composer to appear
        this.observer = new MutationObserver(() => {
            this.detectAndInjectUI();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial check
        this.detectAndInjectUI();
    }

    detectAndInjectUI() {
        // Look for LinkedIn message composer
        const composerSelectors = [
            '.msg-form__contenteditable',
            '.msg-form__msg-content-container',
            'div[role="textbox"][contenteditable="true"]'
        ];

        for (const selector of composerSelectors) {
            const composer = document.querySelector(selector);

            if (composer && !composer.dataset.linkedinAiInjected) {
                this.injectToolbar(composer);
                composer.dataset.linkedinAiInjected = 'true';
                this.currentComposer = composer;
                break;
            }
        }
    }

    injectToolbar(composer) {
        // Find the parent container
        const container = composer.closest('.msg-form__msg-content-container') || composer.parentElement;

        if (!container) return;

        // Create toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'linkedin-ai-toolbar';
        toolbar.style.cssText = `
      display: flex;
      gap: 8px;
      padding: 8px;
      background: #f3f6f8;
      border-top: 1px solid #e0e0e0;
      border-radius: 0 0 8px 8px;
      margin-top: -1px;
    `;

        // Insert Template button
        const insertBtn = this.createButton('📝 Insert Template', 'insert', async () => {
            await this.showTemplateSelector(composer);
        });

        toolbar.appendChild(insertBtn);

        // Character counter
        const charCounter = document.createElement('span');
        charCounter.className = 'char-counter';
        charCounter.style.cssText = `
      margin-left: auto;
      font-size: 12px;
      color: #666;
      line-height: 32px;
    `;
        charCounter.textContent = '0/300';

        toolbar.appendChild(charCounter);

        // Update counter on input
        composer.addEventListener('input', () => {
            const length = composer.innerText.length;
            charCounter.textContent = `${length}/300`;

            if (length > 300) {
                charCounter.style.color = '#cc0000';
            } else if (length > 250) {
                charCounter.style.color = '#f5a623';
            } else {
                charCounter.style.color = '#666';
            }
        });

        // Insert toolbar after composer
        container.appendChild(toolbar);
    }

    createButton(text, action, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `linkedin-ai-btn linkedin-ai-btn-${action}`;
        button.style.cssText = `
      background: #0A66C2;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
        });

        return button;
    }

    async showTemplateSelector(composer) {
        // Get templates from storage
        const result = await chrome.storage.local.get(['templates']);
        const templates = result.templates || [];

        if (templates.length === 0) {
            this.showNotification('No templates found. Create templates in the extension popup!', 'info');
            return;
        }

        // Create modal
        const modal = this.createModal('Select Template');
        const content = modal.querySelector('.modal-content-area');

        templates.forEach(template => {
            const templateItem = document.createElement('div');
            templateItem.style.cssText = `
        padding: 12px;
        margin: 8px 0;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      `;

            templateItem.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">${template.name}</div>
        <div style="font-size: 12px; color: #666;">${template.content.substring(0, 100)}...</div>
      `;

            templateItem.addEventListener('mouseenter', () => {
                templateItem.style.background = '#f3f6f8';
                templateItem.style.borderColor = '#0A66C2';
            });

            templateItem.addEventListener('mouseleave', () => {
                templateItem.style.background = 'white';
                templateItem.style.borderColor = '#e0e0e0';
            });

            templateItem.addEventListener('click', async () => {
                await this.insertTemplate(composer, template);
                modal.remove();
            });

            content.appendChild(templateItem);
        });

        document.body.appendChild(modal);
    }

    async insertTemplate(composer, template) {
        // Get current profile data if available
        const profileData = await this.getCurrentProfileData();

        // Render template with profile data
        let content = template.content;

        if (profileData && window.templateEngine) {
            content = window.templateEngine.render(template.content, profileData);
        }

        // Insert into composer
        composer.innerText = content;
        composer.focus();

        // Track usage
        chrome.runtime.sendMessage({
            action: 'template_used',
            templateId: template.id
        });

        this.showNotification('Template inserted!', 'success');
    }


    async getCurrentProfileData() {
        // Try to get profile data from current page or storage
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'get_cached_profile'
            });
            return response.profileData;
        } catch {
            return null;
        }
    }

    createModal(title) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

        const modal = document.createElement('div');
        modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;

        modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px;">${title}</h2>
        <button class="close-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
      </div>
      <div class="modal-content-area"></div>
    `;

        overlay.appendChild(modal);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // Close button
        modal.querySelector('.close-modal').addEventListener('click', () => {
            overlay.remove();
        });

        return overlay;
    }


    showNotification(message, type = 'info') {
        const colors = {
            success: '#00875a',
            error: '#de350b',
            warning: '#ff991f',
            info: '#0A66C2'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const injector = new MessageComposerInjector();
        injector.init();
    });
} else {
    const injector = new MessageComposerInjector();
    injector.init();
}
