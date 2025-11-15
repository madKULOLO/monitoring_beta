function formatTimeAgo(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'Нет данных';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
        return 'Только что';
    } else if (diffMins < 60) {
        return diffMins + ' мин. назад';
    } else {
        const diffHours = Math.floor(diffMins / 60);
        return diffHours + ' ч. назад';
    }
}

function getFaviconForService(name, url) {
    if (!name || !url) {
        return '<div class="service-icon">🦊</div>';
    }
    
    try {
        const domain = new URL(url).hostname;
        return '<div class="service-icon"><img src="https://www.google.com/s2/favicons?domain=' + domain + '&sz=64" alt="' + name + '" onerror="this.parentElement.innerHTML=\'🦊\'"></div>';
    } catch (e) {
        return '<div class="service-icon">🦊</div>';
    }
}

async function fetchServiceStatus() {
    try {
        // Determine if we're running locally or on GitHub Pages
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        let response;
        if (isLocal) {
            response = await fetch('/api/monitors');
        } else {
            response = await fetch('/monitors.json');
        }
        
        if (!response.ok) {
            throw new Error('HTTP error! status: ' + response.status);
        }
        
        const data = await response.json();
        
        if (data.stat === 'ok') {
            // Проверяем, есть ли функция cleanupOldLogs (в браузере её не будет)
            if (typeof cleanupOldLogs === 'function') {
                data.monitors = cleanupOldLogs(data.monitors);
            }
            updateServiceStatus(data.monitors);
        } else {
            showErrorMessage();
        }
    } catch (error) {
        showErrorMessage();
    }
}

function updateServiceStatus(monitors) {
    const servicesGrid = document.getElementById('servicesGrid');
    servicesGrid.innerHTML = '';
    
    if (monitors && monitors.length > 0) {
        monitors.forEach(monitor => {
            let status, statusText;
            switch (monitor.status) {
                case 2:
                    status = 'online';
                    statusText = 'Работает';
                    break;
                case 8:
                case 9:
                    status = 'offline';
                    statusText = 'Недоступен';
                    break;
                default:
                    status = 'warning';
                    statusText = 'Проблемы';
            }
            
            const card = document.createElement('div');
            card.className = 'service-card';
            card.dataset.status = status;
            
            const favicon = getFaviconForService(monitor.friendly_name, monitor.url);
            
            let lastCheckText = 'Нет данных';
            
            let lastCheckDate = null;
            if (monitor.response_times && monitor.response_times.length > 0) {
                const lastResponse = monitor.response_times[0];
                if (lastResponse.datetime) {
                    lastCheckDate = new Date(lastResponse.datetime * 1000);
                }
            } else if (monitor.logs && monitor.logs.length > 0) {
                const lastLog = monitor.logs[0];
                if (lastLog.datetime) {
                    lastCheckDate = new Date(lastLog.datetime * 1000);
                }
            } else if (monitor.create_datetime) {
                lastCheckDate = new Date(monitor.create_datetime * 1000);
            }
            
            if (lastCheckDate) {
                lastCheckText = formatTimeAgo(lastCheckDate);
            }
            
            let uptimePercentage = 'Нет данных';
            let uptimeClass = 'unknown';
            if (monitor.custom_uptime_ratio) {
                const uptimeValue = parseFloat(monitor.custom_uptime_ratio);
                uptimePercentage = uptimeValue.toFixed(uptimeValue % 1 === 0 ? 0 : 3) + '%';
                if (uptimeValue >= 99) {
                    uptimeClass = 'online';
                } else if (uptimeValue >= 95) {
                    uptimeClass = 'warning';
                } else {
                    uptimeClass = 'offline';
                }
            }
            
            card.innerHTML = 
                '<div class="service-header">' +
                    favicon +
                    '<div class="service-info">' +
                        '<div class="service-name">' + monitor.friendly_name + '</div>' +
                        '<div class="status-text ' + status + '">' + statusText + '</div>' +
                    '</div>' +
                    '<div class="service-actions">' +
                        '<i class="fas fa-info-circle details-icon" title="Детальная информация" data-service="' + encodeURIComponent(monitor.friendly_name) + '"></i>' +
                    '</div>' +
                '</div>' +
                '<div class="last-checked">Последняя проверка: ' + lastCheckText + '</div>';
            
            const detailsIcon = card.querySelector('.details-icon');
            if (detailsIcon) {
                detailsIcon.addEventListener('click', function(e) {
                    e.stopPropagation();
                    window.location.href = 'service-details?service=' + encodeURIComponent(monitor.friendly_name);
                });
            }
            
            servicesGrid.appendChild(card);
        });
    } else {
        servicesGrid.innerHTML = 
            '<div class="service-card" data-status="unknown">' +
                '<div class="service-header">' +
                    '<div class="service-icon">ℹ️</div>' +
                    '<div class="service-info">' +
                        '<div class="service-name">Нет данных</div>' +
                        '<div class="status-text unknown">Нет мониторов</div>' +
                    '</div>' +
                '</div>' +
                '<div class="last-checked">В системе пока нет активных мониторов</div>' +
            '</div>';
    }
}

function showErrorMessage() {
    const servicesGrid = document.getElementById('servicesGrid');
    servicesGrid.innerHTML = 
        '<div class="service-card" data-status="warning">' +
            '<div class="service-header">' +
                '<div class="service-icon">⚠️</div>' +
                '<div class="service-info">' +
                    '<div class="service-name">Ошибка</div>' +
                    '<div class="status-text warning">Ошибка получения данных</div>' +
                '</div>' +
            '</div>' +
            '<div class="last-checked">Проверьте подключение к интернету</div>' +
        '</div>';
}

window.fetchServiceStatus = fetchServiceStatus;
window.updateServiceStatus = updateServiceStatus;
window.showErrorMessage = showErrorMessage;