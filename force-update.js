const fs = require('fs');
const path = require('path');
const https = require('https');

const monitorsFilePath = path.join(__dirname, 'monitors.json');
const apiResponseFilePath = path.join(__dirname, 'api_response.json');

function fetchMonitorsData(apiKey) {
    return new Promise((resolve, reject) => {
        const postData = `api_key=${apiKey}&format=json&logs=1&response_times=1&response_times_average=30&custom_uptime_ratios=7`;
        
        const options = {
            hostname: 'api.uptimerobot.com',
            port: 443,
            path: '/v2/getMonitors',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length,
                'Cache-Control': 'no-cache'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

function saveDataToFile(data) {
    try {
        fs.writeFileSync(monitorsFilePath, JSON.stringify(data, null, 0));
        fs.writeFileSync(apiResponseFilePath, JSON.stringify(data, null, 0));
        console.log('Данные успешно обновлены');
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error.message);
        return false;
    }
}

async function main() {
    const apiKey = process.argv[2];
    if (!apiKey) {
        console.error('Ошибка: Необходимо передать API ключ как аргумент');
        console.log('Использование: node force-update.js YOUR_UPTIMEROBOT_API_KEY');
        process.exit(1);
    }
    
    console.log('Начинаем обновление данных мониторинга...');
    
    try {
        const data = await fetchMonitorsData(apiKey);
        
        if (data.stat === 'ok') {
            console.log(`Получено данных о ${data.monitors.length} мониторах`);
            
            if (saveDataToFile(data)) {
                console.log('Обновление завершено успешно');
            } else {
                process.exit(1);
            }
        } else {
            console.error('Ошибка при получении данных из API:', data.message || 'Неизвестная ошибка');
            process.exit(1);
        }
    } catch (error) {
        console.error('Ошибка при обновлении данных:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    fetchMonitorsData,
    saveDataToFile,
    main
};