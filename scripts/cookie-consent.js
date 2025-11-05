function initCookieConsent() {
    // Use a small delay to ensure DOM is fully loaded
    setTimeout(function() {
        const cookieConsent = document.getElementById('cookieConsent');
        const acceptCookies = document.getElementById('acceptCookies');
        const rejectCookies = document.getElementById('rejectCookies');
        
        if (!cookieConsent || !acceptCookies || !rejectCookies) {
            console.warn('Cookie consent elements not found');
            return;
        }
        
        // Check if consent was already given
        const consentGiven = localStorage.getItem('cookieConsent');
        
        if (!consentGiven) {
            // Show cookie consent after a delay
            setTimeout(() => {
                cookieConsent.classList.add('show');
            }, 1000);
        }
        
        // Remove any existing event listeners to prevent duplicates
        acceptCookies.removeEventListener('click', handleAccept);
        rejectCookies.removeEventListener('click', handleReject);
        
        // Add event listeners
        acceptCookies.addEventListener('click', handleAccept);
        rejectCookies.addEventListener('click', handleReject);
    }, 100);
}

function handleAccept() {
    const cookieConsent = document.getElementById('cookieConsent');
    if (cookieConsent) {
        localStorage.setItem('cookieConsent', 'accepted');
        cookieConsent.classList.remove('show');
    }
}

function handleReject() {
    const cookieConsent = document.getElementById('cookieConsent');
    if (cookieConsent) {
        localStorage.setItem('cookieConsent', 'rejected');
        cookieConsent.classList.remove('show');
    }
}

// Initialize cookie consent when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
} else {
    initCookieConsent();
}

window.initCookieConsent = initCookieConsent;
window.handleAccept = handleAccept;
window.handleReject = handleReject;