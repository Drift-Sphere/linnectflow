/**
 * Template Engine
 * Handles template variable substitution and personalization
 */

class TemplateEngine {
    constructor() {
        this.variableRegex = /\{\{(\w+)\}\}/g;
    }

    /**
     * Get all variables from a template string
     */
    getVariables(template) {
        const matches = template.matchAll(this.variableRegex);
        const variables = new Set();

        for (const match of matches) {
            variables.add(match[1]);
        }

        return Array.from(variables);
    }

    /**
     * Render template with profile data
     */
    render(template, profileData) {
        if (!template || !profileData) {
            return template;
        }

        let rendered = template;

        // Replace each variable with corresponding profile data
        rendered = rendered.replace(this.variableRegex, (match, variable) => {
            const value = this.getProfileValue(variable, profileData);
            return value !== null && value !== undefined ? value : match;
        });

        return rendered;
    }

    /**
     * Get profile value with fallbacks and transformations
     */
    getProfileValue(variable, profileData) {
        // Direct mapping
        if (profileData[variable]) {
            return profileData[variable];
        }

        // Handle special variables
        switch (variable) {
            case 'firstName':
                return this.extractFirstName(profileData.name);

            case 'lastName':
                return this.extractLastName(profileData.name);

            case 'fullName':
            case 'name':
                return profileData.name;

            case 'company':
            case 'currentCompany':
                return profileData.company || this.extractCompanyFromHeadline(profileData.headline);

            case 'role':
            case 'title':
            case 'position':
                return profileData.primaryRole || profileData.headline?.split('|')[0]?.trim();

            case 'headline':
                return profileData.headline;

            case 'location':
                return profileData.location;

            case 'industry':
                return profileData.industry;

            case 'school':
            case 'education':
                return profileData.school;

            case 'mutualConnections':
            case 'mutuals':
                return profileData.mutualConnections || '0';

            case 'skills':
                return profileData.skills ? profileData.skills.join(', ') : '';

            case 'recentActivity':
                return profileData.recentActivity;

            default:
                return null;
        }
    }

    /**
     * Extract first name from full name
     */
    extractFirstName(fullName) {
        if (!fullName) return '';
        return fullName.split(' ')[0];
    }

    /**
     * Extract last name from full name
     */
    extractLastName(fullName) {
        if (!fullName) return '';
        const parts = fullName.split(' ');
        return parts.length > 1 ? parts[parts.length - 1] : '';
    }

    /**
     * Try to extract company from headline
     */
    extractCompanyFromHeadline(headline) {
        if (!headline) return '';

        // Look for "at Company" pattern
        const atMatch = headline.match(/\bat\s+([^|,]+)/i);
        if (atMatch) {
            return atMatch[1].trim();
        }

        // Look for "| Company" pattern
        const parts = headline.split('|');
        if (parts.length > 1) {
            return parts[1].trim();
        }

        return '';
    }

    /**
     * Validate template syntax
     */
    validate(template) {
        const errors = [];

        // Check for unclosed variables
        const openBraces = (template.match(/\{\{/g) || []).length;
        const closeBraces = (template.match(/\}\}/g) || []).length;

        if (openBraces !== closeBraces) {
            errors.push('Unclosed variable brackets detected');
        }

        // Check for empty variables
        if (template.match(/\{\{\s*\}\}/)) {
            errors.push('Empty variable brackets detected');
        }

        // Check length (LinkedIn max is 300 chars for connection requests)
        if (template.length > 300) {
            errors.push(`Template is ${template.length} characters (max 300 for connection requests)`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get preview with sample data
     */
    preview(template, sampleData = null) {
        const defaultSample = {
            name: 'John Doe',
            firstName: 'John',
            lastName: 'Doe',
            headline: 'Senior Product Manager at TechCorp',
            primaryRole: 'Senior Product Manager',
            company: 'TechCorp',
            location: 'San Francisco, CA',
            industry: 'Technology',
            mutualConnections: '12',
            school: 'Stanford University'
        };

        const data = sampleData || defaultSample;
        return this.render(template, data);
    }

    /**
     * Suggest variables based on template content
     */
    suggestVariables(template) {
        const suggestions = [];
        const content = template.toLowerCase();

        if (!content.includes('{{')) {
            // Suggest common variables if none are used
            if (content.includes('hi ') || content.includes('hello ')) {
                suggestions.push({
                    variable: 'firstName',
                    reason: 'Personalize greeting with first name',
                    example: 'Hi {{firstName}},'
                });
            }

            suggestions.push({
                variable: 'company',
                reason: 'Mention their company',
                example: 'I noticed you work at {{company}}'
            });

            suggestions.push({
                variable: 'role',
                reason: 'Reference their role',
                example: 'As a {{role}}...'
            });
        }

        return suggestions;
    }

    /**
     * Get character count with variable estimation
     */
    estimateLength(template, profileData = null) {
        if (profileData) {
            const rendered = this.render(template, profileData);
            return rendered.length;
        }

        // Estimate by replacing variables with average lengths
        let estimated = template;
        estimated = estimated.replace(/\{\{firstName\}\}/g, 'John'); // 4-6 chars avg
        estimated = estimated.replace(/\{\{lastName\}\}/g, 'Smith'); // 5-8 chars avg
        estimated = estimated.replace(/\{\{name\}\}/g, 'John Smith'); // 10-15 chars avg
        estimated = estimated.replace(/\{\{company\}\}/g, 'TechCorp'); // 5-20 chars avg
        estimated = estimated.replace(/\{\{role\}\}/g, 'Product Manager'); // 10-30 chars avg

        return estimated.length;
    }
}

// Export singleton
const templateEngine = new TemplateEngine();

if (typeof window !== 'undefined') {
    window.templateEngine = templateEngine;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = templateEngine;
}
