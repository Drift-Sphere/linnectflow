/**
 * LinkedIn Limits Database
 * Safe usage limits to avoid LinkedIn restrictions
 */

const LINKEDIN_LIMITS = {
    // Safe recommended limits for all users
    safe_limits: {
        connection_requests_per_week: 80,
        connection_requests_per_day: 15,
        messages_per_day: 40
    },
    // Warning thresholds (% of limit)
    warning_threshold: 0.8, // 80%
    critical_threshold: 0.95 // 95%
};

class LinkedInLimitsManager {
    constructor() {
        this.limits = LINKEDIN_LIMITS.safe_limits;
    }

    async initialize() {
        // No-op for now as we use fixed limits
    }

    getLimits() {
        return this.limits;
    }

    async checkDailyMessageLimit() {
        const today = new Date().toISOString().split('T')[0];
        const result = await chrome.storage.local.get(['dailyActivity']);
        const activity = result.dailyActivity || {};
        const todayActivity = activity[today] || { messagesSent: 0 };

        const current = todayActivity.messagesSent;
        const limit = this.limits.messages_per_day;

        return this.createLimitStatus('messages', current, limit);
    }

    async checkWeeklyConnectionLimit() {
        const weekActivity = await this.getWeekActivity();
        const totalConnections = weekActivity.reduce((sum, day) => sum + day.connectionsSent, 0);
        const limit = this.limits.connection_requests_per_week;

        return this.createLimitStatus('connections', totalConnections, limit);
    }

    async checkDailyConnectionLimit() {
        const today = new Date().toISOString().split('T')[0];
        const result = await chrome.storage.local.get(['dailyActivity']);
        const activity = result.dailyActivity || {};
        const todayActivity = activity[today] || { connectionsSent: 0 };

        const current = todayActivity.connectionsSent;
        const limit = this.limits.connection_requests_per_day;

        return this.createLimitStatus('daily_connections', current, limit);
    }

    createLimitStatus(type, current, limit) {
        const percentage = (current / limit) * 100;
        const remaining = Math.max(0, limit - current);

        let status = 'safe';
        let level = 'success';

        if (percentage >= LINKEDIN_LIMITS.critical_threshold * 100) {
            status = 'critical';
            level = 'danger';
        } else if (percentage >= LINKEDIN_LIMITS.warning_threshold * 100) {
            status = 'warning';
            level = 'warning';
        }

        return {
            type,
            current,
            limit,
            remaining,
            percentage: Math.round(percentage),
            status,
            level,
            canProceed: current < limit,
            message: this.getStatusMessage(type, status, current, limit, remaining)
        };
    }

    getStatusMessage(type, status, current, limit, remaining) {
        if (status === 'critical') {
            return `⛔ ${current}/${limit} ${type} sent. You're at your limit!`;
        } else if (status === 'warning') {
            return `⚠️ ${current}/${limit} ${type} sent. Slow down to avoid restrictions.`;
        } else {
            return `✅ ${current}/${limit} ${type} sent today. ${remaining} remaining.`;
        }
    }

    async getWeekActivity() {
        const result = await chrome.storage.local.get(['dailyActivity']);
        const activity = result.dailyActivity || {};

        const weekActivity = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            weekActivity.push(activity[dateStr] || {
                date: dateStr,
                messagesSent: 0,
                connectionsSent: 0
            });
        }

        return weekActivity;
    }

    async getDashboardData() {
        const messageLimit = await this.checkDailyMessageLimit();
        const connectionLimitDaily = await this.checkDailyConnectionLimit();
        const connectionLimitWeekly = await this.checkWeeklyConnectionLimit();
        const weekActivity = await this.getWeekActivity();

        return {
            limits: this.limits,
            messageLimit,
            connectionLimitDaily,
            connectionLimitWeekly,
            weekActivity,
            safeModeRecommended: messageLimit.status !== 'safe' || connectionLimitWeekly.status !== 'safe'
        };
    }

    getRecommendation() {
        const messages = [
            '💡 Personalize each message for better reply rates',
            '⏰ Best time to send: Tuesday-Thursday, 9-11 AM',
            '🎯 Focus on quality over quantity',
            '📊 Track your reply rates to improve',
            '⚡ Follow up after 3-5 days if no response',
            '🤝 Build genuine connections, not just numbers',
            '📝 Keep messages under 200 characters',
            '🎨 Use templates as starting points, then customize'
        ];

        return messages[Math.floor(Math.random() * messages.length)];
    }
}

// Export singleton
const linkedInLimits = new LinkedInLimitsManager();

if (typeof window !== 'undefined') {
    window.linkedInLimits = linkedInLimits;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = linkedInLimits;
}

