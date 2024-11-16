const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ini = require('ini');
const moment = require('moment');
const TelegramBot = require('node-telegram-bot-api');

// 로그 파일 경로 설정
const getAppPath = (...args) => {
    const basePath = process.pkg ? path.dirname(process.execPath) : __dirname;
    return path.join(basePath, ...args);
};

let logFilePath = getAppPath('Templog.txt');

// 로그 작성
function writeToLog(message) {
    let logMessage = moment().format("YYYY-MM-DD HH:mm:ss") + ` | ${message}\n`;
    
    // 파일에 로그 추가 (appendFile은 파일이 없으면 생성함)
    fs.appendFileSync(logFilePath, logMessage, function(err) {
        if (err) {
            console.error(moment().format("YYYY-MM-DD HH:mm:ss") , ' | 로그 파일 작성 실패 : ', err);
        }
    });
}

// 설정 파일 불러오기
function readConfig() {
    try {
        let configPath = getAppPath('config.ini');
        let configFile = fs.readFileSync(configPath, 'utf-8');
        return ini.parse(configFile);
    } catch (error) {
        console.error(moment().format("YYYY-MM-DD HH:mm:ss") , ' | 설정 파일 읽기 실패 : ', error.message);
        process.exit(1);
    }
}

// 온도 측정 변수 설정
let RawDeviceList;
let ProDeviceList = [];

// 현재 연결된 디스크 장치 목록 불러오기
function scanDeviceList() {
    return new Promise(function(resolve, reject) {
        let commandScanDeviceList = `smartctl --scan`;
        exec(commandScanDeviceList, { windowsHide: true }, function(error, stdout, stderr) {
            if (error) {
                console.error(`실행 중 에러 발생: ${error}`);
                reject(error);
                return;
            }
            
            if (stderr) { console.error(`stderr: ${stderr}`); }
            
            RawDeviceList = stdout.split('\n')
                .filter(function(line) {
                    return line.trim(); // 빈 줄 제거
                })  
                .map(function(line) {
                    const parts = line.split('#')[0].trim().split(' ');
                    return {
                        devicePath: parts[0],
                        optionType: parts[1],
                        deviceType: parts[2]
                    };
                });
            resolve(RawDeviceList);
        });
    });
}

