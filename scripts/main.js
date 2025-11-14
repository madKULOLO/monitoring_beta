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
    
    if (typeof fetchServiceStatus === 'function') {
        setTimeout(fetchServiceStatus, 100);
    }
    
    console.log('Хитрая Лиса загружена! Подключение к интеллектуальной системе мониторинга...');
});

function copyToClipboard(button) {
    if (button.classList.contains('copied')) {
        return;
    }
    
    const codeBlock = button.nextElementSibling || button.parentElement.querySelector('pre');
    const text = codeBlock.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.getAttribute('data-original-text') || button.textContent;
        if (!button.getAttribute('data-original-text')) {
            button.setAttribute('data-original-text', originalText);
        }
        
        button.textContent = 'Скопировано!';
        button.classList.add('copied');
        
        button.offsetHeight;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Ошибка копирования: ', err);
    });
}

window.copyToClipboard = copyToClipboard;
