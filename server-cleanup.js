const fs = require('fs');
const path = require('path');
const { cleanupOldLogs } = require('./scripts/cleanup-data.js');

const monitorsFilePath = path.join(__dirname, 'monitors.json');
const apiResponseFilePath = path.join(__dirname, 'api_response.json');

function cleanupMonitorsFile() {
    try {
        const rawData = fs.readFileSync(monitorsFilePath, 'utf8');
        const data = JSON.parse(rawData);
        
        if (data.stat === 'ok' && data.monitors) {
            data.monitors = cleanupOldLogs(data.monitors);
            
            fs.writeFileSync(monitorsFilePath, JSON.stringify(data, null, 0));
            console.log('Файл monitors.json успешно очищен от устаревших данных');
            
            fs.writeFileSync(apiResponseFilePath, JSON.stringify(data, null, 0));
            console.log('Файл api_response.json успешно обновлен');
        } else {
            console.error('Неправильная структура данных в файле monitors.json');
        }
    } catch (error) {
        console.error('Ошибка при очистке файла monitors.json:', error.message);
    }
}

function checkDataFreshness() {
    try {
        const rawData = fs.readFileSync(monitorsFilePath, 'utf8');
        const data = JSON.parse(rawData);
        
        if (data.stat === 'ok' && data.monitors) {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
            
            let staleCount = 0;
            
            data.monitors.forEach(monitor => {
                let lastCheckDate = null;
                
                if (monitor.response_times && monitor.response_times.length > 0) {
                    lastCheckDate = new Date(monitor.response_times[0].datetime * 1000);
                } else if (monitor.logs && monitor.logs.length > 0) {
                    lastCheckDate = new Date(monitor.logs[0].datetime * 1000);
                } else if (monitor.create_datetime) {
                    lastCheckDate = new Date(monitor.create_datetime * 1000);
                }
                
                if (lastCheckDate && lastCheckDate < oneHourAgo) {
                    staleCount++;
                }
            });
            
            if (staleCount > 0) {
                console.warn(`Найдено ${staleCount} мониторов с устаревшими данными (старше 1 часа)`);
                return false;
            } else {
                console.log('Все данные актуальны');
                return true;
            }
        }
    } catch (error) {
        console.error('Ошибка при проверке актуальности данных:', error.message);
        return false;
    }
}

function main() {
    console.log('Запуск очистки устаревших данных мониторинга...');
    
    const isFresh = checkDataFreshness();
    
    cleanupMonitorsFile();
    
    console.log('Очистка завершена');
}

if (require.main === module) {
    main();
}

module.exports = {
    cleanupMonitorsFile,
    checkDataFreshness,
    main
};