// 현재 연결된 디스크 장치들의 온도를 불러오기
async function scanDevicesTemp(RawDeviceList) {
    for (let key of RawDeviceList) {
        if(key.deviceType == "ata") {
            let commandScanDeviceTemp = `smartctl -a ${key.optionType} ${key.deviceType} ${key.devicePath}`;
            let commandOption = `| findstr /C:"Device Model" /C:"Serial Number" /C:"Temperature_Celsius"`;

            await new Promise((resolve) => {
                exec(commandScanDeviceTemp + commandOption, { windowsHide: true }, function(error, stdout, stderr) {
                    let deviceInfo = {
                        deviceModel: 'UnsupportDevice',
                        serialNumber: 'UnsupportDevice',
                        temperature: 0
                    };

                    if (!error) {
                        let lines = stdout.split('\n');
                        lines.forEach(function(line) {
                            if (line.includes('Device Model')) {
                                deviceInfo.deviceModel = line.split(':')[1].trim() || 'unsupportDevice';
                            }
                            else if (line.includes('Serial Number')) {
                                deviceInfo.serialNumber = line.split(':')[1].trim() || 'unsupportDevice';
                            }
                            else if (line.includes('Temperature_Celsius')) {
                                let tempData = line.split(' ').filter(Boolean);
                                let temp = parseInt(tempData[9]);
                                deviceInfo.temperature = isNaN(temp) ? 0 : temp;
                            }
                        });
                    }
                    ProDeviceList.push(deviceInfo);
                    resolve();
                });
            });
        } else if (key.deviceType == "nvme") {
            let commandScanDeviceTemp = `smartctl -a ${key.optionType} ${key.deviceType} ${key.devicePath}`;
            let commandOption = `| findstr /C:"Model Number" /C:"Serial Number" /C:"Temperature:"`;

            await new Promise((resolve) => {
                exec(commandScanDeviceTemp + commandOption, { windowsHide: true }, function(error, stdout, stderr) {
                    let deviceInfo = {
                        deviceModel: 'UnsupportDevice',
                        serialNumber: 'UnsupportDevice',
                        temperature: 0
                    };

                    if (!error) {
                        let lines = stdout.split('\n');
                        lines.forEach(function(line) {
                            if (line.includes('Model Number')) {
                                deviceInfo.deviceModel = line.split(':')[1].trim() || 'unsupportDevice';
                            }
                            else if (line.includes('Serial Number')) {
                                deviceInfo.serialNumber = line.split(':')[1].trim() || 'unsupportDevice';
                            }
                            else if (line.includes('Temperature:')) {
                                let tempStr = line.split(':')[1].trim();
                                let temp = parseInt(tempStr);
                                deviceInfo.temperature = isNaN(temp) ? 0 : temp;
                            }
                        });
                    }
                    ProDeviceList.push(deviceInfo);
                    resolve();
                });
            });
        } else if (key.deviceType == "scsi") {
            let commandScanDeviceTemp = `smartctl -a ${key.optionType} ${key.deviceType} ${key.devicePath}`;
            let commandOption = `| findstr /C:"Device Model" /C:"Serial Number" /C:"Temperature_Celsius"`;

            await new Promise((resolve) => {
                exec(commandScanDeviceTemp + commandOption, { windowsHide: true }, function(error, stdout, stderr) {
                    let deviceInfo = {
                        deviceModel: 'UnsupportDevice',
                        serialNumber: 'UnsupportDevice',
                        temperature: 0
                    };

                    if (!error) {
                        let lines = stdout.split('\n');
                        lines.forEach(function(line) {
                            if (line.includes('Device Model')) {
                                deviceInfo.deviceModel = line.split(':')[1].trim() || 'unsupportDevice';
                            }
                            else if (line.includes('Serial Number')) {
                                deviceInfo.serialNumber = line.split(':')[1].trim() || 'unsupportDevice';
                            }
                            else if (line.includes('Temperature_Celsius')) {
                                let tempData = line.split(' ').filter(Boolean);
                                let temp = parseInt(tempData[9]);
                                deviceInfo.temperature = isNaN(temp) ? 0 : temp;
                            }
                        });
                    }
                    ProDeviceList.push(deviceInfo);
                    resolve();
                });
            });
        } else if (key.deviceType == "sat") {
            let commandScanDeviceTemp = `smartctl -a ${key.optionType} ${key.deviceType} ${key.devicePath}`;
            let commandOption = `| findstr /C:"Device Model" /C:"Serial Number" /C:"Temperature_Celsius"`;

            await new Promise((resolve) => {
                exec(commandScanDeviceTemp + commandOption, { windowsHide: true }, function(error, stdout, stderr) {
                    let deviceInfo = {
                        deviceModel: 'UnsupportDevice',
                        serialNumber: 'UnsupportDevice',
                        temperature: 0
                    };

                    if (!error) {
                        let lines = stdout.split('\n');
                        lines.forEach(function(line) {
                            if (line.includes('Device Model')) {
                                deviceInfo.deviceModel = line.split(':')[1].trim() || 'unsupportDevice';
                            }
                            else if (line.includes('Serial Number')) {
                                deviceInfo.serialNumber = line.split(':')[1].trim() || 'unsupportDevice';
                            }
                            else if (line.includes('Temperature_Celsius')) {
                                let tempData = line.split(' ').filter(Boolean);
                                let temp = parseInt(tempData[9]);
                                deviceInfo.temperature = isNaN(temp) ? 0 : temp;
                            }
                        });
                    }
                    ProDeviceList.push(deviceInfo);
                    resolve();
                });
            });
        } else {
            let commandScanDeviceTemp = `smartctl -a ${key.optionType} ${key.deviceType} ${key.devicePath}`;
            let commandOption = `| findstr /C:"Device Model" /C:"Serial Number" /C:"Temperature_Celsius"`;

            await new Promise((resolve) => {
                exec(commandScanDeviceTemp + commandOption, { windowsHide: true }, function(error, stdout, stderr) {
                    let deviceInfo = {
                        deviceModel: 'UnsupportDevice',
                        serialNumber: 'UnsupportDevice',
                        temperature: 0
                    };

                    if (!error) {
                        let lines = stdout.split('\n');
                        lines.forEach(function(line) {
                            if (line.includes('Device Model')) {
                                deviceInfo.deviceModel = line.split(':')[1].trim() || 'unsupportDevice';
                            }
                            else if (line.includes('Serial Number')) {
                                deviceInfo.serialNumber = line.split(':')[1].trim() || 'unsupportDevice';
                            }
                            else if (line.includes('Temperature_Celsius')) {
                                let tempData = line.split(' ').filter(Boolean);
                                let temp = parseInt(tempData[9]);
                                deviceInfo.temperature = isNaN(temp) ? 0 : temp;
                            }
                        });
                    }
                    ProDeviceList.push(deviceInfo);
                    resolve();
                });
            });
        }
    }
    return ProDeviceList;
}

