class AIService {
    constructor() {
        this.initialized = false;
        this.providers = {
            groq: {
                url: 'https://api.groq.com/openai/v1/chat/completions',
                defaultModel: 'llama-3.3-70b-versatile'
            },
            openai: {
                url: 'https://api.openai.com/v1/chat/completions',
                defaultModel: 'gpt-4o'
            }
        };
    }

    async initialize() {
        if (this.initialized) return;
        const result = await chrome.storage.local.get(['customPrompt', 'aiProvider', 'aiApiKey', 'aiModel']);
        this.customPrompt = result.customPrompt || this.getDefaultPrompt();
        this.aiProvider = result.aiProvider || 'groq';
        this.aiApiKey = result.aiApiKey || '';
        this.aiModel = result.aiModel || this.providers[this.aiProvider].defaultModel;
        this.initialized = true;
    }

    async setCustomPrompt(prompt) {
        this.customPrompt = prompt;
        await chrome.storage.local.set({ customPrompt: prompt });
    }

    getDefaultPrompt() {
        return `You are a professional LinkedIn messaging assistant. Write personalized, friendly connection requests and messages that:
- Are concise (under 250 characters for connection requests)
- Mention specific details about the person's role or company
- Have a clear call-to-action
- Are professional but warm
- Avoid being salesy or pushy`;
    }

    async generateMessage(profileData, context = {}) {
        await this.initialize();

        if (!this.aiApiKey) {
            throw new Error('Missing API Key. Please configure it in Settings.');
        }

        const { type = 'connection', tone = 'professional', length = 'short' } = context;
        const prompt = this.buildPrompt(profileData, type, tone, length);

        try {
            const message = await this.callProvider(prompt);

            if (window.tierManager && window.tierManager.incrementAIUsage) {
                await window.tierManager.incrementAIUsage('generations');
            }

            return {
                success: true,
                message: message,
                charCount: message.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: null
            };
        }
    }

    async optimizeMessage(message, options = {}) {
        await this.initialize();

        if (!this.aiApiKey) {
            throw new Error('Missing API Key. Please configure it in Settings.');
        }

        const { action = 'improve', tone = null, targetLength = null } = options;
        let instruction = '';

        switch (action) {
            case 'improve':
                instruction = `Improve this LinkedIn message to be more engaging and effective. Make it more personalized and likely to get a response. Keep it professional.`;
                break;
            case 'shorten':
                instruction = `Shorten this LinkedIn message to under ${targetLength || 200} characters while keeping the core message.`;
                break;
            case 'lengthen':
                instruction = `Expand this LinkedIn message with more details and context, but keep it professional.`;
                break;
            case 'change_tone':
                const toneGuide = {
                    professional: 'formal and business-like',
                    friendly: 'warm and casual but still professional',
                    enthusiastic: 'energetic and passionate',
                    concise: 'brief and to the point'
                };
                instruction = `Rewrite this LinkedIn message to be more ${toneGuide[tone] || tone}.`;
                break;
            case 'fix_grammar':
                instruction = `Fix any grammar, spelling, or punctuation errors. Keep the tone and meaning the same.`;
                break;
            default:
                instruction = `Improve this LinkedIn message.`;
        }

        const prompt = `${instruction}\n\nMessage:\n"${message}"\n\nProvide ONLY the revised message text.`;

        try {
            const optimized = await this.callProvider(prompt);

            if (window.tierManager && window.tierManager.incrementAIUsage) {
                await window.tierManager.incrementAIUsage('rewrites');
            }

            return {
                success: true,
                original: message,
                optimized: optimized,
                action,
                charCount: optimized.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                optimized: null
            };
        }
    }

    buildPrompt(profileData, type, tone, length) {
        const maxChars = length === 'short' ? 200 : length === 'medium' ? 300 : 400;
        let basePrompt = this.customPrompt + '\n\n';

        if (type === 'connection') {
            basePrompt += `Write a LinkedIn connection request for:\n`;
        } else {
            basePrompt += `Write a LinkedIn message for:\n`;
        }

        basePrompt += `- Name: ${profileData.name || 'Professional'}\n`;
        if (profileData.headline) basePrompt += `- Role: ${profileData.headline}\n`;
        if (profileData.company) basePrompt += `- Company: ${profileData.company}\n`;
        if (profileData.location) basePrompt += `- Location: ${profileData.location}\n`;

        basePrompt += `\nTone: ${tone}\n`;
        basePrompt += `Maximum length: ${maxChars} characters\n`;
        basePrompt += `\nProvide ONLY the message text, no explanations, no quotes, and no subject lines.`;

        return basePrompt;
    }

    async callProvider(prompt, overrideConfig = null) {
        const providerId = overrideConfig?.provider || this.aiProvider;
        const apiKey = overrideConfig?.apiKey || this.aiApiKey;
        const model = overrideConfig?.model || this.aiModel;

        const provider = this.providers[providerId];
        if (!provider) throw new Error(`Unsupported provider: ${providerId}`);

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
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that writes professional LinkedIn messages. You always provide ONLY the message text without any preamble, explanation, or quotes.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error?.message || response.statusText;
                throw new Error(`API Error (${response.status}): ${errorMsg}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || 'API response contains an error');
            }

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Malformed API response: choices not found');
            }

            return data.choices[0].message.content.trim().replace(/^"(.*)"$/, '$1');
        } catch (error) {
            console.error('Fetch operation failed:', error);
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                throw new Error(`Network Error: Failed to fetch from ${provider.url}. Check your internet connection. If the error persists, please reload the extension in chrome://extensions.`);
            }
            throw error;
        }
    }

    async testConnection(provider, apiKey, model) {
        try {
            const testPrompt = 'Say "Connected"';
            const result = await this.callProvider(testPrompt, {
                provider,
                apiKey,
                model: model || this.providers[provider].defaultModel
            });
            return result.toLowerCase().includes('connected');
        } catch (error) {
            console.error('Test connection failed:', error);
            throw error;
        }
    }

    async getSuggestions(messageContent) {
        await this.initialize();
        const suggestions = [];

        if (messageContent.length > 300) {
            suggestions.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Message too long',
                description: `${messageContent.length} characters. LinkedIn connection requests have a 300 character limit.`,
                action: 'shorten',
                actionText: 'Shorten message'
            });
        }

        if (!messageContent.match(/\{\{.*?\}\}/) && !messageContent.toLowerCase().includes('{{')) {
            suggestions.push({
                type: 'tip',
                icon: '💡',
                title: 'Add personalization',
                description: 'Use variables like {{firstName}} or {{company}} for better results',
                action: null
            });
        }

        const hasQuestion = messageContent.includes('?');
        const hasCTA = /\b(connect|chat|discuss|share|talk|reach out|coffee)\b/i.test(messageContent);

        if (!hasQuestion && !hasCTA) {
            suggestions.push({
                type: 'tip',
                icon: '🎯',
                title: 'Add a call-to-action',
                description: 'End with a question or clear next step',
                action: null
            });
        }

        return suggestions;
    }
}

// Export singleton
const aiService = new AIService();

if (typeof window !== 'undefined') {
    window.aiService = aiService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiService;
}

