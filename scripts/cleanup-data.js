function cleanupOldLogs(monitors) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    return monitors.map(monitor => {
        const cleanedMonitor = {...monitor};
        
        if (cleanedMonitor.logs && cleanedMonitor.logs.length > 0) {
            cleanedMonitor.logs = cleanedMonitor.logs.filter(log => {
                const logDate = new Date(log.datetime * 1000);
                return logDate >= sevenDaysAgo;
            });
        }
        
        if (cleanedMonitor.response_times && cleanedMonitor.response_times.length > 0) {
            cleanedMonitor.response_times = cleanedMonitor.response_times.filter(response => {
                const responseDate = new Date(response.datetime * 1000);
                return responseDate >= sevenDaysAgo;
            });
        }
        
        return cleanedMonitor;
    });
}

function checkDataFreshness(monitors) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    let freshCount = 0;
    let staleCount = 0;
    let veryStaleCount = 0;
    
    monitors.forEach(monitor => {
        let lastCheckDate = null;
        
        if (monitor.response_times && monitor.response_times.length > 0) {
            lastCheckDate = new Date(monitor.response_times[0].datetime * 1000);
        } else if (monitor.logs && monitor.logs.length > 0) {
            lastCheckDate = new Date(monitor.logs[0].datetime * 1000);
        } else if (monitor.create_datetime) {
            lastCheckDate = new Date(monitor.create_datetime * 1000);
        }
        
        if (lastCheckDate) {
            if (lastCheckDate >= oneHourAgo) {
                freshCount++;
            } else if (lastCheckDate >= oneDayAgo) {
                staleCount++;
            } else {
                veryStaleCount++;
            }
        }
    });
    
    return {
        fresh: freshCount,
        stale: staleCount,
        veryStale: veryStaleCount,
        total: monitors.length
    };
}

function generateDataReport(monitors) {
    const freshness = checkDataFreshness(monitors);
    const total = freshness.total;
    
    console.log('=== Отчет о состоянии данных мониторинга ===');
    console.log(`Всего мониторов: ${total}`);
    console.log(`Актуальные данные (менее 1 часа): ${freshness.fresh} (${(freshness.fresh/total*100).toFixed(1)}%)`);
    console.log(`Устаревшие данные (1 час - 1 день): ${freshness.stale} (${(freshness.stale/total*100).toFixed(1)}%)`);
    console.log(`Очень устаревшие данные (более 1 дня): ${freshness.veryStale} (${(freshness.veryStale/total*100).toFixed(1)}%)`);
    
    if (freshness.veryStale > 0) {
        console.log('\n⚠️  ВНИМАНИЕ: Найдены очень устаревшие данные!');
        console.log('Рекомендуется проверить подключение к API UptimeRobot и корректность работы workflow.');
    }
    
    return freshness;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        cleanupOldLogs,
        checkDataFreshness,
        generateDataReport
    };
}