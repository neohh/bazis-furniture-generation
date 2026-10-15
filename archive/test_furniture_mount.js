// Диагностика монтажа фурнитуры
var PRESETS_FILE = 'Z:\\Work\\генерация мебели\\fastener_presets.json';
var config = null;

try {
    var rawText = system.readTextFile(PRESETS_FILE);
    config = JSON.parse(rawText);
} catch (e) {
    alert('Ошибка чтения конфига: ' + e);
}

var log = [];
log.push('Config loaded: ' + (config !== null));

var loadedFurn = {};
if (config && config.hardware) {
    for (var hKey in config.hardware) {
        var hItem = config.hardware[hKey];
        try {
            var f = OpenFurniture(hItem.path);
            loadedFurn[hKey] = f;
            log.push('OK: ' + hKey + ' (' + hItem.name + ') -> ' + (f ? f.constructor.name : 'null'));
        } catch (err) {
            log.push('ERR: ' + hKey + ' -> ' + err);
        }
    }
}

// Тест монтажа 1 конфирмата
NewModel();
var p1 = AddVertPanel(0, 0, 500, 1000, 0);
var p2 = AddHorizPanel(16, 0, 500, 500, 100);

if (loadedFurn['confirmat']) {
    try {
        var res = loadedFurn['confirmat'].Mount(p1, p2, 16, 108, 100);
        log.push('Mount confirmat res: ' + res);
    } catch (e2) {
        log.push('Mount confirmat err: ' + e2);
    }
}

alert(log.join('\n'));
