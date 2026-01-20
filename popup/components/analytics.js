/**
 * Analytics Tab Component
 */

class AnalyticsComponent {
  constructor() {
    this.init();
  }

  init() {
    this.loadAnalytics();
  }

  async loadAnalytics() {
    // Analytics is now free for everyone
    await this.renderAnalytics();
  }

  async renderAnalytics() {
    const response = await chrome.runtime.sendMessage({
      action: 'get_analytics',
      dateRange: 30
    });

    const container = document.getElementById('analyticsContent');

    const html = `
      <div class="analytics-card">
        <h4 style="margin-bottom: 12px;">Last 30 Days</h4>
        
        <div class="analytics-stat">
          <div class="stat-label">Messages Sent</div>
          <div class="stat-value">${response.totalSent}</div>
        </div>
        
        <div class="analytics-stat">
          <div class="stat-label">Replies Received</div>
          <div class="stat-value positive">${response.totalReplied}</div>
        </div>
        
        <div class="analytics-stat">
          <div class="stat-label">Reply Rate</div>
          <div class="stat-value ${response.replyRate > 30 ? 'positive' : ''}">${response.replyRate}%</div>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${response.replyRate}%"></div>
        </div>
      </div>

      ${response.templateStats.length > 0 ? `
        <div class="analytics-card">
          <h4 style="margin-bottom: 12px;">Template Performance</h4>
          ${response.templateStats.map(stat => `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 13px;">${stat.name}</span>
                <span style="font-size: 13px; font-weight: 600;">${stat.replyRate}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${stat.replyRate}%"></div>
              </div>
              <div style="font-size: 11px; color: #999; margin-top: 2px;">
                ${stat.sent} sent • ${stat.replied} replied
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="analytics-card">
        <div style="text-align: center; padding: 16px; color: #666;">
          <div style="font-size: 32px; margin-bottom: 8px;">💡</div>
          <div style="font-size: 13px;">
            ${this.getInsight(response.replyRate)}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  getInsight(replyRate) {
    if (replyRate >= 40) {
      return "Excellent! Your messages are performing great. Keep personalizing!";
    } else if (replyRate >= 20) {
      return "Good work! Try A/B testing different opening lines to improve.";
    } else {
      return "Tip: Add more personalization using profile variables like {{company}} and {{role}}.";
    }
  }
}

// Initialize
const analyticsComponent = new AnalyticsComponent();
window.analyticsComponent = analyticsComponent;
