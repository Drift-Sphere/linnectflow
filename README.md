# LinnectFlow - LinkedIn AI Assistant

A reply-rate focused LinkedIn messaging assistant with AI optimization.

## Features

### Free Tier
- ✅ 5 message templates
- ✅ Profile data extraction (basic fields)
- ✅ AI message generation (10/day)
- ✅ Message history (7 days)
- ✅ Activity counter

### Pro Tier ($19/month)
- ✨ Unlimited templates
- ✨ Advanced profile extraction
- ✨ Unlimited AI rewrites & generation
- ✨ Full message history & analytics
- ✨ Smart safety mode
- ✨ Follow-up reminders
- ✨ Lead tagging & notes

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `linkedin-ai-tool` folder
5. The extension icon should appear in your toolbar

## Setup

1. Click the extension icon
2. Go to Settings tab
3. Add your Gemini API key (get free key from [Google AI Studio](https://makersuite.google.com/app/apikey))
4. Configure your LinkedIn account type
5. Save settings

## Usage

### Compose Messages
1. Navigate to any LinkedIn profile
2. Click "Extract Profile Data"
3. Click "Generate AI Message"
4. Copy and paste into LinkedIn

### Use Templates
1. Go to Templates tab
2. Click "+ New" to create a template
3. Use variables: `{{firstName}}`, `{{company}}`, `{{role}}`, etc.
4. Templates will auto-fill when you insert them

### In-Page Features
- When composing a message on LinkedIn, look for the LinkedIn AI Pro toolbar
- Click "Insert Template" to quickly add a template
- Click "Enhance" (Pro) to improve your message with AI

## Variables

Use these in your templates to personalize messages:

- `{{name}}` or `{{fullName}}` - Full name
- `{{firstName}}` - First name only
- `{{lastName}}` - Last name only
- `{{company}}` - Current company
- `{{role}}` or `{{title}}` - Job title
- `{{headline}}` - LinkedIn headline
- `{{location}}` - City, state
- `{{industry}}` - Industry
- `{{school}}` - Education
- `{{skills}}` - Top skills
- `{{mutualConnections}}` - Number of mutual connections

## Safety Features

- **Activity Tracking**: Monitors messages and connection requests
- **LinkedIn Limits**: Warns you before hitting LinkedIn's daily limits
- **Smart Pacing**: (Pro) Adds random delays and warnings

## Privacy

- All data stored locally in your browser
- Optional cloud sync for Pro users
- No data sold to third parties
- AI processing uses Google Gemini API

## Support

For issues or feature requests, please open an issue on GitHub.

## License

MIT License - see LICENSE file for details