// 메인 프로그램
async function main() {
    
    // 초기화
    let config = readConfig();
    let timeoutMinutes = parseInt(config.TimeOut);
    if (timeoutMinutes == null || isNaN(timeoutMinutes)) { timeoutMinutes = 10; }
    let intervalMs = timeoutMinutes * 60 * 1000;

    // 텔레그램 관련 변수
    let telegramToken = config.TelegramToken;
    let TelegramChatID = config.TelegramChatID;
    let TelegramSend = config.TelegramSend;
    let Telbot = new TelegramBot(telegramToken, {polling: true});
    let writeMessageTotal = "";

    // 시작 메세지 - console.log
    console.log('Drive Disk Temp Repoter 프로그램 가동');
    console.log('가동 시작 시간 : ' , moment().format("YYYY-MM-DD HH:mm:ss"));
    console.log('기록 시간 간격 : ' , timeoutMinutes , '분');
    if (TelegramSend == "Y") {
        console.log('텔레그렘 메세지 전송옵션 : ON ');
        console.log('텔레그렘 메세지 전송 ID : ' + TelegramChatID);
    } else {
        console.log('텔레그렘 메세지 전송옵션 : OFF ');
    }
    console.log('종료를 원하신다면 실행된 창을 닫아주세요');

    // 시작 메세지 - 메모장 기록 / 텔레그램 메세지 전송
    writeToLog(`프로그램 가동`);
    if (TelegramSend == "Y") {
        Telbot.sendMessage(TelegramChatID, moment().format("YYYY-MM-DD HH:mm:ss") + ' | 프로그램 가동')
        .catch((error) => {
            console.error(moment().format("YYYY-MM-DD HH:mm:ss") , + ' | 텔레그램 메세지 전송 실패:', error);
        });
    }

    // 최초 1회 디스크 온도 측정
    ProDeviceList = []; // 초기화

    await scanDeviceList();
    await scanDevicesTemp(RawDeviceList);
    for (let key of ProDeviceList) {
        let writeMessage;
        writeMessage = `${key.deviceModel} | ${key.serialNumber} | ${key.temperature}`;
        writeToLog(writeMessage);
        writeMessageTotal = writeMessageTotal + moment().format("YYYY-MM-DD HH:mm:ss") + ' | ' + writeMessage + '\n'
    }

    if (TelegramSend == "Y") {
        Telbot.sendMessage(TelegramChatID, writeMessageTotal)
        .catch((error) => {
            console.error(moment().format("YYYY-MM-DD HH:mm:ss") , + ' | 텔레그램 메세지 전송 실패:', error);
        });
    }

    // 메인 실행
    setInterval(async function() {

        ProDeviceList = []; // 초기화
        writeMessageTotal = "";

        await scanDeviceList();
        await scanDevicesTemp(RawDeviceList);
        for (let key of ProDeviceList) {
            let writeMessage;
            writeMessage = `${key.deviceModel} | ${key.serialNumber} | ${key.temperature}`;
            writeToLog(writeMessage);
            writeMessageTotal = writeMessageTotal + moment().format("YYYY-MM-DD HH:mm:ss") + ' | ' + writeMessage + '\n'
        }
        
        if (TelegramSend == "Y") {
            Telbot.sendMessage(TelegramChatID, writeMessageTotal)
            .catch((error) => {
                console.error(moment().format("YYYY-MM-DD HH:mm:ss") , + ' | 텔레그램 메세지 전송 실패:', error);
            });
        }
        
    }, intervalMs);
}

main();