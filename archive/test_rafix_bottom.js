// Тест правильной ориентации Rafix/VB строго снизу полки
var PRESETS_FILE = 'Z:\\Work\\генерация мебели\\fastener_presets.json';
var rawText = system.readTextFile(PRESETS_FILE);
var config = JSON.parse(rawText);

NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0);
var shelf = AddHorizPanel(16, 0, 500, 560, 500); // Y = 500, толщина 16 мм, то есть верх Y=516, низ Y=500

var rafix = OpenFurniture(config.hardware.vb.path);

// В Базисе: если монтировать в нижнюю плоскость полки:
// Координата Y должна указывать строго на нижнюю плоскость (Y = 500.0)
// Либо для обоих торцов передавать координаты снизу
var f1 = rafix.Mount(shelf, leftSide, 16, 500.0, 50);
var f2 = rafix.Mount(shelf, leftSide, 16, 500.0, 510);

Action.Commit();
ViewAll();
