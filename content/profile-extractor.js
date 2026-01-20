/**
 * Enhanced Profile Data Extractor
 * Extracts comprehensive LinkedIn profile data
 */

function extractProfileData() {
    const data = {
        name: extractName(),
        headline: extractHeadline(),
        location: extractLocation(),
        company: extractCompany(),
        primaryRole: extractPrimaryRole(),
        allRoles: extractAllRoles(),
        industry: extractIndustry(),
        school: extractSchool(),
        skills: extractSkills(),
        mutualConnections: extractMutualConnections(),
        profileUrl: window.location.href,
        extractedAt: Date.now()
    };

    return data;
}

function extractName() {
    // Try multiple selectors for name
    const selectors = [
        'h1.text-heading-xlarge',
        'h1.inline.t-24',
        '.pv-text-details__left-panel h1',
        'h1'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
            return element.innerText.trim();
        }
    }

    return 'Name not found';
}

function extractHeadline() {
    // Headline is usually below the name
    const selectors = [
        '.text-body-medium.break-words',
        '.pv-text-details__left-panel .text-body-medium',
        'div.text-body-medium',
        '.mt1.t-18'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim() && element.innerText.length > 10) {
            return element.innerText.trim();
        }
    }

    return 'Professional';
}

function extractLocation() {
    // Location below headline
    const selectors = [
        '.text-body-small.inline.t-black--light.break-words',
        '.pv-text-details__left-panel .text-body-small',
        'span.text-body-small'
    ];

    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.innerText.trim();
            // Location usually contains city/state/country
            if (text && text.length > 3 && text.includes(',')) {
                return text;
            }
        }
    }

    return null;
}

function extractCompany() {
    // Try to extract from experience section
    const experienceSection = document.querySelector('#experience')?.parentElement;

    if (experienceSection) {
        // Look for the first company name (most recent position)
        const companyElements = experienceSection.querySelectorAll('span.t-14.t-normal span[aria-hidden="true"]');

        for (const element of companyElements) {
            const text = element.innerText.trim();
            if (text && text.length > 2 && !text.match(/^\d/)) { // Not a date
                return text;
            }
        }
    }

    // Fallback: extract from headline
    const headline = extractHeadline();
    const atMatch = headline.match(/\bat\s+([^|,•·]+)/i);
    if (atMatch) {
        return atMatch[1].trim();
    }

    const parts = headline.split(/[|•·]/);
    if (parts.length > 1) {
        return parts[1].trim();
    }

    return null;
}

function extractPrimaryRole() {
    const headline = extractHeadline();

    // Extract first part before | or •
    const parts = headline.split(/[|•·]/);
    if (parts.length > 0) {
        return parts[0].trim();
    }

    return headline;
}

function extractAllRoles() {
    const roles = [];
    const experienceSection = document.querySelector('#experience')?.parentElement;

    if (experienceSection) {
        // Find all role titles
        const titleElements = experienceSection.querySelectorAll('.display-flex.ph5.pv3 span[aria-hidden="true"], .pvs-list__paged-list-item .mr1.t-bold span[aria-hidden="true"]');

        titleElements.forEach(el => {
            const role = el.innerText.trim();
            if (role && role.length > 3 && !roles.includes(role) && !role.match(/^\d/)) {
                roles.push(role);
            }
        });
    }

    // Fallback to headline
    if (roles.length === 0) {
        const headline = extractHeadline();
        headline.split(/[|•·]/).forEach(part => {
            const cleaned = part.trim();
            if (cleaned && cleaned.length > 3) {
                roles.push(cleaned);
            }
        });
    }

    return roles.slice(0, 5); // Limit to top 5 roles
}

function extractIndustry() {
    // Industry might be in the about section or profile details
    const aboutSection = document.querySelector('#about')?.parentElement;

    if (aboutSection) {
        // Look for industry keywords
        const text = aboutSection.innerText;
        const industryKeywords = [
            'technology', 'software', 'finance', 'healthcare', 'education',
            'marketing', 'sales', 'consulting', 'engineering', 'design'
        ];

        for (const keyword of industryKeywords) {
            if (text.toLowerCase().includes(keyword)) {
                return keyword.charAt(0).toUpperCase() + keyword.slice(1);
            }
        }
    }

    return null;
}

function extractSchool() {
    const educationSection = document.querySelector('#education')?.parentElement;

    if (educationSection) {
        // Find first school name
        const schoolElements = educationSection.querySelectorAll('span.t-14.t-normal span[aria-hidden="true"], .pvs-list__paged-list-item .mr1.t-bold span[aria-hidden="true"]');

        for (const element of schoolElements) {
            const text = element.innerText.trim();
            if (text && text.length > 3 && !text.match(/^\d/) && !text.match(/^\(/)) {
                return text;
            }
        }
    }

    return null;
}

function extractSkills() {
    const skills = [];
    const skillsSection = document.querySelector('#skills')?.parentElement;

    if (skillsSection) {
        // Find skill items
        const skillElements = skillsSection.querySelectorAll('.pvs-list__paged-list-item span[aria-hidden="true"]');

        skillElements.forEach(el => {
            const skill = el.innerText.trim();
            if (skill && skill.length > 2 && skill.length < 50 && !skills.includes(skill)) {
                skills.push(skill);
            }
        });
    }

    return skills.slice(0, 5); // Top 5 skills
}

function extractMutualConnections() {
    // Look for mutual connections count
    const selectors = [
        'span.link-without-visited-state span[aria-hidden="true"]',
        '.dist-value'
    ];

    for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.innerText;
            // Look for patterns like "12 mutual connections"
            const match = text.match(/(\d+)\s+mutual/i);
            if (match) {
                return match[1];
            }
        }
    }

    return '0';
}

function getRecentActivity() {
    // Extract latest post or activity
    const activitySection = document.querySelector('#recent-activity')?.parentElement;

    if (activitySection) {
        const postElements = activitySection.querySelectorAll('.feed-shared-update-v2__description');
        if (postElements.length > 0) {
            const latestPost = postElements[0].innerText.trim();
            return latestPost.substring(0, 200); // First 200 chars
        }
    }

    return null;
}

// Message listener for extension popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extract_profile') {
        const profileData = extractProfileData();

        // Add tier-specific data filtering
        if (request.tier === 'free') {
            // Free tier: basic fields only
            sendResponse({
                name: profileData.name,
                headline: profileData.headline,
                company: profileData.company,
                location: profileData.location,
                primaryRole: profileData.primaryRole,
                tier: 'free'
            });
        } else {
            // Paid tier: all fields
            sendResponse(profileData);
        }
    }

    return true;
});

// Show visual feedback when data is extracted
function showExtractionFeedback() {
    const notification = document.createElement('div');
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #0A66C2;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;
    notification.textContent = '✅ Profile data extracted!';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);
