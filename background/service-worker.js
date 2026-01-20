/**
 * Background Service Worker
 * Handles background tasks, reminders, and message routing
 */

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
    console.log('LinnectFlow installed');

    // Set default values
    await chrome.storage.local.set({
        templates: [],
        messages: [],
        reminders: [],
        dailyActivity: {},
        aiUsage: {}
    });

    // Set up daily reminder alarm
    chrome.alarms.create('dailyReminderCheck', {
        periodInMinutes: 60 // Check every hour
    });

    // Set up daily reset alarm
    chrome.alarms.create('dailyReset', {
        when: getNextMidnight(),
        periodInMinutes: 1440 // Every 24 hours
    });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender).then(sendResponse);
    return true; // Keep channel open for async response
});

async function handleMessage(request, sender) {
    switch (request.action) {
        case 'extract_profile':
            return await extractProfileFromTab(sender.tab.id);

        case 'record_activity':
            return await recordActivity(request.activityType);

        case 'save_message':
            return await saveMessage(request.message);

        case 'template_used':
            return await trackTemplateUsage(request.templateId);

        case 'ai_generate':
            return await generateMessageWithAI(request.profileData, request.context);

        case 'get_cached_profile':
            return await getCachedProfile();

        case 'check_limits':
            return await checkAllLimits();

        case 'get_analytics':
            return await getAnalytics(request.dateRange);

        default:
            return { error: 'Unknown action' };
    }
}

async function extractProfileFromTab(tabId) {
    try {
        const response = await chrome.tabs.sendMessage(tabId, {
            action: 'extract_profile'
        });

        // Cache the profile data
        await chrome.storage.local.set({
            cachedProfile: response,
            cachedProfileTime: Date.now()
        });

        return response;
    } catch (error) {
        return { error: error.message };
    }
}

async function recordActivity(type) {
    const today = new Date().toISOString().split('T')[0];
    const result = await chrome.storage.local.get(['dailyActivity']);

    const activity = result.dailyActivity || {};

    if (!activity[today]) {
        activity[today] = {
            date: today,
            messagesSent: 0,
            connectionsSent: 0,
            profileViews: 0
        };
    }

    // Increment the appropriate counter
    if (type === 'message') {
        activity[today].messagesSent++;
    } else if (type === 'connection') {
        activity[today].connectionsSent++;
    } else if (type === 'profile_view') {
        activity[today].profileViews++;
    }

    await chrome.storage.local.set({ dailyActivity: activity });
    return { success: true };
}

async function saveMessage(messageData) {
    const result = await chrome.storage.local.get(['messages']);
    const messages = result.messages || [];

    const message = {
        id: generateId(),
        ...messageData,
        sentAt: Date.now(),
        replied: false
    };

    messages.unshift(message);

    // Keep last 1000 messages
    if (messages.length > 1000) {
        messages.splice(1000);
    }

    await chrome.storage.local.set({ messages });

    return { success: true, messageId: message.id };
}

async function trackTemplateUsage(templateId) {
    const result = await chrome.storage.local.get(['templates']);
    const templates = result.templates || [];

    const template = templates.find(t => t.id === templateId);
    if (template) {
        template.usageCount = (template.usageCount || 0) + 1;
        template.lastUsed = Date.now();
        await chrome.storage.local.set({ templates });
    }

    return { success: true };
}

async function enhanceMessageWithAI(message) {
    // Feature removed as requested
    return { success: false, error: 'Feature disabled' };
}

