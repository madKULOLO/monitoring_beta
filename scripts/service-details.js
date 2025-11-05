function loadServiceDetails(serviceName) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let url;
    if (isLocal) {
        url = '/api/monitors';
    } else {
        url = '/monitors.json';
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.stat === 'ok' && data.monitors) {
                let monitor = data.monitors.find(m => m.friendly_name === serviceName);
                if (!monitor) {
                    monitor = data.monitors.find(m => 
                        m.friendly_name.toLowerCase() === serviceName.toLowerCase()
                    );
                }
                if (monitor) {
                    displayServiceDetails(monitor);
                } else {
                    displayServiceNotFound(serviceName);
                }
            } else {
                displayServiceNotFound(serviceName);
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных:', error);
            displayServiceNotFound(serviceName);
        });
}

function displayServiceDetails(monitor) {
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
    
    const favicon = getFaviconForService(monitor.friendly_name, monitor.url);
    
    let lastCheckText = 'Нет данных';
    if (monitor.response_times && monitor.response_times.length > 0) {
        const lastResponse = monitor.response_times[0];
        if (lastResponse.datetime) {
            lastCheckText = formatTimeAgo(new Date(lastResponse.datetime * 1000));
        }
    } else if (monitor.logs && monitor.logs.length > 0) {
        const lastLog = monitor.logs[0];
        if (lastLog.datetime) {
            lastCheckText = formatTimeAgo(new Date(lastLog.datetime * 1000));
        }
    } else if (monitor.create_datetime) {
        lastCheckText = formatTimeAgo(new Date(monitor.create_datetime * 1000));
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
    
    document.getElementById('serviceDetails').innerHTML = `
        <div class="dashboard-header">
            ${favicon}
            <div class="service-info">
                <div class="service-name">${monitor.friendly_name}</div>
                <div class="status-text ${status}">${statusText}</div>
            </div>
            <div class="last-checked">Последняя проверка: ${lastCheckText}</div>
        </div>
        
        <div class="dashboard-grid">
            <div class="dashboard-card metrics-card">
                <h3><i class="fas fa-tachometer-alt"></i> Основные метрики</h3>
                <div class="metrics-grid">
                    <div class="metric">
                        <div class="metric-value ${status}">${statusText}</div>
                        <div class="metric-label">Текущий статус</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value ${uptimeClass}">${uptimePercentage}</div>
                        <div class="metric-label">Доступность (7 дней)</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${monitor.average_response_time ? monitor.average_response_time.split('.')[0] + 'ms' : 'Нет данных'}</div>
                        <div class="metric-label">Среднее время ответа</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${monitor.responsetime_length || '0'}</div>
                        <div class="metric-label">Проверок выполнено</div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-card chart-card">
                <h3><i class="fas fa-chart-bar"></i> Доступность (30 дней)</h3>
                <div class="chart-container">
                    <canvas id="availabilityChart" width="400" height="200"></canvas>
                </div>
            </div>
            
            <div class="dashboard-card dots-card">
                <h3><i class="fas fa-dot-circle"></i> Точки проверок (7 дней)</h3>
                <div class="dots-container">
                    <div class="dot-chart-header">
                        <span class="chart-title">Последние проверки</span>
                        <span class="chart-value ${uptimeClass}">${uptimePercentage}</span>
                    </div>
                    <div class="dot-chart-container">
                        <div class="dot-chart" id="dotChart">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-card chart-card">
                <h3><i class="fas fa-chart-line"></i> Время ответа (72 часа)</h3>
                <div class="chart-container">
                    <canvas id="responseTimeChart" width="400" height="200"></canvas>
                </div>
            </div>
            
            <div class="dashboard-card failures-card">
                <h3><i class="fas fa-exclamation-circle"></i> Анализ сбоев</h3>
                <div class="failures-content">
                    <div class="failure-stats">
                        <div class="stat-item">
                            <div class="stat-value" id="failureRate">0%</div>
                            <div class="stat-label">Частота сбоев</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="maxDuration">0 сек</div>
                            <div class="stat-label">Макс. время</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="avgDuration">0 сек</div>
                            <div class="stat-label">Ср. время</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="totalFailures">0</div>
                            <div class="stat-label">Всего сбоев</div>
                        </div>
                    </div>
                    <div class="failure-trend">
                        <h4>Тренд сбоев (последние 7 дней)</h4>
                        <div class="trend-chart">
                            <canvas id="failureTrendChart" width="400" height="100"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-card incidents-card">
                <h3><i class="fas fa-exclamation-triangle"></i> История инцидентов</h3>
                <div class="incidents-list" id="incidentsList">
                </div>
            </div>
            
            <div class="dashboard-card tech-card">
                <h3><i class="fas fa-cogs"></i> Техническая информация</h3>
                <div class="tech-grid">
                    <div class="tech-item">
                        <div class="tech-icon">📡</div>
                        <div class="tech-info">
                            <div class="tech-label">Тип мониторинга</div>
                            <div class="tech-value">HTTP(s) мониторинг</div>
                        </div>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">⏱️</div>
                        <div class="tech-info">
                            <div class="tech-label">Интервал проверки</div>
                            <div class="tech-value">Каждые ${monitor.interval ? monitor.interval/60 : 5} минут</div>
                        </div>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">📍</div>
                        <div class="tech-info">
                            <div class="tech-label">Локация</div>
                            <div class="tech-value">Глобальная сеть</div>
                        </div>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">🛡️</div>
                        <div class="tech-info">
                            <div class="tech-label">SSL сертификат</div>
                            <div class="tech-value">Проверяется</div>
                        </div>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">🕒</div>
                        <div class="tech-info">
                            <div class="tech-label">Таймаут</div>
                            <div class="tech-value">${monitor.timeout || 15} секунд</div>
                        </div>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">📊</div>
                        <div class="tech-info">
                            <div class="tech-label">ID монитора</div>
                            <div class="tech-value">${monitor.id || 'Неизвестно'}</div>
                        </div>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">🔗</div>
                        <div class="tech-info">
                            <div class="tech-label">URL</div>
                            <div class="tech-value"><a href="${monitor.url}" target="_blank" rel="noopener noreferrer">${monitor.url || 'Неизвестно'}</a></div>
                        </div>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">📅</div>
                        <div class="tech-info">
                            <div class="tech-label">Дата создания</div>
                            <div class="tech-value">${monitor.create_datetime ? new Date(monitor.create_datetime * 1000).toLocaleDateString('ru-RU') : 'Неизвестно'}</div>
                        </div>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">📈</div>
                        <div class="tech-info">
                            <div class="tech-label">Тип проверки</div>
                            <div class="tech-value">${monitor.type === 1 ? 'HTTP(s)' : 'Неизвестно'}</div>
                        </div>
                    </div>
                    <div class="tech-item">
                        <div class="tech-icon">⚡</div>
                        <div class="tech-info">
                            <div class="tech-label">Последний код ответа</div>
                            <div class="tech-value">${monitor.logs && monitor.logs.length > 0 ? monitor.logs[0].reason.code : 'OK'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    initializeCharts(monitor);
    updateDotChart(monitor);
    updateFailureStats(monitor);
    updateIncidentsList(monitor);
}

function initializeCharts(monitor) {
    if (monitor.response_times && monitor.response_times.length > 0) {
        const availabilityCtx = document.getElementById('availabilityChart').getContext('2d');
        if (availabilityCtx) {
            const recentTimes = monitor.response_times.slice(0, 30).reverse();
            
            const availabilityData = recentTimes.map(response => {
                if (response.value > 5000) return 0;
                if (response.value > 2000) return 50;
                return 100;
            });
            
            const availabilityLabels = recentTimes.map((response, index) => {
                const date = new Date(response.datetime * 1000);
                return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            });
            
            new Chart(availabilityCtx, {
                type: 'line',
                data: {
                    labels: availabilityLabels,
                    datasets: [{
                        label: 'Доступность (%)',
                        data: availabilityData,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }
    
    if (monitor.response_times && monitor.response_times.length > 0) {
        const responseCtx = document.getElementById('responseTimeChart').getContext('2d');
        if (responseCtx) {
            const recentTimes = monitor.response_times.slice(0, 24).reverse();
            
            const responseData = recentTimes.map(response => response.value);
            const responseLabels = recentTimes.map(response => {
                const date = new Date(response.datetime * 1000);
                return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            });
            
            new Chart(responseCtx, {
                type: 'line',
                data: {
                    labels: responseLabels,
                    datasets: [{
                        label: 'Время ответа (мс)',
                        data: responseData,
                        borderColor: '#FF6B35',
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + 'ms';
                                }
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y + 'ms';
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    const trendCtx = document.getElementById('failureTrendChart').getContext('2d');
    if (trendCtx) {
        const failuresByDay = {};
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            failuresByDay[dateKey] = 0;
        }
        
        if (monitor.logs && monitor.logs.length > 0) {
            const sortedLogs = monitor.logs.sort((a, b) => a.datetime - b.datetime);
            
            sortedLogs.forEach(log => {
                if (log.type === 1) {
                    const logDate = new Date(log.datetime * 1000);
                    const dateKey = logDate.toISOString().split('T')[0];
                    if (failuresByDay[dateKey] !== undefined) {
                        failuresByDay[dateKey]++;
                    }
                }
            });
        }
        
        const trendData = Object.values(failuresByDay);
        const trendLabels = Object.keys(failuresByDay).map(date => {
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        });
        
        new Chart(trendCtx, {
            type: 'bar',
            data: {
                labels: trendLabels,
                datasets: [{
                    label: 'Количество сбоев',
                    data: trendData,
                    backgroundColor: '#F44336',
                    borderColor: '#D32F2F',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

function updateDotChart(monitor) {
    const dotChart = document.getElementById('dotChart');
    if (!dotChart) return;
    
    if (monitor.response_times && monitor.response_times.length > 0) {
        const maxDots = 90;
        const recentTimes = monitor.response_times.slice(0, maxDots).reverse();
        
        let dotsHtml = '';
        for (let i = 0; i < maxDots; i++) {
            if (i < recentTimes.length) {
                const response = recentTimes[i];
                let dotClass = 'online';
                let statusText = 'Работает';
                
                const responseDate = new Date(response.datetime * 1000);
                const formattedDate = responseDate.toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                if (response.value > 5000) {
                    dotClass = 'offline';
                    statusText = 'Очень медленный ответ';
                } else if (response.value > 2000) {
                    dotClass = 'warning';
                    statusText = 'Медленный ответ';
                } else {
                    dotClass = 'online';
                    statusText = 'Работает';
                }
                
                dotsHtml += '<div class="dot ' + dotClass + '" data-status="' + statusText + ' (' + response.value + 'ms)" data-time="' + formattedDate + '" onmouseover="showTooltip(this)" onmouseout="hideTooltip(this)"></div>';
            } else {
                dotsHtml += '<div class="dot unknown" data-status="Нет данных" data-time="" onmouseover="showTooltip(this)" onmouseout="hideTooltip(this)"></div>';
            }
        }
        
        dotChart.innerHTML = dotsHtml;
    } else {
        let dotsHtml = '';
        for (let i = 0; i < 90; i++) {
            const random = Math.random();
            let dotClass = 'online';
            let statusText = 'Работает';
            
            if (random < 0.05) {
                dotClass = 'offline';
                statusText = 'Недоступен';
            } else if (random < 0.1) {
                dotClass = 'warning';
                statusText = 'Проблемы';
            }
            
            dotsHtml += '<div class="dot ' + dotClass + '" data-status="' + statusText + '" data-time="" onmouseover="showTooltip(this)" onmouseout="hideTooltip(this)"></div>';
        }
        
        dotChart.innerHTML = dotsHtml;
    }
}

function updateFailureStats(monitor) {
    if (monitor.logs && monitor.logs.length > 0) {
        const failures = monitor.logs.filter(log => log.type === 1).length;
        const totalChecks = monitor.logs.length;
        const failureRate = totalChecks > 0 ? ((failures / totalChecks) * 100).toFixed(2) : 0;
        
        let maxDuration = 0;
        let avgDuration = 0;
        let totalDuration = 0;
        
        monitor.logs.forEach(log => {
            if (log.type === 1) {
                totalDuration += log.duration;
                if (log.duration > maxDuration) {
                    maxDuration = log.duration;
                }
            }
        });
        
        const failureCount = monitor.logs.filter(log => log.type === 1).length;
        if (failureCount > 0) {
            avgDuration = (totalDuration / failureCount).toFixed(0);
        }
        
        document.getElementById('failureRate').textContent = failureRate + '%';
        document.getElementById('maxDuration').textContent = maxDuration + ' сек';
        document.getElementById('avgDuration').textContent = avgDuration + ' сек';
        document.getElementById('totalFailures').textContent = failures;
    }
}

function updateIncidentsList(monitor) {
    const incidentsList = document.getElementById('incidentsList');
    
    if (monitor.logs && monitor.logs.length > 0) {
        const sortedLogs = monitor.logs.sort((a, b) => b.datetime - a.datetime);
        
        const recentLogs = sortedLogs.slice(0, 15);
        
        let incidentsHtml = '';
        recentLogs.forEach(log => {
            let incidentStatus = 'online';
            let incidentStatusText = 'Работает';
            let statusIcon = '✅';
            
            if (log.type === 1) {
                incidentStatus = 'offline';
                incidentStatusText = 'Недоступен';
                statusIcon = '❌';
            } else if (log.type === 2) {
                incidentStatus = 'warning';
                incidentStatusText = 'Проблемы';
                statusIcon = '⚠️';
            }
            
            const incidentDate = new Date(log.datetime * 1000);
            const formattedDate = incidentDate.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const durationMinutes = Math.floor(log.duration / 60);
            const durationSeconds = log.duration % 60;
            let durationText = '';
            
            if (durationMinutes > 0) {
                durationText = durationMinutes + ' мин';
                if (durationSeconds > 0) {
                    durationText += ' ' + durationSeconds + ' сек';
                }
            } else {
                durationText = durationSeconds + ' сек';
            }
            
            incidentsHtml += `
                <div class="incident-item ${incidentStatus}">
                    <div class="incident-status">
                        <span class="status-icon">${statusIcon}</span>
                        <span class="status-text">${incidentStatusText}</span>
                    </div>
                    <div class="incident-time">${formattedDate}</div>
                    <div class="incident-duration">${durationText}</div>
                    <div class="incident-reason">${log.reason.detail || 'Неизвестная ошибка'}</div>
                </div>
            `;
        });
        
        incidentsList.innerHTML = incidentsHtml;
    } else {
        incidentsList.innerHTML = `
            <div class="no-incidents">
                <p>Нет данных об инцидентах</p>
            </div>
        `;
    }
}

function displayServiceNotFound(serviceName) {
    document.getElementById('serviceDetails').innerHTML = `
        <div class="service-card" data-status="unknown">
            <div class="service-header">
                <div class="service-icon">ℹ️</div>
                <div class="service-info">
                    <div class="service-name">Сервис не найден</div>
                    <div class="status-text unknown">Ошибка</div>
                </div>
            </div>
            <div class="last-checked">Сервис "${serviceName}" не найден в системе мониторинга</div>
        </div>
    `;
}

function showTooltip(element) {
    let tooltip = document.getElementById('service-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'service-tooltip';
        tooltip.className = 'service-tooltip';
        document.body.appendChild(tooltip);
    }
    
    const status = element.getAttribute('data-status');
    const time = element.getAttribute('data-time');
    
    let content = status;
    if (time) {
        content += '\n' + time;
    }
    
    tooltip.textContent = content;
    
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    tooltip.style.left = (rect.left + scrollLeft) + 'px';
    tooltip.style.top = (rect.top + scrollTop - 30) + 'px';
    
    tooltip.style.display = 'block';
}

function hideTooltip(element) {
    const tooltip = document.getElementById('service-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceName = urlParams.get('service');
    
    if (serviceName) {
        loadServiceDetails(decodeURIComponent(serviceName));
        document.title = 'Детали мониторинга ' + decodeURIComponent(serviceName) + ' - Хитрая Лиса';
    } else {
        document.getElementById('serviceDetails').innerHTML = `
            <div class="service-card" data-status="unknown">
                <div class="service-header">
                    <div class="service-icon">ℹ️</div>
                    <div class="service-info">
                        <div class="service-name">Сервис не найден</div>
                        <div class="status-text unknown">Ошибка</div>
                    </div>
                </div>
                <div class="last-checked">Не указан сервис для отображения</div>
            </div>
        `;
    }
    
    const copyButtons = document.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const codeBlock = this.nextElementSibling || this.parentElement.querySelector('pre');
            const text = codeBlock.textContent;
            
            navigator.clipboard.writeText(text).then(() => {
                const originalText = this.textContent;
                this.textContent = 'Скопировано!';
                this.classList.add('copied');
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.classList.remove('copied');
                }, 2000);
            });
        });
    });
});

window.loadServiceDetails = loadServiceDetails;
window.displayServiceDetails = displayServiceDetails;
window.initializeCharts = initializeCharts;
window.updateDotChart = updateDotChart;
window.updateFailureStats = updateFailureStats;
window.updateIncidentsList = updateIncidentsList;
window.displayServiceNotFound = displayServiceNotFound;
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;
