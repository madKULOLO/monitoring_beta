function formatTimeAgo(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'Нет данных';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins > 10080) {
        return 'Более 7 дней назад';
    }
    
    if (diffMins < 1) {
        return 'Только что';
    } else if (diffMins < 60) {
        return `${diffMins} мин. назад`;
    } else {
        const diffHours = Math.floor(diffMins / 60);
        return `${diffHours} ч. назад`;
    }
}

function getFaviconForService(name, url) {
    if (url) {
        try {
            const domain = new URL(url).hostname;
            return `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" alt="${name}" onerror="this.parentElement.innerHTML='🦊'">`;
        } catch (e) {
            return '🦊';
        }
    }
    
    return '🦊';
}

function generateDotChart(monitor) {
    let dots = '';
    const maxDots = 30;
    
    if (monitor.logs && monitor.logs.length > 0) {
        const recentLogs = monitor.logs.slice(0, maxDots);
        
        for (let i = 0; i < maxDots; i++) {
            if (i < recentLogs.length) {
                const log = recentLogs[i];
                let dotClass = 'online';
                
                switch (log.type) {
                    case 1:
                        dotClass = 'offline';
                        break;
                    case 2:
                        dotClass = 'online';
                        break;
                    default:
                        dotClass = 'unknown';
                }
                
                dots += `<div class="dot ${dotClass}"></div>`;
            } else {
                dots += `<div class="dot unknown"></div>`;
            }
        }
    } else {
        for (let i = 0; i < maxDots; i++) {
            const random = Math.random();
            let dotClass = 'online';
            
            if (random < 0.05) {
                dotClass = 'offline';
            } else if (random < 0.1) {
                dotClass = 'warning';
            }
            
            dots += `<div class="dot ${dotClass}"></div>`;
        }
    }
    
    return dots;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatTimeAgo,
        getFaviconForService,
        generateDotChart
    };
}