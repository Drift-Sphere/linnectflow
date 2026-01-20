function getDeepProfileData() {
    const name = document.querySelector('h1')?.innerText?.trim() || "Name not found";
    
    // Find all potential role titles in the Experience section
    // We look for 't-bold' spans inside the experience section specifically
    const experienceSection = document.querySelector('#experience')?.parentElement;
    let roles = [];

    if (experienceSection) {
        // This selector finds titles in both "Single Role" and "Multiple Roles at one company" layouts
        const titleElements = experienceSection.querySelectorAll('.display-flex.ph5.pv3 span[aria-hidden="true"], .pvs-list__paged-list-item .mr1.t-bold span[aria-hidden="true"]');
        
        titleElements.forEach(el => {
            const role = el.innerText.trim();
            if (role && role.length > 3 && !roles.includes(role)) {
                roles.push(role);
            }
        });
    }

    // Fallback to the main headline if Experience is empty or private
    if (roles.length === 0) {
        const headline = document.querySelector('.text-body-medium')?.innerText?.trim();
        if (headline) roles = headline.split('|').map(r => r.trim());
    }

    return { 
        name, 
        headline: roles.join(' | '), // Shows all roles separated by |
        primaryRole: roles[0] || "Professional" 
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "get_profile") {
        sendResponse(getDeepProfileData());
    }
    return true;
});