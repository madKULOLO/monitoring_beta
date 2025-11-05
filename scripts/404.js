document.addEventListener('DOMContentLoaded', function() {
    if (typeof initThemeToggle === 'function') {
        initThemeToggle();
    }
    
    if (typeof initEasterEgg === 'function') {
        initEasterEgg();
    }
    
    if (typeof initCookieConsent === 'function') {
        initCookieConsent();
    }
});