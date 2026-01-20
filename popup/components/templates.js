/**
 * Templates Tab Component
 */

class TemplatesComponent {
  constructor() {
    this.templates = [];
    this.editingTemplate = null;
    this.init();
  }

  init() {
    document.getElementById('addTemplateBtn').addEventListener('click', () => this.showTemplateModal());
    this.loadTemplates();
  }

  async loadTemplates() {
    this.templates = await window.storageManager.getTemplates();
    this.render();
    await this.updateLimitInfo();
  }

  async updateLimitInfo() {
    const count = this.templates.length;
    document.getElementById('templateCount').textContent = count;

    // Template limit elements are removed or hidden in free version
  }

  render() {
    const container = document.getElementById('templatesList');

    if (this.templates.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p>No templates yet. Create your first template!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.templates.map(template => `
      <div class="template-card" data-template-id="${template.id}">
        <div class="template-header">
          <div class="template-name">${template.name}</div>
          <div class="template-actions">
            <button class="template-action-btn edit-btn" title="Edit">✏️</button>
            <button class="template-action-btn delete-btn" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="template-preview">${template.content.substring(0, 100)}${template.content.length > 100 ? '...' : ''}</div>
        <div class="template-meta">
          <span>Used: ${template.usageCount || 0} times</span>
          ${template.replyCount ? `<span>Replies: ${template.replyCount}</span>` : ''}
        </div>
      </div>
    `).join('');

    // Add event listeners
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.target.closest('.template-card').dataset.templateId;
        this.editTemplate(id);
      });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.target.closest('.template-card').dataset.templateId;
        if (confirm('Delete this template?')) {
          await window.storageManager.deleteTemplate(id);
          await this.loadTemplates();
          window.popupController.showNotification('Template deleted');
        }
      });
    });
  }

  async showTemplateModal(template = null) {
    const modal = `
      <div class="modal-overlay" id="templateModal">
        <div class="modal" style="max-width: 500px; background: white; padding: 24px; border-radius: 12px;">
          <h3>${template ? 'Edit Template' : 'New Template'}</h3>
          <div class="setting-group">
            <label class="setting-label">Template Name</label>
            <input type="text" id="templateName" class="input" value="${template ? template.name : ''}" placeholder="e.g., Job Seeker Outreach">
          </div>
          <div class="setting-group">
            <label class="setting-label">Message Template</label>
            <textarea id="templateContent" class="input" rows="6" placeholder="Hi {{firstName}}, I noticed you work at {{company}}...">${template ? template.content : ''}</textarea>
            <small class="help-text">Use {{firstName}}, {{lastName}}, {{company}}, {{role}}, etc.</small>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 16px;">
            <button class="btn btn-primary" id="saveTemplate">Save</button>
            <button class="btn btn-secondary" id="cancelTemplate">Cancel</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);

    const modalEl = document.getElementById('templateModal');
    modalEl.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;';

    document.getElementById('saveTemplate').addEventListener('click', async () => {
      const name = document.getElementById('templateName').value.trim();
      const content = document.getElementById('templateContent').value.trim();

      if (!name || !content) {
        alert('Please fill in all fields');
        return;
      }

      await window.storageManager.saveTemplate({
        id: template ? template.id : null,
        name,
        content
      });

      modalEl.remove();
      await this.loadTemplates();
      window.popupController.showNotification(template ? 'Template updated!' : 'Template created!');
    });

    document.getElementById('cancelTemplate').addEventListener('click', () => modalEl.remove());
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) modalEl.remove();
    });
  }

  editTemplate(id) {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      this.showTemplateModal(template);
    }
  }

}

// Initialize
const templatesComponent = new TemplatesComponent();
window.templatesComponent = templatesComponent;
