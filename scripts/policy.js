document.addEventListener('DOMContentLoaded', function() {
    if (typeof initThemeToggle === 'function') {
        initThemeToggle();
    }
    
    if (typeof initCookieConsent === 'function') {
        initCookieConsent();
    }
});