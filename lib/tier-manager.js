/**
 * Tier Management System
 * MODIFIED: Everything is now completely free and unlimited.
 */

class TierManager {
  constructor() {
    this.currentTier = 'pro'; // Defaulting to pro since it's now free
    this.initialized = true;
  }

  async initialize() {
    return; // No longer needed
  }

  async getUserTier() {
    return 'pro';
  }

  async setUserTier(tier) {
    // No-op: everyone is pro now
    return;
  }

  async getLimit(feature) {
    return Infinity;
  }

  async canUseFeature(feature) {
    return { allowed: true, unlimited: true };
  }

  async checkUsageLimit(feature, currentUsage) {
    return {
      allowed: true,
      unlimited: true,
      remaining: Infinity,
      current: currentUsage,
      limit: Infinity,
      upgradeNeeded: false
    };
  }

  async checkTemplateLimit() {
    return this.checkUsageLimit('max_templates', 0);
  }

  async checkAIUsageLimit() {
    return {
      generations: { allowed: true, unlimited: true, remaining: Infinity },
      rewrites: { allowed: true }
    };
  }

  async incrementAIUsage(type = 'generations') {
    // Optional: We can still track usage for analytics if the user wants, 
    // but it's not used for gating anymore.
    const today = new Date().toISOString().split('T')[0];
    const result = await chrome.storage.local.get(['aiUsage']);
    const aiUsage = result.aiUsage || {};

    if (!aiUsage[today]) {
      aiUsage[today] = { rewrites: 0, generations: 0 };
    }

    aiUsage[today][type] = (aiUsage[today][type] || 0) + 1;
    await chrome.storage.local.set({ aiUsage });
  }

  showUpgradePrompt(feature) {
    // This should never be called anymore
    return null;
  }

  isPaidUser() {
    return true; // Everyone is a "paid" user now
  }
}

// Export singleton instance
const tierManager = new TierManager();

if (typeof window !== 'undefined') {
  window.tierManager = tierManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = tierManager;
}

