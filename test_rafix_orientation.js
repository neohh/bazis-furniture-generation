// Тест ориентации Rafix снизу полки
var PRESETS_FILE = 'Z:\\Work\\генерация мебели\\fastener_presets.json';
var rawText = system.readTextFile(PRESETS_FILE);
var config = JSON.parse(rawText);

NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0);
var shelf = AddHorizPanel(16, 0, 500, 560, 500);

var rafix = OpenFurniture(config.hardware.vb.path);

// Монтируем пару Rafix снизу полки:
// Проверим вызовы с разными координатами Y или углами
alert('rafix: ' + rafix.Name);

// 1. Стандартный Mount
rafix.Mount(shelf, leftSide, 16, 500, 50);
rafix.Mount(shelf, leftSide, 16, 500, 510);

Action.Commit();
ViewAll();
