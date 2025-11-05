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
    const codeBlock = button.nextElementSibling || button.parentElement.querySelector('pre');
    const text = codeBlock.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Скопировано!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Ошибка копирования: ', err);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            copyToClipboard(this);
        });
    });
});

window.copyToClipboard = copyToClipboard;