async function generateMessageWithAI(profileData, context) {
    const settings = await chrome.storage.local.get(['aiProvider', 'aiApiKey', 'aiModel', 'customPrompt']);
    const providerId = settings.aiProvider || 'groq';
    const apiKey = settings.aiApiKey;
    const customPrompt = settings.customPrompt || 'You are a professional LinkedIn messaging assistant.';

    const providers = {
        groq: { url: 'https://api.groq.com/openai/v1/chat/completions', defaultModel: 'llama-3.3-70b-versatile' },
        openai: { url: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-4o' }
    };

    if (!apiKey) {
        return { success: false, error: 'Missing API Key. Please configure it in extension settings.' };
    }

    const provider = providers[providerId];
    const model = settings.aiModel || provider.defaultModel;

    const prompt = `${customPrompt}\n\nWrite a LinkedIn connection request for:\n- Name: ${profileData.name}\n- Role: ${profileData.headline}\n- Company: ${profileData.company}\n\nProvide ONLY the message text.`;

    try {
        const response = await fetch(provider.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: 'You are a professional assistant. Provide ONLY the message text.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const msg = errorData.error?.message || response.statusText;
            return { success: false, error: `API Error (${response.status}): ${msg}` };
        }

        const data = await response.json();
        return {
            success: true,
            message: data.choices[0].message.content.trim().replace(/^"(.*)"$/, '$1')
        };
    } catch (error) {
        console.error('Fetch error:', error);
        let errorMsg = error.message;
        if (error.name === 'TypeError' && errorMsg === 'Failed to fetch') {
            errorMsg = `Network Error: Could not connect to ${provider.url}. Ensure you have internet access and have reloaded the extension to apply permissions.`;
        }
        return { success: false, error: errorMsg };
    }
}

async function getCachedProfile() {
    const result = await chrome.storage.local.get(['cachedProfile', 'cachedProfileTime']);

    // Cache expires after 5 minutes
    if (result.cachedProfile && (Date.now() - result.cachedProfileTime) < 300000) {
        return { profileData: result.cachedProfile };
    }

    return { profileData: null };
}

async function checkAllLimits() {
    const today = new Date().toISOString().split('T')[0];
    const activityResult = await chrome.storage.local.get(['dailyActivity']);
    const activity = activityResult.dailyActivity || {};
    const todayActivity = activity[today] || { messagesSent: 0, connectionsSent: 0 };

    // Standard safe defaults for all users
    const limits = {
        messages: 100,
        connections: 50
    };

    return {
        messages: {
            current: todayActivity.messagesSent,
            limit: limits.messages,
            percentage: Math.min(100, Math.round((todayActivity.messagesSent / limits.messages) * 100))
        },
        connections: {
            current: todayActivity.connectionsSent,
            limit: limits.connections,
            percentage: Math.min(100, Math.round((todayActivity.connectionsSent / limits.connections) * 100))
        }
    };
}

async function getAnalytics(dateRange = 30) {
    const result = await chrome.storage.local.get(['messages', 'templates']);
    const messages = result.messages || [];
    const templates = result.templates || [];

    const cutoffDate = Date.now() - (dateRange * 24 * 60 * 60 * 1000);
    const recentMessages = messages.filter(m => m.sentAt >= cutoffDate);

    const totalSent = recentMessages.length;
    const totalReplied = recentMessages.filter(m => m.replied).length;
    const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

    // Template performance
    const templateStats = templates.map(template => {
        const templateMessages = recentMessages.filter(m => m.templateId === template.id);
        const replied = templateMessages.filter(m => m.replied).length;

        return {
            templateId: template.id,
            name: template.name,
            sent: templateMessages.length,
            replied,
            replyRate: templateMessages.length > 0 ? Math.round((replied / templateMessages.length) * 100) : 0
        };
    }).sort((a, b) => b.replyRate - a.replyRate);

    return {
        totalSent,
        totalReplied,
        replyRate,
        templateStats
    };
}

// Alarm handlers
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyReminderCheck') {
        checkReminders();
    } else if (alarm.name === 'dailyReset') {
        // Reset counters could go here if needed
    }
});

async function checkReminders() {
    const result = await chrome.storage.local.get(['reminders']);
    const reminders = result.reminders || [];

    const today = new Date().toISOString().split('T')[0];
    const dueReminders = reminders.filter(r => !r.completed && r.scheduledDate <= today);

    for (const reminder of dueReminders) {
        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'assets/icons/icon128.png',
            title: 'LinkedIn Follow-up Reminder',
            message: `Time to follow up with ${reminder.recipientName}!`,
            priority: 2
        });
    }
}

// Utility functions
function getLinkedInLimits(accountType) {
    const limits = {
        free_account: {
            messages_per_day: 40,
            connection_requests_per_day: 15,
            connection_requests_per_week: 80
        },
        premium_account: {
            messages_per_day: 120,
            connection_requests_per_day: 25,
            connection_requests_per_week: 120
        },
        sales_navigator: {
            messages_per_day: 200,
            connection_requests_per_day: 35,
            connection_requests_per_week: 160
        }
    };

    return limits[accountType] || limits.free_account;
}

function getNextMidnight() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
