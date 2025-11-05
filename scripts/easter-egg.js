function initEasterEgg() {
    const foxHead = document.getElementById('foxHead');
    const easterEgg = document.getElementById('easterEgg');
    const overlay = document.getElementById('overlay');
    
    if (foxHead && easterEgg && overlay) {
        let clickCount = 0;
        const requiredClicks = 5;
        
        foxHead.addEventListener('click', function() {
            clickCount++;
            
            if (clickCount === requiredClicks) {
                easterEgg.innerHTML = `
                    <h2>Поздравляем!</h2>
                    <p>Вы нашли пасхалку Хитрой Лисы! 🦊</p>
                    <p>Как награда, мы дарим вам виртуальную лисью мудрость:</p>
                    <p><strong>"Будь хитер, как лиса, и добросердечен, как голубь."</strong></p>
                    <p>И эксклюзивный промокод на скидку 15% для внедрения наших решений:</p>
                    <p><strong>FOX15Discount</strong></p>
                    <button class="easter-egg-close" id="closeEasterEgg">Закрыть</button>
                `;
                easterEgg.classList.add('show');
                overlay.classList.add('show');
                
                setTimeout(() => {
                    const closeEasterEgg = document.getElementById('closeEasterEgg');
                    if (closeEasterEgg) {
                        closeEasterEgg.addEventListener('click', function() {
                            easterEgg.classList.remove('show');
                            overlay.classList.remove('show');
                            clickCount = 0;
                        });
                    }
                }, 100);
            }
        });
        
        overlay.addEventListener('click', function() {
            easterEgg.classList.remove('show');
            overlay.classList.remove('show');
            clickCount = 0;
        });
    }
}

window.initEasterEgg = initEasterEgg;