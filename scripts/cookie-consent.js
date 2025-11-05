function initCookieConsent() {
    setTimeout(function() {
        const cookieConsent = document.getElementById('cookieConsent');
        const acceptCookies = document.getElementById('acceptCookies');
        const rejectCookies = document.getElementById('rejectCookies');
        
        if (!cookieConsent || !acceptCookies || !rejectCookies) {
            console.warn('Cookie consent elements not found');
            return;
        }
        
        const consentGiven = localStorage.getItem('cookieConsent');
        
        if (!consentGiven) {
            setTimeout(() => {
                cookieConsent.classList.add('show');
            }, 1000);
        }
        
        acceptCookies.removeEventListener('click', handleAccept);
        rejectCookies.removeEventListener('click', handleReject);
        
        acceptCookies.addEventListener('click', handleAccept);
        rejectCookies.addEventListener('click', handleReject);
        
        function handleAccept() {
            localStorage.setItem('cookieConsent', 'accepted');
            cookieConsent.classList.remove('show');
        }
        
        function handleReject() {
            localStorage.setItem('cookieConsent', 'rejected');
            cookieConsent.classList.remove('show');
        }
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

window.initCookieConsent = initCookieConsent;
window.handleAccept = handleAccept;
window.handleReject = handleReject;