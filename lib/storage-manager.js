/**
 * Storage Manager
 * Handles Chrome storage with fallback to localStorage
 * Prepared for future cloud sync integration
 */

class StorageManager {
    constructor() {
        this.storageType = typeof chrome !== 'undefined' && chrome.storage ? 'chrome' : 'local';
    }

    async get(keys) {
        if (this.storageType === 'chrome') {
            return new Promise((resolve) => {
                chrome.storage.local.get(keys, (result) => {
                    resolve(result);
                });
            });
        } else {
            const result = {};
            const keyArray = Array.isArray(keys) ? keys : [keys];
            keyArray.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    try {
                        result[key] = JSON.parse(value);
                    } catch {
                        result[key] = value;
                    }
                }
            });
            return result;
        }
    }

    async set(items) {
        if (this.storageType === 'chrome') {
            return new Promise((resolve) => {
                chrome.storage.local.set(items, () => {
                    resolve();
                });
            });
        } else {
            Object.keys(items).forEach(key => {
                localStorage.setItem(key, JSON.stringify(items[key]));
            });
        }
    }

    async remove(keys) {
        if (this.storageType === 'chrome') {
            return new Promise((resolve) => {
                chrome.storage.local.remove(keys, () => {
                    resolve();
                });
            });
        } else {
            const keyArray = Array.isArray(keys) ? keys : [keys];
            keyArray.forEach(key => {
                localStorage.removeItem(key);
            });
        }
    }

    async clear() {
        if (this.storageType === 'chrome') {
            return new Promise((resolve) => {
                chrome.storage.local.clear(() => {
                    resolve();
                });
            });
        } else {
            localStorage.clear();
        }
    }

    // Template-specific methods
    async getTemplates() {
        const result = await this.get(['templates']);
        return result.templates || [];
    }

    async saveTemplate(template) {
        const templates = await this.getTemplates();

        if (template.id) {
            // Update existing
            const index = templates.findIndex(t => t.id === template.id);
            if (index !== -1) {
                templates[index] = { ...template, updatedAt: Date.now() };
            }
        } else {
            // Create new
            template.id = this.generateId();
            template.createdAt = Date.now();
            template.updatedAt = Date.now();
            template.usageCount = 0;
            template.replyCount = 0;
            templates.push(template);
        }

        await this.set({ templates });
        return template;
    }

    async deleteTemplate(templateId) {
        const templates = await this.getTemplates();
        const filtered = templates.filter(t => t.id !== templateId);
        await this.set({ templates: filtered });
    }

    async incrementTemplateUsage(templateId) {
        const templates = await this.getTemplates();
        const template = templates.find(t => t.id === templateId);
        if (template) {
            template.usageCount = (template.usageCount || 0) + 1;
            template.lastUsed = Date.now();
            await this.set({ templates });
        }
    }

    // Message history methods
    async getMessages() {
        const result = await this.get(['messages']);
        return result.messages || [];
    }

    async saveMessage(message) {
        const messages = await this.getMessages();

        message.id = this.generateId();
        message.sentAt = Date.now();
        message.replied = false;

        messages.unshift(message); // Add to beginning

        // Limit to 1000 messages to prevent storage bloat
        if (messages.length > 1000) {
            messages.splice(1000);
        }

        await this.set({ messages });
        return message;
    }

    async updateMessageReply(messageId, replied = true) {
        const messages = await this.getMessages();
        const message = messages.find(m => m.id === messageId);
        if (message) {
            message.replied = replied;
            message.repliedAt = replied ? Date.now() : null;
            await this.set({ messages });

            // Update template reply count if template was used
            if (message.templateId) {
                const templates = await this.getTemplates();
                const template = templates.find(t => t.id === message.templateId);
                if (template) {
                    template.replyCount = (template.replyCount || 0) + (replied ? 1 : -1);
                    await this.set({ templates });
                }
            }
        }
    }

    async getMessagesInDateRange(startDate, endDate) {
        const messages = await this.getMessages();
        return messages.filter(m => {
            return m.sentAt >= startDate && m.sentAt <= endDate;
        });
    }

    async searchMessages(query) {
        const messages = await this.getMessages();
        const lowerQuery = query.toLowerCase();

        return messages.filter(m => {
            return (
                m.recipientName?.toLowerCase().includes(lowerQuery) ||
                m.messageContent?.toLowerCase().includes(lowerQuery) ||
                m.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        });
    }

    // Daily activity tracking
    async getDailyActivity(date = new Date().toISOString().split('T')[0]) {
        const result = await this.get(['dailyActivity']);
        const activity = result.dailyActivity || {};

        return activity[date] || {
            date,
            messagesSent: 0,
            connectionsSent: 0
        };
    }

    async incrementDailyActivity(type = 'messagesSent') {
        const today = new Date().toISOString().split('T')[0];
        const result = await this.get(['dailyActivity']);
        const activity = result.dailyActivity || {};

        if (!activity[today]) {
            activity[today] = {
                date: today,
                messagesSent: 0,
                connectionsSent: 0
            };
        }

        activity[today][type]++;

        // Clean up old data (keep only last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];

        for (const date in activity) {
            if (date < cutoffDate) {
                delete activity[date];
            }
        }

        await this.set({ dailyActivity: activity });
        return activity[today];
    }

    // Follow-up reminders
    async getReminders() {
        const result = await this.get(['reminders']);
        return result.reminders || [];
    }

    async saveReminder(reminder) {
        const reminders = await this.getReminders();

        if (!reminder.id) {
            reminder.id = this.generateId();
            reminder.createdAt = Date.now();
        }

        reminder.completed = reminder.completed || false;

        reminders.push(reminder);
        await this.set({ reminders });
        return reminder;
    }

    async completeReminder(reminderId) {
        const reminders = await this.getReminders();
        const reminder = reminders.find(r => r.id === reminderId);
        if (reminder) {
            reminder.completed = true;
            reminder.completedAt = Date.now();
            await this.set({ reminders });
        }
    }

    async deleteReminder(reminderId) {
        const reminders = await this.getReminders();
        const filtered = reminders.filter(r => r.id !== reminderId);
        await this.set({ reminders: filtered });
    }

    async getActiveReminders() {
        const reminders = await this.getReminders();
        return reminders.filter(r => !r.completed);
    }

    // Utility methods
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    async exportData() {
        const templates = await this.getTemplates();
        const messages = await this.getMessages();
        const reminders = await this.getReminders();

        return {
            templates,
            messages,
            reminders,
            exportedAt: new Date().toISOString()
        };
    }

    async importData(data) {
        if (data.templates) await this.set({ templates: data.templates });
        if (data.messages) await this.set({ messages: data.messages });
        if (data.reminders) await this.set({ reminders: data.reminders });
    }
}

// Export singleton
const storageManager = new StorageManager();

if (typeof window !== 'undefined') {
    window.storageManager = storageManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = storageManager;
}
