/**
 * History Tab Component
 */

class HistoryComponent {
    constructor() {
        this.messages = [];
        this.init();
    }

    init() {
        document.getElementById('refreshHistoryBtn').addEventListener('click', () => this.loadHistory());
        document.getElementById('historySearch').addEventListener('input', (e) => this.filterHistory(e.target.value));
        this.loadHistory();
    }

    async loadHistory() {
        this.messages = await window.storageManager.getMessages();
        this.render();
    }

    render(filtered = null) {
        const container = document.getElementById('historyList');
        const messages = filtered || this.messages;

        if (messages.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📜</div>
          <p>No messages tracked yet</p>
        </div>
      `;
            return;
        }

        container.innerHTML = messages.map(msg => {
            const date = new Date(msg.sentAt);
            const timeAgo = this.getTimeAgo(date);

            return `
        <div class="history-item ${msg.replied ? 'replied' : ''}">
          <div class="history-header">
            <div class="history-recipient">${msg.recipientName || 'Unknown'}</div>
            <div class="history-status ${msg.replied ? 'replied' : ''}">${msg.replied ? '✅ Replied' : '⏳ Pending'}</div>
          </div>
          <div class="history-message">${msg.messageContent.substring(0, 150)}${msg.messageContent.length > 150 ? '...' : ''}</div>
          <div class="history-time">${timeAgo}</div>
        </div>
      `;
        }).join('');
    }

    filterHistory(query) {
        if (!query) {
            this.render();
            return;
        }

        const filtered = this.messages.filter(msg => {
            const lowerQuery = query.toLowerCase();
            return (
                msg.recipientName?.toLowerCase().includes(lowerQuery) ||
                msg.messageContent?.toLowerCase().includes(lowerQuery)
            );
        });

        this.render(filtered);
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

        return date.toLocaleDateString();
    }
}

// Initialize
const historyComponent = new HistoryComponent();
window.historyComponent = historyComponent;
