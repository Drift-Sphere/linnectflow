# LinnectFlow - LinkedIn AI Assistant

A reply-rate focused LinkedIn messaging assistant with AI optimization. LinnectFlow helps you personalize your outreach, track your activity, and stay within LinkedIn's safety limits—all for free.

## Features

- **Unlimited Templates**: Create and manage as many messaging templates as you need.
- **Full Profile Extraction**: Automatically extract 10+ data points from LinkedIn profiles (Name, Company, Role, Headline, Education, Skills, etc.).
- **AI-Powered Generation**: Generate personalized messages using Groq or OpenAI models.
- **Message History & Analytics**: Track every message sent and monitor your reply rates with built-in analytics.
- **LinkedIn Health Tracking**: Stay safe with real-time activity counters and warnings based on industry-standard limits.
- **Follow-Up Reminders**: Never miss a beat with scheduled reminders for your leads.
- **Lead Tagging & Notes**: Organize your outreach with custom tags and detailed notes.

## Installation

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right.
4. Click **"Load unpacked"** and select the extension folder.
5. The LinnectFlow icon will appear in your toolbar.

## Setup

1. Click the extension icon and go to the **Settings** tab.
2. Select your AI Provider (**Groq** or **OpenAI**).
3. Enter your **API Key** (get one from [Groq Console](https://console.groq.com/) or [OpenAI Platform](https://platform.openai.com/)).
4. Specify the **Model ID** (e.g., `llama-3.1-70b-versatile` or `gpt-4o-mini`).
5. Click **Save Settings** and use the **Test Connection** button to verify.

## Usage

### Personalizing Messages
1. Navigate to a LinkedIn profile.
2. Click the LinnectFlow icon in your toolbar (or use the injected buttons on the page).
3. Click **Extract Profile Data** to grab details.
4. Select a template and click **Generate AI Message** to create a personalized draft.

### Dynamic Templates
Use variables in your templates for automatic personalization:
- `{{firstName}}`, `{{lastName}}`, `{{company}}`, `{{role}}`, `{{headline}}`, `{{location}}`, `{{industry}}`, `{{school}}`, `{{skills}}`, `{{mutualConnections}}`.

## Privacy & Security

- **Local Storage**: All your templates, history, and notes are stored locally in your browser.
- **Bring Your Own Key**: Your API keys are stored securely on your device and calls are made directly to the providers.
- **Privacy First**: We do not track your LinkedIn credentials or sell your data.

## Support

For issues or feature requests, please open an issue on GitHub.

## License

MIT License - see LICENSE file for details.
